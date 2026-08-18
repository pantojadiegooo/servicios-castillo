/**
 * Castle Security & Quality Gate — Operational Tooling Test Suite (Phase 6)
 * 
 * Executes OPS-12 through OPS-30 covering CLI, Release Authorizer,
 * Remediation Store, Evidence Adapters, and Determinism.
 */

'use strict';

const assert = require('assert');
const path = require('path');
const fs = require('fs');

const gate = require('../castle-gate');
const cqs = require('../cqs');
const { runCli } = require('../castle-gate/cli/bin');

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
console.log('Castle Gate (Phase 6) — Core Operational Tooling Tests');
console.log('================================================================\n');

const scratchDir = path.join(__dirname, '..', '.test-scratch-ops');
if (!fs.existsSync(scratchDir)) {
  fs.mkdirSync(scratchDir, { recursive: true });
}

// Generate test evidence files
const passEvidenceFile = path.join(scratchDir, 'pass-evidence.json');
const fullPassEvidence = {};
for (const c of cqs.loadNormativeAssets().controls) {
  fullPassEvidence[c.control_id] = { status: 'PASS' };
}
fs.writeFileSync(passEvidenceFile, JSON.stringify(fullPassEvidence, null, 2), 'utf8');

const deficitEvidenceFile = path.join(scratchDir, 'deficit-evidence.json');
const deficitEvidence = { 'PER-01.1': { status: 'PASS' } };
fs.writeFileSync(deficitEvidenceFile, JSON.stringify(deficitEvidence, null, 2), 'utf8');

const breakerEvidenceFile = path.join(scratchDir, 'breaker-evidence.json');
fs.writeFileSync(breakerEvidenceFile, JSON.stringify({
  'GB-01': true,
  'GB-01_details': 'Plaintext HTTP accepted on login endpoint'
}, null, 2), 'utf8');

// -----------------------------------------------------------------------------
// OPS-12: CLI PASS returns exit code 0
// -----------------------------------------------------------------------------
runTest('OPS-12', 'CLI evaluate retorna Exit Code 0 ante una evaluación PASSED.', () => {
  const exitCode = runCli([
    'evaluate',
    '--level', 'C1',
    '--evidence', passEvidenceFile,
    '--output-dir', path.join(scratchDir, 'out-c1')
  ]);
  assert.strictEqual(exitCode, 0);
});

// -----------------------------------------------------------------------------
// OPS-13: CLI BLOCK returns exit code 1
// -----------------------------------------------------------------------------
runTest('OPS-13', 'CLI evaluate retorna Exit Code 1 ante un Gate Breaker activo (BLOCKED).', () => {
  const exitCode = runCli([
    'evaluate',
    '--level', 'C1',
    '--evidence', passEvidenceFile,
    '--gate-evidence', breakerEvidenceFile
  ]);
  assert.strictEqual(exitCode, 1);
});

// -----------------------------------------------------------------------------
// OPS-14: CLI PENDING / REMEDIATION returns exit code 2
// -----------------------------------------------------------------------------
runTest('OPS-14', 'CLI evaluate retorna Exit Code 2 ante déficit de score o evidencia pendiente.', () => {
  const exitCode = runCli([
    'evaluate',
    '--level', 'C4',
    '--evidence', deficitEvidenceFile
  ]);
  assert.strictEqual(exitCode, 2);
});

// -----------------------------------------------------------------------------
// OPS-15: Invalid level rejection
// -----------------------------------------------------------------------------
runTest('OPS-15', 'CLI evaluate rechaza niveles inválidos con Exit Code 3.', () => {
  const exitCode = runCli([
    'evaluate',
    '--level', 'C99',
    '--evidence', passEvidenceFile
  ]);
  assert.strictEqual(exitCode, 3);
});

// -----------------------------------------------------------------------------
// OPS-16: Malformed evidence rejection
// -----------------------------------------------------------------------------
runTest('OPS-16', 'CLI evaluate rechaza archivos de evidencia inexistentes o malformados con Exit Code 3.', () => {
  const exitCode = runCli([
    'evaluate',
    '--level', 'C1',
    '--evidence', path.join(scratchDir, 'non-existent.json')
  ]);
  assert.strictEqual(exitCode, 3);
});

