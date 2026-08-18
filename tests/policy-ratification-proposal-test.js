/**
 * Castle Security & Quality Gate — Policy Ratification Proposal Test Suite (Phase 4)
 * 
 * Validates the proposed policy matrix against CQS normative assets,
 * logical progression, strict separation of concerns, and immutability.
 */

'use strict';

const assert = require('assert');
const path = require('path');
const fs = require('fs');

const gate = require('../castle-gate');
const cqs = require('../cqs');
const { validateGatePolicy } = require('../castle-gate/policy/policy-validator');

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
console.log('Castle Gate (Phase 4) — Policy Ratification Proposal Tests');
console.log('================================================================\n');

// Load proposed policy matrix
const proposedMatrixPath = path.join(__dirname, '..', 'castle-gate', 'policy', 'CASTLE-GATE-POLICY-MATRIX-PROPOSED.json');
const proposedData = JSON.parse(fs.readFileSync(proposedMatrixPath, 'utf8'));
const proposedPolicies = proposedData.policies;
const levels = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6'];

// -----------------------------------------------------------------------------
// TEST-PROP-01: All 6 levels C1 to C6 present in proposed matrix
// -----------------------------------------------------------------------------
runTest('TEST-PROP-01', 'La propuesta contiene los 6 niveles C1 a C6 completamente definidos.', () => {
  assert.strictEqual(Object.keys(proposedPolicies).length, 6);
  assert.deepStrictEqual(Object.keys(proposedPolicies).sort(), levels.sort());
});

// -----------------------------------------------------------------------------
// TEST-PROP-02: All proposed policies pass structural & CQS validation
// -----------------------------------------------------------------------------
runTest('TEST-PROP-02', 'Todas las políticas propuestas pasan validación formal con policy-validator.', () => {
  for (const lvl of levels) {
    const p = proposedPolicies[lvl];
    const val = validateGatePolicy(p);
    assert.strictEqual(val.valid, true, `Level ${lvl} validation failed: ${val.errors.join('; ')}`);
    assert.strictEqual(val.status, 'FULLY_RATIFIED');
  }
});

// -----------------------------------------------------------------------------
// TEST-PROP-03: Monotonic increase in minimum CQS score thresholds
// -----------------------------------------------------------------------------
runTest('TEST-PROP-03', 'Progresión estrictamente creciente en umbrales de CQS score: C1 < C2 < C3 < C4 < C5 < C6.', () => {
  const scores = levels.map(lvl => proposedPolicies[lvl].minimum_cqs_score);
  for (let i = 0; i < scores.length - 1; i++) {
    assert.ok(scores[i] < scores[i + 1], `Expected score ${levels[i]} (${scores[i]}) < ${levels[i+1]} (${scores[i+1]})`);
  }
  assert.strictEqual(scores[0], 70.0);
  assert.strictEqual(scores[scores.length - 1], 98.0);
});

// -----------------------------------------------------------------------------
// TEST-PROP-04: Monotonic decrease in remediation windows
// -----------------------------------------------------------------------------
runTest('TEST-PROP-04', 'Progresión decreciente en ventanas de remediación (mayor urgencia): C1 >= C2 >= C3 >= C4 >= C5 >= C6.', () => {
  const windows = levels.map(lvl => proposedPolicies[lvl].remediation_window_hours);
  for (let i = 0; i < windows.length - 1; i++) {
    assert.ok(windows[i] >= windows[i + 1], `Expected window ${levels[i]} (${windows[i]}h) >= ${levels[i+1]} (${windows[i+1]}h)`);
  }
  assert.strictEqual(windows[0], 168);
  assert.strictEqual(windows[windows.length - 1], 12);
});

// -----------------------------------------------------------------------------
// TEST-PROP-05: Zero unknown controls in required_controls across all levels
// -----------------------------------------------------------------------------
runTest('TEST-PROP-05', 'Cero controles desconocidos en required_controls contra el registro CQS de 65 controles.', () => {
  const cqsAssets = cqs.loadNormativeAssets();
  const validIds = new Set(cqsAssets.controls.map(c => c.control_id));

  for (const lvl of levels) {
    const req = proposedPolicies[lvl].required_controls;
    for (const cid of req) {
      assert.ok(validIds.has(cid), `Level ${lvl} references unknown control ID "${cid}"`);
    }
  }
});

