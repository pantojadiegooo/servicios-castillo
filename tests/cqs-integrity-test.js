/**
 * Castle Quality System (CQS) v1.1 — Automated Integrity Test Suite
 * 
 * Executes the 15 mandatory integrity and behavioral tests defined in
 * CQS v1.1 Implementation Specification (Section 16).
 */

'use strict';

const assert = require('assert');
const path = require('path');
const fs = require('fs');

const { validateCqsIntegrity, validateEvidencePayload } = require('../cqs/engine/validator');
const { evaluateCqs, loadNormativeAssets } = require('../cqs/engine/evaluator');
const { processControlEvidence, FIELD_CONTROLS, LAB_CONTROLS } = require('../cqs/evidence/evidence-model');
const { calculateGlobalScore, STATUS_PASS, STATUS_FAIL, STATUS_NA, STATUS_UNEXECUTED } = require('../cqs/scoring/scoring-model');

const results = [];

function runTest(testId, description, testFn) {
  try {
    testFn();
    results.push({ id: testId, description, status: 'PASS', error: null });
    console.log(`[PASS] ${testId}: ${description}`);
  } catch (err) {
    results.push({ id: testId, description, status: 'FAIL', error: err.message });
    console.error(`[FAIL] ${testId}: ${description}`);
    console.error(`       Error: ${err.message}`);
  }
}

console.log('================================================================');
console.log('Castle Quality System (CQS v1.1) — Automated Integrity Test Suite');
console.log('================================================================\n');

const assets = loadNormativeAssets();
const { controls, domains, subcriteria, invariants } = assets;

// TEST 01: Registry contiene exactamente 65 controles.
runTest('TEST 01', 'Registry contiene exactamente 65 controles.', () => {
  assert.strictEqual(controls.length, 65, `Expected 65 controls, got ${controls.length}`);
});

// TEST 02: Existen subcriterios normativos (26 subcriterios que albergan los 65 controles en los 7 dominios).
runTest('TEST 02', 'Existen subcriterios normativos completos y congruentes con la jerarquía.', () => {
  const subCount = Object.keys(subcriteria).length;
  assert.ok(subCount >= 24, `Expected at least 24 subcriteria (actual count across 7 domains: ${subCount})`);
  // Verify all 65 controls map to valid subcriteria
  for (const c of controls) {
    assert.ok(subcriteria[c.subcriterion], `Control ${c.control_id} references non-existent subcriterion ${c.subcriterion}`);
  }
});

// TEST 03: Existen exactamente 7 dominios.
runTest('TEST 03', 'Existen exactamente 7 dominios oficiales (PER, SEC, ACC, SEO, UX, REL, MNT).', () => {
  const domainCodes = Object.keys(domains);
  assert.strictEqual(domainCodes.length, 7, `Expected 7 domains, got ${domainCodes.length}`);
  const expected = ['PER', 'SEC', 'ACC', 'SEO', 'UX', 'REL', 'MNT'];
  for (const d of expected) {
    assert.ok(domains[d], `Expected official domain "${d}" is missing`);
  }
});

// TEST 04: Debe permanecer UNEXECUTED.
runTest('TEST 04', 'Enterprise Calibration (TEST 04) permanece estrictamente Pending / UNEXECUTED.', () => {
  assert.strictEqual(invariants.invariants.test_04_status, 'Pending / UNEXECUTED', 'TEST 04 status must be Pending / UNEXECUTED');
  const test04Path = path.join(__dirname, '..', 'calibration', 'test-04.md');
  if (fs.existsSync(test04Path)) {
    const content = fs.readFileSync(test04Path, 'utf8');
    assert.ok(content.includes('UNEXECUTED') || content.includes('Pending'), 'test-04.md must indicate Pending/UNEXECUTED');
  }
});

// TEST 05: 24 controles son EXPLICITLY_APPROVED.
runTest('TEST 05', 'Exactamente 24 controles son EXPLICITLY_APPROVED.', () => {
  const explicitCount = controls.filter(c => c.origin_classification === 'EXPLICITLY_APPROVED').length;
  assert.strictEqual(explicitCount, 24, `Expected 24 EXPLICITLY_APPROVED controls, got ${explicitCount}`);
});