// -----------------------------------------------------------------------------
// OPS-17: Release certificate generated on PASS
// -----------------------------------------------------------------------------
runTest('OPS-17', 'Release Authorizer emite un release-certificate.json válido únicamente ante estado PASSED.', () => {
  const exec = gate.executeCastleGate({
    target_system: { name: 'Cert Test App', environment: 'production' },
    gate_level: 'C2',
    raw_evidence: fullPassEvidence,
    commit_sha: 'testcommit123'
  });

  assert.ok(exec.release_certificate);
  assert.strictEqual(exec.release_certificate.authorization_status, 'AUTHORIZED_FOR_RELEASE');
  assert.strictEqual(exec.release_certificate.governance.gate_level, 'C2');
  assert.strictEqual(exec.release_certificate.target_system.commit_sha, 'testcommit123');

  const verify = gate.verifyReleaseCertificate(exec.release_certificate);
  assert.strictEqual(verify.valid, true);
});

// -----------------------------------------------------------------------------
// OPS-18: Blocked release forbids certificate generation
// -----------------------------------------------------------------------------
runTest('OPS-18', 'Una evaluación BLOCKED o con remediación pendiente jamás genera certificado de release.', () => {
  const exec = gate.executeCastleGate({
    target_system: { name: 'Blocked Target' },
    gate_level: 'C1',
    raw_evidence: fullPassEvidence,
    gate_evidence: { 'GB-01': true, 'GB-01_details': 'Veto active' }
  });

  assert.strictEqual(exec.gate_decision.gate_state, 'BLOCKED');
  assert.strictEqual(exec.release_certificate, null);

  assert.throws(() => {
    gate.generateReleaseCertificate({
      gate_decision: exec.gate_decision,
      cqs_evaluation_result: exec.cqs_result
    });
  }, /Release Forbidden/);
});

// -----------------------------------------------------------------------------
// OPS-19: Remediation store persistence
// -----------------------------------------------------------------------------
runTest('OPS-19', 'RemediationStore persiste sesiones en disco y las recarga íntegramente tras reinicio.', () => {
  const storeDir = path.join(scratchDir, 'remediation-store');
  const store = new gate.RemediationStore(storeDir);

  const session = gate.createRemediationSession('SESS-PERSIST-01', { name: 'Persist App' }, 'C3');
  session.recordCycle({
    cqs_evaluation_result: { evaluation_id: 'EVAL-1', summary: { cqs_display_score: 70.0 } },
    gate_decision: { gate_state: 'REQUIRES_REMEDIATION', blockers: [{ type: 'SCORE_DEFICIT' }] },
    remediation_notes: 'Initial cycle notes.'
  });

  const savedPath = store.saveSession(session);
  assert.ok(fs.existsSync(savedPath));

  const reloaded = store.loadSession('SESS-PERSIST-01');
  assert.ok(reloaded);
  assert.strictEqual(reloaded.session_id, 'SESS-PERSIST-01');
  assert.strictEqual(reloaded.getHistory().total_cycles, 1);
  assert.strictEqual(reloaded.getHistory().cycles[0].cqs_score, 70.0);
});

// -----------------------------------------------------------------------------
// OPS-20: Remediation expiration check
// -----------------------------------------------------------------------------
runTest('OPS-20', 'RemediationStore detecta exactamente la expiración del plazo SLA de remediación.', () => {
  const store = new gate.RemediationStore(path.join(scratchDir, 'remediation-store'));
  const session = gate.createRemediationSession('SESS-EXP-01', { name: 'Exp App' }, 'C4');
  
  // Set creation date to 3 days ago
  session.created_at = new Date(Date.now() - (72 * 60 * 60 * 1000)).toISOString();
  
  // C4 window is 48 hours -> 72h elapsed must be expired
  const expCheck = store.checkExpiration(session, 48);
  assert.strictEqual(expCheck.expired, true);
  assert.strictEqual(expCheck.remaining_hours, 0);

  // But for a 168h window -> still active
  const activeCheck = store.checkExpiration(session, 168);
  assert.strictEqual(activeCheck.expired, false);
  assert.ok(activeCheck.remaining_hours > 90);
});

