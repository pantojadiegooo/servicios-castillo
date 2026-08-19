/**
 * ============================================================================
 * GRUPO CASTILLO — SERVICIO DE PROYECTOS Y EXPEDIENTES (v1.1)
 * ============================================================================
 * Administra el ciclo de vida del proyecto comercial, la aplicación estricta
 * de la Regla NO START, transiciones deterministas con autorización por rol,
 * el recálculo matemático de progreso y el Protocolo de Proyecto Hielo.
 */

import { PROJECT_STATES, isTransitionAllowed, validateNoStartRule, getPackageTrackingTimeline } from '../core/state-machine.js';
import { ROLES, hasCapability, CAPABILITIES } from '../core/roles.js';
import { calculateProjectProgress, MILESTONE_STATUS } from '../core/progress-calculator.js';

export class ProjectService {
  /**
   * @param {import('node:sqlite').DatabaseSync} db
   * @param {import('./audit.service.js').AuditService} auditService
   */
  constructor(db, auditService) {
    this.db = db;
    this.auditService = auditService;
  }

  /**
   * Obtiene la vista completa del expediente de un proyecto.
   * @param {string} projectId
   * @returns {object|null}
   */
  getProjectById(projectId) {
    const projectStmt = this.db.prepare(`
      SELECT p.*, c.business_name, c.contact_name, c.contact_email, c.contact_phone, c.rfc_tax_id,
             u.name as engineer_name, u.last_name as engineer_last_name, u.job_title as engineer_job_title,
             u.department as engineer_department, u.photo_url as engineer_photo_url
      FROM projects p
      JOIN clients c ON p.client_id = c.id
      LEFT JOIN internal_users u ON p.assigned_engineer_id = u.id
      WHERE p.id = ?
    `);
    const project = projectStmt.get(projectId);
    if (!project) return null;

    // Obtener versión activa de cotización
    const quotation = this.db.prepare(`
      SELECT * FROM quotation_versions WHERE project_id = ? ORDER BY version_number DESC LIMIT 1
    `).get(projectId);

    // Obtener contrato
    const contract = this.db.prepare(`
      SELECT * FROM contracts WHERE project_id = ?
    `).get(projectId);

    // Obtener hitos
    const milestones = this.db.prepare(`
      SELECT * FROM milestones WHERE project_id = ? ORDER BY code ASC
    `).all(projectId);

    // Obtener pagos
    const payments = this.db.prepare(`
      SELECT * FROM payments WHERE project_id = ? ORDER BY created_at ASC
    `).all(projectId);

    // Obtener preentregas
    const preDelivery = this.db.prepare(`
      SELECT * FROM pre_deliveries WHERE project_id = ? ORDER BY created_at DESC LIMIT 1
    `).get(projectId);

    // Obtener tickets
    const tickets = this.db.prepare(`
      SELECT * FROM tickets WHERE project_id = ? ORDER BY created_at DESC
    `).all(projectId);

    // Calcular progreso matemático
    const progressData = calculateProjectProgress(milestones);

    // Obtener timeline visual
    const timeline = getPackageTrackingTimeline(project.state);

    return {
      ...project,
      quotation,
      contract,
      milestones,
      payments,
      preDelivery,
      tickets,
      progress: progressData,
      timeline
    };
  }

