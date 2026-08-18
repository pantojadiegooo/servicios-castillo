/**
 * Castle Security & Quality Gate — Operationalization Readiness Audit Test Suite (Phase 5)
 * 
 * Performs structural and contractual audit tests over the implemented
 * Gate components, interface contracts, and readiness matrix.
 */

'use strict';

const assert = require('assert');
const path = require('path');
const fs = require('fs');

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
console.log('Castle Gate (Phase 5) — Operationalization Readiness Audit Tests');
console.log('================================================================\n');

// -----------------------------------------------------------------------------
// OPS-01: Operationalization matrix exists and is well-formed
// -----------------------------------------------------------------------------
runTest('OPS-01', 'La matriz de operacionalización existe y contiene componentes con estados válidos.', () => {
  const matrixPath = path.join(__dirname, '..', 'CASTLE-GATE-OPERATIONALIZATION-MATRIX.json');
  assert.ok(fs.existsSync(matrixPath), 'Matrix file must exist');
  const matrix = JSON.parse(fs.readFileSync(matrixPath, 'utf8'));
  assert.strictEqual(matrix.audit_type, 'OPERATIONALIZATION_READINESS_AUDIT');
  assert.ok(Array.isArray(matrix.components));
  assert.ok(matrix.components.length >= 8);

  const allowedStatuses = ['IMPLEMENTED', 'PARTIALLY_IMPLEMENTED', 'SPECIFICATION_ONLY', 'TEST_ONLY', 'MISSING'];
  for (const c of matrix.components) {
    assert.ok(allowedStatuses.includes(c.status), `Invalid status "${c.status}" in component "${c.component}"`);
    assert.ok(c.component, 'Component name required');
    assert.ok(c.current_capability, 'Current capability required');
  }
});

// -----------------------------------------------------------------------------
// OPS-02: CQS Engine integration interface contract
// -----------------------------------------------------------------------------
runTest('OPS-02', 'CQS Engine expone la interfaz de evaluación requerida (evaluateCqs, validateCqsIntegrity, loadNormativeAssets).', () => {
  assert.strictEqual(typeof cqs.evaluateCqs, 'function');
  assert.strictEqual(typeof cqs.validateCqsIntegrity, 'function');
  assert.strictEqual(typeof cqs.loadNormativeAssets, 'function');

  const evalRes = cqs.evaluateCqs({
    target_system: { name: 'Audit Target', environment: 'staging' },
    evidence: { controls: { 'PER-01.1': { status: 'PASS' } } }
  });

  assert.ok(evalRes.evaluation_id);
  assert.strictEqual(typeof evalRes.summary.cqs_raw_score, 'number');
  assert.strictEqual(typeof evalRes.summary.cqs_display_score, 'number');
  assert.ok(evalRes.summary.final_verdict);
  assert.ok(evalRes.gate_breakers);
  assert.ok(Array.isArray(evalRes.domains));
});

// -----------------------------------------------------------------------------
// OPS-03: Evidence Package Manager interface contract
// -----------------------------------------------------------------------------
runTest('OPS-03', 'Evidence Package Manager genera paquetes estructurados con SHA-256 y provenance.', () => {
  const pkg = gate.createEvidencePackage({
    project_id: 'PRJ-OPS-TEST',
    environment: 'production',
    raw_evidence: { 'SEC-01.1': { status: 'PASS' } },
    collected_by: 'automated_ci'
  });

  assert.ok(pkg.package_id.startsWith('EVP-'));
  assert.ok(pkg.provenance.payload_sha256);
  assert.strictEqual(pkg.provenance.payload_sha256.length, 64);
  assert.strictEqual(pkg.provenance.project_id, 'PRJ-OPS-TEST');
  assert.strictEqual(pkg.provenance.collected_by, 'automated_ci');
  assert.ok(pkg.snapshots.length > 0);
});

