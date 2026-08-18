/**
 * Castle Security & Quality Gate — Policy Matrix Test Suite (Phase 3)
 * 
 * Executes POLICY-MATRIX-01 through POLICY-MATRIX-15 to verify:
 * - 6-level taxonomy completeness (C1 to C6)
 * - 16-field schema compliance
 * - UNSPECIFIED preservation and absence of arbitrary thresholds
 * - Strict CQS registry validation
 * - Template immutability and override isolation
 * - Deterministic policy resolution
 */

'use strict';

const assert = require('assert');
const path = require('path');
const fs = require('fs');

const gate = require('../castle-gate');
const cqs = require('../cqs');
const { validateGatePolicy, ALL_16_POLICY_FIELDS } = require('../castle-gate/policy/policy-validator');

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
console.log('Castle Gate (Phase 3) — Policy Matrix Tests');
console.log('================================================================\n');

const EXPECTED_LEVELS = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6'];

// -----------------------------------------------------------------------------
// POLICY-MATRIX-01: Exactly 6 levels exist
// -----------------------------------------------------------------------------
runTest('POLICY-MATRIX-01', 'Existen exactamente 6 niveles en la taxonomía oficial (C1 a C6).', () => {
  const assets = gate.loadPolicyAssets();
  const levelKeys = Object.keys(assets.levels);
  assert.strictEqual(levelKeys.length, 6);
  assert.deepStrictEqual(levelKeys.sort(), EXPECTED_LEVELS.sort());
});

// -----------------------------------------------------------------------------
// POLICY-MATRIX-02: Each level possesses all 16 required fields
// -----------------------------------------------------------------------------
runTest('POLICY-MATRIX-02', 'Cada nivel C1 a C6 posee la totalidad de los 16 campos estructurados requeridos.', () => {
  for (const lvl of EXPECTED_LEVELS) {
    const policy = gate.resolveGatePolicy(lvl);
    for (const field of ALL_16_POLICY_FIELDS) {
      assert.notStrictEqual(policy[field], undefined, `Level ${lvl} must have field "${field}"`);
    }
  }
});

// -----------------------------------------------------------------------------
// POLICY-MATRIX-03: Unratified parameters remain UNSPECIFIED
// -----------------------------------------------------------------------------
runTest('POLICY-MATRIX-03', 'Todos los parámetros no ratificados permanecen estrictamente como UNSPECIFIED.', () => {
  const unratifiedFields = [
    'minimum_cqs_score',
    'required_controls',
    'required_domains',
    'required_evidence_types',
    'allow_unexecuted_controls',
    'allow_conditional_approval',
    'approval_roles_required',
    'remediation_window_hours',
    'post_verification_required'
  ];

  for (const lvl of EXPECTED_LEVELS) {
    const policy = gate.resolveGatePolicy(lvl);
    for (const field of unratifiedFields) {
      assert.strictEqual(policy[field], 'UNSPECIFIED', `Level ${lvl} field "${field}" must be "UNSPECIFIED"`);
    }
  }
});

// -----------------------------------------------------------------------------
// POLICY-MATRIX-04: UNSPECIFIED does not generate automatic decisions/penalties
// -----------------------------------------------------------------------------
runTest('POLICY-MATRIX-04', 'UNSPECIFIED no genera decisiones ni penalizaciones automáticas arbitrarias.', () => {
  const cqsEval = {
    specification_version: '1.1.0-candidate',
    evaluation_id: 'EVAL-MATRIX-04',
    summary: {
      cqs_raw_score: 85.0,
      cqs_display_score: 85.0,
      final_verdict: 'PASS_RELEASE',
      has_unexecuted_components: false
    },
    domains: [],
    gate_breakers: { status: 'CLEARED', evaluated_gates: [] },
    governance: { methodology_status: 'FROZEN' }
  };

  const decision = gate.evaluateGateDecision({
    cqs_evaluation_result: cqsEval,
    gate_level: 'C3'
  });

  assert.strictEqual(decision.gate_state, 'PASSED');
  assert.strictEqual(decision.blockers.length, 0);
});