  /**
   * Asigna un ingeniero responsable al proyecto (exclusivo para Administración).
   * @param {string} projectId
   * @param {string} engineerId
   * @param {string} adminId
   * @param {string} [actorIp]
   * @returns {object}
   */
  assignEngineer(projectId, engineerId, adminId, actorIp = null) {
    const engineer = this.db.prepare('SELECT * FROM internal_users WHERE id = ? AND role = ? AND is_active = 1').get(engineerId, ROLES.INGENIERO);
    if (!engineer) {
      throw new Error('El ingeniero especificado no existe o no se encuentra activo');
    }

    this.db.prepare('UPDATE projects SET assigned_engineer_id = ?, updated_at = strftime(\'%Y-%m-%dT%H:%M:%fZ\', \'now\') WHERE id = ?').run(engineerId, projectId);

    this.auditService.logEvent({
      projectId,
      actorId: adminId,
      actorRole: ROLES.ADMINISTRACION,
      actorIp,
      action: 'ENGINEER_ASSIGNED',
      rationale: `Asignación del Ing. ${engineer.name} ${engineer.last_name} (${engineer.job_title}) como responsable del proyecto ${projectId}`
    });

    return { success: true, projectId, engineerId, engineerName: `${engineer.name} ${engineer.last_name}` };
  }

  /**
   * Activa el proyecto superando la Regla NO START (exclusivo para Administración).
   * @param {string} projectId
   * @param {string} adminId
   * @param {string} engineerId
   * @param {string} [targetDeliveryDate]
   * @param {string} [actorIp]
   * @returns {object}
   */
  activateProject(projectId, adminId, engineerId, targetDeliveryDate = null, actorIp = null) {
    const project = this.getProjectById(projectId);
    if (!project) {
      throw new Error('Proyecto no encontrado');
    }

    // Comprobar si el anticipo (o hito 1) está pagado
    const paidInitialPayment = project.payments.find(p => (p.concept === 'ANTICIPO_50' || p.concept === 'HITO_1') && p.status === 'PAID');

    // Validar Regla NO START server-side
    const noStartValidation = validateNoStartRule({
      isQuotationAccepted: project.quotation ? project.quotation.is_accepted === 1 : false,
      isContractAccepted: project.contract ? project.contract.is_signed === 1 : false,
      isInitialPaymentConfirmed: !!paidInitialPayment,
      isAdminApproved: true,
      assignedEngineerId: engineerId || project.assigned_engineer_id
    });

    if (!noStartValidation.canStart) {
      throw new Error(`REGLA NO START ACTIVA: No es posible iniciar el proyecto. Faltan las siguientes condiciones:\n- ${noStartValidation.missingConditions.join('\n- ')}`);
    }

    if (!isTransitionAllowed(project.state, PROJECT_STATES.ACTIVE)) {
      throw new Error(`Transición no permitida desde ${project.state} hacia ${PROJECT_STATES.ACTIVE}`);
    }

    const assignedEng = engineerId || project.assigned_engineer_id;

    this.db.prepare(`
      UPDATE projects
      SET state = ?, assigned_engineer_id = ?, target_delivery_date = ?,
          updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
      WHERE id = ?
    `).run(PROJECT_STATES.ACTIVE, assignedEng, targetDeliveryDate, projectId);

    this.auditService.logEvent({
      projectId,
      actorId: adminId,
      actorRole: ROLES.ADMINISTRACION,
      actorIp,
      action: 'PROJECT_ACTIVATED_NO_START_CLEARED',
      fromState: project.state,
      toState: PROJECT_STATES.ACTIVE,
      rationale: `Regla NO START validada con éxito (Cotización + Contrato + Anticipo $${paidInitialPayment.total_mxn} MXN confirmado). Proyecto activado con ingeniero asignado.`
    });

    return {
      success: true,
      projectId,
      state: PROJECT_STATES.ACTIVE,
      assignedEngineerId: assignedEng,
      targetDeliveryDate
    };
  }

