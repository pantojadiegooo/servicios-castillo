/**
 * Castle Security & Quality Gate — Determinism Verification Suite (100 Runs)
 * 
 * Verifies strict mathematical & cryptographic determinism:
 * Same Repository * Same Commit * Same Policy * Same CQS * Same Engine = Identical Decision & Hashes.
 * Includes native AST, DOM semantics, SCA dependency auditing, and external adapters.
 */

'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const gate = require('../castle-gate/index');
const { canonicalize, canonicalHash } = require('../castle-gate/crypto/canonicalizer');
const { NpmAuditAdapter } = require('../castle-gate/evidence/adapters/npm-audit-adapter');
const { LighthouseAdapter } = require('../castle-gate/evidence/adapters/lighthouse-adapter');
const { AxeAdapter } = require('../castle-gate/evidence/adapters/axe-adapter');

const testDir = path.join(__dirname, '..', '.test-scratch-determinism');
if (fs.existsSync(testDir)) {
  fs.rmSync(testDir, { recursive: true, force: true });
}
fs.mkdirSync(testDir, { recursive: true });

console.log('================================================================');
console.log('Castle Gate — Determinism Verification Suite (100 Iterations)');
console.log('================================================================\n');

// Create deterministic fixture project
fs.writeFileSync(path.join(testDir, 'package.json'), JSON.stringify({
  name: 'deterministic-app',
  version: '1.0.0',
  dependencies: { 'acorn': '^8.18.0' }
}, null, 2), 'utf8');

fs.writeFileSync(path.join(testDir, 'package-lock.json'), JSON.stringify({
  name: 'deterministic-app',
  version: '1.0.0',
  lockfileVersion: 2,
  packages: { '': { name: 'deterministic-app', version: '1.0.0' } }
}, null, 2), 'utf8');

fs.writeFileSync(path.join(testDir, 'index.html'), `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Deterministic Test Application</title>
  <meta name="description" content="A fully deterministic web application for Castle Gate verification.">
</head>
<body>
  <header><nav><a href="/">Home</a></nav></header>
  <main>
    <h1>Deterministic Quality Assurance</h1>
    <p>Ensuring verifiable release integrity.</p>
    <img src="/logo.png" alt="Company Logo" width="200" height="50">
  </main>
  <footer><p>&copy; 2026 Grupo Castillo</p></footer>
</body>
</html>
`, 'utf8');

fs.writeFileSync(path.join(testDir, 'app.js'), `
export function processOrder(orderId, amount) {
  if (amount <= 0) {
    throw new Error('Invalid order amount');
  }
  return { orderId, amount, status: 'PROCESSED' };
}
`, 'utf8');

// External sensor payloads
const mockAuditJson = JSON.stringify({ auditReportVersion: 2, vulnerabilities: {} });
const mockLighthouseJson = JSON.stringify({
  audits: {
    'largest-contentful-paint': { numericValue: 1200 },
    'cumulative-layout-shift': { numericValue: 0.02 },
    'total-blocking-time': { numericValue: 50 },
    'modern-image-formats': { score: 1 },
    'uses-text-compression': { score: 1 }
  }
});
const mockAxeJson = JSON.stringify({ violations: [], passes: [{ id: 'color-contrast' }] });

const npmAdapter = new NpmAuditAdapter();
const lhAdapter = new LighthouseAdapter();
const axeAdapter = new AxeAdapter();

const npmParsed = npmAdapter.parse(mockAuditJson);
const lhParsed = lhAdapter.parse(mockLighthouseJson);
const axeParsed = axeAdapter.parse(mockAxeJson);

const combinedExternalControls = {
  ...npmParsed.controls,
  ...lhParsed.controls,
  ...axeParsed.controls
};

console.log('Running 100 consecutive full scan and gate evaluations...');

let baselineResult = null;
let baselineCanonicalSha = null;
let baselineScore = null;
let baselineDecision = null;
let baselineSarifSha = null;
let baselineSbomSha = null;

const TOTAL_RUNS = 100;

for (let i = 1; i <= TOTAL_RUNS; i++) {
  // 1. Run Native Probes Scan
  const scanResult = gate.runNativeScan(testDir);

  // Merge native and external evidence
  const mergedControls = {
    ...scanResult.raw_evidence,
    ...combinedExternalControls
  };

  // 2. Execute Castle Gate Pipeline (Level C2)
  const execution = gate.executeCastleGate({
    target_system: { name: 'deterministic-app', environment: 'production', source_dir: testDir },
    gate_level: 'C2',
    raw_evidence: mergedControls,
    gate_evidence: scanResult.gate_evidence,
    commit_sha: 'a1b2c3d4e5f60718293a4b5c6d7e8f9012345678'
  });

  const currentCanonicalSha = canonicalHash({ controls: execution.evidence_package.evidence, gate_evidence: execution.evidence_package.gate_evidence });
  const currentScore = execution.cqs_result.summary.cqs_raw_score;
  const currentDecision = execution.gate_decision.gate_state;
  const currentSarifSha = canonicalHash(execution.sarif);
  const currentSbomSha = canonicalHash(execution.sbom);

  if (i === 1) {
    baselineResult = execution;
    baselineCanonicalSha = currentCanonicalSha;
    baselineScore = currentScore;
    baselineDecision = currentDecision;
    baselineSarifSha = currentSarifSha;
    baselineSbomSha = currentSbomSha;
  } else {
    assert.strictEqual(
      currentCanonicalSha,
      baselineCanonicalSha,
      `Determinism failed at run #${i}: Canonical Evidence SHA mismatch`
    );
    assert.strictEqual(
      currentScore,
      baselineScore,
      `Determinism failed at run #${i}: CQS Raw Score mismatch (${currentScore} !== ${baselineScore})`
    );
    assert.strictEqual(
      currentDecision,
      baselineDecision,
      `Determinism failed at run #${i}: Gate Decision mismatch (${currentDecision} !== ${baselineDecision})`
    );
    assert.strictEqual(
      currentSarifSha,
      baselineSarifSha,
      `Determinism failed at run #${i}: SARIF Hash mismatch`
    );
    assert.strictEqual(
      currentSbomSha,
      baselineSbomSha,
      `Determinism failed at run #${i}: SBOM Hash mismatch`
    );
  }
}

console.log(`[PASS] 1. CQS Raw Score identical across 100 runs: ${baselineScore.toFixed(4)}`);
console.log(`[PASS] 2. Gate Decision identical across 100 runs: ${baselineDecision}`);
console.log(`[PASS] 3. Canonical Evidence SHA-256 identical across 100 runs: ${baselineCanonicalSha.substring(0, 16)}...`);
console.log(`[PASS] 4. SARIF canonical hash identical across 100 runs: ${baselineSarifSha.substring(0, 16)}...`);
console.log(`[PASS] 5. SBOM canonical hash identical across 100 runs: ${baselineSbomSha.substring(0, 16)}...`);

// Cleanup
try {
  fs.rmSync(testDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
} catch (cleanupErr) {
  // Graceful ignore on Windows locked folder during process exit
}

console.log('\n================================================================');
console.log('ALL DETERMINISM SUITE TESTS PASSED (100/100 RUNS 100% MATCH)');
console.log('================================================================\n');
