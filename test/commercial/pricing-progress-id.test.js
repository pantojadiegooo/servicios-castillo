/**
 * ============================================================================
 * PRUEBAS UNITARIAS: PRICING, CÁLCULO DE PROGRESO E IDENTIFICADORES (v1.1)
 * ============================================================================
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BUILD_PACKAGES,
  SPECIALIZED_SERVICES,
  calculateFinancialBreakdown,
  resolveServicePricing,
  TAX_RATE_DEFAULT
} from '../../src/commercial/core/pricing.js';
import {
  calculateProjectProgress,
  generateDefaultMilestones,
  MILESTONE_STATUS
} from '../../src/commercial/core/progress-calculator.js';
import {
  generateQuotationId,
  generateTicketId,
  isValidQuotationId,
  isValidTicketId,
  QUOTATION_ID_REGEX,
  TICKET_ID_REGEX
} from '../../src/commercial/core/id-generator.js';

test('Pricing — Verificación de catálogo oficial de 6 paquetes y servicios', () => {
  assert.equal(BUILD_PACKAGES.IRON.priceMxn, 2800);
  assert.equal(BUILD_PACKAGES.BRONZE.priceMxn, 4500);
  assert.equal(BUILD_PACKAGES.SILVER.priceMxn, 7500);
  assert.equal(BUILD_PACKAGES.GOLD.priceMxn, 12500);
  assert.equal(BUILD_PACKAGES.PLATINUM.priceMxn, 24500);
  assert.equal(BUILD_PACKAGES.DIAMOND.priceMxn, 40000);

  assert.equal(SPECIALIZED_SERVICES.CHECKUP.priceMxn, 8900);
  assert.equal(SPECIALIZED_SERVICES.CARE.plans.essential.priceMxnMonthly, 3500);
  assert.equal(SPECIALIZED_SERVICES.CARE.plans.pro.priceMxnMonthly, 7900);
  assert.equal(SPECIALIZED_SERVICES.CARE.plans.enterprise.priceMxnMonthly, 17900);
  assert.equal(SPECIALIZED_SERVICES.EMERGENCY.basePriceMxn, 5900);
  assert.equal(SPECIALIZED_SERVICES.RESCUE.basePriceMxn, 6900);
  assert.equal(SPECIALIZED_SERVICES.GATE_CLI.priceMxnAnnual, 9900);
});

test('Pricing — Cálculo de desglose financiero (Subtotal, IVA 16%, 50/50)', () => {
  const breakdown = calculateFinancialBreakdown(12500, TAX_RATE_DEFAULT);
  assert.equal(breakdown.subtotal, 12500);
  assert.equal(breakdown.taxRate, 0.16);
  assert.equal(breakdown.taxAmount, 2000);
  assert.equal(breakdown.total, 14500);
  assert.equal(breakdown.depositStandard50, 7250);
  assert.equal(breakdown.balanceStandard50, 7250);

  const resolved = resolveServicePricing('gold');
  assert.ok(resolved);
  assert.equal(resolved.priceMxn, 12500);
});

test('Progress Calculator — Derivación matemática de progreso por hitos', () => {
  const milestones = generateDefaultMilestones('GC-Q-2026-000042');
  assert.equal(milestones.length, 4);

  // 0% inicial
  let progress = calculateProjectProgress(milestones);
  assert.equal(progress.progressPercentage, 0);
  assert.equal(progress.completedCount, 0);
  assert.equal(progress.nextMilestone.code, 'H1');

  // H1 completado (25%)
  milestones[0].status = MILESTONE_STATUS.COMPLETED;
  progress = calculateProjectProgress(milestones);
  assert.equal(progress.progressPercentage, 25);
  assert.equal(progress.completedCount, 1);
  assert.equal(progress.nextMilestone.code, 'H2');

  // H1 + H2 completados (25% + 35% = 60%)
  milestones[1].status = MILESTONE_STATUS.COMPLETED;
  progress = calculateProjectProgress(milestones);
  assert.equal(progress.progressPercentage, 60);
  assert.equal(progress.completedCount, 2);
  assert.equal(progress.nextMilestone.code, 'H3');

  // Todos completados (100%)
  milestones[2].status = MILESTONE_STATUS.COMPLETED;
  milestones[3].status = MILESTONE_STATUS.VERIFIED;
  progress = calculateProjectProgress(milestones);
  assert.equal(progress.progressPercentage, 100);
  assert.equal(progress.completedCount, 4);
  assert.equal(progress.nextMilestone, null);
});

test('ID Generator — Taxonomía estricta GC-Q y GC-T', () => {
  const qId1 = generateQuotationId(42, 2026);
  assert.equal(qId1, 'GC-Q-2026-000042');
  assert.ok(isValidQuotationId(qId1));
  assert.ok(QUOTATION_ID_REGEX.test(qId1));

  const tId1 = generateTicketId(1, 2026);
  assert.equal(tId1, 'GC-T-2026-000001');
  assert.ok(isValidTicketId(tId1));
  assert.ok(TICKET_ID_REGEX.test(tId1));

  // IDs inválidos
  assert.equal(isValidQuotationId('GC-Q-2026-42'), false);
  assert.equal(isValidQuotationId('GC-2026-000042'), false);
  assert.equal(isValidQuotationId('PROJ-123'), false);
  assert.equal(isValidTicketId('TICK-001'), false);
});
