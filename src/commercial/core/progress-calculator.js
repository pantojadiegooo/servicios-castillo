/**
 * ============================================================================
 * GRUPO CASTILLO — CALCULADORA CENTRALIZADA DE PROGRESO POR HITOS (v1.1)
 * ============================================================================
 * El porcentaje de avance del proyecto NO es un valor arbitrario editable por API.
 * Se deriva estrictamente de la suma ponderada de los hitos completados y verificados.
 */

export const MILESTONE_STATUS = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  VERIFIED: 'VERIFIED'
};

/**
 * Genera el conjunto estándar de 4 hitos para paquetes build normales (Iron a Platinum).
 * @param {string} projectId
 * @returns {Array<object>}
 */
export function generateDefaultMilestones(projectId) {
  return [
    {
      id: `${projectId}-H1`,
      projectId,
      code: 'H1',
      name: 'Arquitectura de información, wireframe y tokens de diseño',
      description: 'Estructuración inicial de layout, paleta Living Glass y mapa de rutas.',
      weight: 25,
      status: MILESTONE_STATUS.PENDING,
      evidenceUrl: null,
      approvedBy: null,
      approvedAt: null
    },
    {
      id: `${projectId}-H2`,
      projectId,
      code: 'H2',
      name: 'Maquetación interactiva y componentes en entorno staging',
      description: 'Construcción modular de vistas en servidor de pruebas accesible al cliente.',
      weight: 35,
      status: MILESTONE_STATUS.PENDING,
      evidenceUrl: null,
      approvedBy: null,
      approvedAt: null
    },
    {
      id: `${projectId}-H3`,
      projectId,
      code: 'H3',
      name: 'Integración de contenidos definitivos, formularios y SEO',
      description: 'Textos finales, validación de captura antispam y metadatos canónicos.',
      weight: 20,
      status: MILESTONE_STATUS.PENDING,
      evidenceUrl: null,
      approvedBy: null,
      approvedAt: null
    },
    {
      id: `${projectId}-H4`,
      projectId,
      code: 'H4',
      name: 'Auditoría Castle Gate (CQS), despliegue a producción y Handoff final',
      description: 'Ejecución del runner CQS v1.1, emisión de certificado criptográfico y transferencia.',
      weight: 20,
      status: MILESTONE_STATUS.PENDING,
      evidenceUrl: null,
      approvedBy: null,
      approvedAt: null
    }
  ];
}

/**
 * Calcula el porcentaje de avance derivado de la lista de hitos.
 * @param {Array<object>} milestones
 * @returns {{ progressPercentage: number, totalWeight: number, completedWeight: number, completedCount: number, totalCount: number, nextMilestone: object|null }}
 */
export function calculateProjectProgress(milestones) {
  if (!Array.isArray(milestones) || milestones.length === 0) {
    return {
      progressPercentage: 0,
      totalWeight: 0,
      completedWeight: 0,
      completedCount: 0,
      totalCount: 0,
      nextMilestone: null
    };
  }

  let totalWeight = 0;
  let completedWeight = 0;
  let completedCount = 0;
  let nextMilestone = null;

  for (const m of milestones) {
    const weight = Number(m.weight) || 0;
    totalWeight += weight;

    if (m.status === MILESTONE_STATUS.COMPLETED || m.status === MILESTONE_STATUS.VERIFIED) {
      completedWeight += weight;
      completedCount += 1;
    } else if (!nextMilestone && (m.status === MILESTONE_STATUS.PENDING || m.status === MILESTONE_STATUS.IN_PROGRESS)) {
      nextMilestone = m;
    }
  }

  const normalizedTotalWeight = totalWeight > 0 ? totalWeight : 100;
  const rawPercentage = (completedWeight / normalizedTotalWeight) * 100;
  const progressPercentage = Math.min(100, Math.max(0, Math.round(rawPercentage * 10) / 10));

  return {
    progressPercentage,
    totalWeight,
    completedWeight,
    completedCount,
    totalCount: milestones.length,
    nextMilestone
  };
}
