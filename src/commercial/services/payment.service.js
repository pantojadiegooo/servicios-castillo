/**
 * ============================================================================
 * GRUPO CASTILLO — SERVICIO FINANCIERO Y PASARELAS DE PAGO (v1.1)
 * ============================================================================
 * Procesa pagos mediante Stripe, Mercado Pago y Transferencia SPEI.
 * Implementa validación criptográfica de webhooks, idempotencia, protección
 * contra repetición (replay), conciliación administrativa y gestión de chargebacks.
 */

import { createHmac } from 'node:crypto';
import { ROLES } from '../core/roles.js';

export class PaymentService {
  /**
   * @param {import('node:sqlite').DatabaseSync} db
   * @param {import('./audit.service.js').AuditService} auditService
   * @param {object} [config]
   */
  constructor(db, auditService, config = {}) {
    this.db = db;
    this.auditService = auditService;
    this.stripeWebhookSecret = config.stripeWebhookSecret || process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_castillo_secret';
    this.mpWebhookSecret = config.mpWebhookSecret || process.env.MP_WEBHOOK_SECRET || 'mp_test_castillo_secret';
  }

  /**
   * Registra un comprobante de transferencia bancaria SPEI en estado PENDING_VERIFICATION.
   * @param {string} paymentId
   * @param {string} comprobanteUrl
   * @param {string} clientEmail
   * @param {string} [actorIp]
   * @returns {object}
   */
  submitBankTransferReceipt(paymentId, comprobanteUrl, clientEmail, actorIp = null) {
    const payment = this.db.prepare('SELECT * FROM payments WHERE id = ?').get(paymentId);
    if (!payment) throw new Error('Orden de pago no encontrada');

    if (payment.status === 'PAID') {
      return { success: true, message: 'Este pago ya ha sido verificado y conciliado previamente.', payment };
    }

    this.db.prepare(`
      UPDATE payments
      SET status = 'PENDING_VERIFICATION', comprobante_url = ?,
          payment_method = 'TRANSFERENCIA_SPEI'
      WHERE id = ?
    `).run(comprobanteUrl, paymentId);

    this.auditService.logEvent({
      projectId: payment.project_id,
      actorId: clientEmail,
      actorRole: ROLES.CLIENTE,
      actorIp,
      action: 'PAYMENT_RECEIPT_SUBMITTED',
      rationale: `Comprobante de transferencia bancaria adjuntado para orden ${payment.concept} ($${payment.total_mxn} MXN). Esperando validación administrativa.`
    });

    return {
      success: true,
      paymentId,
      status: 'PENDING_VERIFICATION',
      message: 'Comprobante recibido exitosamente. La administración verificará los fondos en la cuenta oficial.'
    };
  }

  /**
   * Conciliación manual de pago por parte de Administración.
   * @param {string} paymentId
   * @param {string} adminId
   * @param {string} [actorIp]
   * @returns {object}
   */
  verifyPaymentManual(paymentId, adminId, actorIp = null) {
    const payment = this.db.prepare('SELECT * FROM payments WHERE id = ?').get(paymentId);
    if (!payment) throw new Error('Orden de pago no encontrada');

    const paidAt = new Date().toISOString();

    this.db.prepare(`
      UPDATE payments
      SET status = 'PAID', verified_by_admin_id = ?, verified_at = ?, paid_at = ?
      WHERE id = ?
    `).run(adminId, paidAt, paidAt, paymentId);

    this.auditService.logEvent({
      projectId: payment.project_id,
      actorId: adminId,
      actorRole: ROLES.ADMINISTRACION,
      actorIp,
      action: 'PAYMENT_VERIFIED_ADMIN',
      rationale: `Pago de $${payment.total_mxn} MXN (${payment.concept}) conciliado y aprobado manualmente por Administración.`
    });

    return {
      success: true,
      paymentId,
      projectId: payment.project_id,
      status: 'PAID',
      paidAt
    };
  }

  /**
   * Valida la firma HMAC del webhook de Stripe.
   * @param {string} rawBody
   * @param {string} signatureHeader
   * @returns {boolean}
   */
  verifyStripeSignature(rawBody, signatureHeader) {
    if (!signatureHeader || !rawBody) return false;

    // Header format: t=1492774577,v1=5257a869e7ecebeda32affa62cd...
    const parts = signatureHeader.split(',').reduce((acc, item) => {
      const [k, v] = item.split('=');
      acc[k] = v;
      return acc;
    }, {});

    const timestamp = parts.t;
    const signature = parts.v1;
    if (!timestamp || !signature) return false;

    // Verificar que el timestamp no tenga más de 10 minutos (protección contra replay)
    const ageSeconds = Math.floor(Date.now() / 1000) - parseInt(timestamp, 10);
    if (ageSeconds > 600 || ageSeconds < -60) return false;

    const payload = `${timestamp}.${rawBody}`;
    const expectedSignature = createHmac('sha256', this.stripeWebhookSecret)
      .update(payload)
      .digest('hex');

    return signature === expectedSignature;
  }

