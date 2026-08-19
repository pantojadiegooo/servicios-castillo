/**
 * ============================================================================
 * GRUPO CASTILLO — SERVICIO DE COTIZACIONES Y PROPUESTAS (v1.1)
 * ============================================================================
 * Administra el ciclo de vida de cotizaciones: creación con ID único inmutable
 * GC-Q-YYYY-XXXXXX, versionado estricto, vigencia de 15 días naturales,
 * cálculo financiero oficial y registro formal de aceptación del cliente.
 */

import { createHash, randomBytes } from 'node:crypto';
import { generateQuotationId } from '../core/id-generator.js';
import { resolveServicePricing, calculateFinancialBreakdown, TAX_RATE_DEFAULT } from '../core/pricing.js';
import { PROJECT_STATES } from '../core/state-machine.js';
import { generateDefaultMilestones } from '../core/progress-calculator.js';

export class QuotationService {
  /**
   * @param {import('node:sqlite').DatabaseSync} db
   * @param {import('./audit.service.js').AuditService} auditService
   */
  constructor(db, auditService) {
    this.db = db;
    this.auditService = auditService;
  }

  /**
   * Crea un nuevo expediente/proyecto con su cotización inicial (v1).
   * @param {object} params
   * @param {string} params.businessName
   * @param {string} params.contactName
   * @param {string} params.contactEmail
   * @param {string} [params.contactPhone]
   * @param {string} [params.rfcTaxId]
   * @param {string} params.serviceCode - ej: 'GOLD', 'IRON', 'CHECKUP', etc.
   * @param {string} params.projectName
   * @param {string} params.scopeDescription
   * @param {Array<object>} [params.inventoryRoutes]
   * @param {number} [params.customSubtotalMxn] - Para proyectos Diamond / a la medida
   * @param {string} params.createdBy
   * @param {string} [params.actorIp]
   * @returns {object}
   */
  createQuotation({
    businessName,
    contactName,
    contactEmail,
    contactPhone = null,
    rfcTaxId = null,
    serviceCode,
    projectName,
    scopeDescription,
    inventoryRoutes = [],
    customSubtotalMxn = null,
    createdBy,
    actorIp = null
  }) {
    if (!contactName || !contactEmail || !serviceCode || !projectName) {
      throw new Error('Campos obligatorios faltantes: contactName, contactEmail, serviceCode y projectName');
    }

    const serviceInfo = resolveServicePricing(serviceCode);
    if (!serviceInfo) {
      throw new Error(`El paquete o servicio '${serviceCode}' no existe en el catálogo oficial`);
    }

    let subtotalMxn = serviceInfo.priceMxn || serviceInfo.basePriceMxn;
    if (customSubtotalMxn && typeof customSubtotalMxn === 'number' && customSubtotalMxn > 0) {
      subtotalMxn = customSubtotalMxn;
    }

    const financial = calculateFinancialBreakdown(subtotalMxn, TAX_RATE_DEFAULT);

    // 1. Obtener o crear cliente
    let client = this.db.prepare('SELECT * FROM clients WHERE contact_email = ?').get(contactEmail.trim().toLowerCase());
    if (!client) {
      const clientId = `cli_${randomBytes(6).toString('hex')}`;
      this.db.prepare(`
        INSERT INTO clients (id, business_name, rfc_tax_id, contact_name, contact_email, contact_phone)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        clientId,
        businessName || contactName,
        rfcTaxId,
        contactName,
        contactEmail.trim().toLowerCase(),
        contactPhone
      );
      client = this.db.prepare('SELECT * FROM clients WHERE id = ?').get(clientId);
    }

    // 2. Generar identificador único inmutable de proyecto (GC-Q-YYYY-XXXXXX)
    const projectId = generateQuotationId();

    // 3. Crear registro de proyecto en estado DRAFT
    this.db.prepare(`
      INSERT INTO projects (
        id, client_id, service_package_id, service_type, name, state, progress_percentage
      ) VALUES (?, ?, ?, ?, ?, ?, 0.0)
    `).run(
      projectId,
      client.id,
      serviceInfo.id,
      serviceInfo.type,
      projectName,
      PROJECT_STATES.DRAFT
    );

    // 4. Sembrar hitos predeterminados
    const defaultMilestones = generateDefaultMilestones(projectId);
    for (const m of defaultMilestones) {
      this.db.prepare(`
        INSERT INTO milestones (id, project_id, code, name, description, weight, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(m.id, m.projectId, m.code, m.name, m.description, m.weight, m.status);
    }

    // 5. Crear Versión 1 de la Cotización con vigencia de 15 días naturales
    const validUntilDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString();
    const versionId = `${projectId}-v1`;
    const payloadToHash = JSON.stringify({
      projectId,
      version: 1,
      subtotalMxn: financial.subtotal,
      totalMxn: financial.total,
      validUntilDate,
      scopeDescription
    });
    const digestSha256 = createHash('sha256').update(payloadToHash).digest('hex');

    this.db.prepare(`
      INSERT INTO quotation_versions (
        id, project_id, version_number, scope_description, inventory_routes_json,
        subtotal_mxn, tax_rate, tax_amount_mxn, total_mxn, valid_until_date,
        is_accepted, digest_sha256, created_by
      ) VALUES (?, ?, 1, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
    `).run(
      versionId,
      projectId,
      scopeDescription,
      JSON.stringify(inventoryRoutes),
      financial.subtotal,
      financial.taxRate,
      financial.taxAmount,
      financial.total,
      validUntilDate,
      digestSha256,
      createdBy
    );

    // 6. Transición DRAFT -> QUOTED
    this.db.prepare('UPDATE projects SET state = ? WHERE id = ?').run(PROJECT_STATES.QUOTED, projectId);

    this.auditService.logEvent({
      projectId,
      actorId: createdBy,
      actorRole: 'ADMINISTRACION',
      actorIp,
      action: 'QUOTATION_ISSUED',
      fromState: PROJECT_STATES.DRAFT,
      toState: PROJECT_STATES.QUOTED,
      rationale: `Emisión de cotización v1 para el proyecto ${projectName} (${serviceInfo.fullName}) con vigencia de 15 días naturales`,
      evidenceHashSha256: digestSha256
    });

    return {
      projectId,
      versionNumber: 1,
      client,
      serviceInfo,
      financial,
      validUntilDate,
      digestSha256,
      state: PROJECT_STATES.QUOTED
    };
  }

  /**
   * Obtiene la versión más reciente de la cotización de un proyecto.
   * @param {string} projectId
   * @returns {object|null}
   */
  getLatestQuotation(projectId) {
    const stmt = this.db.prepare(`
      SELECT qv.*, p.name as project_name, p.state as project_state, p.service_package_id,
             c.business_name, c.contact_name, c.contact_email, c.contact_phone, c.rfc_tax_id
      FROM quotation_versions qv
      JOIN projects p ON qv.project_id = p.id
      JOIN clients c ON p.client_id = c.id
      WHERE qv.project_id = ?
      ORDER BY qv.version_number DESC LIMIT 1
    `);
    return stmt.get(projectId);
  }

  /**
   * Registra la aceptación formal de la cotización por parte del cliente.
   * @param {string} projectId
   * @param {object} clientAcceptance
   * @param {string} clientAcceptance.acceptedByName
   * @param {string} clientAcceptance.acceptedByEmail
   * @param {string} [clientAcceptance.acceptedIpAddress]
   * @returns {object}
   */
  acceptQuotation(projectId, { acceptedByName, acceptedByEmail, acceptedIpAddress = null }) {
    const quotation = this.getLatestQuotation(projectId);
    if (!quotation) {
      throw new Error(`No se encontró cotización para el proyecto ${projectId}`);
    }

    if (quotation.is_accepted === 1) {
      return { success: true, message: 'La cotización ya había sido aceptada previamente.', quotation };
    }

    // Validar vigencia de 15 días naturales
    const validUntil = new Date(quotation.valid_until_date).getTime();
    if (Date.now() > validUntil) {
      throw new Error('La cotización ha expirado (vigencia de 15 días naturales superada). Se requiere una nueva cotización.');
    }

    const acceptedAt = new Date().toISOString();

    // Actualizar cotización
    this.db.prepare(`
      UPDATE quotation_versions
      SET is_accepted = 1, accepted_at = ?, accepted_by_name = ?,
          accepted_by_email = ?, accepted_ip_address = ?
      WHERE id = ?
    `).run(acceptedAt, acceptedByName, acceptedByEmail, acceptedIpAddress, quotation.id);

    // Transición QUOTED -> ACCEPTED -> PAYMENT_PENDING
    this.db.prepare('UPDATE projects SET state = ? WHERE id = ?').run(PROJECT_STATES.PAYMENT_PENDING, projectId);

    // Crear orden de pago de anticipo (50%) en estado PENDING
    const paymentId = `pay_${randomBytes(6).toString('hex')}`;
    const depositSubtotal = Math.round((quotation.subtotal_mxn / 2) * 100) / 100;
    const depositTax = Math.round((quotation.tax_amount_mxn / 2) * 100) / 100;
    const depositTotal = Math.round((quotation.total_mxn / 2) * 100) / 100;

    this.db.prepare(`
      INSERT INTO payments (
        id, project_id, concept, subtotal_mxn, tax_amount_mxn, total_mxn,
        payment_method, status
      ) VALUES (?, ?, 'ANTICIPO_50', ?, ?, ?, 'TRANSFERENCIA_SPEI', 'PENDING')
    `).run(paymentId, projectId, depositSubtotal, depositTax, depositTotal);

    this.auditService.logEvent({
      projectId,
      actorId: acceptedByEmail,
      actorRole: 'CLIENTE',
      actorIp: acceptedIpAddress,
      action: 'QUOTATION_ACCEPTED',
      fromState: PROJECT_STATES.QUOTED,
      toState: PROJECT_STATES.PAYMENT_PENDING,
      rationale: `Cotización v${quotation.version_number} aceptada formalmente por ${acceptedByName} (${acceptedByEmail}). Orden de anticipo 50% generada.`,
      evidenceHashSha256: quotation.digest_sha256
    });

    return {
      success: true,
      projectId,
      acceptedAt,
      nextState: PROJECT_STATES.PAYMENT_PENDING,
      depositAmount: depositTotal
    };
  }
}
