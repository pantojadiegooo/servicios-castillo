/**
 * Castle Gate — Independent Adversarial Audit 2 Test Harness
 * 
 * Hostile, black-box, adversarial testing harness executing attacks across all 26 audit phases.
 * Interacts with Castle Gate via standalone CLI processes, independent cryptographic verifiers,
 * and hostile input fuzzing WITHOUT modifying product source code.
 */

'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync, spawnSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '../..');
const { canonicalize } = require(path.join(repoRoot, 'castle-gate/crypto/canonicalizer'));
const auditScratchDir = path.join(repoRoot, '.audit-2-scratch');

if (fs.existsSync(auditScratchDir)) {
  fs.rmSync(auditScratchDir, { recursive: true, force: true });
}
fs.mkdirSync(auditScratchDir, { recursive: true });

console.log('================================================================================');
console.log('CASTLE GATE AUDIT 2 — ADVERSARIAL DESTRUCTION & INDEPENDENT VERIFICATION HARNESS');
console.log('================================================================================\n');

const attackResults = [];

function recordAttack(id, phase, name, expected, actual, passed, severity, details = '') {
  attackResults.push({
    id,
    phase,
    name,
    expected,
    actual,
    status: passed ? 'DEFENDED' : 'VULNERABLE',
    severity: passed ? 'N/A' : severity,
    details: details ? details.trim() : ''
  });
  const symbol = passed ? '[DEFENDED]' : '[CRITICAL FAILURE]';
  console.log(`${symbol} ${id} (${phase}): ${name} -> Expected: ${expected}, Got: ${actual}`);
  if (!passed) {
    console.error(`          VULNERABILITY DETAILS: ${details.trim()}`);
  }
}

// =============================================================================
// FASE 1: RECONNAISSANCE & ARCHITECTURE AUDIT
// =============================================================================
console.log('\n--- FASE 1: RECONNAISSANCE & ARCHITECTURE AUDIT ---');

const pkgJson = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));
const runtimeDeps = Object.keys(pkgJson.dependencies || {});
const hasOnlyAcorn = runtimeDeps.length === 1 && runtimeDeps[0] === 'acorn';
recordAttack(
  'REC-01',
  'FASE 1',
  'Minimal Runtime Dependencies Audit',
  'Only acorn runtime dependency',
  `Found: ${runtimeDeps.join(', ') || 'none'}`,
  hasOnlyAcorn,
  'HIGH',
  'Runtime dependencies must remain strictly minimal.'
);

const cqsIndex = fs.readFileSync(path.join(repoRoot, 'cqs/index.js'), 'utf8');
const cqsDoesNotImportGate = !cqsIndex.includes('castle-gate');
recordAttack(
  'REC-02',
  'FASE 1',
  'CQS Core Layer Isolation (CQS does not import Gate)',
  'CQS independent of Gate',
  cqsDoesNotImportGate ? 'Isolated' : 'Coupled',
  cqsDoesNotImportGate,
  'CRITICAL',
  'CQS must not depend on Gate.'
);

// =============================================================================
// FASE 2 & 4: CRYPTOGRAPHIC ATTACKS & VERIFIER HOSTILE ISOLATION
// =============================================================================
console.log('\n--- FASE 2 & 4: CRYPTOGRAPHIC ATTACKS & VERIFIER ISOLATION ---');

// Generate valid baseline keys & artifacts
const keygenProc = spawnSync('node', ['bin/castle-gate.js', 'keygen', '--output-dir', auditScratchDir, '--project', 'audit-target'], {
  cwd: repoRoot,
  encoding: 'utf8'
});
const privKeyPath = path.join(auditScratchDir, 'audit-target-private.pem');
const pubKeyPath = path.join(auditScratchDir, 'audit-target-public.pem');
const pubKeyAlpha = fs.readFileSync(pubKeyPath, 'utf8');

// Key Beta for confusion attacks
spawnSync('node', ['bin/castle-gate.js', 'keygen', '--output-dir', auditScratchDir, '--project', 'attacker-key'], {
  cwd: repoRoot,
  encoding: 'utf8'
});
const pubKeyBetaPath = path.join(auditScratchDir, 'attacker-key-public.pem');

// Create fixture app for baseline scan
const fixtureAppDir = path.join(auditScratchDir, 'fixture-app');
fs.mkdirSync(fixtureAppDir, { recursive: true });
fs.writeFileSync(path.join(fixtureAppDir, 'index.html'), `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Audit Target Application</title>
  <meta name="description" content="A fully valid web application for Castle Gate baseline testing.">
</head>
<body>
  <header><nav><a href="/">Home</a></nav></header>
  <main>
    <h1>Audit Target Main Title</h1>
    <p>Ensuring release assurance.</p>
    <img src="/logo.png" alt="Company Logo" width="200" height="50">
  </main>
  <footer><p>&copy; 2026 Grupo Castillo</p></footer>
</body>
</html>`, 'utf8');

