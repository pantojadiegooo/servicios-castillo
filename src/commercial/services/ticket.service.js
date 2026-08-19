/**
 * ============================================================================
 * GRUPO CASTILLO — SERVICIO DE TICKETS Y MESA DE INCIDENCIAS (v1.1 FROZEN)
 * ============================================================================
 * Implementa la gestión integral de tickets de soporte con identificador
 * GC-T-YYYY-XXXXXX, severidades congeladas S1 a S4, SLAs calculados,
 * aislamiento de incidentes críticos S1 en garantía y cierre exclusivo por
 * confirmación del cliente ("Problema resuelto").
 */

import { randomBytes } from 'node:crypto';
import { generateTicketId } from '../core/id-generator.js';
import { PROJECT_STATES } from '../core/state-machine.js';
import { ROLES } from '../core/roles.js';

export const TICKET_SEVERITIES = {
  S1: {
    code: 'S1',
    name: 'S1 — Crítica',
    description: 'Sitio web totalmente inaccesible o formulario/pasarela principal inoperable en producción.',
    slaResponseHours: 4,
    slaResolutionHours: 24
  },
  S2: {
    code: 'S2',
    name: 'S2 — Alta',
    description: 'Degradación importante de funcionalidad o falla en secciones clave sin bloqueo total.',
    slaResponseHours: 8,
    slaResolutionHours: 48
  },
  S3: {
    code: 'S3',
    name: 'S3 — Normal',
    description: 'Degradación menor, fallas no bloqueantes o inconsistencias secundarias de maquetación.',
    slaResponseHours: 24,
    slaResolutionHours: 72
  },
  S4: {
    code: 'S4',
    name: 'S4 — Baja',
    description: 'Solicitud de cambio menor de contenido, ajuste visual cosmético o consultas técnicas.',
    slaResponseHours: 48,
    slaResolutionHours: 120
  }
};

