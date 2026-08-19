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
  const paymentService = new PaymentService(db, auditService, { stripeWebhookSecret: webhookSecret });

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
    ) VALUES ('GC-Q-2026-000300-v1', 'GC-Q-2026-000300', 1, 'Alcance Gold', 12500, 0.16, 2000, 14500, '2026-09-01', 'hash_test', 'admin')
  `).run();

  db.prepare(`
    INSERT INTO payments (
      id, project_id, concept, subtotal_mxn, tax_amount_mxn, total_mxn,
      payment_method, status
    ) VALUES ('pay_order_1', 'GC-Q-2026-000300', 'ANTICIPO_50', 6250, 1000, 7250, 'TRANSFERENCIA_SPEI', 'PENDING')
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
  assert.equal(summary.totalPendingVerification, 7250);
  assert.equal(summary.remainingBalance, 14500);

  // 2. Conciliación manual administrativa -> PAID
  const verifyRes = paymentService.verifyPaymentManual('pay_order_1', 'usr_admin_01');
  assert.equal(verifyRes.status, 'PAID');

  summary = paymentService.getProjectFinancialSummary('GC-Q-2026-000300');
  assert.equal(summary.totalPaid, 7250);
  assert.equal(summary.totalPendingVerification, 0);
  assert.equal(summary.remainingBalance, 7250);

  // 3. Webhook de Stripe: Preparar payload firmado con HMAC
  const stripeEvent = {
    id: 'evt_stripe_test_999',
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_test_session_1',
        client_reference_id: 'pay_order_2',
        amount_total: 725000, // $7,250.00 MXN en centavos
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
    ) VALUES ('pay_order_2', 'GC-Q-2026-000300', 'FINIQUITO_50', 6250, 1000, 7250, 'STRIPE', 'PENDING')
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
  assert.equal(summary.totalPaid, 14500);
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
});