// -----------------------------------------------------------------------------
// TEST-PROP-06: Zero unknown domains in required_domains across all levels
// -----------------------------------------------------------------------------
runTest('TEST-PROP-06', 'Cero dominios desconocidos en required_domains contra los 7 dominios oficiales CQS.', () => {
  const cqsAssets = cqs.loadNormativeAssets();
  const validDomains = new Set(Object.keys(cqsAssets.domains));

  for (const lvl of levels) {
    const req = proposedPolicies[lvl].required_domains;
    for (const d of req) {
      assert.ok(validDomains.has(d), `Level ${lvl} references unknown domain code "${d}"`);
    }
  }
});

// -----------------------------------------------------------------------------
// TEST-PROP-07: Mandatory Gate Breakers GB-01 to GB-05 present in all levels
// -----------------------------------------------------------------------------
runTest('TEST-PROP-07', 'Los Gate Breakers GB-01..GB-05 son obligatorios en la totalidad de los 6 niveles.', () => {
  const expectedBreakers = ['GB-01', 'GB-02', 'GB-03', 'GB-04', 'GB-05'];
  for (const lvl of levels) {
    const breakers = proposedPolicies[lvl].mandatory_gate_breakers;
    assert.deepStrictEqual(breakers, expectedBreakers, `Level ${lvl} must have mandatory GB-01..GB-05`);
  }
});

// -----------------------------------------------------------------------------
// TEST-PROP-08: UNEXECUTED tolerance correctly partitioned
// -----------------------------------------------------------------------------
runTest('TEST-PROP-08', 'Tolerancia a UNEXECUTED permitida solo en C1/C2 y estrictamente prohibida en C3..C6.', () => {
  assert.strictEqual(proposedPolicies.C1.allow_unexecuted_controls, true);
  assert.strictEqual(proposedPolicies.C2.allow_unexecuted_controls, true);
  assert.strictEqual(proposedPolicies.C3.allow_unexecuted_controls, false);
  assert.strictEqual(proposedPolicies.C4.allow_unexecuted_controls, false);
  assert.strictEqual(proposedPolicies.C5.allow_unexecuted_controls, false);
  assert.strictEqual(proposedPolicies.C6.allow_unexecuted_controls, false);
});

// -----------------------------------------------------------------------------
// TEST-PROP-09: Conditional approval correctly partitioned
// -----------------------------------------------------------------------------
runTest('TEST-PROP-09', 'Aprobación condicional permitida en C1..C3 y estrictamente prohibida en C4..C6.', () => {
  assert.strictEqual(proposedPolicies.C1.allow_conditional_approval, true);
  assert.strictEqual(proposedPolicies.C2.allow_conditional_approval, true);
  assert.strictEqual(proposedPolicies.C3.allow_conditional_approval, true);
  assert.strictEqual(proposedPolicies.C4.allow_conditional_approval, false);
  assert.strictEqual(proposedPolicies.C5.allow_conditional_approval, false);
  assert.strictEqual(proposedPolicies.C6.allow_conditional_approval, false);
});

// -----------------------------------------------------------------------------
// TEST-PROP-10: Gate Decision Engine determinism with proposed policies
// -----------------------------------------------------------------------------
runTest('TEST-PROP-10', 'Gate Decision Engine evalúa deterministamente con las políticas propuestas.', () => {
  const cqsEval = {
    specification_version: '1.1.0',
    evaluation_id: 'EVAL-PROP-TEST',
    summary: {
      cqs_raw_score: 86.5,
      cqs_display_score: 86.5,
      final_verdict: 'PASS_RELEASE',
      has_unexecuted_components: false
    },
    domains: [],
    gate_breakers: { status: 'CLEARED', evaluated_gates: [] },
    governance: { methodology_status: 'FROZEN' }
  };

  // C3 requires minimum 85.0 -> 86.5 passes
  const decC3 = gate.evaluateGateDecision({
    cqs_evaluation_result: cqsEval,
    gate_level: 'C3',
    policy_override: proposedPolicies.C3
  });
  assert.strictEqual(decC3.gate_state, 'PASSED');

  // C4 requires minimum 90.0 -> 86.5 fails (requires remediation)
  const decC4 = gate.evaluateGateDecision({
    cqs_evaluation_result: cqsEval,
    gate_level: 'C4',
    policy_override: proposedPolicies.C4
  });
  assert.strictEqual(decC4.gate_state, 'REQUIRES_REMEDIATION');
  assert.ok(decC4.blockers.some(b => b.type === 'SCORE_DEFICIT'));
});