export class TicketService {
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
   * Crea un nuevo ticket de soporte asociado a un proyecto.
   * @param {object} params
   * @param {string} params.projectId
   * @param {string} params.title
   * @param {string} params.description
   * @param {string} [params.severity='S3'] - S1, S2, S3, S4
   * @param {Array<string>} [params.evidenceUrls=[]]
   * @param {object} params.actor - { userId, name, role, ip }
   * @returns {object}
   */
  createTicket({
    projectId,
    title,
    description,
    severity = 'S3',
    evidenceUrls = [],
    actor
  }) {
    if (!title || !description) {
      throw new Error('Título y descripción detallada son obligatorios para abrir un ticket');
    }

    const project = this.projectService.getProjectById(projectId);
    if (!project) throw new Error('Proyecto no encontrado');

    const sevConfig = TICKET_SEVERITIES[severity] || TICKET_SEVERITIES.S3;
    const ticketId = generateTicketId();

    const now = Date.now();
    const slaResponseDueAt = new Date(now + sevConfig.slaResponseHours * 60 * 60 * 1000).toISOString();
    const slaResolutionDueAt = new Date(now + sevConfig.slaResolutionHours * 60 * 60 * 1000).toISOString();
    const assignedEngineer = project.assigned_engineer_id || null;

    this.db.prepare(`
      INSERT INTO tickets (
        id, project_id, title, description, severity, internal_status,
        client_facing_status, assigned_engineer_id, sla_response_due_at,
        sla_resolution_due_at
      ) VALUES (?, ?, ?, ?, ?, 'RECEIVED', 'Recibido', ?, ?, ?)
    `).run(
      ticketId,
      projectId,
      title.trim(),
      description.trim(),
      sevConfig.code,
      assignedEngineer,
      slaResponseDueAt,
      slaResolutionDueAt
    );

    // Mensaje inicial en la conversación del ticket
    const messageId = `tmsg_${randomBytes(6).toString('hex')}`;
    this.db.prepare(`
      INSERT INTO ticket_messages (
        id, ticket_id, sender_role, sender_id, sender_name, message, evidence_urls_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      messageId,
      ticketId,
      actor.role,
      actor.userId,
      actor.name,
      description.trim(),
      JSON.stringify(evidenceUrls)
    );

    // Solo una severidad crítica S1 en un proyecto en estado WARRANTY activa INCIDENT_OPEN
    if (sevConfig.code === 'S1' && project.state === PROJECT_STATES.WARRANTY) {
      this.db.prepare(`
        UPDATE projects SET state = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?
      `).run(PROJECT_STATES.INCIDENT_OPEN, projectId);

      this.auditService.logEvent({
        projectId,
        actorId: actor.userId,
        actorRole: actor.role,
        actorIp: actor.ip,
        action: 'STATE_TRANSITION',
        fromState: PROJECT_STATES.WARRANTY,
        toState: PROJECT_STATES.INCIDENT_OPEN,
        rationale: `Apertura de incidente crítico S1 (${ticketId}: "${title}"). Proyecto pasa a contingencia INCIDENT_OPEN.`
      });
    }

    this.auditService.logEvent({
      projectId,
      actorId: actor.userId,
      actorRole: actor.role,
      actorIp: actor.ip,
      action: 'TICKET_CREATED',
      rationale: `Ticket ${ticketId} creado: "${title}" (Severidad ${sevConfig.name}). SLA de respuesta: ${sevConfig.slaResponseHours}h.`
    });

    return {
      success: true,
      ticketId,
      projectId,
      title,
      severity: sevConfig.code,
      clientFacingStatus: 'Recibido',
      slaResponseDueAt,
      slaResolutionDueAt
    };
  }

  /**
   * Agrega un mensaje o respuesta a la conversación de un ticket.
   * @param {string} ticketId
   * @param {string} message
   * @param {Array<string>} [evidenceUrls=[]]
   * @param {boolean} [isInternalNote=false]
   * @param {object} actor
   * @returns {object}
   */
  addMessage(ticketId, message, evidenceUrls = [], isInternalNote = false, actor) {
    if (!message || message.trim().length === 0) {
      throw new Error('El mensaje no puede estar vacío');
    }

    const ticket = this.db.prepare('SELECT * FROM tickets WHERE id = ?').get(ticketId);
    if (!ticket) throw new Error('Ticket no encontrado');

    const messageId = `tmsg_${randomBytes(6).toString('hex')}`;
    this.db.prepare(`
      INSERT INTO ticket_messages (
        id, ticket_id, sender_role, sender_id, sender_name, message,
        evidence_urls_json, is_internal_note
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      messageId,
      ticketId,
      actor.role,
      actor.userId,
      actor.name,
      message.trim(),
      JSON.stringify(evidenceUrls),
      isInternalNote ? 1 : 0
    );

    // Actualizar timestamp del ticket
    this.db.prepare('UPDATE tickets SET updated_at = strftime(\'%Y-%m-%dT%H:%M:%fZ\', \'now\') WHERE id = ?').run(ticketId);

    return {
      success: true,
      messageId,
      ticketId,
      senderName: actor.name,
      createdAt: new Date().toISOString()
    };
  }

  /**
   * El ingeniero o administración marca el ticket como resuelto técnicamente.
   * Transiciona el estado del cliente a "Resuelto" a la espera de confirmación.
   * Si no quedan otros incidentes S1 activos, retorna el proyecto de INCIDENT_OPEN a WARRANTY.
   *
   * @param {string} ticketId
   * @param {string} resolutionNotes
   * @param {object} actor
   * @returns {object}
   */
  resolveTicketInternal(ticketId, resolutionNotes, actor) {
    const ticket = this.db.prepare('SELECT * FROM tickets WHERE id = ?').get(ticketId);
    if (!ticket) throw new Error('Ticket no encontrado');

    const nowUtc = new Date().toISOString();

    this.db.prepare(`
      UPDATE tickets
      SET internal_status = 'RESOLVED_INTERNAL', client_facing_status = 'Resuelto',
          resolved_at = ?, updated_at = ?
      WHERE id = ?
    `).run(nowUtc, nowUtc, ticketId);

    // Agregar nota de resolución en el historial
    this.addMessage(ticketId, `[RESOLUCIÓN TÉCNICA]: ${resolutionNotes}`, [], false, actor);

    // Si el proyecto estaba en INCIDENT_OPEN, verificar si quedan otros incidentes S1 activos
    const project = this.projectService.getProjectById(ticket.project_id);
    if (project && project.state === PROJECT_STATES.INCIDENT_OPEN) {
      const activeS1 = this.db.prepare(`
        SELECT COUNT(*) as count FROM tickets
        WHERE project_id = ? AND severity = 'S1' AND internal_status NOT IN ('RESOLVED_INTERNAL', 'CLOSED')
      `).get(ticket.project_id);

      if (activeS1 && activeS1.count === 0) {
        this.db.prepare(`
          UPDATE projects SET state = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?
        `).run(PROJECT_STATES.WARRANTY, ticket.project_id);

        this.auditService.logEvent({
          projectId: ticket.project_id,
          actorId: actor.userId,
          actorRole: actor.role,
          actorIp: actor.ip,
          action: 'STATE_TRANSITION',
          fromState: PROJECT_STATES.INCIDENT_OPEN,
          toState: PROJECT_STATES.WARRANTY,
          rationale: `Todos los incidentes críticos S1 han sido solventados. El proyecto retorna al periodo de WARRANTY.`
        });
      }
    }

    this.auditService.logEvent({
      projectId: ticket.project_id,
      actorId: actor.userId,
      actorRole: actor.role,
      actorIp: actor.ip,
      action: 'TICKET_RESOLVED_INTERNAL',
      rationale: `Ticket ${ticketId} marcado como resuelto por ${actor.name}. Pendiente de confirmación final del cliente.`
    });

    return {
      success: true,
      ticketId,
      clientFacingStatus: 'Resuelto',
      resolvedAt: nowUtc
    };
  }

  /**
   * El cliente confirma: "Problema resuelto" y cierra oficialmente el ticket.
   * @param {string} ticketId
   * @param {string} clientEmail
   * @param {string} [actorIp]
   * @returns {object}
   */
  confirmTicketResolvedClient(ticketId, clientEmail, actorIp = null) {
    const ticket = this.db.prepare('SELECT * FROM tickets WHERE id = ?').get(ticketId);
    if (!ticket) throw new Error('Ticket no encontrado');

    const nowUtc = new Date().toISOString();

    this.db.prepare(`
      UPDATE tickets
      SET internal_status = 'CLOSED', client_facing_status = 'Resuelto',
          client_confirmed_resolved_at = ?, updated_at = ?
      WHERE id = ?
    `).run(nowUtc, nowUtc, ticketId);

    this.addMessage(ticketId, 'El cliente ha confirmado formalmente que el problema ha quedado resuelto a satisfacción.', [], false, {
      userId: clientEmail,
      name: clientEmail,
      role: ROLES.CLIENTE
    });

    this.auditService.logEvent({
      projectId: ticket.project_id,
      actorId: clientEmail,
      actorRole: ROLES.CLIENTE,
      actorIp,
      action: 'TICKET_CLOSED_BY_CLIENT',
      rationale: `El cliente (${clientEmail}) confirmó "Problema resuelto" para el ticket ${ticketId}. Ticket cerrado oficialmente.`
    });

    return {
      success: true,
      ticketId,
      isClosed: true,
      clientConfirmedResolvedAt: nowUtc,
      message: 'Ticket cerrado formalmente a satisfacción.'
    };
  }

  /**
   * Obtiene la lista completa de tickets y mensajes de un proyecto.
   * @param {string} projectId
   * @param {string} role - CLIENTE, INGENIERO, ADMINISTRACION
   * @returns {Array<object>}
   */
  getProjectTickets(projectId, role = ROLES.CLIENTE) {
    const tickets = this.db.prepare('SELECT * FROM tickets WHERE project_id = ? ORDER BY created_at DESC').all(projectId);

    return tickets.map(t => {
      // Filtrar notas internas si el rol es CLIENTE
      const msgStmt = role === ROLES.CLIENTE
        ? this.db.prepare('SELECT * FROM ticket_messages WHERE ticket_id = ? AND is_internal_note = 0 ORDER BY created_at ASC')
        : this.db.prepare('SELECT * FROM ticket_messages WHERE ticket_id = ? ORDER BY created_at ASC');

      const messages = msgStmt.all(t.id).map(m => ({
        ...m,
        evidenceUrls: JSON.parse(m.evidence_urls_json || '[]')
      }));

      return {
        ...t,
        messages
      };
    });
  }
}
