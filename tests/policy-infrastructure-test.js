/**
 * Castle Security & Quality Gate — Policy Infrastructure Test Suite (Phase 2)
 * 
 * Executes POLICY-01 through POLICY-15 to verify policy model robustness,
 * validation against CQS registry, override scoping, and UNSPECIFIED preservation.
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
console.log('Castle Gate (Phase 2) — Policy Infrastructure Tests');
console.log('================================================================\n');

// POLICY-01 to POLICY-06: Verification of C1 through C6 default policies
const levels = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6'];
levels.forEach((lvl, idx) => {
  const testId = `POLICY-0${idx + 1}`;
  runTest(testId, `Nivel ${lvl} existe, resuelve su política y pasa validación estructural.`, () => {
    const policy = gate.resolveGatePolicy(lvl);
    assert.strictEqual(policy.level, lvl);
    assert.ok(policy.name);
    assert.ok(policy.policy_version);
    assert.ok(policy.rules);
    assert.ok(policy.governance);
    
    // Validate policy structure
    const val = validateGatePolicy(policy);
    assert.strictEqual(val.valid, true, `Policy for ${lvl} must be valid: ${val.errors.join('; ')}`);
  });
});

// POLICY-07: UNSPECIFIED no genera penalización
runTest('POLICY-07', 'Valores UNSPECIFIED en políticas no generan penalizaciones automáticas arbitrarias.', () => {
  const policyC1 = gate.resolveGatePolicy('C1');
  assert.strictEqual(policyC1.rules.minimum_cqs_score, 'UNSPECIFIED');

  const cqsEval = {
    specification_version: '1.1.0',
    evaluation_id: 'EVAL-POLICY-07',
    summary: {
      cqs_raw_score: 82.5,
      cqs_display_score: 82.5,
      final_verdict: 'PASS_RELEASE',
      has_unexecuted_components: false
    },
    domains: [],
    gate_breakers: { status: 'CLEARED', evaluated_gates: [] },
    governance: { methodology_status: 'FROZEN' }
  };

  const decision = gate.evaluateGateDecision({
    cqs_evaluation_result: cqsEval,
    gate_level: 'C1'
  });

  assert.strictEqual(decision.gate_state, 'PASSED');
  assert.strictEqual(decision.blockers.length, 0);
});

// POLICY-08: Nivel inexistente es rechazado
runTest('POLICY-08', 'Nivel de Gate inexistente (ej. C99, INVALID) es rechazado por el Policy Resolver.', () => {
  assert.throws(() => {
    gate.resolveGatePolicy('C99');
  }, /Invalid Gate Level/);
});

// POLICY-09: Control inexistente en required_controls es rechazado
runTest('POLICY-09', 'Control inexistente en required_controls es detectado y rechazado por el validador.', () => {
  const invalidPolicy = {
    level: 'C2',
    name: 'STANDARD',
    intended_scope: 'Scope',
    risk_profile: 'Risk',
    policy_version: '1.0.0-invalid-control',
    required_controls: ['PER-01.1', 'NONEXISTENT-99.9'],
    required_domains: 'UNSPECIFIED',
    required_evidence_types: 'UNSPECIFIED',
    minimum_cqs_score: 'UNSPECIFIED',
    mandatory_gate_breakers: ['GB-01'],
    allow_unexecuted_controls: 'UNSPECIFIED',
    allow_conditional_approval: 'UNSPECIFIED',
    approval_roles_required: 'UNSPECIFIED',
    remediation_window_hours: 'UNSPECIFIED',
    post_verification_required: 'UNSPECIFIED',
    governance_status: 'TEST_OVERRIDE',
    decision_reference: 'TEST'
  };

  const val = validateGatePolicy(invalidPolicy);
  assert.strictEqual(val.valid, false);
  assert.ok(val.errors.some(e => e.includes('NONEXISTENT-99.9')));
});

// POLICY-10: Dominio inexistente en required_domains es rechazado
runTest('POLICY-10', 'Dominio inexistente en required_domains es detectado y rechazado por el validador.', () => {
  const invalidPolicy = {
    level: 'C3',
    name: 'PROFESSIONAL',
    intended_scope: 'Scope',
    risk_profile: 'Risk',
    policy_version: '1.0.0-invalid-domain',
    required_controls: 'UNSPECIFIED',
    required_domains: ['PER', 'SEC', 'FAKE_DOMAIN'],
    required_evidence_types: 'UNSPECIFIED',
    minimum_cqs_score: 'UNSPECIFIED',
    mandatory_gate_breakers: ['GB-01'],
    allow_unexecuted_controls: 'UNSPECIFIED',
    allow_conditional_approval: 'UNSPECIFIED',
    approval_roles_required: 'UNSPECIFIED',
    remediation_window_hours: 'UNSPECIFIED',
    post_verification_required: 'UNSPECIFIED',
    governance_status: 'TEST_OVERRIDE',
    decision_reference: 'TEST'
  };

  const val = validateGatePolicy(invalidPolicy);
  assert.strictEqual(val.valid, false);
  assert.ok(val.errors.some(e => e.includes('FAKE_DOMAIN')));
});

// POLICY-11: Override no modifica CQS ni defaults
runTest('POLICY-11', 'Override de política no muta el registro CQS ni la plantilla por defecto.', () => {
  const customOverride = {
    policy_version: '2.0.0-custom',
    minimum_cqs_score: 92.0
  };

  const resolvedCustom = gate.resolveGatePolicy('C4', customOverride);
  assert.strictEqual(resolvedCustom.minimum_cqs_score, 92.0);

  // Default C4 must remain UNSPECIFIED
  const defaultC4 = gate.resolveGatePolicy('C4');
  assert.strictEqual(defaultC4.minimum_cqs_score, 'UNSPECIFIED');

  // Verify CQS total nominal weight is still 100.00
  const cqsAssets = cqs.loadNormativeAssets();
  const sumW = cqsAssets.controls.reduce((sum, c) => sum + c.inherited_weight, 0);
  assert.ok(Math.abs(sumW - 100.0) < 1e-6);
});

// POLICY-12: Policy incompleta se identifica correctamente
runTest('POLICY-12', 'Política incompleta (con campos faltantes) es detectada y rechazada.', () => {
  const incompletePolicy = {
    level: 'C1',
    name: 'FOUNDATION'
    // missing required fields
  };

  const val = validateGatePolicy(incompletePolicy);
  assert.strictEqual(val.valid, false);
  assert.ok(val.errors.some(e => e.includes('Missing required policy field')));
});

// POLICY-13: PARTIAL permanece inactivo
runTest('POLICY-13', 'El estado PARTIAL permanece formalmente inactivo y aislado como decisión abierta.', () => {
  const cqsAssets = cqs.loadNormativeAssets();
  const omd = cqsAssets.invariants.open_methodological_decisions.find(d => d.id === 'OMD-01-PARTIAL-STATUS');
  assert.ok(omd);
  assert.strictEqual(omd.status, 'OPEN_METHODOLOGICAL_DECISION');
  assert.strictEqual(omd.active_in_engine, false);
});

// POLICY-14: Gate Breakers permanecen independientes
runTest('POLICY-14', 'Gate Breakers (GB-01 a GB-05) permanecen obligatorios e independientes de los puntajes.', () => {
  for (const lvl of levels) {
    const policy = gate.resolveGatePolicy(lvl);
    assert.deepStrictEqual(policy.mandatory_gate_breakers, ['GB-01', 'GB-02', 'GB-03', 'GB-04', 'GB-05']);
  }
});

// POLICY-15: CQS permanece íntegro e inmutable
runTest('POLICY-15', 'CQS v1.1 mantiene integridad metodológica perfecta de 65 controles y 100.00 de peso.', () => {
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
console.log(`POLICY TEST SUITE SUMMARY: ${passedCount}/${results.length} PASSED (${failedCount} FAILED)`);
console.log('================================================================\n');

if (failedCount > 0) {
  process.exit(1);
}
