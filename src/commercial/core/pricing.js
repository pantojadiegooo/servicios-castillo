/**
 * ============================================================================
 * GRUPO CASTILLO — FUENTE ÚNICA DE VERDAD DE PRICING Y PAQUETES (v1.1)
 * ============================================================================
 * Este archivo centraliza todas las tarifas, límites, descripciones y alcances
 * comerciales de Grupo Castillo. NINGÚN módulo debe duplicar o hardcodear precios.
 */

export const TAX_RATE_DEFAULT = 0.16; // IVA 16% estándar en México (parametrizable)

export const BUILD_PACKAGES = {
  IRON: {
    id: 'iron',
    tier: '01',
    name: 'Castle Iron',
    fullName: 'Paquete Castle Iron',
    priceMxn: 2800,
    priceUsdEstimate: 165,
    subtitle: 'Presencia digital esencial One-Page para profesionistas y micronegocios',
    pageLimit: 1,
    pageStructure: '1 Vista Ágil (One-Page)',
    reviewRounds: 1,
    features: [
      'Estructura One-Page (1 vista ágil)',
      'Enlace directo a WhatsApp',
      'Optimización de carga y rendimiento web',
      'Certificado SSL y hosting incluido',
      '1 ronda de revisión formal',
      'Titularidad 100% del cliente'
    ],
    governanceLevel: 'C1'
  },
  BRONZE: {
    id: 'bronze',
    tier: '02',
    name: 'Castle Bronze',
    fullName: 'Paquete Castle Bronze',
    priceMxn: 4500,
    priceUsdEstimate: 265,
    subtitle: 'Landing comercial enfocada en conversión para campañas y nuevos productos',
    pageLimit: 1,
    maxSections: 5,
    pageStructure: 'Hasta 5 secciones estructuradas',
    reviewRounds: 2,
    features: [
      'Hasta 5 secciones estructuradas',
      'Formulario de captación de clientes',
      'Integración analítica básica',
      'Diseño adaptado a móviles',
      '2 rondas de revisión formal',
      'Titularidad 100% del cliente'
    ],
    governanceLevel: 'C1'
  },
  SILVER: {
    id: 'silver',
    tier: '03',
    name: 'Castle Silver',
    fullName: 'Paquete Castle Silver',
    priceMxn: 7500,
    priceUsdEstimate: 440,
    subtitle: 'Sitio corporativo multi-página para empresas que requieren estructura formal',
    pageLimit: 5,
    pageStructure: 'Hasta 5 páginas completas independientes',
    reviewRounds: 3,
    features: [
      'Hasta 5 páginas completas independientes',
      'Menú de navegación interactivo',
      'SEO on-page y metadatos estructurados',
      'Protocolo de validación técnica incluido',
      '3 rondas de revisión formal',
      'Titularidad 100% del cliente'
    ],
    governanceLevel: 'C1'
  },
  GOLD: {
    id: 'gold',
    tier: '04',
    name: 'Castle Gold',
    fullName: 'Paquete Castle Gold',
    priceMxn: 12500,
    priceUsdEstimate: 735,
    subtitle: 'Plataforma de crecimiento corporativo con Blog / CMS autogestionable',
    pageLimit: 10,
    pageStructure: '8 a 10 páginas completas',
    reviewRounds: 4,
    features: [
      '8 a 10 páginas completas',
      'Blog / CMS autogestionable',
      'Optimización Core Web Vitals',
      'SEO avanzado Schema.org (JSON-LD)',
      '4 rondas de revisión formal',
      'Titularidad 100% del cliente'
    ],
    governanceLevel: 'C2'
  },
  PLATINUM: {
    id: 'platinum',
    tier: '05',
    name: 'Castle Platinum',
    fullName: 'Paquete Castle Platinum',
    priceMxn: 24500,
    priceUsdEstimate: 1440,
    subtitle: 'Plataforma avanzada con integración de APIs, CRM, pagos y seguridad reforzada',
    pageLimit: 15,
    pageStructure: 'Hasta 15 páginas y secciones dinámicas',
    reviewRounds: 5,
    features: [
      'Hasta 15 páginas y secciones dinámicas',
      'Integración de pagos (Stripe / Mercado Pago)',
      'Conexión con CRM y bases de datos',
      'Hardening de seguridad y cabeceras estrictas',
      '5 rondas de revisión formal',
      'Release Certificate SHA-256 entregado',
      'Titularidad 100% del cliente'
    ],
    governanceLevel: 'C3'
  },
  DIAMOND: {
    id: 'diamond',
    tier: '06',
    name: 'Castle Diamond',
    fullName: 'Paquete Castle Diamond',
    priceMxn: 40000,
    priceUsdEstimate: 2350,
    isStartingPrice: true,
    subtitle: 'Ingeniería de software a la medida, portales de clientes y alta disponibilidad',
    pageLimit: 999,
    pageStructure: 'Arquitectura personalizada a la medida',
    reviewRounds: 99,
    features: [
      'Arquitectura personalizada a la medida',
      'Portales de usuarios y permisos (RBAC)',
      'Infraestructura Edge / Alta Disponibilidad',
      'Integración con base de datos y backend',
      'Sprints y entregables continuos',
      'Release Certificate SHA-256 entregado',
      'Titularidad 100% del cliente'
    ],
    governanceLevel: 'C4'
  }
};