  /**
   * Ejecuta una transición de estado con validación estricta de RBAC y registro de auditoría.
   * @param {string} projectId
   * @param {string} toState
   * @param {object} actor - { userId, role, ip }
   * @param {string} rationale - Motivo obligatorio del cambio
   * @returns {object}
   */
  transitionState(projectId, toState, actor, rationale) {
    if (!rationale || typeof rationale !== 'string' || rationale.trim().length < 5) {
      throw new Error('Se requiere un motivo explicativo válido para autorizar el cambio de estado');
    }

    const project = this.getProjectById(projectId);
    if (!project) {
      throw new Error('Proyecto no encontrado');
    }

    if (!isTransitionAllowed(project.state, toState)) {
      throw new Error(`Transición no permitida de ${project.state} a ${toState}`);
    }

    // ------------------------------------------------------------------------
    // ENFORCEMENT ESTRICTO DE CAPACIDADES RBAC POR TRANSICIÓN
    // ------------------------------------------------------------------------
    if (actor.role === ROLES.CLIENTE) {
      // El rol CLIENTE únicamente puede transicionar estados específicos de su flujo:
      // - PREDELIVERY -> BALANCE_PENDING (Aprobación de preentrega)
      // - PREDELIVERY -> DEVELOPMENT (Observaciones de preentrega)
      // - DELIVERY_READY -> WARRANTY (Confirmación de recepción del handoff)
      // - PROJECT_FROZEN -> REACTIVATION_PENDING (Solicitud de reactivación)
      const allowedClientTransitions = [
        PROJECT_STATES.BALANCE_PENDING,
        PROJECT_STATES.DEVELOPMENT,
        PROJECT_STATES.WARRANTY,
        PROJECT_STATES.REACTIVATION_PENDING
      ];

      if (!allowedClientTransitions.includes(toState)) {
        throw new Error(`El rol CLIENTE no tiene autorización para ejecutar la transición de estado hacia ${toState}`);
      }
    } else if (actor.role === ROLES.INGENIERO) {
      // El rol INGENIERO no puede autorizar transiciones de estado directamente en producción.
      // Su capacidad se limita a proponer estados o actualizar hitos técnicos.
      // La autorización administrativa de PLANNING, DEVELOPMENT, QA, PREDELIVERY, etc. es de ADMINISTRACION.
      throw new Error(`El rol INGENIERO solo puede proponer avances de hitos técnicos; la autorización del cambio de estado hacia ${toState} requiere rol ADMINISTRACION`);
    } else if (actor.role === ROLES.ADMINISTRACION) {
      // ADMINISTRACION ostenta autorización para transiciones legalmente permitidas
      if (!hasCapability(ROLES.ADMINISTRACION, CAPABILITIES.AUTHORIZE_STATE_TRANSITION)) {
        throw new Error('Permisos administrativos insuficientes para autorizar la transición');
      }
    }

    // Si transiciona a ACTIVE, forzar validación de NO START
    if (toState === PROJECT_STATES.ACTIVE) {
      return this.activateProject(projectId, actor.userId, project.assigned_engineer_id, null, actor.ip);
    }

    this.db.prepare(`
      UPDATE projects
      SET state = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
      WHERE id = ?
    `).run(toState, projectId);

    this.auditService.logEvent({
      projectId,
      actorId: actor.userId,
      actorRole: actor.role,
      actorIp: actor.ip,
      action: 'STATE_TRANSITION',
      fromState: project.state,
      toState,
      rationale: rationale.trim()
    });

    return {
      success: true,
      projectId,
      fromState: project.state,
      toState
    };
  }

