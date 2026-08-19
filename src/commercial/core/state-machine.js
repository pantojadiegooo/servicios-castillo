/**
 * ============================================================================
 * GRUPO CASTILLO — MÁQUINA DE ESTADOS DEL PROYECTO (v1.1 FROZEN)
 * ============================================================================
 * Implementa los 21 estados deterministas del ciclo de vida comercial y técnico,
 * sus transiciones permitidas, requisitos previos (Regla NO START, Preentrega, etc.)
 * y las traducciones a lenguaje comercial transparente para el portal del cliente.
 */

export const PROJECT_STATES = {
  DRAFT: 'DRAFT',
  QUOTED: 'QUOTED',
  ACCEPTED: 'ACCEPTED',
  PAYMENT_PENDING: 'PAYMENT_PENDING',
  ACTIVE: 'ACTIVE',
  PLANNING: 'PLANNING',
  DEVELOPMENT: 'DEVELOPMENT',
  QA: 'QA',
  AWAITING_CLIENT: 'AWAITING_CLIENT',
  PROJECT_FROZEN: 'PROJECT_FROZEN',
  REACTIVATION_PENDING: 'REACTIVATION_PENDING',
  PREDELIVERY: 'PREDELIVERY',
  BALANCE_PENDING: 'BALANCE_PENDING',
  DELIVERY_READY: 'DELIVERY_READY',
  WARRANTY: 'WARRANTY',
  INCIDENT_OPEN: 'INCIDENT_OPEN',
  COMPLETED: 'COMPLETED',
  PORTAL_EXPIRED: 'PORTAL_EXPIRED',
  CANCELLED: 'CANCELLED',
  REFUND_REVIEW: 'REFUND_REVIEW',
  REFUND_APPROVED: 'REFUND_APPROVED',
  REFUNDED: 'REFUNDED'
};

/**
 * Traducción de estados internos a lenguaje amigable para clientes en el Portal.
 */
export const CLIENT_FACING_STATE_LABELS = {
  [PROJECT_STATES.DRAFT]: 'En Preparación de Propuesta',
  [PROJECT_STATES.QUOTED]: 'Cotización Emitida',
  [PROJECT_STATES.ACCEPTED]: 'Cotización Aceptada',
  [PROJECT_STATES.PAYMENT_PENDING]: 'Esperando Confirmación de Anticipo',
  [PROJECT_STATES.ACTIVE]: 'Proyecto Aprobado e Iniciado',
  [PROJECT_STATES.PLANNING]: 'Fase de Arquitectura y Planeación',
  [PROJECT_STATES.DEVELOPMENT]: 'Desarrollo e Ingeniería en Curso',
  [PROJECT_STATES.QA]: 'Aseguramiento de Calidad y Pruebas CQS',
  [PROJECT_STATES.AWAITING_CLIENT]: 'Pendiente de Información del Cliente',
  [PROJECT_STATES.PROJECT_FROZEN]: 'Proyecto en Pausa Administrativa',
  [PROJECT_STATES.REACTIVATION_PENDING]: 'Solicitud de Reanudación en Revisión',
  [PROJECT_STATES.PREDELIVERY]: 'Preentrega en Staging Lista para Revisión',
  [PROJECT_STATES.BALANCE_PENDING]: 'Esperando Liquidación Final',
  [PROJECT_STATES.DELIVERY_READY]: 'Listo para Transferencia Final',
  [PROJECT_STATES.WARRANTY]: 'Garantía Técnica Activa (30 Días)',
  [PROJECT_STATES.INCIDENT_OPEN]: 'Atención de Incidente en Garantía',
  [PROJECT_STATES.COMPLETED]: 'Proyecto Completado y Entregado a Satisfacción',
  [PROJECT_STATES.PORTAL_EXPIRED]: 'Acceso a Portal Concluido (Expediente Archivado)',
  [PROJECT_STATES.CANCELLED]: 'Proyecto Concluido / Cancelado',
  [PROJECT_STATES.REFUND_REVIEW]: 'Revisión Administrativa de Liquidación',
  [PROJECT_STATES.REFUND_APPROVED]: 'Liquidación Aprobada',
  [PROJECT_STATES.REFUNDED]: 'Liquidación Efectuada'
};

