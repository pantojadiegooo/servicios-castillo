/**
 * Castle Security & Quality Gate — Native Probes Test Suite (Phase 8)
 * 
 * Verifies:
 * - Remediation of ATTACK-17 (In-memory immutability in RemediationSession)
 * - SecurityProbe (Secrets, dangerous DOM, plaintext HTTP, headers)
 * - DomSemanticsProbe (Landmarks, heading hierarchy, alt text, viewport, SEO)
 * - MaintainabilityProbe (Monoliths, nesting, lockfile hygiene, image dimensions)
 * - AnalyzerOrchestrator (Aggregation, determinism, isolation, graceful error handling)
 * - CLI scan command execution & standard exit codes
 * - Performance benchmark (< 500ms target)
 */

'use strict';

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const gate = require('../castle-gate');
const cqs = require('../cqs');
const { runCli } = require('../castle-gate/cli/bin');

let passedTests = 0;
let totalTests = 0;

function runTest(id, description, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`[PASS] ${id}: ${description}`);
  } catch (err) {
    console.error(`[FAIL] ${id}: ${description}`);
    console.error(`       Error: ${err.message}`);
    if (err.stack) console.error(`       Stack: ${err.stack.split('\n').slice(1, 4).join('\n')}`);
  }
}

console.log('================================================================');
console.log('Castle Gate (Phase 8) — Native Probes & Defense Test Suite');
console.log('================================================================\n');

const testScratchDir = path.join(__dirname, '..', '.test-scratch-probes');
if (fs.existsSync(testScratchDir)) {
  fs.rmSync(testScratchDir, { recursive: true, force: true });
}
fs.mkdirSync(testScratchDir, { recursive: true });

// -----------------------------------------------------------------------------
// PROBE-01: ATTACK-17 Remediation (Adversarial In-Memory Immutability Test)
// -----------------------------------------------------------------------------
runTest('PROBE-01', 'ATTACK-17 Remediation: getHistory() deep cloning prevents in-memory state mutation', () => {
  const session = gate.createRemediationSession('SESS-PROBE-01', { name: 'Target App' }, 'C2');
  session.recordCycle({
    cqs_evaluation_result: { evaluation_id: 'EVAL-01', summary: { cqs_display_score: 55.0 } },
    gate_decision: { gate_state: 'REQUIRES_REMEDIATION', blockers: [{ code: 'LOW_SCORE' }] }
  });

  // Attempt external in-memory mutation
  const history1 = session.getHistory();
  assert.strictEqual(history1.cycles[0].cqs_score, 55.0);
  
  // Attacker mutates the returned object
  history1.cycles[0].cqs_score = 99.99;
  history1.cycles[0].gate_state = 'PASSED';
  history1.target_system.name = 'HACKED_TARGET';
  history1.total_cycles = 999;

  // Retrieve fresh history and assert internal state remains untampered
  const history2 = session.getHistory();
  assert.strictEqual(history2.cycles[0].cqs_score, 55.0, 'Internal cycle score must not be mutated');
  assert.strictEqual(history2.cycles[0].gate_state, 'REQUIRES_REMEDIATION', 'Internal gate state must not be mutated');
  assert.strictEqual(history2.target_system.name, 'Target App', 'Internal target system must not be mutated');
  assert.strictEqual(history2.total_cycles, 1, 'Internal total cycles must not be mutated');
});

// -----------------------------------------------------------------------------
// PROBE-02: SecurityProbe detects hardcoded secrets and triggers GB-01
// -----------------------------------------------------------------------------
runTest('PROBE-02', 'SecurityProbe detects AWS key, Stripe secret, and triggers GB-01', () => {
  const projDir = path.join(testScratchDir, 'proj-secrets');
  fs.mkdirSync(projDir, { recursive: true });
  fs.writeFileSync(path.join(projDir, 'config.js'), 'const awsKey = "AKIA1234567890ABCDEF";\nconst stripe = "sk_live_123456789012345678901234";');
  fs.writeFileSync(path.join(projDir, '.env'), 'DATABASE_PASSWORD=supersecret');

  const probe = new gate.SecurityProbe();
  const res = probe.run(projDir);

  assert.strictEqual(res.controls['SEC-05.1'].status, 'FAIL');
  assert.ok(res.controls['SEC-05.1'].findings.length >= 3, 'Must identify all 3 secrets');
  assert.strictEqual(res.gate_evidence['GB-01'], true, 'Critical secret must trigger GB-01');
});

