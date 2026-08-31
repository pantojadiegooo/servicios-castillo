/**
 * ============================================================================
 * PRUEBAS: PASARELAS DE PAGO, WEBHOOKS, CONCILIACIÓN Y CHARGEBACKS (v1.1)
 * ============================================================================
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { createDatabase } from '../../src/commercial/db/database.js';
import { AuditService } from '../../src/commercial/services/audit.service.js';
import { PaymentService } from '../../src/commercial/services/payment.service.js';

test('Pagos & Webhooks — Stripe HMAC, Idempotencia, SPEI y Chargebacks', () => {
  const db = createDatabase(':memory:');
  const auditService = new AuditService(db);
  const webhookSecret = 'whsec_test_secret_castillo_123';
  const mpWebhookSecret = 'mp_test_secret_castillo_456';
  const paymentService = new PaymentService(db, auditService, {
    stripeWebhookSecret: webhookSecret,
    mpWebhookSecret: mpWebhookSecret
  });

  // Crear proyecto y orden de pago
  db.prepare(`
    INSERT INTO clients (id, business_name, contact_name, contact_email)
    VALUES ('cli_pay_1', 'Pay Test S.A.', 'Laura Gómez', 'laura@paytest.com')
  `).run();

  db.prepare(`
    INSERT INTO projects (id, client_id, service_package_id, service_type, name, state)
    VALUES ('GC-Q-2026-000300', 'cli_pay_1', 'gold', 'BUILD_PACKAGE', 'Portal Pagos', 'PAYMENT_PENDING')
  `).run();

  db.prepare(`
    INSERT INTO quotation_versions (
      id, project_id, version_number, scope_description, subtotal_mxn,
      tax_rate, tax_amount_mxn, total_mxn, valid_until_date, digest_sha256, created_by
    ) VALUES ('GC-Q-2026-000300-v1', 'GC-Q-2026-000300', 1, 'Alcance Gold', 12900, 0.16, 2064, 14964, '2026-09-01', 'hash_test', 'admin')
  `).run();

  db.prepare(`
    INSERT INTO payments (
      id, project_id, concept, subtotal_mxn, tax_amount_mxn, total_mxn,
      payment_method, status
    ) VALUES ('pay_order_1', 'GC-Q-2026-000300', 'ANTICIPO_50', 6450, 1032, 7482, 'TRANSFERENCIA_SPEI', 'PENDING')
  `).run();

  // 1. Transferencia SPEI -> Comprobante -> PENDING_VERIFICATION
  const receiptRes = paymentService.submitBankTransferReceipt(
    'pay_order_1',
    'https://vault.castillo.com/comprobantes/spei_123.pdf',
    'laura@paytest.com'
  );
  assert.equal(receiptRes.status, 'PENDING_VERIFICATION');

  let summary = paymentService.getProjectFinancialSummary('GC-Q-2026-000300');
  assert.equal(summary.totalPaid, 0);
  assert.equal(summary.totalPendingVerification, 7482);
  assert.equal(summary.remainingBalance, 14964);

  // 2. Conciliación manual administrativa -> PAID
  const verifyRes = paymentService.verifyPaymentManual('pay_order_1', 'usr_admin_01');
  assert.equal(verifyRes.status, 'PAID');

  summary = paymentService.getProjectFinancialSummary('GC-Q-2026-000300');
  assert.equal(summary.totalPaid, 7482);
  assert.equal(summary.totalPendingVerification, 0);
  assert.equal(summary.remainingBalance, 7482);

  // 3. Webhook de Stripe: Preparar payload firmado con HMAC
  const stripeEvent = {
    id: 'evt_stripe_test_999',
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_test_session_1',
        client_reference_id: 'pay_order_2',
        amount_total: 748200, // $7,482.00 MXN en centavos
        metadata: {
          payment_id: 'pay_order_2',
          project_id: 'GC-Q-2026-000300'
        }
      }
    }
  };

  db.prepare(`
    INSERT INTO payments (
      id, project_id, concept, subtotal_mxn, tax_amount_mxn, total_mxn,
      payment_method, status
    ) VALUES ('pay_order_2', 'GC-Q-2026-000300', 'FINIQUITO_50', 6450, 1032, 7482, 'STRIPE', 'PENDING')
  `).run();

  const rawBody = JSON.stringify(stripeEvent);
  const timestamp = Math.floor(Date.now() / 1000);
  const signatureHash = createHmac('sha256', webhookSecret)
    .update(`${timestamp}.${rawBody}`)
    .digest('hex');
  const signatureHeader = `t=${timestamp},v1=${signatureHash}`;

  // 4. Procesar Webhook exitoso
  const webhookRes = paymentService.processStripeWebhook(stripeEvent, rawBody, signatureHeader);
  assert.equal(webhookRes.success, true);
  assert.equal(webhookRes.processedEvent, 'checkout.session.completed');

  summary = paymentService.getProjectFinancialSummary('GC-Q-2026-000300');
  assert.equal(summary.totalPaid, 14964);
  assert.equal(summary.remainingBalance, 0);
  assert.equal(summary.isFullyPaid, true);

  // 5. Idempotencia: Procesar el mismo evento no duplica el pago
  const idempotentRes = paymentService.processStripeWebhook(stripeEvent, rawBody, signatureHeader);
  assert.equal(idempotentRes.success, true);
  assert.ok(idempotentRes.message.includes('Idempotencia'));

  // 6. Firma inválida de Webhook rechazada
  assert.throws(() => {
    paymentService.processStripeWebhook(stripeEvent, rawBody, 't=12345,v1=tampered_signature');
  }, /Firma de webhook de Stripe inválida/);

  // 7. Manejo de Disputa / Chargeback sin borrar historial
  const disputeEvent = {
    id: 'evt_stripe_dispute_1',
    type: 'charge.dispute.created',
    data: {
      object: {
        payment_intent: 'evt_stripe_test_999'
      }
    }
  };
  const disputeRaw = JSON.stringify(disputeEvent);
  const disputeSig = createHmac('sha256', webhookSecret)
    .update(`${timestamp}.${disputeRaw}`)
    .digest('hex');

  const disputeRes = paymentService.processStripeWebhook(disputeEvent, disputeRaw, `t=${timestamp},v1=${disputeSig}`);
  assert.equal(disputeRes.success, true);

  const disputedPayment = db.prepare("SELECT * FROM payments WHERE id = 'pay_order_2'").get();
  assert.equal(disputedPayment.status, 'CHARGEBACK_DISPUTE');

  // ==========================================================================
  // 8. PRUEBAS OFICIALES DE MERCADO PAGO WEBHOOK (x-signature)
  // ==========================================================================
  db.prepare(`
    INSERT INTO payments (
      id, project_id, concept, subtotal_mxn, tax_amount_mxn, total_mxn,
      payment_method, status
    ) VALUES ('pay_order_mp_1', 'GC-Q-2026-000300', 'HITO_ADICIONAL', 1000, 160, 1160, 'MERCADO_PAGO', 'PENDING')
  `).run();

  const mpDataId = '9876543210';
  const mpRequestId = 'req_castillo_mp_001';
  const mpTs = Math.floor(Date.now() / 1000);
  const mpManifest = `id:${mpDataId};request-id:${mpRequestId};ts:${mpTs};`;
  const mpHash = createHmac('sha256', mpWebhookSecret)
    .update(mpManifest)
    .digest('hex');
  const mpSignatureHeader = `ts=${mpTs},v1=${mpHash}`;

  const mpPayload = {
    action: 'payment.created',
    data: { id: mpDataId, status: 'approved', currency_id: 'MXN' },
    metadata: { payment_id: 'pay_order_mp_1' }
  };

  // 8.1. Webhook válido de Mercado Pago
  const mpRes = paymentService.processMercadoPagoWebhook({
    payload: mpPayload,
    dataId: mpDataId,
    xRequestId: mpRequestId,
    xSignatureHeader: mpSignatureHeader
  });
  assert.equal(mpRes.success, true);

  const mpPaymentInDb = db.prepare("SELECT * FROM payments WHERE id = 'pay_order_mp_1'").get();
  assert.equal(mpPaymentInDb.status, 'PAID');
  assert.equal(mpPaymentInDb.external_transaction_id, mpDataId);

  // 8.2. Idempotencia en Mercado Pago
  const mpIdempotentRes = paymentService.processMercadoPagoWebhook({
    payload: mpPayload,
    dataId: mpDataId,
    xRequestId: mpRequestId,
    xSignatureHeader: mpSignatureHeader
  });
  assert.equal(mpIdempotentRes.success, true);
  assert.ok(mpIdempotentRes.message.includes('Idempotencia'));

  // 8.3. Firma inválida de Mercado Pago
  assert.throws(() => {
    paymentService.processMercadoPagoWebhook({
      payload: mpPayload,
      dataId: mpDataId,
      xRequestId: mpRequestId,
      xSignatureHeader: `ts=${mpTs},v1=invalido`
    });
  }, /Firma de webhook de Mercado Pago inválida/);

  // 8.4. Replay attack en Mercado Pago (> 10 min)
  const oldTs = mpTs - 700;
  const oldManifest = `id:${mpDataId};request-id:${mpRequestId};ts:${oldTs};`;
  const oldHash = createHmac('sha256', mpWebhookSecret).update(oldManifest).digest('hex');
  assert.throws(() => {
    paymentService.processMercadoPagoWebhook({
      payload: mpPayload,
      dataId: mpDataId,
      xRequestId: mpRequestId,
      xSignatureHeader: `ts=${oldTs},v1=${oldHash}`
    });
  }, /Firma de webhook de Mercado Pago inválida/);

  // 8.5. Moneda inválida en Mercado Pago
  const mpInvalidCurrencyPayload = {
    action: 'payment.created',
    data: { id: '9876543211', status: 'approved', currency_id: 'USD' },
    metadata: { payment_id: 'pay_order_1' }
  };
  const mpDataId2 = '9876543211';
  const mpManifest2 = `id:${mpDataId2};request-id:${mpRequestId};ts:${mpTs};`;
  const mpHash2 = createHmac('sha256', mpWebhookSecret).update(mpManifest2).digest('hex');
  assert.throws(() => {
    paymentService.processMercadoPagoWebhook({
      payload: mpInvalidCurrencyPayload,
      dataId: mpDataId2,
      xRequestId: mpRequestId,
      xSignatureHeader: `ts=${mpTs},v1=${mpHash2}`
    });
  }, /Moneda de pago inválida/);
});