/**
 * Matriz de transiciones permitidas.
 * Cada estado lista los estados a los que puede transicionar directamente.
 */
export const ALLOWED_TRANSITIONS = {
  [PROJECT_STATES.DRAFT]: [PROJECT_STATES.QUOTED, PROJECT_STATES.CANCELLED],
  [PROJECT_STATES.QUOTED]: [PROJECT_STATES.ACCEPTED, PROJECT_STATES.CANCELLED],
  [PROJECT_STATES.ACCEPTED]: [PROJECT_STATES.PAYMENT_PENDING, PROJECT_STATES.CANCELLED],
  [PROJECT_STATES.PAYMENT_PENDING]: [PROJECT_STATES.ACTIVE, PROJECT_STATES.CANCELLED],
  [PROJECT_STATES.ACTIVE]: [PROJECT_STATES.PLANNING, PROJECT_STATES.REFUND_REVIEW, PROJECT_STATES.CANCELLED],
  [PROJECT_STATES.PLANNING]: [PROJECT_STATES.DEVELOPMENT, PROJECT_STATES.AWAITING_CLIENT, PROJECT_STATES.REFUND_REVIEW, PROJECT_STATES.CANCELLED],
  [PROJECT_STATES.DEVELOPMENT]: [PROJECT_STATES.QA, PROJECT_STATES.AWAITING_CLIENT, PROJECT_STATES.REFUND_REVIEW, PROJECT_STATES.CANCELLED],
  [PROJECT_STATES.QA]: [PROJECT_STATES.PREDELIVERY, PROJECT_STATES.DEVELOPMENT, PROJECT_STATES.CANCELLED],
  [PROJECT_STATES.AWAITING_CLIENT]: [PROJECT_STATES.DEVELOPMENT, PROJECT_STATES.PLANNING, PROJECT_STATES.PROJECT_FROZEN, PROJECT_STATES.CANCELLED],
  [PROJECT_STATES.PROJECT_FROZEN]: [PROJECT_STATES.REACTIVATION_PENDING, PROJECT_STATES.CANCELLED],
  [PROJECT_STATES.REACTIVATION_PENDING]: [PROJECT_STATES.PLANNING, PROJECT_STATES.DEVELOPMENT, PROJECT_STATES.CANCELLED],
  [PROJECT_STATES.PREDELIVERY]: [PROJECT_STATES.BALANCE_PENDING, PROJECT_STATES.DEVELOPMENT, PROJECT_STATES.REFUND_REVIEW],
  [PROJECT_STATES.BALANCE_PENDING]: [PROJECT_STATES.DELIVERY_READY, PROJECT_STATES.REFUND_REVIEW, PROJECT_STATES.CANCELLED],
  [PROJECT_STATES.DELIVERY_READY]: [PROJECT_STATES.WARRANTY, PROJECT_STATES.REFUND_REVIEW],
  [PROJECT_STATES.WARRANTY]: [PROJECT_STATES.INCIDENT_OPEN, PROJECT_STATES.COMPLETED],
  [PROJECT_STATES.INCIDENT_OPEN]: [PROJECT_STATES.WARRANTY, PROJECT_STATES.REFUND_REVIEW],
  [PROJECT_STATES.COMPLETED]: [PROJECT_STATES.PORTAL_EXPIRED],
  [PROJECT_STATES.PORTAL_EXPIRED]: [],
  [PROJECT_STATES.CANCELLED]: [PROJECT_STATES.REFUND_REVIEW],
  [PROJECT_STATES.REFUND_REVIEW]: [PROJECT_STATES.REFUND_APPROVED, PROJECT_STATES.ACTIVE, PROJECT_STATES.CANCELLED],
  [PROJECT_STATES.REFUND_APPROVED]: [PROJECT_STATES.REFUNDED],
  [PROJECT_STATES.REFUNDED]: []
};

/**
 * Valida si una transición de estado es estructuralmente legal.
 * @param {string} fromState
 * @param {string} toState
 * @returns {boolean}
 */