// TEST 06: 41 controles son DERIVED_FROM_APPROVED_CRITERION.
runTest('TEST 06', 'Exactamente 41 controles son DERIVED_FROM_APPROVED_CRITERION.', () => {
  const derivedCount = controls.filter(c => c.origin_classification === 'DERIVED_FROM_APPROVED_CRITERION').length;
  assert.strictEqual(derivedCount, 41, `Expected 41 DERIVED_FROM_APPROVED_CRITERION controls, got ${derivedCount}`);
});

// TEST 07: 0 controles son NEW_PROPOSAL.
runTest('TEST 07', 'Exactamente 0 controles son NEW_PROPOSAL (Regla: NEW_PROPOSAL = 0).', () => {
  const newPropCount = controls.filter(c => c.origin_classification === 'NEW_PROPOSAL').length;
  assert.strictEqual(newPropCount, 0, `Expected 0 NEW_PROPOSAL controls, got ${newPropCount}`);
});

// TEST 08: Peso total = 100.00.
runTest('TEST 08', 'La suma total de pesos nominales es exactamente 100.00.', () => {
  const totalWeight = controls.reduce((sum, c) => sum + c.inherited_weight, 0);
  assert.ok(Math.abs(totalWeight - 100.0) < 1e-6, `Expected nominal weight sum 100.00, got ${totalWeight}`);
  
  const domainWeightSum = Object.values(domains).reduce((sum, d) => sum + d.nominal_weight, 0);
  assert.ok(Math.abs(domainWeightSum - 100.0) < 1e-6, `Expected domain weight sum 100.00, got ${domainWeightSum}`);
});

// TEST 09: Lab/Field permanecen independientes.
runTest('TEST 09', 'Lab y Field son controles independientes y no se sustituyen entre sí.', () => {
  assert.ok(FIELD_CONTROLS.includes('PER-01.2'), 'PER-01.2 must be a Field control');
  assert.ok(LAB_CONTROLS.includes('PER-01.1'), 'PER-01.1 must be a Lab control');
  assert.notStrictEqual('PER-01.1', 'PER-01.2');

  const labCtrl = controls.find(c => c.control_id === 'PER-01.1');
  const fieldCtrl = controls.find(c => c.control_id === 'PER-01.2');

  // Passing lab data to field control must be rejected
  assert.throws(() => {
    processControlEvidence(fieldCtrl, { is_lab: true, status: 'PASS' });
  }, /Methodological Violation/);

  // Passing field data to lab control must be rejected
  assert.throws(() => {
    processControlEvidence(labCtrl, { is_field_telemetry: true, status: 'PASS' });
  }, /Methodological Violation/);
});

// TEST 10: Field sin telemetría suficiente produce N/A y no FAIL.
runTest('TEST 10', 'Field sin telemetría suficiente produce N/A y nunca FAIL.', () => {
  const fieldCtrl = controls.find(c => c.control_id === 'PER-01.2');
  const result = processControlEvidence(fieldCtrl, { has_sufficient_telemetry: false });
  assert.strictEqual(result.status, STATUS_NA, `Expected N/A for missing field telemetry, got ${result.status}`);
  assert.notStrictEqual(result.status, STATUS_FAIL, 'Missing field telemetry must NEVER result in FAIL');
});