  /**
   * Actualiza el estado de un hito y recalcula automáticamente el progreso del proyecto.
   * @param {string} milestoneId
   * @param {string} status - PENDING, IN_PROGRESS, COMPLETED, VERIFIED
   * @param {string|null} evidenceUrl
   * @param {object} actor
   * @returns {object}
   */
  updateMilestone(milestoneId, status, evidenceUrl = null, actor) {
    const milestone = this.db.prepare('SELECT * FROM milestones WHERE id = ?').get(milestoneId);
    if (!milestone) {
      throw new Error('Hito no encontrado');
    }

    const nowUtc = new Date().toISOString();
    const approvedBy = (status === MILESTONE_STATUS.COMPLETED || status === MILESTONE_STATUS.VERIFIED) ? actor.userId : null;
    const approvedAt = approvedBy ? nowUtc : null;

    this.db.prepare(`
      UPDATE milestones
      SET status = ?, evidence_url = COALESCE(?, evidence_url),
          approved_by = COALESCE(?, approved_by), approved_at = COALESCE(?, approved_at),
          updated_at = ?
      WHERE id = ?
    `).run(status, evidenceUrl, approvedBy, approvedAt, nowUtc, milestoneId);

    // Recalcular progreso global del proyecto
    const allMilestones = this.db.prepare('SELECT * FROM milestones WHERE project_id = ?').all(milestone.project_id);
    const progressData = calculateProjectProgress(allMilestones);

    this.db.prepare(`
      UPDATE projects
      SET progress_percentage = ?, updated_at = ?
      WHERE id = ?
    `).run(progressData.progressPercentage, nowUtc, milestone.project_id);

    this.auditService.logEvent({
      projectId: milestone.project_id,
      actorId: actor.userId,
      actorRole: actor.role,
      actorIp: actor.ip,
      action: 'MILESTONE_UPDATED',
      rationale: `Hito ${milestone.code} (${milestone.name}) actualizado a estado ${status}. Progreso recalculado a ${progressData.progressPercentage}%`,
      metadata: { milestoneId, status, progressPercentage: progressData.progressPercentage }
    });

    return {
      success: true,
      milestoneId,
      status,
      newProgressPercentage: progressData.progressPercentage
    };
  }

  /**
   * Protocolo de Proyecto Hielo: Registra inactividad de insumos y gestiona alertas escalonadas.
   * @param {string} projectId
   * @param {number} inactiveDays
   * @param {string} [actorId='SYSTEM_MONITOR']
   * @returns {object}
   */
  processInactivityCheck(projectId, inactiveDays, actorId = 'SYSTEM_MONITOR') {
    const project = this.getProjectById(projectId);
    if (!project) throw new Error('Proyecto no encontrado');

    let alertsSent = project.inactivity_alerts_sent;
    let newAlertTriggered = false;
    let alertMessage = null;

    if (inactiveDays >= 8 && alertsSent === 0) {
      alertsSent = 1;
      newAlertTriggered = true;
      alertMessage = 'Alerta 1: Falta de respuesta, aprobación o insumos necesarios por parte del cliente (8 días de inactividad).';
    } else if (inactiveDays >= 12 && alertsSent === 1) {
      alertsSent = 2;
      newAlertTriggered = true;
      alertMessage = 'Alerta 2: Segundo aviso preventivo por falta de insumos o respuesta del cliente.';
    } else if (inactiveDays >= 15 && alertsSent === 2) {
      alertsSent = 3;
      newAlertTriggered = true;
      alertMessage = 'Alerta 3: Tercer y último aviso formal previo a congelamiento de cronograma.';
    }

    this.db.prepare(`
      UPDATE projects
      SET inactivity_days = ?, inactivity_alerts_sent = ?,
          updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
      WHERE id = ?
    `).run(inactiveDays, alertsSent, projectId);

    if (newAlertTriggered) {
      this.auditService.logEvent({
        projectId,
        actorId,
        actorRole: 'SYSTEM_DAEMON',
        action: `INACTIVITY_ALERT_${alertsSent}`,
        rationale: alertMessage
      });
    }

    return {
      projectId,
      inactiveDays,
      alertsSent,
      canBeFrozenByAdmin: alertsSent >= 3,
      newAlertTriggered,
      alertMessage
    };
  }