// -----------------------------------------------------------------------------
// PROBE-03: SecurityProbe detects eval(), document.write(), and unescaped innerHTML
// -----------------------------------------------------------------------------
runTest('PROBE-03', 'SecurityProbe detects dangerous DOM and eval patterns (SEC-04.1)', () => {
  const projDir = path.join(testScratchDir, 'proj-dangerous-dom');
  fs.mkdirSync(projDir, { recursive: true });
  fs.writeFileSync(path.join(projDir, 'app.js'), 'eval("2 + 2");\ndocument.write("hello");\nel.innerHTML = rawInput;');

  const probe = new gate.SecurityProbe();
  const res = probe.run(projDir);

  assert.strictEqual(res.controls['SEC-04.1'].status, 'FAIL');
  const rules = res.controls['SEC-04.1'].findings.map(f => f.rule);
  assert.ok(rules.includes('UNSAFE_EVAL'));
  assert.ok(rules.includes('UNSAFE_DOC_WRITE'));
  assert.ok(rules.includes('RAW_INNERHTML'));
});

// -----------------------------------------------------------------------------
// PROBE-04: SecurityProbe detects unencrypted external HTTP links (SEC-01.2)
// -----------------------------------------------------------------------------
runTest('PROBE-04', 'SecurityProbe detects unencrypted external HTTP links', () => {
  const projDir = path.join(testScratchDir, 'proj-http');
  fs.mkdirSync(projDir, { recursive: true });
  fs.writeFileSync(path.join(projDir, 'api.js'), 'const endpoint = "http://insecure-api.example.com/data";\nconst safe = "https://safe.example.com";');

  const probe = new gate.SecurityProbe();
  const res = probe.run(projDir);

  assert.strictEqual(res.controls['SEC-01.2'].status, 'FAIL');
  assert.strictEqual(res.controls['SEC-01.2'].findings.length, 1);
  assert.ok(res.controls['SEC-01.2'].findings[0].description.includes('insecure-api.example.com'));
});

// -----------------------------------------------------------------------------
// PROBE-05: SecurityProbe detects presence of security headers (SEC-02.1)
// -----------------------------------------------------------------------------
runTest('PROBE-05', 'SecurityProbe detects security headers configuration', () => {
  const projDir = path.join(testScratchDir, 'proj-headers');
  fs.mkdirSync(projDir, { recursive: true });
  fs.writeFileSync(path.join(projDir, '_headers'), '/*\n  Content-Security-Policy: default-src \'self\'\n  Strict-Transport-Security: max-age=31536000');

  const probe = new gate.SecurityProbe();
  const res = probe.run(projDir);

  assert.strictEqual(res.controls['SEC-02.1'].status, 'PASS');
});

// -----------------------------------------------------------------------------
// PROBE-06: DomSemanticsProbe passes on valid HTML5 landmarks & headings
// -----------------------------------------------------------------------------
runTest('PROBE-06', 'DomSemanticsProbe passes on valid semantic landmarks & heading tree', () => {
  const projDir = path.join(testScratchDir, 'proj-dom-valid');
  fs.mkdirSync(projDir, { recursive: true });
  fs.writeFileSync(path.join(projDir, 'index.html'), `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Valid Site</title>
      <meta name="description" content="Valid site description for search engines.">
    </head>
    <body>
      <header><h1>Main Title</h1></header>
      <nav><a href="#about">About</a></nav>
      <main>
        <h2>Section Title</h2>
        <img src="pic.webp" alt="A nice picture">
      </main>
      <footer><p>Footer info</p></footer>
    </body>
    </html>
  `);

  const probe = new gate.DomSemanticsProbe();
  const res = probe.run(projDir);

  assert.strictEqual(res.controls['ACC-01.1'].status, 'PASS');
  assert.strictEqual(res.controls['ACC-03.1'].status, 'PASS');
  assert.strictEqual(res.controls['UX-01.1'].status, 'PASS');
  assert.strictEqual(res.controls['SEO-02.1'].status, 'PASS');
});

// -----------------------------------------------------------------------------
// PROBE-07: DomSemanticsProbe detects missing alt, missing lang, missing viewport
// -----------------------------------------------------------------------------
runTest('PROBE-07', 'DomSemanticsProbe flags missing alt text, missing lang, missing viewport', () => {
  const projDir = path.join(testScratchDir, 'proj-dom-invalid');
  fs.mkdirSync(projDir, { recursive: true });
  fs.writeFileSync(path.join(projDir, 'index.html'), `
    <!DOCTYPE html>
    <html>
    <head>
      <title>No Lang or Viewport</title>
    </head>
    <body>
      <div>Just a div without semantic landmarks</div>
      <img src="photo.jpg">
    </body>
    </html>
  `);

  const probe = new gate.DomSemanticsProbe();
  const res = probe.run(projDir);

  assert.strictEqual(res.controls['ACC-01.1'].status, 'FAIL', 'Must flag missing landmarks');
  assert.strictEqual(res.controls['ACC-03.1'].status, 'FAIL', 'Must flag missing alt and lang');
  assert.strictEqual(res.controls['UX-01.1'].status, 'FAIL', 'Must flag missing viewport');
  assert.strictEqual(res.controls['SEO-02.1'].status, 'FAIL', 'Must flag missing description');
});