// -----------------------------------------------------------------------------
// OPS-21: Append-only remediation history
// -----------------------------------------------------------------------------
runTest('OPS-21', 'RemediationSession conserva todos los ciclos históricos sin sobreescritura.', () => {
  const session = gate.createRemediationSession('SESS-MULTI-01', { name: 'Multi App' }, 'C2');
  
  session.recordCycle({
    cqs_evaluation_result: { evaluation_id: 'EVAL-C1', summary: { cqs_display_score: 60.0 } },
    gate_decision: { gate_state: 'REQUIRES_REMEDIATION', blockers: [{ type: 'DEFICIT' }] }
  });
  session.recordCycle({
    cqs_evaluation_result: { evaluation_id: 'EVAL-C2', summary: { cqs_display_score: 75.0 } },
    gate_decision: { gate_state: 'REQUIRES_REMEDIATION', blockers: [{ type: 'DEFICIT' }] }
  });
  session.recordCycle({
    cqs_evaluation_result: { evaluation_id: 'EVAL-C3', summary: { cqs_display_score: 90.0 } },
    gate_decision: { gate_state: 'PASSED', blockers: [] }
  });

  const history = session.getHistory();
  assert.strictEqual(history.total_cycles, 3);
  assert.strictEqual(history.is_closed, true);
  assert.strictEqual(history.cycles[0].cycle_number, 1);
  assert.strictEqual(history.cycles[1].cycle_number, 2);
  assert.strictEqual(history.cycles[2].cycle_number, 3);
});

// -----------------------------------------------------------------------------
// OPS-22: Audit trail persistence
// -----------------------------------------------------------------------------
runTest('OPS-22', 'Audit trail export produce un archivo JSON inmutable en disco.', () => {
  const outDir = path.join(scratchDir, 'audit-export');
  const exec = gate.executeCastleGate({
    target_system: { name: 'Audit Persistence' },
    gate_level: 'C1',
    raw_evidence: fullPassEvidence,
    output_dir: outDir
  });

  const files = fs.readdirSync(outDir).filter(f => f.startsWith('AUD-GATE-'));
  assert.ok(files.length > 0);
  const auditContent = JSON.parse(fs.readFileSync(path.join(outDir, files[0]), 'utf8'));
  assert.strictEqual(auditContent.target_system.name, 'Audit Persistence');
  assert.ok(auditContent.full_traceability_chain);
});

// -----------------------------------------------------------------------------
// OPS-23: CI exit code compatibility
// -----------------------------------------------------------------------------
runTest('OPS-23', 'Los códigos de salida (0=PASS, 1=BLOCK, 2=REMEDIATION, 3=ERROR) son deterministas.', () => {
  const p1 = gate.executeCastleGate({ gate_level: 'C1', raw_evidence: fullPassEvidence });
  assert.strictEqual(p1.exit_code, 0);

  const p2 = gate.executeCastleGate({ gate_level: 'C1', raw_evidence: fullPassEvidence, gate_evidence: { 'GB-01': true } });
  assert.strictEqual(p2.exit_code, 1);

  const p3 = gate.executeCastleGate({ gate_level: 'C5', raw_evidence: deficitEvidence });
  assert.strictEqual(p3.exit_code, 2);
});

// -----------------------------------------------------------------------------
// OPS-24: CQS immutability
// -----------------------------------------------------------------------------
runTest('OPS-24', 'CQS v1.1 mantiene integridad perfecta (65 controles, 7 dominios, 100.00 nominal weight).', () => {
  const integrity = cqs.validateCqsIntegrity();
  assert.strictEqual(integrity.integrity, 'PASS');
  assert.strictEqual(integrity.metrics.total_controls, 65);
  assert.strictEqual(integrity.metrics.total_domains, 7);
  assert.ok(Math.abs(integrity.metrics.nominal_weight_total - 100.0) < 1e-6);
});

// -----------------------------------------------------------------------------
// OPS-25: Deterministic repeated execution
// -----------------------------------------------------------------------------
runTest('OPS-25', 'Ejecuciones repetidas del CLI producen resultados de score y decisión idénticos.', () => {
  const exec1 = gate.executeCastleGate({ gate_level: 'C2', raw_evidence: fullPassEvidence });
  const exec2 = gate.executeCastleGate({ gate_level: 'C2', raw_evidence: fullPassEvidence });
  assert.strictEqual(exec1.cqs_result.summary.cqs_raw_score, exec2.cqs_result.summary.cqs_raw_score);
  assert.strictEqual(exec1.gate_decision.gate_state, exec2.gate_decision.gate_state);
});