// -----------------------------------------------------------------------------
// POLICY-MATRIX-05: No controls outside registry
// -----------------------------------------------------------------------------
runTest('POLICY-MATRIX-05', 'No se permiten controles fuera del registro oficial de 65 controles CQS.', () => {
  const customPolicy = {
    level: 'C2',
    name: 'STANDARD',
    intended_scope: 'Scope',
    risk_profile: 'Risk',
    policy_version: '1.0.0-invalid-control',
    required_controls: ['PER-01.1', 'FAKE-CONTROL-99.9'],
    required_domains: 'UNSPECIFIED',
    required_evidence_types: 'UNSPECIFIED',
    minimum_cqs_score: 'UNSPECIFIED',
    mandatory_gate_breakers: ['GB-01'],
    allow_unexecuted_controls: 'UNSPECIFIED',
    allow_conditional_approval: 'UNSPECIFIED',
    approval_roles_required: 'UNSPECIFIED',
    remediation_window_hours: 'UNSPECIFIED',
    post_verification_required: 'UNSPECIFIED',
    governance_status: 'TEST',
    decision_reference: 'TEST'
  };

  const val = validateGatePolicy(customPolicy);
  assert.strictEqual(val.valid, false);
  assert.ok(val.errors.some(e => e.includes('FAKE-CONTROL-99.9')));
});

// -----------------------------------------------------------------------------
// POLICY-MATRIX-06: No domains outside registry
// -----------------------------------------------------------------------------
runTest('POLICY-MATRIX-06', 'No se permiten dominios fuera de los 7 dominios oficiales CQS.', () => {
  const customPolicy = {
    level: 'C4',
    name: 'ADVANCED',
    intended_scope: 'Scope',
    risk_profile: 'Risk',
    policy_version: '1.0.0-invalid-domain',
    required_controls: 'UNSPECIFIED',
    required_domains: ['PER', 'SEC', 'NONEXISTENT_DOMAIN'],
    required_evidence_types: 'UNSPECIFIED',
    minimum_cqs_score: 'UNSPECIFIED',
    mandatory_gate_breakers: ['GB-01'],
    allow_unexecuted_controls: 'UNSPECIFIED',
    allow_conditional_approval: 'UNSPECIFIED',
    approval_roles_required: 'UNSPECIFIED',
    remediation_window_hours: 'UNSPECIFIED',
    post_verification_required: 'UNSPECIFIED',
    governance_status: 'TEST',
    decision_reference: 'TEST'
  };

  const val = validateGatePolicy(customPolicy);
  assert.strictEqual(val.valid, false);
  assert.ok(val.errors.some(e => e.includes('NONEXISTENT_DOMAIN')));
});

// -----------------------------------------------------------------------------
// POLICY-MATRIX-07: No invalid Gate Breakers
// -----------------------------------------------------------------------------
runTest('POLICY-MATRIX-07', 'No se permiten Gate Breakers distintos a GB-01..GB-05.', () => {
  const customPolicy = {
    level: 'C5',
    name: 'CRITICAL',
    intended_scope: 'Scope',
    risk_profile: 'Risk',
    policy_version: '1.0.0-invalid-gb',
    required_controls: 'UNSPECIFIED',
    required_domains: 'UNSPECIFIED',
    required_evidence_types: 'UNSPECIFIED',
    minimum_cqs_score: 'UNSPECIFIED',
    mandatory_gate_breakers: ['GB-01', 'GB-99_INVALID'],
    allow_unexecuted_controls: 'UNSPECIFIED',
    allow_conditional_approval: 'UNSPECIFIED',
    approval_roles_required: 'UNSPECIFIED',
    remediation_window_hours: 'UNSPECIFIED',
    post_verification_required: 'UNSPECIFIED',
    governance_status: 'TEST',
    decision_reference: 'TEST'
  };

  const val = validateGatePolicy(customPolicy);
  assert.strictEqual(val.valid, false);
  assert.ok(val.errors.some(e => e.includes('GB-99_INVALID')));
});

// -----------------------------------------------------------------------------
// POLICY-MATRIX-08: No NEW_PROPOSALS
// -----------------------------------------------------------------------------
runTest('POLICY-MATRIX-08', 'CQS Registry y políticas mantienen exactamente 0 NEW_PROPOSALS.', () => {
  const assets = cqs.loadNormativeAssets();
  const newProposals = assets.controls.filter(c => c.origin_classification === 'NEW_PROPOSAL');
  assert.strictEqual(newProposals.length, 0);
});

