/**
 * ============================================================================
 * PRUEBAS UNITARIAS: MÁQUINA DE ESTADOS Y REGLA NO START (v1.1)
 * ============================================================================
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PROJECT_STATES,
  isTransitionAllowed,
  validateNoStartRule,
  getPackageTrackingTimeline,
  CLIENT_FACING_STATE_LABELS
} from '../../src/commercial/core/state-machine.js';

test('Máquina de Estados — Verificación de los 22 estados', () => {
  const stateKeys = Object.keys(PROJECT_STATES);
  assert.equal(stateKeys.length, 22, 'Deben existir exactamente 22 estados deterministas según SPEC v1.1 sección 11');

  assert.ok(PROJECT_STATES.DRAFT);
  assert.ok(PROJECT_STATES.QUOTED);
  assert.ok(PROJECT_STATES.ACCEPTED);
  assert.ok(PROJECT_STATES.PAYMENT_PENDING);
  assert.ok(PROJECT_STATES.ACTIVE);
  assert.ok(PROJECT_STATES.PLANNING);
  assert.ok(PROJECT_STATES.DEVELOPMENT);
  assert.ok(PROJECT_STATES.QA);
  assert.ok(PROJECT_STATES.AWAITING_CLIENT);
  assert.ok(PROJECT_STATES.PROJECT_FROZEN);
  assert.ok(PROJECT_STATES.REACTIVATION_PENDING);
  assert.ok(PROJECT_STATES.PREDELIVERY);
  assert.ok(PROJECT_STATES.BALANCE_PENDING);
  assert.ok(PROJECT_STATES.DELIVERY_READY);
  assert.ok(PROJECT_STATES.WARRANTY);
  assert.ok(PROJECT_STATES.INCIDENT_OPEN);
  assert.ok(PROJECT_STATES.COMPLETED);
  assert.ok(PROJECT_STATES.PORTAL_EXPIRED);
  assert.ok(PROJECT_STATES.CANCELLED);
  assert.ok(PROJECT_STATES.REFUND_REVIEW);
  assert.ok(PROJECT_STATES.REFUND_APPROVED);
  assert.ok(PROJECT_STATES.REFUNDED);
});

test('Máquina de Estados — Traducción comercial transparente', () => {
  for (const [state, label] of Object.entries(CLIENT_FACING_STATE_LABELS)) {
    assert.ok(label && typeof label === 'string', `El estado ${state} debe tener una etiqueta comercial amigable`);
    assert.ok(!label.includes('_'), `La etiqueta comercial para ${state} no debe exponer nombres técnicos crudos con guiones bajos`);
  }
});

test('Máquina de Estados — Transiciones legales e ilegales', () => {
  // Transiciones válidas
  assert.equal(isTransitionAllowed(PROJECT_STATES.DRAFT, PROJECT_STATES.QUOTED), true);
  assert.equal(isTransitionAllowed(PROJECT_STATES.QUOTED, PROJECT_STATES.ACCEPTED), true);
  assert.equal(isTransitionAllowed(PROJECT_STATES.ACCEPTED, PROJECT_STATES.PAYMENT_PENDING), true);
  assert.equal(isTransitionAllowed(PROJECT_STATES.PAYMENT_PENDING, PROJECT_STATES.ACTIVE), true);
  assert.equal(isTransitionAllowed(PROJECT_STATES.ACTIVE, PROJECT_STATES.PLANNING), true);
  assert.equal(isTransitionAllowed(PROJECT_STATES.PLANNING, PROJECT_STATES.DEVELOPMENT), true);
  assert.equal(isTransitionAllowed(PROJECT_STATES.DEVELOPMENT, PROJECT_STATES.QA), true);
  assert.equal(isTransitionAllowed(PROJECT_STATES.QA, PROJECT_STATES.PREDELIVERY), true);
  assert.equal(isTransitionAllowed(PROJECT_STATES.PREDELIVERY, PROJECT_STATES.BALANCE_PENDING), true);
  assert.equal(isTransitionAllowed(PROJECT_STATES.BALANCE_PENDING, PROJECT_STATES.DELIVERY_READY), true);
  assert.equal(isTransitionAllowed(PROJECT_STATES.DELIVERY_READY, PROJECT_STATES.WARRANTY), true);
  assert.equal(isTransitionAllowed(PROJECT_STATES.WARRANTY, PROJECT_STATES.COMPLETED), true);
  assert.equal(isTransitionAllowed(PROJECT_STATES.COMPLETED, PROJECT_STATES.PORTAL_EXPIRED), true);

  // Transiciones ilegales
  assert.equal(isTransitionAllowed(PROJECT_STATES.DRAFT, PROJECT_STATES.ACTIVE), false);
  assert.equal(isTransitionAllowed(PROJECT_STATES.DRAFT, PROJECT_STATES.WARRANTY), false);
  assert.equal(isTransitionAllowed(PROJECT_STATES.PAYMENT_PENDING, PROJECT_STATES.PREDELIVERY), false);
  assert.equal(isTransitionAllowed(PROJECT_STATES.PORTAL_EXPIRED, PROJECT_STATES.ACTIVE), false);
  assert.equal(isTransitionAllowed(PROJECT_STATES.REFUNDED, PROJECT_STATES.PLANNING), false);
});

test('Máquina de Estados — Regla NO START (Validación server-side)', () => {
  // Caso 1: Todo completo -> canStart = true
  const validContext = {
    isQuotationAccepted: true,
    isContractAccepted: true,
    isInitialPaymentConfirmed: true,
    isAdminApproved: true,
    assignedEngineerId: 'usr_eng_01'
  };
  const resValid = validateNoStartRule(validContext);
  assert.equal(resValid.canStart, true);
  assert.equal(resValid.missingConditions.length, 0);

  // Caso 2: Falta pago inicial
  const noPayContext = { ...validContext, isInitialPaymentConfirmed: false };
  const resNoPay = validateNoStartRule(noPayContext);
  assert.equal(resNoPay.canStart, false);
  assert.ok(resNoPay.missingConditions.some(c => c.includes('pago inicial')));

  // Caso 3: Falta contrato
  const noContractContext = { ...validContext, isContractAccepted: false };
  const resNoContract = validateNoStartRule(noContractContext);
  assert.equal(resNoContract.canStart, false);
  assert.ok(resNoContract.missingConditions.some(c => c.includes('contrato')));

  // Caso 4: Falta ingeniero asignado
  const noEngContext = { ...validContext, assignedEngineerId: null };
  const resNoEng = validateNoStartRule(noEngContext);
  assert.equal(resNoEng.canStart, false);
  assert.ok(resNoEng.missingConditions.some(c => c.includes('ingeniero')));
});

test('Máquina de Estados — Timeline de seguimiento de paquete', () => {
  const tlPlanning = getPackageTrackingTimeline(PROJECT_STATES.PLANNING);
  assert.equal(tlPlanning.stageIndex, 0);
  assert.equal(tlPlanning.stages[0].status, 'current');
  assert.equal(tlPlanning.stages[1].status, 'upcoming');

  const tlDevelopment = getPackageTrackingTimeline(PROJECT_STATES.DEVELOPMENT);
  assert.equal(tlDevelopment.stageIndex, 1);
  assert.equal(tlDevelopment.stages[0].status, 'completed');
  assert.equal(tlDevelopment.stages[1].status, 'current');

  const tlWarranty = getPackageTrackingTimeline(PROJECT_STATES.WARRANTY);
  assert.equal(tlWarranty.stageIndex, 5);
  assert.equal(tlWarranty.stages[0].status, 'completed');
  assert.equal(tlWarranty.stages[4].status, 'completed');
  assert.equal(tlWarranty.stages[5].status, 'current');
});