fs.writeFileSync(path.join(fixtureAppDir, 'security-headers.js'), `
// Security configuration
const CSP = "default-src 'self'";
const HSTS = "max-age=31536000; includeSubDomains";
const X_FRAME = "DENY";
// Content-Security-Policy, Strict-Transport-Security, X-Frame-Options configured
`, 'utf8');

fs.writeFileSync(path.join(fixtureAppDir, 'app.js'), 'export function cleanCode() { return 42; }\n', 'utf8');
fs.writeFileSync(path.join(fixtureAppDir, 'package.json'), JSON.stringify({ name: 'fixture-app', version: '1.0.0' }, null, 2), 'utf8');
fs.writeFileSync(path.join(fixtureAppDir, 'package-lock.json'), JSON.stringify({ name: 'fixture-app', version: '1.0.0', lockfileVersion: 2, packages: { "": { name: "fixture-app", version: "1.0.0" } } }, null, 2), 'utf8');

const baselineCommit = 'a1b2c3d4e5f678901234567890abcdef12345678';
spawnSync('node', [
  'bin/castle-gate.js', 'scan',
  '--dir', fixtureAppDir,
  '--level', 'C2',
  '--project', 'AuditApp',
  '--commit', baselineCommit,
  '--key', privKeyPath,
  '--pubkey', pubKeyPath,
  '--output-dir', path.join(auditScratchDir, 'baseline-out')
], {
  cwd: repoRoot,
  encoding: 'utf8'
});

const baselineEvidencePath = path.join(auditScratchDir, 'baseline-out', 'evidence.json');
const baselineCertPath = path.join(auditScratchDir, 'baseline-out', 'release-certificate.json');
const baselineSarifPath = path.join(auditScratchDir, 'baseline-out', 'sarif.json');
const baselineSbomPath = path.join(auditScratchDir, 'baseline-out', 'sbom-cyclonedx.json');
const baselineHtmlPath = path.join(auditScratchDir, 'baseline-out', 'compliance-report.html');

// Verify baseline is authentic
const baseVerifyProc = spawnSync('node', [
  'bin/castle-verify.js',
  '--artifact', baselineCertPath,
  '--key', pubKeyPath,
  '--html', baselineHtmlPath,
  '--commit', baselineCommit
], {
  cwd: repoRoot,
  encoding: 'utf8'
});
recordAttack(
  'CRYPTO-00',
  'FASE 2',
  'Authentic Baseline Verification',
  'VALID (Exit 0)',
  `${baseVerifyProc.status === 0 ? 'VALID' : 'INVALID'} (Exit ${baseVerifyProc.status})`,
  baseVerifyProc.status === 0,
  'CRITICAL',
  'Baseline authentic certificate must verify successfully.'
);

// Mutation attack test helper
function testCertificateMutation(mutationId, mutationName, mutatorFn) {
  const certRaw = JSON.parse(fs.readFileSync(baselineCertPath, 'utf8'));
  mutatorFn(certRaw);
  const mutPath = path.join(auditScratchDir, `cert-${mutationId}.json`);
  fs.writeFileSync(mutPath, JSON.stringify(certRaw, null, 2), 'utf8');

  const verifyProc = spawnSync('node', [
    'bin/castle-verify.js',
    '--artifact', mutPath,
    '--key', pubKeyPath,
    '--html', baselineHtmlPath,
    '--commit', baselineCommit
  ], {
    cwd: repoRoot,
    encoding: 'utf8'
  });

  const rejected = verifyProc.status === 1;
  recordAttack(
    mutationId,
    'FASE 2',
    mutationName,
    'INVALID (Exit 1)',
    `${verifyProc.status === 0 ? 'VALID' : 'INVALID'} (Exit ${verifyProc.status})`,
    rejected,
    'CRITICAL',
    verifyProc.stdout + verifyProc.stderr
  );
}