// -----------------------------------------------------------------------------
// OPS-04: Ratified Policy Matrix exists and is active (1.0.0-ratified)
// -----------------------------------------------------------------------------
runTest('OPS-04', 'La matriz ratificada de políticas existe, está activa y pasa validación.', () => {
  const ratifiedPath = path.join(__dirname, '..', 'castle-gate', 'policy', 'CASTLE-GATE-POLICY-MATRIX-RATIFIED.json');
  assert.ok(fs.existsSync(ratifiedPath));
  const ratified = JSON.parse(fs.readFileSync(ratifiedPath, 'utf8'));
  assert.strictEqual(ratified.governance_status, 'RATIFIED_POLICY');
  assert.strictEqual(ratified.version, '1.0.0-ratified');

  for (const lvl of ['C1', 'C2', 'C3', 'C4', 'C5', 'C6']) {
    const val = gate.validateGatePolicy(ratified.policies[lvl]);
    assert.strictEqual(val.valid, true);
    assert.strictEqual(val.status, 'FULLY_RATIFIED');
  }
});

// -----------------------------------------------------------------------------
// OPS-05: Gate Decision Engine interface contract
// -----------------------------------------------------------------------------
runTest('OPS-05', 'Gate Decision Engine emite estados deterministas y estructuras de decisión completas.', () => {
  const cqsEval = cqs.evaluateCqs({
    target_system: { name: 'Contract Test' },
    evidence: { controls: { 'SEC-01.1': { status: 'PASS' } } }
  });

  const decision = gate.evaluateGateDecision({
    cqs_evaluation_result: cqsEval,
    gate_level: 'C1'
  });

  assert.ok(decision.decision_id);
  assert.ok(decision.timestamp);
  assert.strictEqual(decision.gate_level, 'C1');
  assert.ok(decision.gate_state);
  assert.ok(Array.isArray(decision.blockers));
  assert.ok(Array.isArray(decision.required_actions));
  assert.ok(decision.versioning);
  assert.ok(decision.cqs_summary);
  assert.ok(decision.traceability_chain);
});

// -----------------------------------------------------------------------------
// OPS-06: Gate Audit Trail Generator interface contract
// -----------------------------------------------------------------------------
runTest('OPS-06', 'Gate Audit Trail Generator produce registros inmutables con cadena completa de trazabilidad.', () => {
  const cqsEval = cqs.evaluateCqs({
    target_system: { name: 'Audit Contract' },
    evidence: { controls: {} }
  });
  const decision = gate.evaluateGateDecision({
    cqs_evaluation_result: cqsEval,
    gate_level: 'C1'
  });
  const audit = gate.createGateAuditRecord({
    gate_decision: decision,
    cqs_evaluation_result: cqsEval
  });

  assert.ok(audit.audit_record_id.startsWith('AUD-GATE-'));
  assert.ok(audit.recorded_at);
  assert.ok(audit.governance_metadata);
  assert.ok(audit.full_traceability_chain);
  assert.strictEqual(audit.full_traceability_chain.final_gate_state, decision.gate_state);
});

// -----------------------------------------------------------------------------
// OPS-07: Remediation Tracker interface contract
// -----------------------------------------------------------------------------
runTest('OPS-07', 'Remediation Tracker gestiona ciclos multi-etapa y preserva historial append-only.', () => {
  const session = gate.createRemediationSession('SESS-OPS-01', { name: 'Target App' }, 'C2');
  assert.strictEqual(session.session_id, 'SESS-OPS-01');
  assert.strictEqual(session.getHistory().total_cycles, 0);

  const cqsEval = {
    specification_version: '1.1.0',
    evaluation_id: 'EVAL-01',
    summary: { cqs_display_score: 72.0, final_verdict: 'FAIL_REMEDIATION' }
  };
  const decision = { gate_state: 'REQUIRES_REMEDIATION', blockers: [{ code: 'SCORE_DEFICIT' }] };

  session.recordCycle({
    cqs_evaluation_result: cqsEval,
    gate_decision: decision,
    remediation_notes: 'Initial cycle'
  });

  assert.strictEqual(session.getHistory().total_cycles, 1);
  assert.strictEqual(session.getHistory().cycles[0].cycle_number, 1);
});