export const SPECIALIZED_SERVICES = {
  CHECKUP: {
    id: 'checkup',
    name: 'Castle Checkup',
    fullName: 'Servicio Castle Checkup',
    priceMxn: 8900,
    priceUsdEstimate: 525,
    deliveryTimeHours: 72,
    description: 'Diagnóstico estático de 65 controles CQS v1.1 en 72h con 100% de crédito bonificable hacia Gate anual',
    creditTowardsGateDays: 30
  },
  AUDIT: {
    id: 'audit',
    name: 'Castle Audit',
    fullName: 'Servicio Castle Audit',
    tiers: {
      standard: { name: 'Standard Audit', priceMxn: 19900, priceUsdEstimate: 1170 },
      advanced: { name: 'Advanced Audit', priceMxn: 39900, priceUsdEstimate: 2350 },
      enterprise: { name: 'Enterprise / Due Diligence', priceMxn: 74900, priceUsdEstimate: 4400 }
    },
    basePriceMxn: 19900,
    description: 'Auditoría exhaustiva de arquitectura, dependencias, deuda técnica y cumplimiento para Due Diligence o modernización'
  },
  RESCUE: {
    id: 'rescue',
    name: 'Castle Rescue',
    fullName: 'Servicio Castle Rescue',
    tiers: {
      express: { name: 'Rescue Express', priceMxn: 6900, priceUsdEstimate: 405 },
      standard: { name: 'Rescue Standard', priceMxn: 12900, priceUsdEstimate: 760 },
      complex: { name: 'Rescue Complex', priceMxn: 24900, priceUsdEstimate: 1465 }
    },
    basePriceMxn: 6900,
    description: 'Intervención directa en código para sanear secretos expuestos, desbloquear pipelines rotos y reparar fallas críticas'
  },
  EMERGENCY: {
    id: 'emergency',
    name: 'Castle Emergency',
    fullName: 'Servicio Castle Emergency',
    basePriceMxn: 5900,
    priceUsdEstimate: 345,
    slaHours: 2,
    is247: true,
    description: 'Activación prioritaria 24/7 para contingencias activas, caídas de producción, brechas de seguridad y bloqueos críticos'
  },
  CARE: {
    id: 'care',
    name: 'Castle Care',
    fullName: 'Póliza Mensual Castle Care',
    isMonthly: true,
    plans: {
      basic: { name: 'Castle Care Basic', priceMxnMonthly: 590, priceUsdEstimate: 35 },
      pro: { name: 'Castle Care Pro', priceMxnMonthly: 990, priceUsdEstimate: 58 },
      enterprise: { name: 'Castle Care Enterprise', priceMxnMonthly: 2490, priceUsdEstimate: 110 }
    },
    basePriceMxn: 590,
    description: 'Supervisión continua de uptime, actualización de dependencias, parches de seguridad y soporte de mantenimiento preventivo'
  },
  GATE_CLI: {
    id: 'gate-cli',
    name: 'Castle Gate CLI',
    fullName: 'Licencia Anual Castle Gate CLI',
    isAnnual: true,
    priceMxnAnnual: 9900,
    priceUsdEstimate: 580,
    description: 'Licencia anual de escaneo automatizado y gobernanza de calidad y seguridad CQS v1.1'
  }
};

/**
 * Calcula el desglose financiero exacto de una cotización o hito.
 * @param {number} subtotalMxn - Monto neto sin impuestos.
 * @param {number} [taxRate=TAX_RATE_DEFAULT] - Tasa de IVA aplicable (por defecto 0.16).
 * @returns {{ subtotal: number, taxRate: number, taxAmount: number, total: number, depositStandard50: number, balanceStandard50: number }}
 */
export function calculateFinancialBreakdown(subtotalMxn, taxRate = TAX_RATE_DEFAULT) {
  if (typeof subtotalMxn !== 'number' || isNaN(subtotalMxn) || subtotalMxn < 0) {
    throw new Error('El subtotal debe ser un número positivo válido');
  }
  const taxAmount = Math.round(subtotalMxn * taxRate * 100) / 100;
  const total = Math.round((subtotalMxn + taxAmount) * 100) / 100;
  const depositStandard50 = Math.round((total / 2) * 100) / 100;
  const balanceStandard50 = Math.round((total - depositStandard50) * 100) / 100;

  return {
    subtotal: subtotalMxn,
    taxRate,
    taxAmount,
    total,
    depositStandard50,
    balanceStandard50
  };
}

/**
 * Busca y retorna la configuración oficial de un paquete o servicio por su código.
 * @param {string} code
 * @returns {object|null}
 */
export function resolveServicePricing(code) {
  if (!code) return null;
  const normalized = String(code).trim().toUpperCase();

  if (BUILD_PACKAGES[normalized]) {
    return { type: 'BUILD_PACKAGE', ...BUILD_PACKAGES[normalized] };
  }

  for (const [key, svc] of Object.entries(SPECIALIZED_SERVICES)) {
    if (key === normalized || svc.id.toUpperCase() === normalized) {
      return { type: 'SPECIALIZED_SERVICE', ...svc };
    }
  }

  return null;
}
