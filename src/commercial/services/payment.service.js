/**
 * ============================================================================
 * GRUPO CASTILLO — SERVICIO FINANCIERO Y PASARELAS DE PAGO (v1.1)
 * ============================================================================
 * Procesa pagos mediante Stripe, Mercado Pago y Transferencia SPEI.
 * Implementa validación criptográfica independiente para cada pasarela (HMAC SHA-256),
 * protección contra ataques de repetición (replay), idempotencia por event_id,
 * conciliación administrativa y gestión de chargebacks.
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

  // ==========================================================================
  // 1. PASARELA STRIPE — VALIDACIÓN Y PROCESAMIENTO
  // ==========================================================================

  /**
   * Valida la firma HMAC del webhook de Stripe.
   * Header format: t=1492774577,v1=5257a869e7ecebeda32affa62cd...
   * @param {string} rawBody
   * @param {string} signatureHeader
   * @returns {boolean}
   */
  verifyStripeSignature(rawBody, signatureHeader) {
    if (!signatureHeader || !rawBody) return false;

    const parts = signatureHeader.split(',').reduce((acc, item) => {
      const [k, v] = item.split('=');
      if (k && v) acc[k.trim()] = v.trim();
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

  // ==========================================================================
  // 2. PASARELA MERCADO PAGO — VALIDACIÓN OFICIAL (x-signature) Y PROCESAMIENTO
  // ==========================================================================

  /**
   * Valida la firma HMAC oficial de Mercado Pago (x-signature con ts y v1).
   * Header format: ts=1700000000,v1=5257a869e7ecebeda32affa62cd...
   * Manifest format: id:[data.id];request-id:[x-request-id];ts:[ts];
   *
   * @param {string} dataId - ID del recurso notificado (ej. data.id o id de la URL)
   * @param {string} xRequestId - Cabecera x-request-id
   * @param {string} xSignatureHeader - Cabecera x-signature
   * @returns {boolean}
   */
  verifyMercadoPagoSignature(dataId, xRequestId, xSignatureHeader) {
    if (!xSignatureHeader || !dataId) return false;

    const parts = xSignatureHeader.split(',').reduce((acc, item) => {
      const [k, v] = item.split('=');
      if (k && v) acc[k.trim()] = v.trim();
      return acc;
    }, {});

    const ts = parts.ts;
    const v1 = parts.v1;
    if (!ts || !v1) return false;

    // Verificar ventana de tiempo de 10 minutos (anti-replay)
    const ageSeconds = Math.floor(Date.now() / 1000) - parseInt(ts, 10);
    if (ageSeconds > 600 || ageSeconds < -60) return false;

    // Manifest oficial de Mercado Pago: id:[data.id];request-id:[x-request-id];ts:[ts];
    const manifest = `id:${dataId};request-id:${xRequestId || ''};ts:${ts};`;
    const expectedHash = createHmac('sha256', this.mpWebhookSecret)
      .update(manifest)
      .digest('hex');

    return v1 === expectedHash;
  }

  /**
   * Procesa una notificación oficial de webhook de Mercado Pago.
   * @param {object} params
   * @param {object} params.payload - Cuerpo JSON de la notificación
   * @param {string} params.dataId - Identificador del recurso (payment id)
   * @param {string} params.xRequestId - Cabecera x-request-id
   * @param {string} params.xSignatureHeader - Cabecera x-signature
   * @returns {object}
   */
  processMercadoPagoWebhook({ payload, dataId, xRequestId, xSignatureHeader }) {
    if (!this.verifyMercadoPagoSignature(dataId, xRequestId, xSignatureHeader)) {
      throw new Error('Firma de webhook de Mercado Pago inválida (x-signature)');
    }

    const eventId = `mp_${dataId}_${payload.action || 'payment'}`;

    // Idempotencia
    const existing = this.db.prepare('SELECT * FROM webhook_events WHERE id = ?').get(eventId);
    if (existing) {
      return { success: true, message: 'Evento de Mercado Pago ya procesado previamente (Idempotencia).', eventId };
    }

    // Registrar evento de webhook
    this.db.prepare(`
      INSERT INTO webhook_events (id, provider, event_type, payload_json)
      VALUES (?, 'MERCADO_PAGO', ?, ?)
    `).run(eventId, payload.action || 'payment.updated', JSON.stringify(payload));

    const paymentData = payload.data || payload;
    const externalPaymentId = String(dataId);
    const paymentRecordId = payload.metadata?.payment_id || payload.additional_info?.payment_id;

    if (paymentRecordId) {
      const payment = this.db.prepare('SELECT * FROM payments WHERE id = ?').get(paymentRecordId);
      if (!payment) throw new Error(`Orden de pago asociada ${paymentRecordId} no encontrada`);

      // Validación de moneda y estado
      const currency = paymentData.currency_id || 'MXN';
      if (currency !== 'MXN') {
        throw new Error(`Moneda de pago inválida: ${currency}. Solo se admite MXN.`);
      }

      const status = paymentData.status;
      if (status === 'approved') {
        const paidAt = new Date().toISOString();
        this.db.prepare(`
          UPDATE payments
          SET status = 'PAID', payment_method = 'MERCADO_PAGO',
              external_transaction_id = ?, paid_at = ?
          WHERE id = ?
        `).run(externalPaymentId, paidAt, paymentRecordId);

        this.auditService.logEvent({
          projectId: payment.project_id,
          actorId: 'MERCADO_PAGO_WEBHOOK',
          actorRole: 'SYSTEM_GATEWAY',
          action: 'PAYMENT_CONFIRMED_MERCADO_PAGO',
          rationale: `Pago electrónico de $${payment.total_mxn} MXN confirmado vía Mercado Pago (ID: ${externalPaymentId})`
        });
      } else if (status === 'rejected' || status === 'cancelled') {
        this.db.prepare("UPDATE payments SET status = 'FAILED' WHERE id = ?").run(paymentRecordId);
      }
    }

    return { success: true, processedEvent: payload.action || 'payment', eventId };
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
