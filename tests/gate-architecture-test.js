/**
 * Castle Security & Quality Gate (C1 to C6) — Architectural Test Suite
 * 
 * Executes GATE-01 through GATE-13 to rigorously verify architectural separation,
 * CQS engine consumption, immutability, policy resolution, and traceability.
 */

'use strict';

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const gate = require('../castle-gate');
const cqs = require('../cqs');

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
console.log('Castle Security & Quality Gate (C1->C6) — Architectural Tests');
console.log('================================================================\n');

// -----------------------------------------------------------------------------
// GATE-01: Gate consume CQS Engine
// -----------------------------------------------------------------------------
runTest('GATE-01', 'Gate consume directamente el CQS Engine existente sin bypass.', () => {
  const target = { name: 'Gate Consumer Test', environment: 'staging' };
  const auditor = { name: 'Gate Auditor', role: 'Security Lead' };
  
  // Minimal evidence with 1 pass
  const rawEvidence = { 'PER-01.1': { status: 'PASS' } };
  
  const gateExec = gate.executeCastleGate({
    target_system: target,
    auditor: auditor,
    gate_level: 'C1',
    raw_evidence: rawEvidence
  });

  assert.ok(gateExec.cqs_result, 'Gate must contain CQS evaluation result');
  assert.strictEqual(gateExec.cqs_result.specification_version, '1.1.0');
  assert.strictEqual(gateExec.gate_decision.gate_level, 'C1');
  assert.ok(gateExec.gate_decision.cqs_summary, 'Gate decision must consume CQS summary');
});

// -----------------------------------------------------------------------------
// GATE-02: Gate no duplica scoring
// -----------------------------------------------------------------------------
runTest('GATE-02', 'Gate no recalcula ni duplica las fórmulas matemáticas de scoring de CQS.', () => {
  const assets = cqs.loadNormativeAssets();
  const rawEvidence = {};
  for (const c of assets.controls) {
    rawEvidence[c.control_id] = { status: 'PASS' };
  }

  const gateExec = gate.executeCastleGate({
    target_system: { name: 'No Duplicate Scoring', environment: 'production' },
    auditor: { name: 'Auditor', role: 'QA' },
    gate_level: 'C2',
    raw_evidence: rawEvidence
  });

  // The gate decision score must match CQS engine score exactly
  assert.strictEqual(gateExec.gate_decision.cqs_summary.raw_score, gateExec.cqs_result.summary.cqs_raw_score);
  assert.strictEqual(gateExec.gate_decision.cqs_summary.display_score, gateExec.cqs_result.summary.cqs_display_score);
});

// -----------------------------------------------------------------------------
// GATE-03: Gate no modifica CQS
// -----------------------------------------------------------------------------
runTest('GATE-03', 'Gate opera como capa exterior sin modificar el objeto de resultados de CQS.', () => {
  const assets = cqs.loadNormativeAssets();
  const originalControlsCount = assets.controls.length;
  const originalDomainsCount = Object.keys(assets.domains).length;

  const gateExec = gate.executeCastleGate({
    target_system: { name: 'Immutability Check', environment: 'production' },
    auditor: { name: 'Auditor', role: 'QA' },
    gate_level: 'C3',
    raw_evidence: { 'SEC-01.1': { status: 'PASS' } }
  });

  const assetsAfter = cqs.loadNormativeAssets();
  assert.strictEqual(assetsAfter.controls.length, originalControlsCount, 'CQS controls count must not change');
  assert.strictEqual(Object.keys(assetsAfter.domains).length, originalDomainsCount, 'CQS domains count must not change');
});

// -----------------------------------------------------------------------------
// GATE-04: Policy Resolver funciona
// -----------------------------------------------------------------------------
runTest('GATE-04', 'Policy Resolver resuelve correctamente cada nivel C1 a C6 y valida niveles.', () => {
  for (const lvl of ['C1', 'C2', 'C3', 'C4', 'C5', 'C6']) {
    const policy = gate.resolveGatePolicy(lvl);
    assert.strictEqual(policy.level, lvl, `Policy for ${lvl} must have level ${lvl}`);
    assert.ok(policy.rules, `Policy for ${lvl} must contain rules`);
  }

  // Unknown level must be rejected
  assert.throws(() => {
    gate.resolveGatePolicy('C99');
  }, /Invalid Gate Level/);
});

