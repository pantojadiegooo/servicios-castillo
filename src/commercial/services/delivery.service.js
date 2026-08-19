/**
 * ============================================================================
 * GRUPO CASTILLO — SERVICIO DE ENTREGA, HANDOFF Y GARANTÍA (v1.1)
 * ============================================================================
 * Administra la autorización de entrega tras la liquidación del saldo,
 * la confirmación formal de recepción del cliente, la activación del periodo
 * de garantía de 30 días naturales y la expiración segura del portal (T+15).
 */

import { PROJECT_STATES } from '../core/state-machine.js';
import { ROLES } from '../core/roles.js';

export class DeliveryService {
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
   * Administración autoriza la entrega tras confirmar que el saldo ha sido 100% liquidado.
   * Transiciona BALANCE_PENDING -> DELIVERY_READY.
   * @param {string} projectId
   * @param {string} adminId
   * @param {string} [actorIp]
   * @returns {object}
   */
  authorizeDelivery(projectId, adminId, actorIp = null) {
    const project = this.projectService.getProjectById(projectId);
    if (!project) throw new Error('Proyecto no encontrado');

    if (project.state !== PROJECT_STATES.BALANCE_PENDING) {
      throw new Error(`Para autorizar la entrega el proyecto debe estar en BALANCE_PENDING (Estado actual: ${project.state})`);
    }

    // Verificar que el finiquito esté pagado
    const finiquito = project.payments.find(p => p.concept === 'FINIQUITO_50' || p.concept.startsWith('HITO_FINAL'));
    if (!finiquito || finiquito.status !== 'PAID') {
      throw new Error('No se puede autorizar la entrega: El saldo final de finiquito no ha sido confirmado como pagado.');
    }

    this.projectService.transitionState(
      projectId,
      PROJECT_STATES.DELIVERY_READY,
      { userId: adminId, role: ROLES.ADMINISTRACION, ip: actorIp },
      `Saldo final liquidado y conciliado. Entrega autorizada para transferencia de repositorio Git, hosting y credenciales.`
    );

    return {
      success: true,
      projectId,
      state: PROJECT_STATES.DELIVERY_READY,
      message: 'Entrega autorizada. El cliente puede proceder a la recepción final y activación de garantía.'
    };
  }

  /**
   * El cliente confirma la recepción formal del handoff y activa la garantía de 30 días.
   * Transiciona DELIVERY_READY -> WARRANTY.
   * @param {string} projectId
   * @param {string} clientEmail
   * @param {string} [actorIp]
   * @returns {object}
   */
  confirmReceiptAndStartWarranty(projectId, clientEmail, actorIp = null) {
    const project = this.projectService.getProjectById(projectId);
    if (!project) throw new Error('Proyecto no encontrado');

    if (project.state !== PROJECT_STATES.DELIVERY_READY) {
      throw new Error(`Solo se puede confirmar recepción en estado DELIVERY_READY (Estado actual: ${project.state})`);
    }

    const warrantyStartDate = new Date().toISOString();
    const warrantyEndDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    this.projectService.transitionState(
      projectId,
      PROJECT_STATES.WARRANTY,
      { userId: clientEmail, role: ROLES.CLIENTE, ip: actorIp },
      `Recepción de activos y handoff confirmada a satisfacción por el cliente (${clientEmail}). Activada garantía técnica de 30 días naturales (Vigente hasta ${warrantyEndDate}).`
    );

    return {
      success: true,
      projectId,
      state: PROJECT_STATES.WARRANTY,
      warrantyStartDate,
      warrantyEndDate,
      message: 'Recepción confirmada con éxito. Garantía técnica de 30 días naturales activada.'
    };
  }

  /**
   * Cierre formal del proyecto tras concluir los 30 días de garantía sin incidencias abiertas.
   * Transiciona WARRANTY -> COMPLETED y programa la expiración del portal (T+15 días).
   * @param {string} projectId
   * @param {string} adminId
   * @param {string} [actorIp]
   * @returns {object}
   */
  completeProject(projectId, adminId, actorIp = null) {
    const project = this.projectService.getProjectById(projectId);
    if (!project) throw new Error('Proyecto no encontrado');

    if (project.state !== PROJECT_STATES.WARRANTY) {
      throw new Error(`Solo se puede completar un proyecto en estado WARRANTY`);
    }

    // Verificar que no existan tickets abiertos
    const openTickets = project.tickets.filter(t => t.internal_status !== 'CLOSED');
    if (openTickets.length > 0) {
      throw new Error(`No se puede cerrar el proyecto: Existen ${openTickets.length} ticket(s) de soporte aún activos.`);
    }

    // Portal expira en 15 días naturales tras COMPLETED
    const portalExpiresAt = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString();

    this.db.prepare(`
      UPDATE projects
      SET portal_access_expires_at = ?
      WHERE id = ?
    `).run(portalExpiresAt, projectId);

    this.projectService.transitionState(
      projectId,
      PROJECT_STATES.COMPLETED,
      { userId: adminId, role: ROLES.ADMINISTRACION, ip: actorIp },
      `Proyecto finalizado con éxito. Periodo de garantía cumplido sin incidentes pendientes. Acceso al portal programado para expirar el ${portalExpiresAt} (El expediente interno se preserva de forma inmutable).`
    );

    return {
      success: true,
      projectId,
      state: PROJECT_STATES.COMPLETED,
      portalExpiresAt
    };
  }
}