// -----------------------------------------------------------------------------
// PROBE-08: MaintainabilityProbe detects monolithic files (>800 LOC) and nesting (>5)
// -----------------------------------------------------------------------------
runTest('PROBE-08', 'MaintainabilityProbe flags monolithic files and excessive nesting (MNT-01.1)', () => {
  const projDir = path.join(testScratchDir, 'proj-monolith');
  fs.mkdirSync(projDir, { recursive: true });
  
  // 850 line file
  const bigContent = Array(850).fill('console.log("line");').join('\n');
  fs.writeFileSync(path.join(projDir, 'huge.js'), bigContent);

  // Deeply nested file (6 levels = 24 spaces)
  const nestedContent = 'function deep() {\n                        console.log("very deep");\n}';
  fs.writeFileSync(path.join(projDir, 'nested.js'), nestedContent);

  const probe = new gate.MaintainabilityProbe();
  const res = probe.run(projDir);

  assert.strictEqual(res.controls['MNT-01.1'].status, 'FAIL');
  assert.ok(res.controls['MNT-01.1'].details.includes('monolithic'));
});

// -----------------------------------------------------------------------------
// PROBE-09: MaintainabilityProbe flags missing package-lock.json and wildcard dependencies
// -----------------------------------------------------------------------------
runTest('PROBE-09', 'MaintainabilityProbe flags missing lockfile and wildcard dependencies (MNT-02.1)', () => {
  const projDir = path.join(testScratchDir, 'proj-deps');
  fs.mkdirSync(projDir, { recursive: true });
  
  // package.json without package-lock.json, with wildcard dependency
  fs.writeFileSync(path.join(projDir, 'package.json'), JSON.stringify({
    name: 'test-app',
    dependencies: {
      'express': '*',
      'lodash': 'latest'
    }
  }, null, 2));

  const probe = new gate.MaintainabilityProbe();
  const res = probe.run(projDir);

  assert.strictEqual(res.controls['MNT-02.1'].status, 'FAIL');
  assert.ok(res.controls['MNT-02.1'].findings.some(f => f.rule === 'MISSING_LOCKFILE'));
  assert.ok(res.controls['MNT-02.1'].findings.some(f => f.rule === 'WILDCARD_DEPENDENCY'));
});

// -----------------------------------------------------------------------------
// PROBE-10: MaintainabilityProbe flags missing image dimensions (PER-04.2)
// -----------------------------------------------------------------------------
runTest('PROBE-10', 'MaintainabilityProbe flags missing width/height on images (PER-04.2)', () => {
  const projDir = path.join(testScratchDir, 'proj-img-dim');
  fs.mkdirSync(projDir, { recursive: true });
  fs.writeFileSync(path.join(projDir, 'page.html'), '<img src="banner.webp" alt="Banner">');

  const probe = new gate.MaintainabilityProbe();
  const res = probe.run(projDir);

  assert.strictEqual(res.controls['PER-04.2'].status, 'FAIL');
  assert.strictEqual(res.controls['PER-04.2'].findings.length, 1);
});

// -----------------------------------------------------------------------------
// PROBE-11: AnalyzerOrchestrator runs all probes and produces valid Evidence Package
// -----------------------------------------------------------------------------
runTest('PROBE-11', 'AnalyzerOrchestrator runs all probes and hashes aggregated evidence', () => {
  const projDir = path.join(testScratchDir, 'proj-orch');
  fs.mkdirSync(projDir, { recursive: true });
  fs.writeFileSync(path.join(projDir, 'index.html'), '<!DOCTYPE html><html lang="en"><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Title</title><meta name="description" content="Desc"></head><body><header><h1>T</h1></header><main><p>Content</p></main><footer>F</footer></body></html>');
  fs.writeFileSync(path.join(projDir, 'index.js'), 'console.log("Safe script");');

  const orch = new gate.AnalyzerOrchestrator();
  const scan = orch.runAllProbes(projDir);

  assert.ok(scan.total_files_scanned >= 2);
  assert.ok(scan.aggregated_sha256 && scan.aggregated_sha256.length === 64);
  assert.ok(scan.raw_evidence['SEC-05.1'] !== undefined);
  assert.ok(scan.raw_evidence['ACC-01.1'] !== undefined);
  assert.ok(scan.raw_evidence['MNT-01.1'] !== undefined);
});