// -----------------------------------------------------------------------------
// POLICY-MATRIX-09: Overrides do not mutate templates
// -----------------------------------------------------------------------------
runTest('POLICY-MATRIX-09', 'Los overrides por proyecto no mutan los templates base de default-policies.json.', () => {
  const defaultC6Before = gate.resolveGatePolicy('C6');
  assert.strictEqual(defaultC6Before.minimum_cqs_score, 'UNSPECIFIED');

  const customOverride = {
    policy_version: '1.0.0-override-test',
    minimum_cqs_score: 99.0
  };

  const overridden = gate.resolveGatePolicy('C6', customOverride);
  assert.strictEqual(overridden.minimum_cqs_score, 99.0);

  // Re-resolving without override must yield original UNSPECIFIED template
  const defaultC6After = gate.resolveGatePolicy('C6');
  assert.strictEqual(defaultC6After.minimum_cqs_score, 'UNSPECIFIED');
});

// -----------------------------------------------------------------------------
// POLICY-MATRIX-10: CQS remains byte-identical / immutable
// -----------------------------------------------------------------------------
runTest('POLICY-MATRIX-10', 'CQS v1.1 mantiene integridad metodológica intacta de 65 controles y 100.00 puntos.', () => {
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
// POLICY-MATRIX-11: TEST 04 remains Pending / UNEXECUTED
// -----------------------------------------------------------------------------
runTest('POLICY-MATRIX-11', 'Enterprise Calibration (TEST 04) permanece estrictamente Pending / UNEXECUTED.', () => {
  const assets = cqs.loadNormativeAssets();
  assert.strictEqual(assets.invariants.invariants.test_04_status, 'Pending / UNEXECUTED');
  const test04Path = path.join(__dirname, '..', 'calibration', 'test-04.md');
  if (fs.existsSync(test04Path)) {
    const content = fs.readFileSync(test04Path, 'utf8');
    assert.ok(content.includes('UNEXECUTED') || content.includes('Pending'), 'test-04.md must indicate Pending/UNEXECUTED');
  }
});

// -----------------------------------------------------------------------------
// POLICY-MATRIX-12: PARTIAL remains OPEN METHODOLOGICAL DECISION
// -----------------------------------------------------------------------------
runTest('POLICY-MATRIX-12', 'PARTIAL permanece como OPEN METHODOLOGICAL DECISION e inactivo en el engine.', () => {
  const assets = cqs.loadNormativeAssets();
  const omd = assets.invariants.open_methodological_decisions.find(d => d.id === 'OMD-01-PARTIAL-STATUS');
  assert.ok(omd);
  assert.strictEqual(omd.status, 'OPEN_METHODOLOGICAL_DECISION');
  assert.strictEqual(omd.active_in_engine, false);
});

// -----------------------------------------------------------------------------
// POLICY-MATRIX-13: Incomplete policy is detected correctly
// -----------------------------------------------------------------------------
runTest('POLICY-MATRIX-13', 'Política incompleta a la que le faltan campos obligatorios es clasificada como POLICY_INCOMPLETE.', () => {
  const incomplete = {
    level: 'C1',
    name: 'FOUNDATION'
    // missing all other 14 fields
  };

  const val = validateGatePolicy(incomplete);
  assert.strictEqual(val.valid, false);
  assert.strictEqual(val.status, 'POLICY_INCOMPLETE');
  assert.ok(val.errors.length > 0);
});

// -----------------------------------------------------------------------------
// POLICY-MATRIX-14: Policy Resolver produces reproducible results
// -----------------------------------------------------------------------------
runTest('POLICY-MATRIX-14', 'Policy Resolver produce resultados deterministas e idénticos en ejecuciones repetidas.', () => {
  const res1 = gate.resolveGatePolicy('C3');
  const res2 = gate.resolveGatePolicy('C3');
  assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2));
});

// -----------------------------------------------------------------------------
// POLICY-MATRIX-15: No invented normative thresholds
// -----------------------------------------------------------------------------
runTest('POLICY-MATRIX-15', 'No existen umbrales numéricos quemados en el código de default-policies.json.', () => {
  const assets = gate.loadPolicyAssets();
  for (const lvl of EXPECTED_LEVELS) {
    const p = assets.defaultPolicies[lvl];
    assert.strictEqual(p.minimum_cqs_score, 'UNSPECIFIED', `Level ${lvl} must not have invented minimum_cqs_score`);
  }
});

console.log('\n================================================================');
const passedCount = results.filter(r => r.status === 'PASS').length;
const failedCount = results.filter(r => r.status === 'FAIL').length;
console.log(`POLICY MATRIX TEST SUITE SUMMARY: ${passedCount}/${results.length} PASSED (${failedCount} FAILED)`);
console.log('================================================================\n');

if (failedCount > 0) {
  process.exit(1);
}