// -----------------------------------------------------------------------------
// GATE-05: C1→C6 son configurables
// -----------------------------------------------------------------------------
runTest('GATE-05', 'Niveles C1→C6 son configurables mediante sobreescritura de políticas sin alterar defaults.', () => {
  const customOverride = {
    policy_version: '1.0.0-custom-fintech',
    rules: {
      minimum_cqs_score: 95.0,
      approval_roles_required: ['CISO', 'Lead Architect']
    }
  };

  const resolved = gate.resolveGatePolicy('C5', customOverride);
  assert.strictEqual(resolved.level, 'C5');
  assert.strictEqual(resolved.policy_version, '1.0.0-custom-fintech');
  assert.strictEqual(resolved.rules.minimum_cqs_score, 95.0);

  // Default C5 policy must remain unmodified
  const defaultC5 = gate.resolveGatePolicy('C5');
  assert.strictEqual(defaultC5.rules.minimum_cqs_score, 'UNSPECIFIED');
});

// -----------------------------------------------------------------------------
// GATE-06: Estados Gate están separados de estados CQS
// -----------------------------------------------------------------------------
runTest('GATE-06', 'Estados de entrega de Gate están formalmente separados de estados de evaluación CQS.', () => {
  const cqsStatuses = [cqs.STATUS_PASS, cqs.STATUS_FAIL, cqs.STATUS_NA, cqs.STATUS_UNEXECUTED];
  const gateStates = gate.PROPOSED_GATE_STATES;

  // Verify no state collision
  assert.ok(gateStates.includes('REQUIRES_REMEDIATION'));
  assert.ok(gateStates.includes('BLOCKED'));
  assert.ok(gateStates.includes('EVIDENCE_PENDING'));

  assert.ok(!cqsStatuses.includes('REQUIRES_REMEDIATION'));
  assert.ok(!cqsStatuses.includes('EVIDENCE_PENDING'));
});

// -----------------------------------------------------------------------------
// GATE-07: Gate Breakers son consumidos correctamente
// -----------------------------------------------------------------------------
runTest('GATE-07', 'Gate Breakers de CQS provocan bloqueo inmediato en la decisión del Gate.', () => {
  const assets = cqs.loadNormativeAssets();
  const rawEvidence = {};
  for (const c of assets.controls) {
    rawEvidence[c.control_id] = { status: 'PASS' };
  }

  // CQS score is 100.00, but GB-01 (Insecure Transport) is active
  const gateExec = gate.executeCastleGate({
    target_system: { name: 'Gate Breaker Consumer', environment: 'production' },
    auditor: { name: 'Security Auditor', role: 'SecOps' },
    gate_level: 'C4',
    raw_evidence: rawEvidence,
    gate_evidence: {
      'GB-01': true,
      'GB-01_details': 'Plaintext HTTP accepted on login endpoint'
    }
  });

  assert.strictEqual(gateExec.cqs_result.summary.cqs_display_score, 100.00);
  assert.strictEqual(gateExec.cqs_result.gate_breakers.status, 'BLOCKED');
  assert.strictEqual(gateExec.gate_decision.gate_state, 'BLOCKED');
  assert.ok(gateExec.gate_decision.blockers.some(b => b.code === 'GB-01'));
});

// -----------------------------------------------------------------------------
// GATE-08: Traceability completa
// -----------------------------------------------------------------------------
runTest('GATE-08', 'Traceability completa: Evidence -> Control -> Subcriterion -> Domain -> Score -> Gate Decision.', () => {
  const gateExec = gate.executeCastleGate({
    target_system: { name: 'Traceability System', environment: 'production' },
    auditor: { name: 'Auditor', role: 'QA' },
    gate_level: 'C1',
    raw_evidence: { 'PER-01.1': { status: 'PASS' } }
  });

  const trace = gateExec.audit_record.full_traceability_chain;
  assert.ok(trace.evidence_package_id, 'Traceability must have evidence_package_id');
  assert.ok(trace.cqs_evaluation_id, 'Traceability must have cqs_evaluation_id');
  assert.ok(trace.domains.length === 7, 'Traceability must have all 7 domains');
  assert.ok(trace.gate_decision_id, 'Traceability must have gate_decision_id');
  assert.ok(trace.final_gate_state, 'Traceability must have final_gate_state');
});

// -----------------------------------------------------------------------------
// GATE-09: Versioning presente
// -----------------------------------------------------------------------------
runTest('GATE-09', 'Versionado explícito multidimensional presente en cada decisión.', () => {
  const gateExec = gate.executeCastleGate({
    target_system: { name: 'Versioning App', environment: 'staging' },
    auditor: { name: 'Auditor', role: 'QA' },
    gate_level: 'C2',
    raw_evidence: {}
  });

  const v = gateExec.gate_decision.versioning;
  assert.ok(v.cqs_specification_version, 'Must contain cqs_specification_version');
  assert.ok(v.cqs_engine_version, 'Must contain cqs_engine_version');
  assert.ok(v.gate_version, 'Must contain gate_version');
  assert.ok(v.gate_policy_version, 'Must contain gate_policy_version');
  assert.ok(v.evaluation_id, 'Must contain evaluation_id');
  assert.ok(v.evidence_package_id, 'Must contain evidence_package_id');
});