// -----------------------------------------------------------------------------
// PROBE-12: Determinism test (Multiple runs on same codebase produce identical hashes)
// -----------------------------------------------------------------------------
runTest('PROBE-12', 'Native scan determinism: Repeated executions produce identical SHA-256 digests', () => {
  const projDir = path.join(testScratchDir, 'proj-orch');
  const scan1 = gate.runNativeScan(projDir);
  const scan2 = gate.runNativeScan(projDir);

  assert.strictEqual(scan1.aggregated_sha256, scan2.aggregated_sha256);
  assert.deepStrictEqual(scan1.raw_evidence, scan2.raw_evidence);
});

// -----------------------------------------------------------------------------
// PROBE-13: Robustness test (Empty project directory does not crash probes)
// -----------------------------------------------------------------------------
runTest('PROBE-13', 'Empty directory is handled cleanly with N/A statuses without throwing', () => {
  const emptyDir = path.join(testScratchDir, 'empty-dir');
  fs.mkdirSync(emptyDir, { recursive: true });

  const scan = gate.runNativeScan(emptyDir);
  assert.strictEqual(scan.total_files_scanned, 0);
  assert.ok(scan.aggregated_sha256.length === 64);
});

// -----------------------------------------------------------------------------
// PROBE-14: End-to-end CLI scan command execution
// -----------------------------------------------------------------------------
runTest('PROBE-14', 'CLI scan command executes probes, evaluates Gate, and returns exit code', () => {
  const projDir = path.join(testScratchDir, 'proj-orch');
  const outDir = path.join(testScratchDir, 'cli-scan-out');

  const code = runCli(['scan', '--dir', projDir, '--level', 'C1', '--output-dir', outDir]);
  assert.ok(code === 0 || code === 2, `Exit code must be 0 (PASS) or 2 (REMED), got ${code}`);
  assert.ok(fs.existsSync(outDir), 'Output directory must be created for artifacts');
});

// -----------------------------------------------------------------------------
// PROBE-15: Performance benchmark (< 500ms on project scan)
// -----------------------------------------------------------------------------
runTest('PROBE-15', 'Performance benchmark: Probes scan 20 files in under 500ms', () => {
  const benchDir = path.join(testScratchDir, 'bench-proj');
  fs.mkdirSync(benchDir, { recursive: true });

  for (let i = 0; i < 20; i++) {
    fs.writeFileSync(path.join(benchDir, `file_${i}.js`), `// File ${i}\nconst x = ${i};\nconsole.log(x);`);
    fs.writeFileSync(path.join(benchDir, `page_${i}.html`), `<!DOCTYPE html><html lang="es"><head><meta name="viewport" content="width=device-width"><title>P${i}</title><meta name="description" content="D${i}"></head><body><header><h1>H${i}</h1></header><main><p>M${i}</p></main><footer>F${i}</footer></body></html>`);
  }

  const start = Date.now();
  const scan = gate.runNativeScan(benchDir);
  const elapsed = Date.now() - start;

  assert.ok(elapsed < 500, `Scan took ${elapsed}ms (must be < 500ms)`);
  assert.ok(scan.total_files_scanned >= 40, 'Must have scanned all files across probes');
});

// -----------------------------------------------------------------------------
// PROBE-16: CQS Engine Invariance Verification (65 controls, 100.00 nominal weight)
// -----------------------------------------------------------------------------
runTest('PROBE-16', 'CQS v1.1 Integrity check: 65 atomic controls, 7 domains, 100.00 nominal weight', () => {
  const integrity = cqs.validateCqsIntegrity();
  assert.strictEqual(integrity.integrity, 'PASS');
  assert.strictEqual(integrity.metrics.total_controls, 65);
  assert.strictEqual(integrity.metrics.total_domains, 7);
  assert.ok(Math.abs(integrity.metrics.nominal_weight_total - 100.0) < 1e-9, 'Nominal weight must equal 100.00');
});

console.log('\n================================================================');
console.log(`NATIVE PROBES TEST SUMMARY: ${passedTests}/${totalTests} PASSED (${totalTests - passedTests} FAILED)`);
console.log('================================================================\n');

// Cleanup
try {
  fs.rmSync(testScratchDir, { recursive: true, force: true });
} catch (e) {}

if (passedTests !== totalTests) {
  process.exit(1);
}