  /**
   * Congela administrativamente un proyecto tras completar las 3 alertas de inactividad.
   * @param {string} projectId
   * @param {string} adminId
   * @param {string} rationale
   * @param {string} [actorIp]
   * @returns {object}
   */
  freezeProject(projectId, adminId, rationale, actorIp = null) {
    const project = this.getProjectById(projectId);
    if (!project) throw new Error('Proyecto no encontrado');

    if (project.inactivity_alerts_sent < 3) {
      throw new Error('Para congelar oficialmente un proyecto deben haberse emitido las 3 alertas previas de seguimiento.');
    }

    const officialRationale = rationale || 'Falta de respuesta, aprobación o información necesaria por parte del cliente tras 3 avisos formales.';

    this.db.prepare(`
      UPDATE projects
      SET state = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
      WHERE id = ?
    `).run(PROJECT_STATES.PROJECT_FROZEN, projectId);

    this.auditService.logEvent({
      projectId,
      actorId: adminId,
      actorRole: ROLES.ADMINISTRACION,
      actorIp,
      action: 'PROJECT_FROZEN',
      fromState: project.state,
      toState: PROJECT_STATES.PROJECT_FROZEN,
      rationale: officialRationale
    });

    return {
      success: true,
      projectId,
      state: PROJECT_STATES.PROJECT_FROZEN,
      message: 'Proyecto congelado formalmente. Cronograma y contador de tiempo detenidos.'
    };
  }

  /**
   * Solicita reactivación del proyecto por parte del cliente o administración.
   * @param {string} projectId
   * @param {object} actor
   * @returns {object}
   */
  requestReactivation(projectId, actor) {
    const project = this.getProjectById(projectId);
    if (!project) throw new Error('Proyecto no encontrado');

    if (project.state !== PROJECT_STATES.PROJECT_FROZEN) {
      throw new Error('Solo se puede solicitar reactivación en proyectos que se encuentren en estado PROJECT_FROZEN');
    }

    this.db.prepare(`
      UPDATE projects
      SET state = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
      WHERE id = ?
    `).run(PROJECT_STATES.REACTIVATION_PENDING, projectId);

    this.auditService.logEvent({
      projectId,
      actorId: actor.userId,
      actorRole: actor.role,
      actorIp: actor.ip,
      action: 'REACTIVATION_REQUESTED',
      fromState: PROJECT_STATES.PROJECT_FROZEN,
      toState: PROJECT_STATES.REACTIVATION_PENDING,
      rationale: 'El cliente ha retomado contacto y solicita la reanudación operativa del proyecto.'
    });

    return {
      success: true,
      projectId,
      state: PROJECT_STATES.REACTIVATION_PENDING
    };
  }

  /**
   * Aprueba administrativamente la reactivación del proyecto con nuevo cronograma.
   * @param {string} projectId
   * @param {string} adminId
   * @param {string} newTargetDeliveryDate
   * @param {string} rationale
   * @param {string} [actorIp]
   * @returns {object}
   */
  approveReactivation(projectId, adminId, newTargetDeliveryDate, rationale, actorIp = null) {
    const project = this.getProjectById(projectId);
    if (!project) throw new Error('Proyecto no encontrado');

    if (project.state !== PROJECT_STATES.REACTIVATION_PENDING) {
      throw new Error('El proyecto no se encuentra en estado REACTIVATION_PENDING');
    }

    const nextState = PROJECT_STATES.DEVELOPMENT;

    this.db.prepare(`
      UPDATE projects
      SET state = ?, target_delivery_date = ?, inactivity_days = 0, inactivity_alerts_sent = 0,
          last_client_activity_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
          updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
      WHERE id = ?
    `).run(nextState, newTargetDeliveryDate, projectId);

    this.auditService.logEvent({
      projectId,
      actorId: adminId,
      actorRole: ROLES.ADMINISTRACION,
      actorIp,
      action: 'REACTIVATION_APPROVED',
      fromState: PROJECT_STATES.REACTIVATION_PENDING,
      toState: nextState,
      rationale: `Reactivación autorizada por Administración. Nueva fecha estimada fijada para ${newTargetDeliveryDate}. ${rationale}`
    });

    return {
      success: true,
      projectId,
      state: nextState,
      newTargetDeliveryDate
    };
  }
}