// -----------------------------------------------------------------------------
// OPS-08: Full End-to-End Pipeline Determinism Replay
// -----------------------------------------------------------------------------
runTest('OPS-08', 'La ejecución completa executeCastleGate es determinista en score, veredicto y blockers.', () => {
  const input = {
    target_system: { name: 'E2E App', environment: 'production' },
    auditor: { name: 'CI/CD Pipeline', organization: 'Grupo Castillo' },
    gate_level: 'C2',
    raw_evidence: {
      'SEC-01.1': { status: 'PASS' },
      'SEC-01.2': { status: 'PASS' },
      'PER-01.1': { status: 'PASS' }
    }
  };

  const run1 = gate.executeCastleGate(input);
  const run2 = gate.executeCastleGate(input);

  assert.strictEqual(run1.cqs_result.summary.cqs_raw_score, run2.cqs_result.summary.cqs_raw_score);
  assert.strictEqual(run1.cqs_result.summary.final_verdict, run2.cqs_result.summary.final_verdict);
  assert.strictEqual(run1.gate_decision.gate_state, run2.gate_decision.gate_state);
  assert.strictEqual(run1.gate_decision.blockers.length, run2.gate_decision.blockers.length);
});

// -----------------------------------------------------------------------------
// OPS-09: Gate Breakers veto release unconditionally
// -----------------------------------------------------------------------------
runTest('OPS-09', 'Gate Breaker produce estado BLOCKED y bloquea la entrega incondicionalmente.', () => {
  const rawEvidence = {};
  for (const c of cqs.loadNormativeAssets().controls) {
    rawEvidence[c.control_id] = { status: 'PASS' };
  }

  const result = gate.executeCastleGate({
    target_system: { name: 'Breaker Test' },
    gate_level: 'C1',
    raw_evidence: rawEvidence,
    gate_evidence: {
      'GB-01': true,
      'GB-01_details': 'Cleartext HTTP detected on login route'
    }
  });

  assert.strictEqual(result.gate_decision.gate_state, 'BLOCKED');
  assert.ok(result.gate_decision.blockers.some(b => b.code === 'GB-01'));
});

// -----------------------------------------------------------------------------
// OPS-10: CQS v1.1 immutability verified (65 controls, 7 domains, 100.00 nominal weight)
// -----------------------------------------------------------------------------
runTest('OPS-10', 'CQS v1.1 mantiene integridad formal inmutable (65 controles, 100.00 nominal weight).', () => {
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
// OPS-11: TEST 04 and PARTIAL maintain frozen governance state
// -----------------------------------------------------------------------------
runTest('OPS-11', 'TEST 04 permanece Pending / UNEXECUTED y PARTIAL como OPEN METHODOLOGICAL DECISION.', () => {
  const cqsAssets = cqs.loadNormativeAssets();
  assert.strictEqual(cqsAssets.invariants.invariants.test_04_status, 'Pending / UNEXECUTED');
  const omd = cqsAssets.invariants.open_methodological_decisions.find(d => d.id === 'OMD-01-PARTIAL-STATUS');
  assert.ok(omd);
  assert.strictEqual(omd.status, 'OPEN_METHODOLOGICAL_DECISION');
  assert.strictEqual(omd.active_in_engine, false);
});

console.log('\n================================================================');
const passedCount = results.filter(r => r.status === 'PASS').length;
const failedCount = results.filter(r => r.status === 'FAIL').length;
console.log(`OPERATIONAL READINESS TEST SUITE SUMMARY: ${passedCount}/${results.length} PASSED (${failedCount} FAILED)`);
console.log('================================================================\n');

if (failedCount > 0) {
  process.exit(1);
}