// -----------------------------------------------------------------------------
// OPS-26: Policy version integrity
// -----------------------------------------------------------------------------
runTest('OPS-26', 'La versión de política ratificada 1.0.0-ratified se propaga en el certificado de release.', () => {
  const exec = gate.executeCastleGate({ gate_level: 'C3', raw_evidence: fullPassEvidence });
  assert.strictEqual(exec.release_certificate.governance.gate_policy_version, '1.0.0-ratified');
});

// -----------------------------------------------------------------------------
// OPS-27: Evidence hash integrity
// -----------------------------------------------------------------------------
runTest('OPS-27', 'El hash SHA-256 del Evidence Package coincide en el Audit Record y en el Release Certificate.', () => {
  const exec = gate.executeCastleGate({ gate_level: 'C1', raw_evidence: fullPassEvidence });
  const evpHash = exec.evidence_package.provenance.payload_sha256;
  assert.strictEqual(exec.audit_record.evidence_provenance.payload_sha256, evpHash);
  assert.strictEqual(exec.release_certificate.evaluation_reference.evidence_package_hash, evpHash);
});

// -----------------------------------------------------------------------------
// OPS-28: Gate Breaker veto preserved
// -----------------------------------------------------------------------------
runTest('OPS-28', 'Gate Breaker GB-01 a GB-05 anulan incondicionalmente cualquier autorización.', () => {
  for (const gb of ['GB-01', 'GB-02', 'GB-03', 'GB-04', 'GB-05']) {
    const gateEv = {};
    gateEv[gb] = true;
    const exec = gate.executeCastleGate({
      gate_level: 'C1',
      raw_evidence: fullPassEvidence,
      gate_evidence: gateEv
    });
    assert.strictEqual(exec.gate_decision.gate_state, 'BLOCKED');
    assert.strictEqual(exec.release_certificate, null);
    assert.strictEqual(exec.exit_code, 1);
  }
});

// -----------------------------------------------------------------------------
// OPS-29: Lighthouse Adapter integration test
// -----------------------------------------------------------------------------
runTest('OPS-29', 'LighthouseAdapter ingesta JSON de Lighthouse y extrae controles CQS con provenance.', () => {
  const adapter = new gate.LighthouseAdapter();
  const mockLighthouse = {
    audits: {
      'largest-contentful-paint': { numericValue: 1800 },
      'cumulative-layout-shift': { numericValue: 0.04 },
      'total-blocking-time': { numericValue: 80 },
      'is-on-https': { score: 1 },
      'heading-order': { score: 1 },
      'color-contrast': { score: 1 },
      'viewport': { score: 1 },
      'tap-targets': { score: 1 }
    }
  };

  const parsed = adapter.parse(mockLighthouse);
  assert.strictEqual(parsed.source_tool, 'Google Lighthouse');
  assert.ok(parsed.raw_payload_sha256);
  assert.strictEqual(parsed.controls['PER-01.1'].status, 'PASS');
  assert.strictEqual(parsed.controls['PER-03.1'].status, 'PASS');
  assert.strictEqual(parsed.controls['SEC-01.2'].status, 'PASS');
});

// -----------------------------------------------------------------------------
// OPS-30: No scoring duplication or methodology mutation
// -----------------------------------------------------------------------------
runTest('OPS-30', 'El Gate no duplica fórmulas de scoring y mantiene cqs/ como caja negra inmutable.', () => {
  const cqsAssets = cqs.loadNormativeAssets();
  assert.strictEqual(cqsAssets.invariants.invariants.test_04_status, 'Pending / UNEXECUTED');
  const omd = cqsAssets.invariants.open_methodological_decisions.find(d => d.id === 'OMD-01-PARTIAL-STATUS');
  assert.strictEqual(omd.status, 'OPEN_METHODOLOGICAL_DECISION');
});

console.log('\n================================================================');
const passedCount = results.filter(r => r.status === 'PASS').length;
const failedCount = results.filter(r => r.status === 'FAIL').length;
console.log(`CORE OPERATIONAL TOOLING TEST SUMMARY: ${passedCount}/${results.length} PASSED (${failedCount} FAILED)`);
console.log('================================================================\n');

// Cleanup scratch directory
try {
  fs.rmSync(scratchDir, { recursive: true, force: true });
} catch (e) {}

if (failedCount > 0) {
  process.exit(1);
}
