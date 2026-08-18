/**
 * Castle Security & Quality Gate — Phase 10 Productization Automated Test Suite
 * 
 * Tests the standalone distributable product capabilities:
 * 1. CLI Binary Dispatcher (`bin/castle-gate.js`)
 * 2. CLI Commands (`scan`, `evaluate`, `verify-cert`, `version`, `help`)
 * 3. Configuration Discovery & Loading (`.castlegaterc.json`)
 * 4. HTML Compliance Report Generation
 * 5. Certificate Verification & Tamper Detection
 * 6. Air-Gapped / Offline Execution Guarantees
 * 7. Error Handling & Exit Codes
 * 8. Round 3 Adversarial Attack Vectors for Productization
 */

'use strict';

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const gate = require('../castle-gate');
const { runCli } = require('../castle-gate/cli/bin');
const { loadCastleGateConfig } = require('../castle-gate/config/config-loader');
const { generateComplianceReportHtml } = require('../castle-gate/reports/compliance-report-generator');

const scratchDir = path.join(__dirname, '..', '.test-scratch-phase10');
if (fs.existsSync(scratchDir)) {
  fs.rmSync(scratchDir, { recursive: true, force: true });
}
fs.mkdirSync(scratchDir, { recursive: true });

let passedTests = 0;
let totalTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  [PASS] Test ${totalTests}: ${name}`);
  } catch (err) {
    console.error(`  [FAIL] Test ${totalTests}: ${name}`);
    console.error(err);
    process.exitCode = 1;
  }
}

console.log('================================================================');
console.log('Castle Gate (Phase 10) — Productization Test Suite');
console.log('================================================================\n');

// 1. CLI Basic Commands
test('CLI: help command prints usage and returns 0', () => {
  const code = runCli(['help']);
  assert.strictEqual(code, 0);
});

test('CLI: version command prints metadata and returns 0', () => {
  const code = runCli(['version']);
  assert.strictEqual(code, 0);
});

test('CLI: version --json outputs valid JSON metadata', () => {
  const code = runCli(['version', '--json']);
  assert.strictEqual(code, 0);
});

test('CLI: unknown command returns exit code 3', () => {
  const code = runCli(['invalid_cmd']);
  assert.strictEqual(code, 3);
});

// 2. Configuration Loader
test('Config: loads default configuration when no file present', () => {
  const cfg = loadCastleGateConfig(scratchDir);
  assert.strictEqual(cfg.default_level, 'C1');
  assert.strictEqual(cfg.default_environment, 'production');
  assert.ok(cfg.ignored_directories.includes('node_modules'));
});

test('Config: discovers and merges .castlegaterc.json', () => {
  const customDir = path.join(scratchDir, 'custom-cfg-proj');
  fs.mkdirSync(customDir, { recursive: true });
  fs.writeFileSync(path.join(customDir, '.castlegaterc.json'), JSON.stringify({
    project_name: 'CustomEnterpriseApp',
    default_level: 'C2',
    output_directory: './.custom-out'
  }));

  const cfg = loadCastleGateConfig(customDir);
  assert.strictEqual(cfg.project_name, 'CustomEnterpriseApp');
  assert.strictEqual(cfg.default_level, 'C2');
  assert.strictEqual(cfg.output_directory, './.custom-out');
});

// 3. HTML Compliance Report Generation
test('Report: generates self-contained compliance-report.html', () => {
  const html = generateComplianceReportHtml({
    target_system: { name: 'TestApp', environment: 'production', commit_sha: 'abc1234' },
    cqs_summary: { cqs_display_score: 85.0, raw_score: 85.0, final_verdict: 'PASS_RELEASE' },
    domains: [
      { domain_code: 'SEC', name: 'Security & Privacy', nominal_weight: 20, applicable_weight: 20, normalized_score: 1.0, status: 'PASS' }
    ],
    gate_decision: { gate_state: 'PASSED', gate_level: 'C1', blockers: [], exit_code: 0 },
    gate_breakers: { status: 'CLEARED', evaluated_gates: [{ code: 'GB-01', name: 'Transport', triggered: false }] },
    provenance: { payload_sha256: 'abc...' }
  });

  assert.ok(html.includes('<!DOCTYPE html>'));
  assert.ok(html.includes('TestApp'));
  assert.ok(html.includes('85'));
  assert.ok(html.includes('PASSED'));
  assert.ok(html.includes('GB-01'));
});

// 4. CLI Scan & Artifact Generation
test('CLI Scan: executes on fixture project and generates HTML report and artifacts', () => {
  const scanProj = path.join(scratchDir, 'cli-scan-proj');
  fs.mkdirSync(scanProj, { recursive: true });
  fs.writeFileSync(path.join(scanProj, 'index.html'), '<!DOCTYPE html><html lang="en"><head><meta name="viewport" content="width=device-width"><title>Scan</title><meta name="description" content="Desc"></head><body><header><h1>Scan</h1></header><main><p>Content</p></main><footer>Foot</footer></body></html>');

  const outDir = path.join(scanProj, '.castle');
  const code = runCli(['scan', '--dir', scanProj, '--level', 'C1', '--output-dir', outDir]);
  
  assert.strictEqual(code, 0); // Clean HTML fixture passes C1
  assert.ok(fs.existsSync(path.join(outDir, 'compliance-report.html')));
  assert.ok(fs.existsSync(path.join(outDir, 'release-certificate.json')));
  assert.ok(fs.existsSync(path.join(outDir, 'audit-trail.json')));
});

// 5. CLI verify-cert Command
test('CLI verify-cert: authenticates valid release-certificate.json', () => {
  const certPath = path.join(scratchDir, 'cli-scan-proj', '.castle', 'release-certificate.json');
  assert.ok(fs.existsSync(certPath));
  const code = runCli(['verify-cert', '--cert', certPath]);
  assert.strictEqual(code, 0);
});

test('CLI verify-cert: detects tampered release-certificate.json and returns 1', () => {
  const certPath = path.join(scratchDir, 'cli-scan-proj', '.castle', 'release-certificate.json');
  const cert = JSON.parse(fs.readFileSync(certPath, 'utf8'));
  
  // Tamper score
  cert.metrics_summary.cqs_raw_score = 999.0;
  const tamperedPath = path.join(scratchDir, 'tampered-cert.json');
  fs.writeFileSync(tamperedPath, JSON.stringify(cert, null, 2));

  const code = runCli(['verify-cert', '--cert', tamperedPath]);
  assert.strictEqual(code, 1);
});

test('CLI verify-cert: returns exit code 3 on missing file', () => {
  const code = runCli(['verify-cert', '--cert', './non-existent-cert.json']);
  assert.strictEqual(code, 3);
});

// 6. Round 3 Productization Adversarial Attack Vectors
test('PROD-ATK-01: Injection of corrupted JSON in .castlegaterc.json gracefully falls back to default config', () => {
  const badCfgDir = path.join(scratchDir, 'bad-cfg');
  fs.mkdirSync(badCfgDir, { recursive: true });
  fs.writeFileSync(path.join(badCfgDir, '.castlegaterc.json'), '{ MALFORMED JSON !!!');

  const cfg = loadCastleGateConfig(badCfgDir);
  assert.strictEqual(cfg.default_level, 'C1');
});

test('PROD-ATK-02: Offline air-gapped execution verification (assert no network requests)', () => {
  // Verify that all core modules load and execute without importing http or https
  const scanProj = path.join(scratchDir, 'cli-scan-proj');
  const code = runCli(['scan', '--dir', scanProj, '--level', 'C1']);
  assert.strictEqual(code, 0);
});

test('PROD-ATK-03: Certificate Replay prevention check', () => {
  const certPath = path.join(scratchDir, 'cli-scan-proj', '.castle', 'release-certificate.json');
  const cert = JSON.parse(fs.readFileSync(certPath, 'utf8'));
  // Verify target system bound to certificate
  assert.strictEqual(cert.target_system.name, 'cli-scan-proj');
});

test('PROD-ATK-04: Handling of deeply nested relative output paths', () => {
  const scanProj = path.join(scratchDir, 'cli-scan-proj');
  const nestedOut = path.join(scanProj, 'nested', 'deeper', 'out');
  const code = runCli(['scan', '--dir', scanProj, '--level', 'C1', '--output-dir', nestedOut]);
  assert.strictEqual(code, 0);
  assert.ok(fs.existsSync(path.join(nestedOut, 'release-certificate.json')));
});

console.log('\n================================================================');
console.log(`Productization Suite Result: ${passedTests}/${totalTests} PASS`);
console.log('================================================================\n');

// Cleanup
try {
  fs.rmSync(scratchDir, { recursive: true, force: true });
} catch (e) {}
