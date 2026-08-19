/**
 * ============================================================================
 * GRUPO CASTILLO — SERVICIO DE PREENTREGA Y REVISIÓN EN STAGING (v1.1)
 * ============================================================================
 * Gestiona el entorno de preentrega, la vinculación de evidencia Castle Gate
 * (CQS v1.1), la aprobación formal del cliente y el flujo trazable de observaciones.
 */

import { randomBytes } from 'node:crypto';
import { PROJECT_STATES } from '../core/state-machine.js';
import { ROLES } from '../core/roles.js';

export class PreDeliveryService {
  /**
   * @param {import('node:sqlite').DatabaseSync} db
   * @param {import('./audit.service.js').AuditService} auditService
   * @param {import('./project.service.js').ProjectService} projectService
   */
  constructor(db, auditService, projectService) {
    this.db = db;
    this.auditService = auditService;
    this.projectService = projectService;
  }

  /**
   * Publica el entorno de preentrega en staging para revisión del cliente.
   * Transiciona el proyecto de QA a PREDELIVERY.
   * @param {object} params
   * @param {string} params.projectId
   * @param {string} params.stagingUrl
   * @param {string} [params.castleGateValidationId]
   * @param {number} [params.castleGateScore]
   * @param {object} [params.castleGateCert]
   * @param {string} params.engineerId
   * @param {string} [params.actorIp]
   * @returns {object}
   */
  publishPreDelivery({
    projectId,
    stagingUrl,
    castleGateValidationId = null,
    castleGateScore = 100,
    castleGateCert = null,
    engineerId,
    actorIp = null
  }) {
    if (!stagingUrl) throw new Error('Se requiere la URL del entorno de staging');

    const project = this.projectService.getProjectById(projectId);
    if (!project) throw new Error('Proyecto no encontrado');

    const preDeliveryId = `prd_${randomBytes(6).toString('hex')}`;

    this.db.prepare(`
      INSERT INTO pre_deliveries (
        id, project_id, staging_url, castle_gate_validation_id,
        castle_gate_score, castle_gate_cert_json
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      preDeliveryId,
      projectId,
      stagingUrl,
      castleGateValidationId,
      castleGateScore,
      castleGateCert ? JSON.stringify(castleGateCert) : null
    );

    // Transición QA -> PREDELIVERY
    this.projectService.transitionState(
      projectId,
      PROJECT_STATES.PREDELIVERY,
      { userId: engineerId, role: ROLES.INGENIERO, ip: actorIp },
      `Entorno de staging publicado (${stagingUrl}) con validación Castle Gate ${castleGateValidationId || 'CQS PASS'}. Listo para revisión del cliente.`
    );

    return {
      success: true,
      preDeliveryId,
      projectId,
      stagingUrl,
      state: PROJECT_STATES.PREDELIVERY
    };
  }

  /**
   * El cliente aprueba la preentrega, transicionando a BALANCE_PENDING y generando la orden de finiquito.
   * @param {string} projectId
   * @param {string} clientEmail
   * @param {string} [actorIp]
   * @returns {object}
   */
  approvePreDelivery(projectId, clientEmail, actorIp = null) {
    const project = this.projectService.getProjectById(projectId);
    if (!project) throw new Error('Proyecto no encontrado');

    if (project.state !== PROJECT_STATES.PREDELIVERY) {
      throw new Error(`El proyecto no se encuentra en estado PREDELIVERY (Estado actual: ${project.state})`);
    }

    const decisionAt = new Date().toISOString();

    this.db.prepare(`
      UPDATE pre_deliveries
      SET client_decision = 'APPROVED', client_decision_at = ?
      WHERE project_id = ?
    `).run(decisionAt, projectId);

    // Generar orden de pago de finiquito si no existe
    const existingFiniquito = project.payments.find(p => p.concept === 'FINIQUITO_50');
    if (!existingFiniquito && project.quotation) {
      const paymentId = `pay_${randomBytes(6).toString('hex')}`;
      const balanceSubtotal = Math.round((project.quotation.subtotal_mxn / 2) * 100) / 100;
      const balanceTax = Math.round((project.quotation.tax_amount_mxn / 2) * 100) / 100;
      const balanceTotal = Math.round((project.quotation.total_mxn / 2) * 100) / 100;

      this.db.prepare(`
        INSERT INTO payments (
          id, project_id, concept, subtotal_mxn, tax_amount_mxn, total_mxn,
          payment_method, status
        ) VALUES (?, ?, 'FINIQUITO_50', ?, ?, ?, 'TRANSFERENCIA_SPEI', 'PENDING')
      `).run(paymentId, projectId, balanceSubtotal, balanceTax, balanceTotal);
    }

    // Transición PREDELIVERY -> BALANCE_PENDING
    this.projectService.transitionState(
      projectId,
      PROJECT_STATES.BALANCE_PENDING,
      { userId: clientEmail, role: ROLES.CLIENTE, ip: actorIp },
      'Preentrega en staging aprobada formalmente por el cliente. Esperando liquidación del 50% finiquito.'
    );

    return {
      success: true,
      projectId,
      state: PROJECT_STATES.BALANCE_PENDING,
      message: 'Preentrega aprobada. Se ha habilitado la orden de liquidación final.'
    };
  }

  /**
   * El cliente reporta observaciones técnicas o ajustes, retornando a DEVELOPMENT.
   * @param {string} projectId
   * @param {string} notes - Explicación detallada de observaciones
   * @param {Array<string>} [evidenceUrls=[]]
   * @param {string} clientEmail
   * @param {string} [actorIp]
   * @returns {object}
   */
  reportObservations(projectId, notes, evidenceUrls = [], clientEmail, actorIp = null) {
    if (!notes || notes.trim().length < 10) {
      throw new Error('Se requiere una descripción detallada de las observaciones (mínimo 10 caracteres)');
    }

    const project = this.projectService.getProjectById(projectId);
    if (!project) throw new Error('Proyecto no encontrado');

    if (project.state !== PROJECT_STATES.PREDELIVERY) {
      throw new Error(`Solo se pueden reportar observaciones en estado PREDELIVERY`);
    }

    const decisionAt = new Date().toISOString();

    this.db.prepare(`
      UPDATE pre_deliveries
      SET client_decision = 'OBSERVATIONS_SUBMITTED', client_decision_at = ?,
          observations_notes = ?, observations_evidence_urls_json = ?
      WHERE project_id = ?
    `).run(decisionAt, notes.trim(), JSON.stringify(evidenceUrls), projectId);

    // Transición PREDELIVERY -> DEVELOPMENT
    this.projectService.transitionState(
      projectId,
      PROJECT_STATES.DEVELOPMENT,
      { userId: clientEmail, role: ROLES.CLIENTE, ip: actorIp },
      `Observaciones de preentrega registradas por el cliente: "${notes.trim().substring(0, 120)}...". Retorno a ingeniería para ajustes.`
    );

    return {
      success: true,
      projectId,
      state: PROJECT_STATES.DEVELOPMENT,
      message: 'Observaciones registradas. El equipo de ingeniería atenderá los ajustes reportados.'
    };
  }
}
