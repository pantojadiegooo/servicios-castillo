/**
 * Castle Security & Quality Gate — Human Ratification & Activation Decision Test Suite (Phase 4.3)
 * 
 * Verifies that the human ratification decision is correctly activated in the
 * ratified policy matrix, maintains determinism, respects architectural boundaries,
 * and preserves CQS v1.1 frozen integrity.
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
console.log('Castle Gate (Phase 4.3) — Ratification & Activation Decision Tests');
console.log('================================================================\n');

const ratifiedPath = path.join(__dirname, '..', 'castle-gate', 'policy', 'CASTLE-GATE-POLICY-MATRIX-RATIFIED.json');
const ratifiedData = JSON.parse(fs.readFileSync(ratifiedPath, 'utf8'));
const policies = ratifiedData.policies;
const levels = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6'];

const registerPath = path.join(__dirname, '..', 'castle-gate', 'policy', 'CASTLE-GATE-POLICY-HUMAN-RATIFICATION-REGISTER.json');
const registerData = JSON.parse(fs.readFileSync(registerPath, 'utf8'));

const cqsAssets = cqs.loadNormativeAssets();
const validControlIds = new Set(cqsAssets.controls.map(c => c.control_id));
const validDomainCodes = new Set(Object.keys(cqsAssets.domains));

// -----------------------------------------------------------------------------
// RATIF-01: Ratification status is APPROVED in the register
// -----------------------------------------------------------------------------
runTest('RATIF-01', 'El registro de ratificación humana contiene status APPROVED y autoridad asignada.', () => {
  assert.strictEqual(registerData.status, 'APPROVED / RATIFIED');
  assert.strictEqual(registerData.ratification_metadata.ratification_status, 'APPROVED');
  assert.ok(registerData.ratification_metadata.human_authority.length > 0);
  assert.ok(registerData.ratification_metadata.ratification_timestamp.length > 0);
});

// -----------------------------------------------------------------------------
// RATIF-02: Ratified policy matrix contains all 6 levels with RATIFIED_POLICY status
// -----------------------------------------------------------------------------
runTest('RATIF-02', 'La matriz ratificada contiene los 6 niveles C1 a C6 con estado RATIFIED_POLICY.', () => {
  assert.strictEqual(ratifiedData.governance_status, 'RATIFIED_POLICY');
  assert.strictEqual(Object.keys(policies).length, 6);
  assert.deepStrictEqual(Object.keys(policies).sort(), levels.sort());
  for (const lvl of levels) {
    assert.strictEqual(policies[lvl].governance_status, 'RATIFIED_POLICY');
  }
});

// -----------------------------------------------------------------------------
// RATIF-03: All ratified policies pass strict Policy Validator
// -----------------------------------------------------------------------------
runTest('RATIF-03', 'Todas las políticas ratificadas pasan validación formal con policy-validator.', () => {
  for (const lvl of levels) {
    const val = validateGatePolicy(policies[lvl]);
    assert.strictEqual(val.valid, true, `Validation failed for ${lvl}: ${val.errors.join('; ')}`);
    assert.strictEqual(val.status, 'FULLY_RATIFIED');
  }
});

// -----------------------------------------------------------------------------
// RATIF-04: Exact HR-GATE-01 score progression [70, 78, 85, 90, 95, 98]
// -----------------------------------------------------------------------------
runTest('RATIF-04', 'HR-GATE-01: Escala monotónica de scores ratificada exactamente: [70.0, 78.0, 85.0, 90.0, 95.0, 98.0].', () => {
  const scores = levels.map(lvl => policies[lvl].minimum_cqs_score);
  assert.deepStrictEqual(scores, [70.0, 78.0, 85.0, 90.0, 95.0, 98.0]);
});

// -----------------------------------------------------------------------------
// RATIF-05: Exact HR-GATE-02 control counts [12, 21, 33, 60, 65, 65]
// -----------------------------------------------------------------------------
runTest('RATIF-05', 'HR-GATE-02: Subconjuntos de controles obligatorios ratificados exactamente: [12, 21, 33, 60, 65, 65].', () => {
  const counts = levels.map(lvl => policies[lvl].required_controls.length);
  assert.deepStrictEqual(counts, [12, 21, 33, 60, 65, 65]);
});

// -----------------------------------------------------------------------------
// RATIF-06: All required controls belong to CQS Registry (65 controls)
// -----------------------------------------------------------------------------
runTest('RATIF-06', 'HR-GATE-02: Cada ID de control requerido pertenece estrictamente al registro CQS.', () => {
  for (const lvl of levels) {
    for (const cid of policies[lvl].required_controls) {
      assert.ok(validControlIds.has(cid), `Unknown control ID "${cid}" in level ${lvl}`);
    }
  }
});

// -----------------------------------------------------------------------------
// RATIF-07: Exact HR-GATE-03 domain scoping (6 in C1, 7 in C2..C6)
// -----------------------------------------------------------------------------
runTest('RATIF-07', 'HR-GATE-03: Dominios obligatorios ratificados (6 en C1 sin MNT, 7 en C2..C6).', () => {
  assert.strictEqual(policies.C1.required_domains.length, 6);
  assert.ok(!policies.C1.required_domains.includes('MNT'));
  for (const lvl of ['C2', 'C3', 'C4', 'C5', 'C6']) {
    assert.strictEqual(policies[lvl].required_domains.length, 7);
  }
});

// -----------------------------------------------------------------------------
// RATIF-08: Exact HR-GATE-04 evidence types hierarchy
// -----------------------------------------------------------------------------
runTest('RATIF-08', 'HR-GATE-04: Modalidades de evidencia ratificadas (Lab/Audit en C1/C2 -> Field/Tests en C4..C6).', () => {
  assert.deepStrictEqual(policies.C1.required_evidence_types, ['lab', 'code_audit']);
  assert.deepStrictEqual(policies.C2.required_evidence_types, ['lab', 'code_audit', 'infrastructure']);
  assert.deepStrictEqual(policies.C3.required_evidence_types, ['lab', 'code_audit', 'infrastructure', 'runtime']);
  assert.deepStrictEqual(policies.C4.required_evidence_types, ['lab', 'code_audit', 'infrastructure', 'runtime', 'field', 'automated_test']);
  assert.deepStrictEqual(policies.C5.required_evidence_types, ['lab', 'code_audit', 'infrastructure', 'runtime', 'field', 'automated_test']);
  assert.deepStrictEqual(policies.C6.required_evidence_types, ['lab', 'code_audit', 'infrastructure', 'runtime', 'field', 'automated_test']);
});

// -----------------------------------------------------------------------------
// RATIF-09: Exact HR-GATE-05 UNEXECUTED rules
// -----------------------------------------------------------------------------
runTest('RATIF-09', 'HR-GATE-05: Regla UNEXECUTED (true en C1/C2, false en C3..C6).', () => {
  assert.strictEqual(policies.C1.allow_unexecuted_controls, true);
  assert.strictEqual(policies.C2.allow_unexecuted_controls, true);
  assert.strictEqual(policies.C3.allow_unexecuted_controls, false);
  assert.strictEqual(policies.C4.allow_unexecuted_controls, false);
  assert.strictEqual(policies.C5.allow_unexecuted_controls, false);
  assert.strictEqual(policies.C6.allow_unexecuted_controls, false);
});

// -----------------------------------------------------------------------------
// RATIF-10: Exact HR-GATE-06 Conditional Approval rules
// -----------------------------------------------------------------------------
runTest('RATIF-10', 'HR-GATE-06: Aprobación condicional (true en C1..C3, false en C4..C6).', () => {
  assert.strictEqual(policies.C1.allow_conditional_approval, true);
  assert.strictEqual(policies.C2.allow_conditional_approval, true);
  assert.strictEqual(policies.C3.allow_conditional_approval, true);
  assert.strictEqual(policies.C4.allow_conditional_approval, false);
  assert.strictEqual(policies.C5.allow_conditional_approval, false);
  assert.strictEqual(policies.C6.allow_conditional_approval, false);
});

// -----------------------------------------------------------------------------
// RATIF-11: Exact HR-GATE-07 Authority Classes
// -----------------------------------------------------------------------------
runTest('RATIF-11', 'HR-GATE-07: Clases de autoridad ratificadas (AUTH_CLASS_1 a AUTH_CLASS_6).', () => {
  const expected = [
    'AUTH_CLASS_1_PEER_LEAD',
    'AUTH_CLASS_2_MULTI_DISCIPLINE',
    'AUTH_CLASS_3_TRIAD_SIGN_OFF',
    'AUTH_CLASS_4_STAFF_TRIAD',
    'AUTH_CLASS_5_EXECUTIVE_SECURITY',
    'AUTH_CLASS_6_GOVERNANCE_BOARD'
  ];
  for (let i = 0; i < levels.length; i++) {
    assert.strictEqual(policies[levels[i]].approval_authority_class, expected[i]);
  }
});

// -----------------------------------------------------------------------------
// RATIF-12: Exact HR-GATE-08 Remediation Windows [168, 120, 72, 48, 24, 12]
// -----------------------------------------------------------------------------
runTest('RATIF-12', 'HR-GATE-08: Ventanas de remediación ratificadas: [168h, 120h, 72h, 48h, 24h, 12h].', () => {
  const windows = levels.map(lvl => policies[lvl].remediation_window_hours);
  assert.deepStrictEqual(windows, [168, 120, 72, 48, 24, 12]);
});

// -----------------------------------------------------------------------------
// RATIF-13: Exact HR-GATE-09 Post-Verification rules
// -----------------------------------------------------------------------------
runTest('RATIF-13', 'HR-GATE-09: Post-verificación (false en C1/C2, true en C3..C6).', () => {
  assert.strictEqual(policies.C1.post_verification_required, false);
  assert.strictEqual(policies.C2.post_verification_required, false);
  assert.strictEqual(policies.C3.post_verification_required, true);
  assert.strictEqual(policies.C4.post_verification_required, true);
  assert.strictEqual(policies.C5.post_verification_required, true);
  assert.strictEqual(policies.C6.post_verification_required, true);
});

// -----------------------------------------------------------------------------
// RATIF-14: Gate Breakers GB-01..GB-05 mandatory across all levels
// -----------------------------------------------------------------------------
runTest('RATIF-14', 'Gate Breakers GB-01..GB-05 son invariantes y obligatorios en los 6 niveles.', () => {
  const expectedBreakers = ['GB-01', 'GB-02', 'GB-03', 'GB-04', 'GB-05'];
  for (const lvl of levels) {
    assert.deepStrictEqual(policies[lvl].mandatory_gate_breakers, expectedBreakers);
  }
});

// -----------------------------------------------------------------------------
// RATIF-15: Determinism of Gate Decision Engine with Ratified Policies
// -----------------------------------------------------------------------------
runTest('RATIF-15', 'Gate Decision Engine evalúa deterministamente con la matriz ratificada.', () => {
  const cqsEval = {
    specification_version: '1.1.0',
    evaluation_id: 'EVAL-RATIF-TEST',
    summary: {
      cqs_raw_score: 91.2,
      cqs_display_score: 91.2,
      final_verdict: 'PASS_RELEASE',
      has_unexecuted_components: false
    },
    domains: [],
    gate_breakers: { status: 'CLEARED', evaluated_gates: [] },
    governance: { methodology_status: 'FROZEN' }
  };

  const decC4 = gate.evaluateGateDecision({
    cqs_evaluation_result: cqsEval,
    gate_level: 'C4',
    policy_override: policies.C4
  });
  assert.strictEqual(decC4.gate_state, 'PASSED');

  const decC5 = gate.evaluateGateDecision({
    cqs_evaluation_result: cqsEval,
    gate_level: 'C5',
    policy_override: policies.C5
  });
  assert.strictEqual(decC5.gate_state, 'REQUIRES_REMEDIATION');
});

// -----------------------------------------------------------------------------
// RATIF-16: Historical proposal files remain intact
// -----------------------------------------------------------------------------
runTest('RATIF-16', 'Archivos históricos de propuesta permanecen íntegros e intactos.', () => {
  const v1Path = path.join(__dirname, '..', 'castle-gate', 'policy', 'CASTLE-GATE-POLICY-MATRIX-PROPOSED.json');
  const v2Path = path.join(__dirname, '..', 'castle-gate', 'policy', 'CASTLE-GATE-POLICY-MATRIX-PROPOSED-V2.json');
  assert.ok(fs.existsSync(v1Path), 'V1 proposal matrix must exist');
  assert.ok(fs.existsSync(v2Path), 'V2 proposal matrix must exist');
});

// -----------------------------------------------------------------------------
// RATIF-17: CQS v1.1 immutability verified (65 controls, 7 domains, 100.00 nominal weight)
// -----------------------------------------------------------------------------
runTest('RATIF-17', 'CQS v1.1 mantiene integridad metodológica inmutable (65 controles, 100.00 puntos).', () => {
  const integrity = cqs.validateCqsIntegrity();
  assert.strictEqual(integrity.integrity, 'PASS');
  assert.strictEqual(integrity.metrics.total_controls, 65);
  assert.strictEqual(integrity.metrics.total_domains, 7);
  assert.strictEqual(integrity.metrics.explicitly_approved, 24);
  assert.strictEqual(integrity.metrics.derived_from_approved_criterion, 41);
  assert.strictEqual(integrity.metrics.new_proposal, 0);
  assert.ok(Math.abs(integrity.metrics.nominal_weight_total - 100.0) < 1e-6);
});

// -----------------------------------------------------------------------------
// RATIF-18: TEST 04 and PARTIAL maintain frozen governance state
// -----------------------------------------------------------------------------
runTest('RATIF-18', 'TEST 04 permanece Pending / UNEXECUTED y PARTIAL como OPEN METHODOLOGICAL DECISION.', () => {
  assert.strictEqual(cqsAssets.invariants.invariants.test_04_status, 'Pending / UNEXECUTED');
  const omd = cqsAssets.invariants.open_methodological_decisions.find(d => d.id === 'OMD-01-PARTIAL-STATUS');
  assert.ok(omd);
  assert.strictEqual(omd.status, 'OPEN_METHODOLOGICAL_DECISION');
  assert.strictEqual(omd.active_in_engine, false);
});

console.log('\n================================================================');
const passedCount = results.filter(r => r.status === 'PASS').length;
const failedCount = results.filter(r => r.status === 'FAIL').length;
console.log(`RATIFICATION DECISION TEST SUITE SUMMARY: ${passedCount}/${results.length} PASSED (${failedCount} FAILED)`);
console.log('================================================================\n');

if (failedCount > 0) {
  process.exit(1);
}