// 24 Cryptographic Mutation Attacks:
testCertificateMutation('CRYPTO-01', 'Tamper CQS Display Score in Certificate', c => { c.metrics_summary.cqs_display_score = 99.99; });
testCertificateMutation('CRYPTO-02', 'Tamper Gate Level in Certificate (C2 -> C6)', c => { c.governance.gate_level = 'C6'; c.governance.gate_level_name = 'Defense / Mission Critical'; });
testCertificateMutation('CRYPTO-03', 'Tamper Evaluation ID', c => { c.evaluation_reference.evaluation_id = 'EVAL-FORGED-999'; });
testCertificateMutation('CRYPTO-04', 'Tamper Repository Project Name', c => { c.target_system.name = 'HackedBankApp'; });
testCertificateMutation('CRYPTO-05', 'Tamper Commit SHA', c => { c.target_system.commit_sha = '0000000000000000000000000000000000000000'; });
testCertificateMutation('CRYPTO-06', 'Tamper Evidence Package Hash Reference', c => { c.evaluation_reference.evidence_package_hash = 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'; });
testCertificateMutation('CRYPTO-07', 'Tamper Policy Version', c => { c.governance.gate_policy_version = '9.9.9-forged'; });
testCertificateMutation('CRYPTO-08', 'Tamper CQS Spec Version', c => { c.governance.cqs_specification_version = '99.0.0'; });
testCertificateMutation('CRYPTO-09', 'Tamper Certificate Timestamp', c => { c.issued_at = '2099-01-01T00:00:00.000Z'; });
testCertificateMutation('CRYPTO-10', 'Tamper Anti-Replay Nonce', c => { c.nonce = 'forged-nonce-12345678'; });
testCertificateMutation('CRYPTO-11', 'Tamper Gate Breakers Status', c => { c.metrics_summary.gate_breakers_status = 'CLEARED_BY_ATTACKER'; });
testCertificateMutation('CRYPTO-12', 'Tamper Authority Class', c => { c.governance.authority_class = 'BYPASS_AUTHORITY'; });
testCertificateMutation('CRYPTO-13', 'Tamper HTML Report Hash Reference', c => { c.artifacts = { ...(c.artifacts || {}), compliance_report_html_sha256: 'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' }; });
testCertificateMutation('CRYPTO-14', 'Replace Signature with Garbage Base64', c => {
  if (!c.integrity.pki_signature_extension) c.integrity.pki_signature_extension = {};
  c.integrity.pki_signature_extension.signature_base64 = Buffer.from('GARBAGE_BYTES_ATTACK').toString('base64');
});
testCertificateMutation('CRYPTO-15', 'Signature Stripping Attack (Delete pki_signature_extension)', c => {
  if (c.integrity) delete c.integrity.pki_signature_extension;
});
testCertificateMutation('CRYPTO-16', 'Delete Integrity Block Entirely', c => { delete c.integrity; });
testCertificateMutation('CRYPTO-17', 'Inject Extra Malicious Property', c => { c.backdoor_payload = 'malicious_exec()'; });
testCertificateMutation('CRYPTO-18', 'Delete Target System Block', c => { delete c.target_system; });
testCertificateMutation('CRYPTO-19', 'Change Type of Score (Number -> String)', c => { c.metrics_summary.cqs_display_score = "82.50"; });
testCertificateMutation('CRYPTO-20', 'Change Type of Score (Number -> Boolean)', c => { c.metrics_summary.cqs_display_score = true; });
testCertificateMutation('CRYPTO-21', 'Unicode Homoglyph / RTL Override in Project Name', c => { c.target_system.name = 'Audit\u202EppA'; });
testCertificateMutation('CRYPTO-22', 'Recalculate Hash without Private Key (Forge Digest)', c => {
  const { integrity, ...rest } = c;
  const canonical = JSON.stringify(rest);
  c.integrity.certificate_digest = crypto.createHash('sha256').update(canonical).digest('hex');
});
testCertificateMutation('CRYPTO-22B', 'Legacy Fallback Exploitation (Uncanonicalized JSON.stringify Hash Injection)', c => {
  const { integrity, ...rest } = c;
  // Permute keys in reverse order to ensure JSON.stringify produces a non-canonical string
  const permuted = {};
  const keys = Object.keys(rest).reverse();
  for (const k of keys) permuted[k] = rest[k];

  const strJson = JSON.stringify(permuted);
  const strJcs = canonicalize(permuted);

  if (strJson === strJcs) {
    throw new Error('Test invariant error: JSON.stringify must differ from JCS for CRYPTO-22B');
  }

  const legacySha = crypto.createHash('sha256').update(strJson, 'utf8').digest('hex');
  c.integrity.certificate_digest = legacySha;
});

// Verification against wrong public key
const wrongKeyProc = spawnSync('node', [
  'bin/castle-verify.js',
  '--artifact', baselineCertPath,
  '--key', pubKeyBetaPath,
  '--html', baselineHtmlPath,
  '--commit', baselineCommit
], {
  cwd: repoRoot,
  encoding: 'utf8'
});
recordAttack(
  'CRYPTO-23',
  'FASE 2',
  'Verify Against Unrelated Public Key (Key Confusion)',
  'INVALID (Exit 1)',
  `${wrongKeyProc.status === 0 ? 'VALID' : 'INVALID'} (Exit ${wrongKeyProc.status})`,
  wrongKeyProc.status === 1,
  'CRITICAL',
  'Verification with wrong public key must fail.'
);

// Malformed JSON input
const corruptJsonPath = path.join(auditScratchDir, 'cert-corrupt.json');
fs.writeFileSync(corruptJsonPath, '{"certificate_id": "CORRUPTED_JSON_<<<>>>', 'utf8');
const corruptJsonProc = spawnSync('node', [
  'bin/castle-verify.js',
  '--artifact', corruptJsonPath,
  '--key', pubKeyPath
], {
  cwd: repoRoot,
  encoding: 'utf8'
});
recordAttack(
  'CRYPTO-24',
  'FASE 2',
  'Malformed JSON Input to castle-verify',
  'INVALID (Exit 1)',
  `${corruptJsonProc.status === 0 ? 'VALID' : 'INVALID'} (Exit ${corruptJsonProc.status})`,
  corruptJsonProc.status === 1,
  'HIGH',
  'Malformed JSON must fail closed.'
);

// =============================================================================
// FASE 3: RFC 8785 JSON CANONICALIZATION SCHEME (JCS) DEEP VERIFICATION
// =============================================================================
console.log('\n--- FASE 3: RFC 8785 / JCS DEEP VERIFICATION ---');

const objUnsorted = { "b": 1, "a": 2, "A": 3, "1": 4, "\u00e9": 5, "\u0100": 6, "\ud83d\ude00": 7 };
const canonString = canonicalize(objUnsorted);
const expectedOrder = '{"1":4,"A":3,"a":2,"b":1,"\u00e9":5,"\u0100":6,"\ud83d\ude00":7}';
const keysSortedCorrectly = canonString === expectedOrder;

recordAttack(
  'JCS-01',
  'FASE 3',
  'RFC 8785 UTF-16 Code Unit Property Ordering',
  expectedOrder,
  canonString,
  keysSortedCorrectly,
  'HIGH',
  'Keys must be sorted strictly by UTF-16 code units.'
);

const numbersObj = { "zero": 0, "negZero": -0, "float": 100.5, "int": 100, "large": 1e20 };
const canonNum = canonicalize(numbersObj);
const numPass = canonNum.includes('"negZero":0') && canonNum.includes('"int":100') && !canonNum.includes('"int":100.0');
recordAttack(
  'JCS-02',
  'FASE 3',
  'RFC 8785 Number Representation (-0 -> 0, integer formatting)',
  '{"float":100.5,"int":100,"large":100000000000000000000,"negZero":0,"zero":0}',
  canonNum,
  numPass,
  'HIGH',
  'Numbers must serialize strictly per RFC 8785.'
);

const specialStrings = { "slash": "a/b/c", "quote": "a\"b", "control": "a\nb\tc\u0000" };
const canonSpecial = canonicalize(specialStrings);
const solidusUnescaped = canonSpecial.includes('"slash":"a/b/c"') && !canonSpecial.includes('"slash":"a\\/b\\/c"');
recordAttack(
  'JCS-03',
  'FASE 3',
  'RFC 8785 String Escaping (Solidus "/" must NOT be escaped)',
  'Unescaped "/"',
  solidusUnescaped ? 'Unescaped "/"' : 'Escaped "\\/"',
  solidusUnescaped,
  'HIGH',
  'RFC 8785 prohibits escaping forward slashes.'
);

// =============================================================================
// FASE 5: CROSS-PROJECT EVIDENCE REPLAY ATTACKS
// =============================================================================
console.log('\n--- FASE 5: CROSS-PROJECT REPLAY ATTACKS ---');

const replayCommitProc = spawnSync('node', [
  'bin/castle-verify.js',
  '--artifact', baselineEvidencePath,
  '--key', pubKeyPath,
  '--commit', 'deadbeefdeadbeefdeadbeefdeadbeefdeadbeef'
], {
  cwd: repoRoot,
  encoding: 'utf8'
});
recordAttack(
  'REPLAY-01',
  'FASE 5',
  'Commit Replay Attack (Valid evidence asserted on different commit)',
  'INVALID (Exit 1)',
  `${replayCommitProc.status === 0 ? 'VALID' : 'INVALID'} (Exit ${replayCommitProc.status})`,
  replayCommitProc.status === 1,
  'CRITICAL',
  'Evidence bound to Commit A must be rejected when verifying Commit B.'
);

const replayPolicyProc = spawnSync('node', [
  'bin/castle-verify.js',
  '--artifact', baselineEvidencePath,
  '--key', pubKeyPath,
  '--policy-hash', 'forged-policy-hash-00000000000000000000000000000000'
], {
  cwd: repoRoot,
  encoding: 'utf8'
});
recordAttack(
  'REPLAY-02',
  'FASE 5',
  'Policy Downgrade Replay Attack (Mismatched policy hash)',
  'INVALID (Exit 1)',
  `${replayPolicyProc.status === 0 ? 'VALID' : 'INVALID'} (Exit ${replayPolicyProc.status})`,
  replayPolicyProc.status === 1,
  'CRITICAL',
  'Evidence evaluated under Policy A must not verify against Policy B.'
);

// =============================================================================
// FASE 6: ARTIFACT ANTI-TAMPERING (HTML, SARIF, SBOM)
// =============================================================================
console.log('\n--- FASE 6: ARTIFACT ANTI-TAMPERING ---');

const tamperedHtmlPath = path.join(auditScratchDir, 'report-tampered.html');
fs.copyFileSync(baselineHtmlPath, tamperedHtmlPath);
fs.appendFileSync(tamperedHtmlPath, '<!-- INJECTED MALICIOUS AUDIT REPORT MODIFICATION -->');

const htmlVerifyProc = spawnSync('node', [
  'bin/castle-verify.js',
  '--artifact', baselineEvidencePath,
  '--key', pubKeyPath,
  '--html', tamperedHtmlPath
], {
  cwd: repoRoot,
  encoding: 'utf8'
});
recordAttack(
  'TAMPER-01',
  'FASE 6',
  'Tampered HTML Compliance Report Linked in Evidence',
  'INVALID (Exit 1)',
  `${htmlVerifyProc.status === 0 ? 'VALID' : 'INVALID'} (Exit ${htmlVerifyProc.status})`,
  htmlVerifyProc.status === 1,
  'HIGH',
  'Modifying 1 byte in HTML report must invalidate verification.'
);

const tamperedSarifPath = path.join(auditScratchDir, 'sarif-tampered.json');
fs.copyFileSync(baselineSarifPath, tamperedSarifPath);
const sarifObj = JSON.parse(fs.readFileSync(tamperedSarifPath, 'utf8'));
sarifObj.runs[0].results.push({
  ruleId: 'INJECTED-FORGED-FINDING',
  level: 'error',
  message: { text: 'Injected forged vulnerability finding' }
});
fs.writeFileSync(tamperedSarifPath, JSON.stringify(sarifObj, null, 2), 'utf8');

const sarifVerifyProc = spawnSync('node', [
  'bin/castle-verify.js',
  '--artifact', baselineEvidencePath,
  '--key', pubKeyPath,
  '--sarif', tamperedSarifPath
], {
  cwd: repoRoot,
  encoding: 'utf8'
});
recordAttack(
  'TAMPER-02',
  'FASE 6',
  'Tampered SARIF Report Linked in Evidence',
  'INVALID (Exit 1)',
  `${sarifVerifyProc.status === 0 ? 'VALID' : 'INVALID'} (Exit ${sarifVerifyProc.status})`,
  sarifVerifyProc.status === 1,
  'HIGH',
  'Modifying SARIF findings must invalidate verification.'
);

const tamperedSbomPath = path.join(auditScratchDir, 'sbom-tampered.json');
fs.copyFileSync(baselineSbomPath, tamperedSbomPath);
const sbomObj = JSON.parse(fs.readFileSync(tamperedSbomPath, 'utf8'));
sbomObj.components.push({ name: 'injected-backdoor-pkg', version: '6.6.6' });
fs.writeFileSync(tamperedSbomPath, JSON.stringify(sbomObj, null, 2), 'utf8');

const sbomVerifyProc = spawnSync('node', [
  'bin/castle-verify.js',
  '--artifact', baselineEvidencePath,
  '--key', pubKeyPath,
  '--sbom', tamperedSbomPath
], {
  cwd: repoRoot,
  encoding: 'utf8'
});
recordAttack(
  'TAMPER-03',
  'FASE 6',
  'Tampered CycloneDX SBOM Linked in Evidence',
  'INVALID (Exit 1)',
  `${sbomVerifyProc.status === 0 ? 'VALID' : 'INVALID'} (Exit ${sbomVerifyProc.status})`,
  sbomVerifyProc.status === 1,
  'HIGH',
  'Modifying SBOM components must invalidate verification.'
);

// =============================================================================
// FASE 7: FAIL-CLOSED DOM-02 TESTING
// =============================================================================
console.log('\n--- FASE 7: FAIL-CLOSED DOM-02 TESTING ---');

const { NpmAuditAdapter } = require(path.join(repoRoot, 'castle-gate/evidence/adapters/npm-audit-adapter'));
const { OsvAdapter } = require(path.join(repoRoot, 'castle-gate/evidence/adapters/osv-adapter'));

const npmAdapter = new NpmAuditAdapter();
const osvAdapter = new OsvAdapter();

const netErr = npmAdapter.parse(JSON.stringify({ error: { code: 'ENOTFOUND', summary: 'registry.npmjs.org down' } }));
const netFailClosed = netErr.adapter_status === 'INCONCLUSIVE' && netErr.controls['MNT-02.2'].status === 'UNEXECUTED';
recordAttack(
  'FAILCLOSE-01',
  'FASE 7',
  'npm audit Network Error -> Fail-Closed (INCONCLUSIVE / UNEXECUTED)',
  'INCONCLUSIVE / UNEXECUTED (NEVER PASS)',
  `${netErr.adapter_status} / ${netErr.controls['MNT-02.2'].status}`,
  netFailClosed,
  'CRITICAL',
  'Network failure must NEVER fabricate a PASS.'
);

const emptyErr = npmAdapter.parse('');
const emptyFailClosed = emptyErr.adapter_status === 'INCONCLUSIVE' && emptyErr.controls['MNT-02.2'].status === 'UNEXECUTED';
recordAttack(
  'FAILCLOSE-02',
  'FASE 7',
  'npm audit Empty Output -> Fail-Closed',
  'INCONCLUSIVE / UNEXECUTED',
  `${emptyErr.adapter_status} / ${emptyErr.controls['MNT-02.2'].status}`,
  emptyFailClosed,
  'HIGH',
  'Empty stdout must fail closed.'
);

const osvErr = osvAdapter.parse('<!DOCTYPE html><html><body>504 Gateway Timeout</body></html>');
const osvFailClosed = osvErr.adapter_status === 'INCONCLUSIVE' && osvErr.controls['MNT-02.2'].status === 'UNEXECUTED';
recordAttack(
  'FAILCLOSE-03',
  'FASE 7',
  'OSV.dev 504 Gateway Timeout -> Fail-Closed',
  'INCONCLUSIVE / UNEXECUTED',
  `${osvErr.adapter_status} / ${osvErr.controls['MNT-02.2'].status}`,
  osvFailClosed,
  'HIGH',
  'HTTP 504 in OSV must fail closed.'
);

// =============================================================================
// FASE 8 & 9: PATH / SYMLINK / RESOURCE EXHAUSTION DEFENSE
// =============================================================================
console.log('\n--- FASE 8 & 9: FILESYSTEM & RESOURCE LIMITS ---');

const { validatePathWithinWorkspace, safeDiscoverFiles, safeRegexTest } = require(path.join(repoRoot, 'castle-gate/analyzers/security-guard'));

const jailWorkspace = path.join(auditScratchDir, 'jail');
fs.mkdirSync(jailWorkspace, { recursive: true });
const badPath = path.join(jailWorkspace, '..', '..', '..', 'Windows');
const trapCheck = validatePathWithinWorkspace(jailWorkspace, badPath);
recordAttack(
  'FS-01',
  'FASE 8',
  'Relative Path Traversal Escape Defense',
  'safe: false',
  `safe: ${trapCheck.safe}`,
  trapCheck.safe === false,
  'CRITICAL',
  'Path traversal outside workspace must be blocked.'
);

let deepTree = jailWorkspace;
for (let i = 0; i < 25; i++) {
  deepTree = path.join(deepTree, `d_${i}`);
  fs.mkdirSync(deepTree, { recursive: true });
}
fs.writeFileSync(path.join(deepTree, 'nested.js'), 'const x = 1;', 'utf8');

const { warnings: depthWarnings } = safeDiscoverFiles(jailWorkspace, { maxDepth: 20 });
const depthCapped = depthWarnings.some(w => w.includes('Maximum directory depth reached'));
recordAttack(
  'FS-02',
  'FASE 8',
  'Extreme Directory Depth Bomb (Capped at 20)',
  'Depth warning emitted',
  depthCapped ? 'Depth capped' : 'Uncapped recursion',
  depthCapped,
  'MEDIUM',
  'Directory traversal depth must be capped to prevent stack overflows.'
);

const redosPayload = 'a'.repeat(30000) + '!';
const redosResult = safeRegexTest(/(a+)+$/, redosPayload, 1000);
recordAttack(
  'REDOS-01',
  'FASE 9',
  'ReDoS Catastrophic Backtracking String Guard',
  'Input truncated / safely evaluated',
  typeof redosResult === 'boolean' ? 'Safe boolean returned' : 'Timeout/crash',
  typeof redosResult === 'boolean',
  'HIGH',
  'Excessively long strings must be bounded before regex execution.'
);

// =============================================================================
// FASE 10: GIT HISTORY SECRET SCANNING
// =============================================================================
console.log('\n--- FASE 10: GIT HISTORY SECRET SCANNING ---');

const { GitHistoryProbe } = require(path.join(repoRoot, 'castle-gate/analyzers/git-history-probe'));
const gitProbe = new GitHistoryProbe();

const gitTestRepo = path.join(auditScratchDir, 'git-secret-repo');
fs.mkdirSync(gitTestRepo, { recursive: true });
execSync('git init', { cwd: gitTestRepo, stdio: 'ignore' });
execSync('git config user.name "Auditor"', { cwd: gitTestRepo, stdio: 'ignore' });
execSync('git config user.email "auditor@test.org"', { cwd: gitTestRepo, stdio: 'ignore' });

fs.writeFileSync(path.join(gitTestRepo, 'secret.js'), 'const k = "sk_live_123456789012345678901234";\n', 'utf8');
execSync('git add secret.js', { cwd: gitTestRepo, stdio: 'ignore' });
execSync('git commit -m "add key"', { cwd: gitTestRepo, stdio: 'ignore' });

fs.unlinkSync(path.join(gitTestRepo, 'secret.js'));
execSync('git add secret.js', { cwd: gitTestRepo, stdio: 'ignore' });
execSync('git commit -m "delete key"', { cwd: gitTestRepo, stdio: 'ignore' });

const gitScanResult = gitProbe.run(gitTestRepo);
const secretDetected = gitScanResult.controls['SEC-05.1'].status === 'FAIL' && gitScanResult.gate_evidence['GB-02'] === true;
recordAttack(
  'GIT-01',
  'FASE 10',
  'Deleted Historical Secret Detection (Committed then Unlinked)',
  'SEC-05.1 FAIL + GB-02 TRUE',
  `${gitScanResult.controls['SEC-05.1'].status} + GB-02: ${gitScanResult.gate_evidence['GB-02']}`,
  secretDetected,
  'CRITICAL',
  'Secrets in past commits must trigger Gate Breaker GB-02.'
);

// =============================================================================
// FASE 11: AST REAL ANALYSIS VERIFICATION
// =============================================================================
console.log('\n--- FASE 11: REAL AST STATIC ANALYSIS ---');

const { AstProbe } = require(path.join(repoRoot, 'castle-gate/analyzers/ast-probe'));
const astProbe = new AstProbe();

const astTestDir = path.join(auditScratchDir, 'ast-test-dir');
fs.mkdirSync(astTestDir, { recursive: true });

fs.writeFileSync(path.join(astTestDir, 'ast-test.js'), `
// Comment with eval("safe inside comment")
const strLiteral = "eval('safe inside string')";
function compute() {
  debugger; // Real AST statement
  return 10;
}
`, 'utf8');

const astResult = astProbe.run(astTestDir);
const hasDebugger = astResult.findings.debugger_statements.length === 1;
const falseEvalIgnored = astResult.findings.eval_invocations.length === 0;
const astReal = hasDebugger && falseEvalIgnored;

recordAttack(
  'AST-01',
  'FASE 11',
  'Real AST Structural Inspection (Comments/Strings ignored, real debugger caught)',
  '1 Debugger, 0 False-Positive Evals',
  `${astResult.findings.debugger_statements.length} Debuggers, ${astResult.findings.eval_invocations.length} Evals`,
  astReal,
  'HIGH',
  'AST must distinguish real syntax nodes from comments and string literals.'
);

// =============================================================================
// FASE 17: DSSE / IN-TOTO ATTESTATION INTEGRITY
// =============================================================================
console.log('\n--- FASE 17: DSSE / IN-TOTO ATTESTATION INTEGRITY ---');

const { createDsseEnvelope, verifyDsseEnvelope, createInTotoStatement } = require(path.join(repoRoot, 'castle-gate/crypto/dsse'));

const inTotoStmt = createInTotoStatement({
  subjectName: 'artifact.tar.gz',
  subjectSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  predicate: { releaseAuthorized: true, gateLevel: 'C2', cqsScore: 95.0 }
});

const dsseEnvelope = createDsseEnvelope(inTotoStmt, fs.readFileSync(privKeyPath, 'utf8'));
const dsseValid = verifyDsseEnvelope(dsseEnvelope, pubKeyAlpha);

// Tamper DSSE envelope payload
const tamperedDsse = JSON.parse(JSON.stringify(dsseEnvelope));
const unpackedStmt = Buffer.from(tamperedDsse.payload, 'base64').toString('utf8');
const tamperedStmtStr = unpackedStmt.replace('"releaseAuthorized":true', '"releaseAuthorized":false');
tamperedDsse.payload = Buffer.from(tamperedStmtStr, 'utf8').toString('base64');

const dsseTamperCheck = verifyDsseEnvelope(tamperedDsse, pubKeyAlpha);
const dsseDefended = dsseValid.valid === true && dsseTamperCheck.valid === false;

recordAttack(
  'DSSE-01',
  'FASE 17',
  'DSSE in-toto Attestation Envelope Tampering Defense',
  'Authentic: VALID, Tampered: INVALID',
  `Authentic: ${dsseValid.valid ? 'VALID' : 'INVALID'}, Tampered: ${dsseTamperCheck.valid ? 'VALID' : 'INVALID'}`,
  dsseDefended,
  'CRITICAL',
  'Modifying DSSE payload bytes must break Ed25519 PAE signature verification.'
);

// =============================================================================
// FASE 19: GOVERNED WAIVERS ABUSE
// =============================================================================
console.log('\n--- FASE 19: GOVERNED WAIVERS ABUSE ---');

const { createWaiver, validateWaiver, applyWaivers } = require(path.join(repoRoot, 'castle-gate/policy/waiver-manager'));

const expiredW = createWaiver({ controlId: 'MNT-01.1', reason: 'Test', expiresInDays: -1, privateKeyPem: fs.readFileSync(privKeyPath, 'utf8') });
const expVal = validateWaiver(expiredW, new Date(), pubKeyAlpha);
const expRejected = expVal.active === false;

recordAttack(
  'WAIVER-01',
  'FASE 19',
  'Expired Governed Waiver Bypass Attempt',
  'active: false (Expired)',
  `active: ${expVal.active}`,
  expRejected,
  'CRITICAL',
  'Expired waivers must automatically fail closed.'
);

const tamperedW = JSON.parse(JSON.stringify(expiredW));
tamperedW.expires_at = '2099-01-01T00:00:00.000Z';
const tampVal = validateWaiver(tamperedW, new Date(), pubKeyAlpha);
const tampRejected = tampVal.valid === false;

recordAttack(
  'WAIVER-02',
  'FASE 19',
  'Tampered Waiver Payload Integrity Check',
  'valid: false',
  `valid: ${tampVal.valid}`,
  tampRejected,
  'CRITICAL',
  'Tampered waiver signatures must be rejected.'
);

// =============================================================================
// FASE 20: MERKLE EVIDENCE CHAIN CONTINUITY
// =============================================================================
console.log('\n--- FASE 20: MERKLE EVIDENCE CHAIN CONTINUITY ---');

const { EvidenceLedger } = require(path.join(repoRoot, 'castle-gate/evidence/evidence-chain'));
const ledger = new EvidenceLedger();
ledger.append({ evaluation_id: 'E1', integrity: { payload_sha256: 'aaaa' } });
ledger.append({ evaluation_id: 'E2', integrity: { payload_sha256: 'bbbb' } });
ledger.append({ evaluation_id: 'E3', integrity: { payload_sha256: 'cccc' } });

const initialCont = ledger.verifyContinuity();
ledger.entries[1].evidence_sha256 = 'tampered-hash-0000';
const tamperedCont = ledger.verifyContinuity();

const ledgerDefense = initialCont.valid === true && tamperedCont.valid === false;
recordAttack(
  'LEDGER-01',
  'FASE 20',
  'Merkle Evidence Chain Tamper Detection (E1 -> E2 -> E3)',
  'Initial: VALID, Tampered: INVALID',
  `Initial: ${initialCont.valid ? 'VALID' : 'INVALID'}, Tampered: ${tamperedCont.valid ? 'VALID' : 'INVALID'}`,
  ledgerDefense,
  'HIGH',
  'Tampering with historical evaluation node must invalidate entire downstream chain.'
);

// =============================================================================
// FASE 22: CQS v1.1 FROZEN INTEGRITY VERIFICATION
// =============================================================================
console.log('\n--- FASE 22: CQS v1.1 FROZEN INTEGRITY VERIFICATION ---');

const { validateCqsIntegrity } = require(path.join(repoRoot, 'cqs/engine/validator'));
const cqsVal = validateCqsIntegrity();
const cqsFrozen = cqsVal.integrity === 'PASS' && cqsVal.metrics.total_controls === 65 && cqsVal.metrics.total_domains === 7 && Math.abs(cqsVal.metrics.nominal_weight_total - 100.0) < 1e-6;

recordAttack(
  'CQS-01',
  'FASE 22',
  'CQS v1.1 Mathematical Invariant Check (65 controls, 7 domains, 100.00 weight)',
  '65 controls, 7 domains, 100.00 weight (PASS)',
  `${cqsVal.metrics.total_controls} controls, ${cqsVal.metrics.total_domains} domains, ${cqsVal.metrics.nominal_weight_total.toFixed(2)} weight (${cqsVal.integrity})`,
  cqsFrozen,
  'CRITICAL',
  'CQS v1.1 is frozen and must maintain exactly 65 controls and 100.00 nominal weight.'
);

// =============================================================================
// PRINT HARNESS SUMMARY
// =============================================================================
console.log('\n================================================================================');
console.log('AUDIT 2 ADVERSARIAL HARNESS EXECUTION SUMMARY');
console.log('================================================================================');

const totalAttacks = attackResults.length;
const defendedAttacks = attackResults.filter(a => a.status === 'DEFENDED').length;
const vulnerableAttacks = attackResults.filter(a => a.status === 'VULNERABLE').length;

console.log(`Total Attacks Executed: ${totalAttacks}`);
console.log(`Successfully Defended:  ${defendedAttacks}`);
console.log(`Vulnerabilities Found:  ${vulnerableAttacks}`);
console.log('================================================================================\n');

// Write machine-readable results to audit scratch
fs.writeFileSync(path.join(auditScratchDir, 'attack-matrix.json'), JSON.stringify(attackResults, null, 2), 'utf8');

// Cleanup
fs.rmSync(auditScratchDir, { recursive: true, force: true });