  /**
   * Procesa un webhook de Stripe con protección de idempotencia.
   * @param {object} event - Payload parseado del evento Stripe
   * @param {string} rawBody
   * @param {string} signatureHeader
   * @returns {object}
   */
  processStripeWebhook(event, rawBody, signatureHeader) {
    if (!this.verifyStripeSignature(rawBody, signatureHeader)) {
      throw new Error('Firma de webhook de Stripe inválida');
    }

    const eventId = event.id;

    // Idempotencia: Verificar si el evento ya fue procesado
    const existing = this.db.prepare('SELECT * FROM webhook_events WHERE id = ?').get(eventId);
    if (existing) {
      return { success: true, message: 'Evento de Stripe ya procesado previamente (Idempotencia).', eventId };
    }

    // Registrar evento de webhook
    this.db.prepare(`
      INSERT INTO webhook_events (id, provider, event_type, payload_json)
      VALUES (?, 'STRIPE', ?, ?)
    `).run(eventId, event.type, JSON.stringify(event));

    if (event.type === 'checkout.session.completed' || event.type === 'payment_intent.succeeded') {
      const session = event.data?.object;
      const paymentId = session?.client_reference_id || session?.metadata?.payment_id;
      const projectId = session?.metadata?.project_id;

      if (paymentId) {
        const paidAt = new Date().toISOString();
        this.db.prepare(`
          UPDATE payments
          SET status = 'PAID', payment_method = 'STRIPE', external_transaction_id = ?, paid_at = ?
          WHERE id = ?
        `).run(event.id, paidAt, paymentId);

        this.auditService.logEvent({
          projectId,
          actorId: 'STRIPE_WEBHOOK',
          actorRole: 'SYSTEM_GATEWAY',
          action: 'PAYMENT_CONFIRMED_STRIPE',
          rationale: `Pago electrónico de $${(session.amount_total || 0) / 100} MXN confirmado vía Stripe (${event.type})`
        });
      }
    } else if (event.type === 'charge.dispute.created') {
      // Manejo de disputa / chargeback
      const dispute = event.data?.object;
      const paymentIntentId = dispute?.payment_intent;

      const payment = this.db.prepare('SELECT * FROM payments WHERE external_transaction_id = ?').get(paymentIntentId);
      if (payment) {
        this.db.prepare("UPDATE payments SET status = 'CHARGEBACK_DISPUTE' WHERE id = ?").run(payment.id);

        this.auditService.logEvent({
          projectId: payment.project_id,
          actorId: 'STRIPE_DISPUTE_WEBHOOK',
          actorRole: 'SYSTEM_GATEWAY',
          action: 'PAYMENT_CHARGEBACK_ALERT',
          rationale: `ALERTA FINANCIERA: Disputa/Contracargo registrado en Stripe para orden ${payment.id}. Monto: $${payment.total_mxn} MXN.`
        });
      }
    }

    return { success: true, processedEvent: event.type, eventId };
  }

  /**
   * Genera el estado de cuenta y balance financiero de un proyecto.
   * @param {string} projectId
   * @returns {object}
   */
  getProjectFinancialSummary(projectId) {
    const quotation = this.db.prepare(`
      SELECT * FROM quotation_versions WHERE project_id = ? ORDER BY version_number DESC LIMIT 1
    `).get(projectId);

    const payments = this.db.prepare(`
      SELECT * FROM payments WHERE project_id = ? ORDER BY created_at ASC
    `).all(projectId);

    const totalContracted = quotation ? quotation.total_mxn : 0;
    const subtotalContracted = quotation ? quotation.subtotal_mxn : 0;
    const taxContracted = quotation ? quotation.tax_amount_mxn : 0;

    let totalPaid = 0;
    let totalPendingVerification = 0;

    for (const p of payments) {
      if (p.status === 'PAID') {
        totalPaid += p.total_mxn;
      } else if (p.status === 'PENDING_VERIFICATION') {
        totalPendingVerification += p.total_mxn;
      }
    }

    const remainingBalance = Math.max(0, Math.round((totalContracted - totalPaid) * 100) / 100);

    return {
      projectId,
      subtotalContracted,
      taxContracted,
      totalContracted,
      totalPaid,
      totalPendingVerification,
      remainingBalance,
      isFullyPaid: remainingBalance === 0 && totalContracted > 0,
      paymentsHistory: payments
    };
  }
}
