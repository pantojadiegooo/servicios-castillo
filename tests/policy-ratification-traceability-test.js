/**
 * Castle Security & Quality Gate — Policy Traceability & Ratification Audit Test Suite (Phase 4.1)
 * 
 * Verifies comprehensive end-to-end traceability, non-duplication of scoring,
 * strict monotonicity, control existence, and immutability.
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
console.log('Castle Gate (Phase 4.1) — Traceability & Ratification Audit Tests');
console.log('================================================================\n');

// Load V2 proposed policy matrix
const v2Path = path.join(__dirname, '..', 'castle-gate', 'policy', 'CASTLE-GATE-POLICY-MATRIX-PROPOSED-V2.json');
const v2Data = JSON.parse(fs.readFileSync(v2Path, 'utf8'));
const policies = v2Data.policies;
const levels = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6'];

const cqsAssets = cqs.loadNormativeAssets();
const validControlIds = new Set(cqsAssets.controls.map(c => c.control_id));
const validDomainCodes = new Set(Object.keys(cqsAssets.domains));

// -----------------------------------------------------------------------------
// TRACE-01: Full C1 to C6 levels defined in V2 proposal
// -----------------------------------------------------------------------------
runTest('TRACE-01', 'La propuesta V2 define formalmente la totalidad de los 6 niveles C1 a C6.', () => {
  assert.strictEqual(Object.keys(policies).length, 6);
  assert.deepStrictEqual(Object.keys(policies).sort(), levels.sort());
});

// -----------------------------------------------------------------------------
// TRACE-02: All V2 proposed policies pass formal validation
// -----------------------------------------------------------------------------
runTest('TRACE-02', 'Todas las políticas V2 pasan validación estricta con policy-validator.', () => {
  for (const lvl of levels) {
    const val = validateGatePolicy(policies[lvl]);
    assert.strictEqual(val.valid, true, `Validation failed for ${lvl}: ${val.errors.join('; ')}`);
    assert.strictEqual(val.status, 'FULLY_RATIFIED');
  }
});

// -----------------------------------------------------------------------------
// TRACE-03: Exact control ID traceability against CQS Registry
// -----------------------------------------------------------------------------
runTest('TRACE-03', 'Cada control requerido en C1 a C6 existe en el registry de 65 controles CQS.', () => {
  for (const lvl of levels) {
    const req = policies[lvl].required_controls;
    assert.ok(Array.isArray(req), `Level ${lvl} must have required_controls array`);
    for (const cid of req) {
      assert.ok(validControlIds.has(cid), `Level ${lvl} contains invalid control ID "${cid}"`);
    }
  }
});

// -----------------------------------------------------------------------------
// TRACE-04: No duplicate controls in required_controls arrays
// -----------------------------------------------------------------------------
runTest('TRACE-04', 'Ausencia total de controles duplicados en los arreglos de cada nivel.', () => {
  for (const lvl of levels) {
    const req = policies[lvl].required_controls;
    const seen = new Set();
    for (const cid of req) {
      assert.ok(!seen.has(cid), `Duplicate control ID "${cid}" detected in level ${lvl}`);
      seen.add(cid);
    }
  }
});

// -----------------------------------------------------------------------------
// TRACE-05: Monotonic increase in required controls count (12 -> 21 -> 33 -> 60 -> 65 -> 65)
// -----------------------------------------------------------------------------
runTest('TRACE-05', 'Conteo de controles obligatorios escala monotónicamente: 12 <= 21 <= 33 <= 60 <= 65 <= 65.', () => {
  const counts = levels.map(lvl => policies[lvl].required_controls.length);
  assert.deepStrictEqual(counts, [12, 21, 33, 60, 65, 65]);
  for (let i = 0; i < counts.length - 1; i++) {
    assert.ok(counts[i] <= counts[i + 1], `Expected count ${levels[i]} <= ${levels[i+1]}`);
  }
});

// -----------------------------------------------------------------------------
// TRACE-06: Strict monotonicity in minimum CQS score thresholds (70 -> 78 -> 85 -> 90 -> 95 -> 98)
// -----------------------------------------------------------------------------
runTest('TRACE-06', 'Umbrales mínimos de score son estrictamente crecientes: 70.0 < 78.0 < 85.0 < 90.0 < 95.0 < 98.0.', () => {
  const scores = levels.map(lvl => policies[lvl].minimum_cqs_score);
  assert.deepStrictEqual(scores, [70.0, 78.0, 85.0, 90.0, 95.0, 98.0]);
  for (let i = 0; i < scores.length - 1; i++) {
    assert.ok(scores[i] < scores[i + 1], `Expected score ${levels[i]} < ${levels[i+1]}`);
  }
});

// -----------------------------------------------------------------------------
// TRACE-07: Monotonic reduction in remediation windows (168h -> 120h -> 72h -> 48h -> 24h -> 12h)
// -----------------------------------------------------------------------------
runTest('TRACE-07', 'Ventanas de remediación se reducen monotónicamente: 168h >= 120h >= 72h >= 48h >= 24h >= 12h.', () => {
  const windows = levels.map(lvl => policies[lvl].remediation_window_hours);
  assert.deepStrictEqual(windows, [168, 120, 72, 48, 24, 12]);
  for (let i = 0; i < windows.length - 1; i++) {
    assert.ok(windows[i] >= windows[i + 1], `Expected window ${levels[i]} >= ${levels[i+1]}`);
  }
});

// -----------------------------------------------------------------------------
// TRACE-08: Domain traceability and C1 exclusion rationale
// -----------------------------------------------------------------------------
runTest('TRACE-08', 'Trazabilidad de dominios: C1 exige 6 dominios (excluye MNT) y C2 a C6 exigen los 7 dominios.', () => {
  assert.strictEqual(policies.C1.required_domains.length, 6);
  assert.ok(!policies.C1.required_domains.includes('MNT'));
  
  for (const lvl of ['C2', 'C3', 'C4', 'C5', 'C6']) {
    assert.strictEqual(policies[lvl].required_domains.length, 7);
    for (const d of ['PER', 'SEC', 'ACC', 'SEO', 'UX', 'REL', 'MNT']) {
      assert.ok(policies[lvl].required_domains.includes(d));
    }
  }
});

// -----------------------------------------------------------------------------
// TRACE-09: Mandatory Gate Breakers GB-01 to GB-05 invariant
// -----------------------------------------------------------------------------
runTest('TRACE-09', 'Gate Breakers GB-01..GB-05 son obligatorios en los 6 niveles sin excepción.', () => {
  const expectedBreakers = ['GB-01', 'GB-02', 'GB-03', 'GB-04', 'GB-05'];
  for (const lvl of levels) {
    assert.deepStrictEqual(policies[lvl].mandatory_gate_breakers, expectedBreakers);
  }
});

// -----------------------------------------------------------------------------
// TRACE-10: UNEXECUTED control rules strictly partitioned
// -----------------------------------------------------------------------------
runTest('TRACE-10', 'Reglas de UNEXECUTED: permitido únicamente en C1/C2 y estrictamente prohibido en C3..C6.', () => {
  assert.strictEqual(policies.C1.allow_unexecuted_controls, true);
  assert.strictEqual(policies.C2.allow_unexecuted_controls, true);
  assert.strictEqual(policies.C3.allow_unexecuted_controls, false);
  assert.strictEqual(policies.C4.allow_unexecuted_controls, false);
  assert.strictEqual(policies.C5.allow_unexecuted_controls, false);
  assert.strictEqual(policies.C6.allow_unexecuted_controls, false);
});

// -----------------------------------------------------------------------------
// TRACE-11: Conditional approval rules strictly partitioned
// -----------------------------------------------------------------------------
runTest('TRACE-11', 'Reglas de CONDITIONAL: permitido en C1..C3 y estrictamente prohibido en C4..C6.', () => {
  assert.strictEqual(policies.C1.allow_conditional_approval, true);
  assert.strictEqual(policies.C2.allow_conditional_approval, true);
  assert.strictEqual(policies.C3.allow_conditional_approval, true);
  assert.strictEqual(policies.C4.allow_conditional_approval, false);
  assert.strictEqual(policies.C5.allow_conditional_approval, false);
  assert.strictEqual(policies.C6.allow_conditional_approval, false);
});

// -----------------------------------------------------------------------------
// TRACE-12: Approval Authority Classes structured
// -----------------------------------------------------------------------------
runTest('TRACE-12', 'Clases de autoridad de aprobación (AUTH_CLASS_1 a AUTH_CLASS_6) presentes y coherentes.', () => {
  const expectedClasses = [
    'AUTH_CLASS_1_PEER_LEAD',
    'AUTH_CLASS_2_MULTI_DISCIPLINE',
    'AUTH_CLASS_3_TRIAD_SIGN_OFF',
    'AUTH_CLASS_4_STAFF_TRIAD',
    'AUTH_CLASS_5_EXECUTIVE_SECURITY',
    'AUTH_CLASS_6_GOVERNANCE_BOARD'
  ];
  for (let i = 0; i < levels.length; i++) {
    const lvl = levels[i];
    assert.strictEqual(policies[lvl].approval_authority_class, expectedClasses[i]);
  }
});

// -----------------------------------------------------------------------------
// TRACE-13: Post-verification requirements structured
// -----------------------------------------------------------------------------
runTest('TRACE-13', 'Post-verificación: false en C1/C2 y true en C3..C6.', () => {
  assert.strictEqual(policies.C1.post_verification_required, false);
  assert.strictEqual(policies.C2.post_verification_required, false);
  assert.strictEqual(policies.C3.post_verification_required, true);
  assert.strictEqual(policies.C4.post_verification_required, true);
  assert.strictEqual(policies.C5.post_verification_required, true);
  assert.strictEqual(policies.C6.post_verification_required, true);
});

// -----------------------------------------------------------------------------
// TRACE-14: Zero scoring duplication - Gate consumes CQS Engine strictly
// -----------------------------------------------------------------------------
runTest('TRACE-14', 'El Gate no recalcula ni duplica scoring; consume fielmente el objeto de CQS Engine.', () => {
  const rawEvidence = { 'PER-01.1': { status: 'PASS' } };
  const cqsDirect = cqs.evaluateCqs({
    target_system: { name: 'Trace Test', environment: 'staging' },
    evidence: { controls: rawEvidence }
  });

  const gateResult = gate.executeCastleGate({
    target_system: { name: 'Trace Test', environment: 'staging' },
    gate_level: 'C1',
    raw_evidence: rawEvidence,
    policy_override: policies.C1
  });

  assert.strictEqual(gateResult.gate_decision.cqs_summary.raw_score, cqsDirect.summary.cqs_raw_score);
  assert.strictEqual(gateResult.gate_decision.cqs_summary.display_score, cqsDirect.summary.cqs_display_score);
});

// -----------------------------------------------------------------------------
// TRACE-15: Default policies template remains UNSPECIFIED (No silent activation)
// -----------------------------------------------------------------------------
runTest('TRACE-15', 'default-policies.json continúa con valores UNSPECIFIED (cero activación silenciosa).', () => {
  const defaultAssets = gate.loadPolicyAssets();
  for (const lvl of levels) {
    const p = defaultAssets.defaultPolicies[lvl];
    assert.strictEqual(p.minimum_cqs_score, 'UNSPECIFIED');
    assert.strictEqual(p.required_controls, 'UNSPECIFIED');
    assert.strictEqual(p.required_domains, 'UNSPECIFIED');
  }
});

// -----------------------------------------------------------------------------
// TRACE-16: TEST 04 remains strictly Pending / UNEXECUTED
// -----------------------------------------------------------------------------
runTest('TRACE-16', 'Enterprise Calibration (TEST 04) permanece estrictamente Pending / UNEXECUTED.', () => {
  assert.strictEqual(cqsAssets.invariants.invariants.test_04_status, 'Pending / UNEXECUTED');
});

// -----------------------------------------------------------------------------
// TRACE-17: PARTIAL remains strictly OPEN METHODOLOGICAL DECISION
// -----------------------------------------------------------------------------
runTest('TRACE-17', 'PARTIAL permanece inactivo y declarado como OPEN METHODOLOGICAL DECISION.', () => {
  const omd = cqsAssets.invariants.open_methodological_decisions.find(d => d.id === 'OMD-01-PARTIAL-STATUS');
  assert.ok(omd);
  assert.strictEqual(omd.status, 'OPEN_METHODOLOGICAL_DECISION');
  assert.strictEqual(omd.active_in_engine, false);
});

// -----------------------------------------------------------------------------
// TRACE-18: CQS v1.1 immutability verified (65 controls, 7 domains, 100.00 nominal weight)
// -----------------------------------------------------------------------------
runTest('TRACE-18', 'CQS v1.1 mantiene integridad formal inmutable (65 controles, 100.00 puntos).', () => {
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
console.log(`TRACEABILITY AUDIT TEST SUITE SUMMARY: ${passedCount}/${results.length} PASSED (${failedCount} FAILED)`);
console.log('================================================================\n');

if (failedCount > 0) {
  process.exit(1);
}