// -----------------------------------------------------------------------------
// TEST-PROP-11: Gate Breakers veto release regardless of score under proposal
// -----------------------------------------------------------------------------
runTest('TEST-PROP-11', 'Gate Breaker bloquea la entrega incluso con score 100.0 bajo la propuesta.', () => {
  const cqsEval = {
    specification_version: '1.1.0',
    evaluation_id: 'EVAL-PROP-GB',
    summary: {
      cqs_raw_score: 100.0,
      cqs_display_score: 100.0,
      final_verdict: 'FAIL_BLOCKED',
      has_unexecuted_components: false
    },
    domains: [],
    gate_breakers: {
      status: 'BLOCKED',
      evaluated_gates: [{ code: 'GB-01', name: 'Insecure Transport', triggered: true, details: 'Plain HTTP login' }]
    },
    governance: { methodology_status: 'FROZEN' }
  };

  const dec = gate.evaluateGateDecision({
    cqs_evaluation_result: cqsEval,
    gate_level: 'C1',
    policy_override: proposedPolicies.C1
  });
  assert.strictEqual(dec.gate_state, 'BLOCKED');
  assert.ok(dec.blockers.some(b => b.code === 'GB-01'));
});

// -----------------------------------------------------------------------------
// TEST-PROP-12: Zero NEW_PROPOSAL in CQS Registry
// -----------------------------------------------------------------------------
runTest('TEST-PROP-12', 'CQS Registry mantiene exactamente 0 NEW_PROPOSALS.', () => {
  const cqsAssets = cqs.loadNormativeAssets();
  const proposals = cqsAssets.controls.filter(c => c.origin_classification === 'NEW_PROPOSAL');
  assert.strictEqual(proposals.length, 0);
});

// -----------------------------------------------------------------------------
// TEST-PROP-13: TEST 04 remains Pending / UNEXECUTED
// -----------------------------------------------------------------------------
runTest('TEST-PROP-13', 'Enterprise Calibration (TEST 04) permanece estrictamente Pending / UNEXECUTED.', () => {
  const cqsAssets = cqs.loadNormativeAssets();
  assert.strictEqual(cqsAssets.invariants.invariants.test_04_status, 'Pending / UNEXECUTED');
});

// -----------------------------------------------------------------------------
// TEST-PROP-14: PARTIAL remains OPEN METHODOLOGICAL DECISION
// -----------------------------------------------------------------------------
runTest('TEST-PROP-14', 'PARTIAL permanece formalmente inactivo y como OPEN METHODOLOGICAL DECISION.', () => {
  const cqsAssets = cqs.loadNormativeAssets();
  const omd = cqsAssets.invariants.open_methodological_decisions.find(d => d.id === 'OMD-01-PARTIAL-STATUS');
  assert.ok(omd);
  assert.strictEqual(omd.status, 'OPEN_METHODOLOGICAL_DECISION');
  assert.strictEqual(omd.active_in_engine, false);
});

// -----------------------------------------------------------------------------
// TEST-PROP-15: CQS directory remains 100% unmodified with PASS integrity
// -----------------------------------------------------------------------------
runTest('TEST-PROP-15', 'CQS v1.1 mantiene integridad formal perfecta (65 controles, 100.00 nominal weight).', () => {
  const integrity = cqs.validateCqsIntegrity();
  assert.strictEqual(integrity.integrity, 'PASS');
  assert.strictEqual(integrity.metrics.total_controls, 65);
  assert.strictEqual(integrity.metrics.total_domains, 7);
  assert.strictEqual(integrity.metrics.explicitly_approved, 24);
  assert.strictEqual(integrity.metrics.derived_from_approved_criterion, 41);
  assert.strictEqual(integrity.metrics.new_proposal, 0);
  assert.ok(Math.abs(integrity.metrics.nominal_weight_total - 100.0) < 1e-6);
});

console.log('\n================================================================');
const passedCount = results.filter(r => r.status === 'PASS').length;
const failedCount = results.filter(r => r.status === 'FAIL').length;
console.log(`POLICY PROPOSAL TEST SUITE SUMMARY: ${passedCount}/${results.length} PASSED (${failedCount} FAILED)`);
console.log('================================================================\n');

if (failedCount > 0) {
  process.exit(1);
}