// TEST 11: N/A elimina el peso correspondiente del cálculo sin distorsión.
runTest('TEST 11', 'N/A elimina el peso correspondiente del divisor sin distorsión.', () => {
  // Scenario A: Single control PER-01.2 is N/A, all others PASS
  const evidenceObj = {};
  for (const c of controls) {
    if (c.control_id === 'PER-01.2') {
      evidenceObj[c.control_id] = { status: STATUS_NA, na_reason: 'No field traffic' };
    } else {
      evidenceObj[c.control_id] = { status: STATUS_PASS };
    }
  }

  const evalResult = evaluateCqs({ evidence: { controls: evidenceObj } });
  
  // Total atomic excluded weight should be 2.0 (PER-01.2)
  assert.strictEqual(evalResult.summary.total_atomic_excluded_weight, 2.0, 'Atomic excluded weight must be 2.0');
  assert.strictEqual(evalResult.summary.total_atomic_applicable_weight, 98.0, 'Atomic applicable weight must be 98.0');
  // Score should be 100.00 because all active controls passed
  assert.strictEqual(evalResult.summary.cqs_display_score, 100.0, 'CQS display score with N/A control must be 100.00');

  // Scenario B: Full subcriterion pruned (e.g. REL-01 where both REL-01.1 and REL-01.2 are N/A)
  const evidenceObjPruned = {};
  for (const c of controls) {
    if (c.control_id === 'REL-01.1' || c.control_id === 'REL-01.2') {
      evidenceObjPruned[c.control_id] = { status: STATUS_NA, na_reason: 'Not applicable environment' };
    } else {
      evidenceObjPruned[c.control_id] = { status: STATUS_PASS };
    }
  }

  const evalResultPruned = evaluateCqs({ evidence: { controls: evidenceObjPruned } });
  const relDomain = evalResultPruned.domains.find(d => d.domain_code === 'REL');
  
  // REL domain applicable weight should drop from 10.0 to 5.0 (REL-01 subcriterion pruned)
  assert.strictEqual(relDomain.applicable_weight, 5.0, 'REL domain applicable weight must be 5.0 after REL-01 pruning');
  assert.strictEqual(evalResultPruned.summary.cqs_display_score, 100.0, 'CQS score must remain 100.00 when subcriterion is pruned');
});

// TEST 12: UNEXECUTED no se convierte automáticamente en FAIL.
runTest('TEST 12', 'UNEXECUTED no se convierte automáticamente en FAIL.', () => {
  const ctrl = controls.find(c => c.control_id === 'SEC-01.1');
  const processed = processControlEvidence(ctrl, { unexecuted: true });
  assert.strictEqual(processed.status, STATUS_UNEXECUTED, `Expected UNEXECUTED, got ${processed.status}`);
  assert.notStrictEqual(processed.status, STATUS_FAIL, 'UNEXECUTED must NEVER convert to FAIL');
});

// TEST 13: IDs duplicados son detectados y rechazados.
runTest('TEST 13', 'IDs duplicados en registry son detectados y rechazados por el validador.', () => {
  const modifiedControls = [...controls, { ...controls[0] }]; // Duplicate PER-01.1
  const customReg = {
    controls: modifiedControls,
    domains: { domains, subcriteria },
    invariants
  };
  const val = validateCqsIntegrity(customReg);
  assert.strictEqual(val.integrity, 'FAIL', 'Duplicate control IDs must fail integrity validation');
  assert.ok(val.errors.some(e => e.includes('Duplicate control IDs')), 'Error must mention duplicate IDs');
});

// TEST 14: Peso alterado es detectado y rechazado.
runTest('TEST 14', 'Peso nominal alterado es detectado y rechazado por el validador.', () => {
  const modifiedControls = controls.map(c => c.control_id === 'PER-01.1' ? { ...c, inherited_weight: 5.0 } : c);
  const customReg = {
    controls: modifiedControls,
    domains: { domains, subcriteria },
    invariants
  };
  const val = validateCqsIntegrity(customReg);
  assert.strictEqual(val.integrity, 'FAIL', 'Altered weight must fail integrity validation');
});

// TEST 15: Control inexistente en payload de evidencia es detectado y rechazado.
runTest('TEST 15', 'Control inexistente en payload de evidencia es detectado y rechazado.', () => {
  const invalidEvidence = {
    controls: {
      'UNKNOWN-99.9': { status: 'PASS' }
    }
  };
  const val = validateEvidencePayload(invalidEvidence, controls);
  assert.strictEqual(val.valid, false, 'Unknown control ID must be rejected');
  assert.ok(val.errors.some(e => e.includes('Unknown control ID')), 'Error must mention unknown control ID');
});

console.log('\n================================================================');
const passedCount = results.filter(r => r.status === 'PASS').length;
const failedCount = results.filter(r => r.status === 'FAIL').length;
console.log(`TEST SUITE SUMMARY: ${passedCount}/${results.length} PASSED (${failedCount} FAILED)`);
console.log('================================================================\n');

if (failedCount > 0) {
  process.exit(1);
}