export function isTransitionAllowed(fromState, toState) {
  if (!fromState || !toState) return false;
  const allowed = ALLOWED_TRANSITIONS[fromState];
  return Array.isArray(allowed) && allowed.includes(toState);
}

/**
 * Valida la REGLA NO START antes de permitir la transición a ACTIVE.
 * Requiere simultáneamente:
 * 1. Cotización aceptada.
 * 2. Contrato firmado/aceptado.
 * 3. Pago inicial confirmado.
 * 4. Aprobación humana de Administración.
 * 5. Ingeniero responsable asignado.
 *
 * @param {object} context
 * @param {boolean} context.isQuotationAccepted
 * @param {boolean} context.isContractAccepted
 * @param {boolean} context.isInitialPaymentConfirmed
 * @param {boolean} context.isAdminApproved
 * @param {string|null} context.assignedEngineerId
 * @returns {{ canStart: boolean, missingConditions: string[] }}
 */
export function validateNoStartRule(context) {
  const missingConditions = [];

  if (!context.isQuotationAccepted) {
    missingConditions.push('La cotización no ha sido aceptada por el cliente.');
  }
  if (!context.isContractAccepted) {
    missingConditions.push('El contrato marco y SOW no han sido firmados/aceptados.');
  }
  if (!context.isInitialPaymentConfirmed) {
    missingConditions.push('El pago inicial (anticipo del 50% o hito 1) no ha sido confirmado.');
  }
  if (!context.isAdminApproved) {
    missingConditions.push('Falta la aprobación administrativa formal para la activación.');
  }
  if (!context.assignedEngineerId) {
    missingConditions.push('Debe asignarse un ingeniero responsable antes de entrar a ACTIVE.');
  }

  return {
    canStart: missingConditions.length === 0,
    missingConditions
  };
}

/**
 * Obtiene la etapa del timeline visual ("seguimiento de paquete") para el portal.
 * @param {string} state
 * @returns {{ stageIndex: number, stageName: string, stages: Array<{ key: string, name: string, status: 'completed'|'current'|'upcoming' }> }}
 */
export function getPackageTrackingTimeline(state) {
  const STAGES = [
    { key: 'planning', name: 'Planeación' },
    { key: 'development', name: 'Desarrollo' },
    { key: 'qa', name: 'Pruebas' },
    { key: 'predelivery', name: 'Preentrega' },
    { key: 'delivery', name: 'Entrega' },
    { key: 'warranty', name: 'Garantía' }
  ];

  let currentStageIndex = 0;

  switch (state) {
    case PROJECT_STATES.DRAFT:
    case PROJECT_STATES.QUOTED:
    case PROJECT_STATES.ACCEPTED:
    case PROJECT_STATES.PAYMENT_PENDING:
    case PROJECT_STATES.ACTIVE:
    case PROJECT_STATES.PLANNING:
      currentStageIndex = 0;
      break;
    case PROJECT_STATES.DEVELOPMENT:
    case PROJECT_STATES.AWAITING_CLIENT:
    case PROJECT_STATES.PROJECT_FROZEN:
    case PROJECT_STATES.REACTIVATION_PENDING:
      currentStageIndex = 1;
      break;
    case PROJECT_STATES.QA:
      currentStageIndex = 2;
      break;
    case PROJECT_STATES.PREDELIVERY:
    case PROJECT_STATES.BALANCE_PENDING:
      currentStageIndex = 3;
      break;
    case PROJECT_STATES.DELIVERY_READY:
      currentStageIndex = 4;
      break;
    case PROJECT_STATES.WARRANTY:
    case PROJECT_STATES.INCIDENT_OPEN:
    case PROJECT_STATES.COMPLETED:
    case PROJECT_STATES.PORTAL_EXPIRED:
      currentStageIndex = 5;
      break;
    default:
      currentStageIndex = 0;
  }

  const stages = STAGES.map((s, idx) => {
    let status = 'upcoming';
    if (idx < currentStageIndex) {
      status = 'completed';
    } else if (idx === currentStageIndex) {
      status = 'current';
    }
    return { ...s, status };
  });

  return {
    stageIndex: currentStageIndex,
    stageName: STAGES[currentStageIndex]?.name || 'Planeación',
    stages
  };
}