// -----------------------------------------------------------------------------
// GATE-10: Audit Trail presente
// -----------------------------------------------------------------------------
runTest('GATE-10', 'Audit trail inmutable estructurado generado para cada ejecución.', () => {
  const gateExec = gate.executeCastleGate({
    target_system: { name: 'Audit Trail App', environment: 'staging' },
    auditor: { name: 'Compliance Auditor', role: 'Auditor' },
    gate_level: 'C1',
    raw_evidence: { 'SEC-01.1': { status: 'PASS' } }
  });

  const audit = gateExec.audit_record;
  assert.ok(audit.audit_record_id, 'Audit record must have unique audit_record_id');
  assert.ok(audit.recorded_at, 'Audit record must have timestamp');
  assert.ok(audit.governance_metadata, 'Audit record must have governance metadata');
  assert.ok(audit.gate_decision_summary, 'Audit record must have decision summary');
});

// -----------------------------------------------------------------------------
// GATE-11: Remediation conserva historial
// -----------------------------------------------------------------------------
runTest('GATE-11', 'Remediation Session conserva historial append-only inmutable a través de ciclos.', () => {
  const session = gate.createRemediationSession('SESS-TEST-001', { name: 'Remediation Target' }, 'C3');

  // Cycle 1: Evaluation with failure
  const cqsRes1 = {
    evaluation_id: 'EVAL-001',
    summary: { cqs_display_score: 65.0 }
  };
  const decision1 = {
    gate_state: 'REQUIRES_REMEDIATION',
    blockers: [{ type: 'SCORE_DEFICIT', details: 'Score below standard' }]
  };
  session.recordCycle({
    cqs_evaluation_result: cqsRes1,
    gate_decision: decision1,
    remediation_notes: 'Cycle 1: Identified security headers deficiency.'
  });

  // Cycle 2: Re-evaluation after fix
  const cqsRes2 = {
    evaluation_id: 'EVAL-002',
    summary: { cqs_display_score: 92.0 }
  };
  const decision2 = {
    gate_state: 'PASSED',
    blockers: []
  };
  session.recordCycle({
    cqs_evaluation_result: cqsRes2,
    gate_decision: decision2,
    remediation_notes: 'Cycle 2: Deployed CSP and HSTS headers. Verified compliant.',
    resolved_blockers: ['SCORE_DEFICIT']
  });

  const history = session.getHistory();
  assert.strictEqual(history.total_cycles, 2, 'Must record exactly 2 cycles');
  assert.strictEqual(history.cycles[0].cycle_number, 1);
  assert.strictEqual(history.cycles[0].gate_state, 'REQUIRES_REMEDIATION');
  assert.strictEqual(history.cycles[1].cycle_number, 2);
  assert.strictEqual(history.cycles[1].gate_state, 'PASSED');
  assert.strictEqual(history.is_closed, true);
});

// -----------------------------------------------------------------------------
// GATE-12: UNSPECIFIED no genera reglas automáticas
// -----------------------------------------------------------------------------
runTest('GATE-12', 'Valores UNSPECIFIED en políticas no generan reglas ni penalizaciones automáticas arbitrarias.', () => {
  const defaultC1 = gate.resolveGatePolicy('C1');
  assert.strictEqual(defaultC1.rules.minimum_cqs_score, 'UNSPECIFIED');

  // When minimum_cqs_score is UNSPECIFIED, the gate does not fail an evaluation on arbitrary score
  const cqsRes = {
    specification_version: '1.1.0',
    evaluation_id: 'EVAL-MOCK-001',
    summary: {
      cqs_raw_score: 88.5,
      cqs_display_score: 88.5,
      final_verdict: 'PASS_RELEASE',
      has_unexecuted_components: false
    },
    domains: [],
    gate_breakers: { status: 'CLEARED', evaluated_gates: [] },
    governance: { methodology_status: 'FROZEN' }
  };

  const decision = gate.evaluateGateDecision({
    cqs_evaluation_result: cqsRes,
    gate_level: 'C1'
  });

  assert.strictEqual(decision.gate_state, 'PASSED');
  assert.strictEqual(decision.blockers.length, 0);
});

// -----------------------------------------------------------------------------
// GATE-13: CQS permanece inmutable
// -----------------------------------------------------------------------------
runTest('GATE-13', 'El directorio cqs/ permanece 100% inmutable y con integridad PASS.', () => {
  const integrity = cqs.validateCqsIntegrity();
  assert.strictEqual(integrity.integrity, 'PASS', 'CQS internal integrity must remain PASS');
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
console.log(`GATE TEST SUITE SUMMARY: ${passedCount}/${results.length} PASSED (${failedCount} FAILED)`);
console.log('================================================================\n');

if (failedCount > 0) {
  process.exit(1);
}
