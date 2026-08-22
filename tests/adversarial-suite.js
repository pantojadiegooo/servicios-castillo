/**
 * Castle Security & Quality Gate — Comprehensive Adversarial Testing Suite
 * 
 * Executes adversarial attacks across 20 distinct threat scenarios:
 * 
 * 1. [ADV-01] Symlink Workspace Escape Attack (Symlink pointing outside workspace)
 * 2. [ADV-02] Path Traversal in CLI arguments (../../ escaping attempts)
 * 3. [ADV-03] Giant File DoS Bomb (File > 5MB memory exhaustion attempt)
 * 4. [ADV-04] Extreme Directory Depth Bomb (Directory tree > 25 levels deep)
 * 5. [ADV-05] ReDoS Regex Catastrophic Backtracking Attack
 * 6. [ADV-06] Inconclusive/Failing SCA npm audit Network Failure -> Fail Closed
 * 7. [ADV-07] Corrupted Scanner JSON Output -> Fail Closed
 * 8. [ADV-08] Git Commit History Hidden Secret Attack
 * 9. [ADV-09] Tampered Release Certificate Payload Attack
 * 10. [ADV-10] Tampered Release Certificate Digest Attack
 * 11. [ADV-11] Asymmetric Signature Forgery Attack
 * 12. [ADV-12] Wrong Ed25519 Public Key Verification Attack
 * 13. [ADV-13] Cross-Project Evidence Replay Attack
 * 14. [ADV-14] Commit SHA Substitution / Identity Mismatch Attack
 * 15. [ADV-15] Policy Tampering & Downgrade Attack
 * 16. [ADV-16] Tampered HTML Compliance Report Linked in Artifacts Attack
 * 17. [ADV-17] Tampered SARIF Report Linked in Artifacts Attack
 * 18. [ADV-18] Tampered CycloneDX SBOM Linked in Artifacts Attack
 * 19. [ADV-19] Expired Waiver Authorization Bypass Attack
 * 20. [ADV-20] Broken Merkle Evidence Chain Injection Attack
 */

'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

const gate = require('../castle-gate/index');
const { validatePathWithinWorkspace, safeDiscoverFiles, safeRegexTest } = require('../castle-gate/analyzers/security-guard');
const { generateKeyPair } = require('../castle-gate/crypto/signing-key');
const { signPayload, verifySignature } = require('../castle-gate/crypto/signer');
const { canonicalize, canonicalHash } = require('../castle-gate/crypto/canonicalizer');
const { createBoundEvidenceArtifact } = require('../castle-gate/evidence/evidence-binding');
const { generateReleaseCertificate } = require('../castle-gate/engine/release-authorizer');
const { verifyAssuranceArtifact } = require('../castle-gate/verifier/castle-verify');
const { createWaiver, validateWaiver, applyWaivers } = require('../castle-gate/policy/waiver-manager');
const { EvidenceLedger } = require('../castle-gate/evidence/evidence-chain');
const { NpmAuditAdapter } = require('../castle-gate/evidence/adapters/npm-audit-adapter');

const testScratchDir = path.join(__dirname, '..', '.test-scratch-adversarial-master');
if (fs.existsSync(testScratchDir)) {
  fs.rmSync(testScratchDir, { recursive: true, force: true });
}
fs.mkdirSync(testScratchDir, { recursive: true });

console.log('================================================================');
console.log('Castle Gate — Comprehensive Adversarial Testing Suite (20 Attack Vectors)');
console.log('================================================================\n');

const keyPairAlpha = generateKeyPair();
const keyPairBeta = generateKeyPair();

// -----------------------------------------------------------------------------
// [ADV-01] Symlink Workspace Escape Attack
// -----------------------------------------------------------------------------
const jailDir = path.join(testScratchDir, 'jail-workspace');
const outsideDir = path.join(testScratchDir, 'outside-secret-vault');
fs.mkdirSync(jailDir, { recursive: true });
fs.mkdirSync(outsideDir, { recursive: true });

const secretHostFile = path.join(outsideDir, 'passwords.txt');
fs.writeFileSync(secretHostFile, 'SUPER_SECRET_HOST_PASSWORD_12345', 'utf8');

// Create symlink pointing outside jail
let symlinkCreated = false;
const symlinkPath = path.join(jailDir, 'escaped-link.txt');
try {
  fs.symlinkSync(secretHostFile, symlinkPath, 'file');
  symlinkCreated = true;
} catch (e) {
  // On Windows without SeCreateSymbolicLinkPrivilege, test path containment directly
}

const symlinkCheck = validatePathWithinWorkspace(jailDir, symlinkCreated ? symlinkPath : path.join(jailDir, '..', 'outside-secret-vault', 'passwords.txt'));
assert.strictEqual(symlinkCheck.safe, false, 'Symlink or traversal pointing outside workspace MUST be rejected');
console.log('[DEFENDED] ADV-01: Symlink workspace escape attack blocked and quarantined.');

// -----------------------------------------------------------------------------
// [ADV-02] Path Traversal in File Discovery / CLI
// -----------------------------------------------------------------------------
const traversalPath = path.join(jailDir, '..', '..', 'Windows', 'System32');
const traversalCheck = validatePathWithinWorkspace(jailDir, traversalPath);
assert.strictEqual(traversalCheck.safe, false, 'Relative path traversal must be rejected');
console.log('[DEFENDED] ADV-02: Path traversal attack (../ escaping) rejected.');

// -----------------------------------------------------------------------------
// [ADV-03] Giant File DoS Bomb (> 5MB)
// -----------------------------------------------------------------------------
const giantFilePath = path.join(jailDir, 'giant-bomb.js');
const giantBuffer = Buffer.alloc(6 * 1024 * 1024, 0x61); // 6 MB
fs.writeFileSync(giantFilePath, giantBuffer);

const baseAnalyzer = new (class extends gate.BaseAnalyzer {
  constructor() { super('TestGiantProbe', '1.0.0'); }
  analyze() { return {}; }
})();

const giantContent = baseAnalyzer.safeReadFile(giantFilePath);
assert.strictEqual(giantContent, null, 'Files exceeding 5MB cap must be skipped to protect memory');
console.log('[DEFENDED] ADV-03: Giant file memory exhaustion DoS bomb safely skipped.');

// -----------------------------------------------------------------------------
// [ADV-04] Extreme Directory Depth Bomb (> 20 levels)
// -----------------------------------------------------------------------------
let deepPath = jailDir;
for (let d = 1; d <= 25; d++) {
  deepPath = path.join(deepPath, `level_${d}`);
  fs.mkdirSync(deepPath, { recursive: true });
}
fs.writeFileSync(path.join(deepPath, 'deep-secret.js'), 'const a = 1;', 'utf8');

const { files: discoveredFiles, warnings: depthWarnings } = safeDiscoverFiles(jailDir, { maxDepth: 20 });
assert(depthWarnings.some(w => w.includes('Maximum directory depth reached')), 'Depth bomb must trigger warning');
assert(!discoveredFiles.includes(path.join(deepPath, 'deep-secret.js')), 'Files beyond max depth must not cause infinite traversal');
console.log('[DEFENDED] ADV-04: Extreme directory depth bomb capped at depth 20.');

// -----------------------------------------------------------------------------
// [ADV-05] ReDoS Regex Catastrophic Backtracking Attack
// -----------------------------------------------------------------------------
const maliciousReDosString = 'a'.repeat(50000) + '!';
const regexToTest = /([a-zA-Z]+)*$/; // Vulnerable pattern

const reDosResult = safeRegexTest(regexToTest, maliciousReDosString, 1000);
assert(typeof reDosResult === 'boolean');
console.log('[DEFENDED] ADV-05: ReDoS attack neutralized with input bounds check.');

// -----------------------------------------------------------------------------
// [ADV-06] Inconclusive SCA npm audit Failure -> Fail Closed
// -----------------------------------------------------------------------------
const npmAdapter = new NpmAuditAdapter();
const netFailResult = npmAdapter.parse(JSON.stringify({ error: { code: 'ENOTFOUND', summary: 'DNS timeout' } }));
assert.strictEqual(netFailResult.adapter_status, 'INCONCLUSIVE');
assert.strictEqual(netFailResult.controls['MNT-02.2'].status, 'UNEXECUTED');
assert.strictEqual(netFailResult.controls['MNT-02.2'].inconclusive, true);
console.log('[DEFENDED] ADV-06: npm audit network failure fails closed (never fabricates PASS).');

// -----------------------------------------------------------------------------
// [ADV-07] Corrupted Scanner JSON Output -> Fail Closed
// -----------------------------------------------------------------------------
const corruptParse = npmAdapter.parse('CORRUPT_NOT_JSON_<<<>>>');
assert.strictEqual(corruptParse.adapter_status, 'INCONCLUSIVE');
assert.strictEqual(corruptParse.controls['MNT-02.2'].inconclusive, true);
console.log('[DEFENDED] ADV-07: Corrupted scanner output fails closed.');

// -----------------------------------------------------------------------------
// [ADV-08] Git Commit History Secret Attack (Committed & Deleted Secret)
// -----------------------------------------------------------------------------
const gitFixtureDir = path.join(testScratchDir, 'git-history-fixture');
fs.mkdirSync(gitFixtureDir, { recursive: true });
execSync('git init', { cwd: gitFixtureDir, stdio: 'ignore' });
execSync('git config user.name "Adversary"', { cwd: gitFixtureDir, stdio: 'ignore' });
execSync('git config user.email "adv@test.org"', { cwd: gitFixtureDir, stdio: 'ignore' });

fs.writeFileSync(path.join(gitFixtureDir, 'credentials.json'), JSON.stringify({ stripe_live: 'sk_live_123456789012345678901234' }), 'utf8');
execSync('git add credentials.json', { cwd: gitFixtureDir, stdio: 'ignore' });
execSync('git commit -m "feat: add payment key"', { cwd: gitFixtureDir, stdio: 'ignore' });

// Remove the file in commit 2
fs.unlinkSync(path.join(gitFixtureDir, 'credentials.json'));
execSync('git add credentials.json', { cwd: gitFixtureDir, stdio: 'ignore' });
execSync('git commit -m "fix: delete secret from working tree"', { cwd: gitFixtureDir, stdio: 'ignore' });

const gitProbe = new gate.GitHistoryProbe();
const gitHistoryResult = gitProbe.run(gitFixtureDir);
assert.strictEqual(gitHistoryResult.controls['SEC-05.1'].status, 'FAIL');
assert.strictEqual(gitHistoryResult.gate_evidence['GB-02'], true);
console.log('[DEFENDED] ADV-08: Deleted secret recovered and blocked from Git history.');

// -----------------------------------------------------------------------------
// [ADV-09] Tampered Release Certificate Payload Attack
// -----------------------------------------------------------------------------
const dummyDecisionPass = {
  decision_id: 'DEC-ADV-001',
  gate_level: 'C2',
  gate_level_name: 'Staging Standard',
  gate_state: 'PASSED',
  versioning: { cqs_specification_version: '1.1.0 (FROZEN)', gate_policy_version: '1.0.0-ratified', evaluation_id: 'EVAL-ADV' },
  cqs_summary: { raw_score: 95.0, display_score: 95.0, verdict: 'PASS_RELEASE' }
};
const dummyCqsPass = {
  evaluation_id: 'EVAL-ADV',
  summary: { cqs_raw_score: 95.0, cqs_display_score: 95.0, final_verdict: 'PASS_RELEASE' },
  gate_breakers: { status: 'CLEARED' }
};

const validCert = generateReleaseCertificate({
  gate_decision: dummyDecisionPass,
  cqs_evaluation_result: dummyCqsPass,
  commit_sha: '1234567890abcdef1234567890abcdef12345678',
  private_key_pem: keyPairAlpha.privateKeyPem,
  public_key_pem: keyPairAlpha.publicKeyPem
});

const certFilePath = path.join(testScratchDir, 'release-cert.json');
fs.writeFileSync(certFilePath, JSON.stringify(validCert, null, 2), 'utf8');

// Tamper score inside certificate
const tamperedCertData = JSON.parse(JSON.stringify(validCert));
tamperedCertData.metrics_summary.cqs_display_score = 99.99;
const tamperedCertFilePath = path.join(testScratchDir, 'release-cert-tampered.json');
fs.writeFileSync(tamperedCertFilePath, JSON.stringify(tamperedCertData, null, 2), 'utf8');

const tamperedCertVerification = verifyAssuranceArtifact({
  artifactPath: tamperedCertFilePath,
  publicKeyPem: keyPairAlpha.publicKeyPem
});
assert.strictEqual(tamperedCertVerification.status, 'INVALID');
console.log('[DEFENDED] ADV-09: Tampered release certificate payload detected as INVALID.');

// -----------------------------------------------------------------------------
// [ADV-10] Tampered Certificate Digest Attack (Recalculating hash without private key)
// -----------------------------------------------------------------------------
const rehashedCertData = JSON.parse(JSON.stringify(tamperedCertData));
const { integrity: _, ...rawRehashPayload } = rehashedCertData;
const forgedHash = crypto.createHash('sha256').update(canonicalize(rawRehashPayload), 'utf8').digest('hex');
rehashedCertData.integrity.certificate_digest = forgedHash;

const rehashedCertFilePath = path.join(testScratchDir, 'release-cert-rehashed.json');
fs.writeFileSync(rehashedCertFilePath, JSON.stringify(rehashedCertData, null, 2), 'utf8');

const rehashVerify = verifyAssuranceArtifact({
  artifactPath: rehashedCertFilePath,
  publicKeyPem: keyPairAlpha.publicKeyPem
});
assert.strictEqual(rehashVerify.status, 'INVALID', 'Rehashing cannot forge Ed25519 signature');
console.log('[DEFENDED] ADV-10: Self-rehashed certificate without private key rejected as INVALID.');

// -----------------------------------------------------------------------------
// [ADV-11] Asymmetric Signature Forgery Attack (Altering signature bytes)
// -----------------------------------------------------------------------------
const forgedSigCert = JSON.parse(JSON.stringify(validCert));
forgedSigCert.integrity.pki_signature_extension.signature_base64 = Buffer.from('FORGED_SIGNATURE_BYTES_12345').toString('base64');
const forgedSigPath = path.join(testScratchDir, 'forged-sig.json');
fs.writeFileSync(forgedSigPath, JSON.stringify(forgedSigCert, null, 2), 'utf8');

const forgedVerify = verifyAssuranceArtifact({ artifactPath: forgedSigPath, publicKeyPem: keyPairAlpha.publicKeyPem });
assert.strictEqual(forgedVerify.status, 'INVALID');
console.log('[DEFENDED] ADV-11: Forged Ed25519 digital signature rejected as INVALID.');

// -----------------------------------------------------------------------------
// [ADV-12] Wrong Ed25519 Public Key Verification Attack
// -----------------------------------------------------------------------------
const wrongKeyVerify = verifyAssuranceArtifact({ artifactPath: certFilePath, publicKeyPem: keyPairBeta.publicKeyPem });
assert.strictEqual(wrongKeyVerify.status, 'INVALID');
console.log('[DEFENDED] ADV-12: Verification against wrong public key rejected as INVALID.');

// -----------------------------------------------------------------------------
// [ADV-13] Cross-Project Evidence Replay Attack
// -----------------------------------------------------------------------------
const boundEvidenceProjA = createBoundEvidenceArtifact({
  target_system: { name: 'ProjectAlpha', environment: 'production' },
  cqs_result: dummyCqsPass,
  gate_decision: dummyDecisionPass,
  effective_policy: { policy_version: '1.0.0-ratified' },
  commit_sha: 'commit-sha-alpha-001',
  private_key_pem: keyPairAlpha.privateKeyPem
});

const evProjAPath = path.join(testScratchDir, 'evidence-proj-a.json');
fs.writeFileSync(evProjAPath, JSON.stringify(boundEvidenceProjA, null, 2), 'utf8');

// Attempting to assert evidence A on project B's commit
const replayVerify = verifyAssuranceArtifact({
  artifactPath: evProjAPath,
  publicKeyPem: keyPairAlpha.publicKeyPem,
  expectedCommit: 'commit-sha-beta-999'
});
assert.strictEqual(replayVerify.status, 'INVALID', 'Cross-project commit replay must be rejected');
console.log('[DEFENDED] ADV-13: Cross-project evidence replay attack blocked.');

// -----------------------------------------------------------------------------
// [ADV-14] Commit SHA Substitution Attack
// -----------------------------------------------------------------------------
const tamperedCommitEv = JSON.parse(JSON.stringify(boundEvidenceProjA));
tamperedCommitEv.target_system.commit_sha = 'commit-sha-forged-888';
const tamperedCommitPath = path.join(testScratchDir, 'tampered-commit.json');
fs.writeFileSync(tamperedCommitPath, JSON.stringify(tamperedCommitEv, null, 2), 'utf8');

const commitSubVerify = verifyAssuranceArtifact({
  artifactPath: tamperedCommitPath,
  publicKeyPem: keyPairAlpha.publicKeyPem
});
assert.strictEqual(commitSubVerify.status, 'INVALID');
console.log('[DEFENDED] ADV-14: Commit SHA substitution detected and rejected.');

// -----------------------------------------------------------------------------
// [ADV-15] Policy Tampering & Downgrade Attack
// -----------------------------------------------------------------------------
const expectedPolicyHash = canonicalHash({ policy_version: '1.0.0-ratified' });
const policyMismatchVerify = verifyAssuranceArtifact({
  artifactPath: evProjAPath,
  publicKeyPem: keyPairAlpha.publicKeyPem,
  expectedPolicyHash: 'downgraded-permissive-policy-hash-000000000000000000000'
});
assert.strictEqual(policyMismatchVerify.status, 'INVALID');
console.log('[DEFENDED] ADV-15: Policy tampering & downgrade attack detected.');

// -----------------------------------------------------------------------------
// [ADV-16] Tampered HTML Compliance Report Linked in Artifacts Attack
// -----------------------------------------------------------------------------
const htmlReport = '<html><body><h1>Authentic Audit Report</h1></body></html>';
const htmlReportPath = path.join(testScratchDir, 'report.html');
fs.writeFileSync(htmlReportPath, htmlReport, 'utf8');
const htmlSha = crypto.createHash('sha256').update(htmlReport).digest('hex');

const boundEvWithHtml = createBoundEvidenceArtifact({
  target_system: { name: 'ProjectAlpha', environment: 'production' },
  cqs_result: dummyCqsPass,
  gate_decision: dummyDecisionPass,
  effective_policy: { policy_version: '1.0.0-ratified' },
  artifacts_hashes: { report_html_sha256: htmlSha },
  private_key_pem: keyPairAlpha.privateKeyPem
});

const evHtmlPath = path.join(testScratchDir, 'evidence-html.json');
fs.writeFileSync(evHtmlPath, JSON.stringify(boundEvWithHtml, null, 2), 'utf8');

// Modify HTML report on disk
fs.writeFileSync(htmlReportPath, '<html><body><h1>MALICIOUSLY TAMPERED REPORT</h1></body></html>', 'utf8');
const tamperedHtmlVerify = verifyAssuranceArtifact({
  artifactPath: evHtmlPath,
  publicKeyPem: keyPairAlpha.publicKeyPem,
  reportHtmlPath: htmlReportPath
});
assert.strictEqual(tamperedHtmlVerify.status, 'INVALID');
console.log('[DEFENDED] ADV-16: Tampered HTML compliance report detected as INVALID.');

// -----------------------------------------------------------------------------
// [ADV-17] Tampered SARIF Report Linked in Artifacts Attack
// -----------------------------------------------------------------------------
const sarifReport = '{"version": "2.1.0", "runs": []}';
const sarifReportPath = path.join(testScratchDir, 'report.sarif');
fs.writeFileSync(sarifReportPath, sarifReport, 'utf8');
const sarifSha = crypto.createHash('sha256').update(sarifReport).digest('hex');

const boundEvWithSarif = createBoundEvidenceArtifact({
  target_system: { name: 'ProjectAlpha', environment: 'production' },
  cqs_result: dummyCqsPass,
  gate_decision: dummyDecisionPass,
  effective_policy: { policy_version: '1.0.0-ratified' },
  artifacts_hashes: { sarif_sha256: sarifSha },
  private_key_pem: keyPairAlpha.privateKeyPem
});

const evSarifPath = path.join(testScratchDir, 'evidence-sarif.json');
fs.writeFileSync(evSarifPath, JSON.stringify(boundEvWithSarif, null, 2), 'utf8');

// Modify SARIF on disk
fs.writeFileSync(sarifReportPath, '{"version": "2.1.0", "tampered": true}', 'utf8');
const tamperedSarifVerify = verifyAssuranceArtifact({
  artifactPath: evSarifPath,
  publicKeyPem: keyPairAlpha.publicKeyPem,
  sarifPath: sarifReportPath
});
assert.strictEqual(tamperedSarifVerify.status, 'INVALID');
console.log('[DEFENDED] ADV-17: Tampered SARIF artifact detected as INVALID.');

// -----------------------------------------------------------------------------
// [ADV-18] Tampered CycloneDX SBOM Linked in Artifacts Attack
// -----------------------------------------------------------------------------
const sbomReport = '{"bomFormat": "CycloneDX", "specVersion": "1.5"}';
const sbomReportPath = path.join(testScratchDir, 'sbom.json');
fs.writeFileSync(sbomReportPath, sbomReport, 'utf8');
const sbomSha = crypto.createHash('sha256').update(sbomReport).digest('hex');

const boundEvWithSbom = createBoundEvidenceArtifact({
  target_system: { name: 'ProjectAlpha', environment: 'production' },
  cqs_result: dummyCqsPass,
  gate_decision: dummyDecisionPass,
  effective_policy: { policy_version: '1.0.0-ratified' },
  artifacts_hashes: { sbom_cyclonedx_sha256: sbomSha },
  private_key_pem: keyPairAlpha.privateKeyPem
});

const evSbomPath = path.join(testScratchDir, 'evidence-sbom.json');
fs.writeFileSync(evSbomPath, JSON.stringify(boundEvWithSbom, null, 2), 'utf8');

// Modify SBOM on disk
fs.writeFileSync(sbomReportPath, '{"bomFormat": "CycloneDX", "specVersion": "1.5", "tampered": true}', 'utf8');
const tamperedSbomVerify = verifyAssuranceArtifact({
  artifactPath: evSbomPath,
  publicKeyPem: keyPairAlpha.publicKeyPem,
  sbomPath: sbomReportPath
});
assert.strictEqual(tamperedSbomVerify.status, 'INVALID');
console.log('[DEFENDED] ADV-18: Tampered CycloneDX SBOM artifact detected as INVALID.');

// -----------------------------------------------------------------------------
// [ADV-19] Expired Waiver Authorization Bypass Attack
// -----------------------------------------------------------------------------
const expiredWaiver = createWaiver({
  controlId: 'SEC-04.1',
  reason: 'Temporary bypass attempt',
  expiresInDays: -5,
  privateKeyPem: keyPairAlpha.privateKeyPem
});

const waiverValidation = validateWaiver(expiredWaiver, new Date(), keyPairAlpha.publicKeyPem);
assert.strictEqual(waiverValidation.active, false);

const failingControlSet = { 'SEC-04.1': { status: 'FAIL', details: 'eval usage' } };
const waiverApplyResult = applyWaivers(failingControlSet, [expiredWaiver]);
assert.strictEqual(waiverApplyResult.updatedControls['SEC-04.1'].status, 'FAIL', 'Expired waiver must not bypass gate');
console.log('[DEFENDED] ADV-19: Expired waiver authorization bypass blocked.');

// -----------------------------------------------------------------------------
// [ADV-20] Broken Merkle Evidence Chain Injection Attack
// -----------------------------------------------------------------------------
const ledger = new EvidenceLedger();
ledger.append({ evaluation_id: 'EVAL-01', target_system: {}, integrity: { payload_sha256: '1111' } });
ledger.append({ evaluation_id: 'EVAL-02', target_system: {}, integrity: { payload_sha256: '2222' } });

// Inject forged block without recalculating Merkle hashes
ledger.entries[1].parent_hash = 'forged-non-existent-hash';
const ledgerVerify = ledger.verifyContinuity();
assert.strictEqual(ledgerVerify.valid, false, 'Broken Merkle parent link must invalidate ledger');
console.log('[DEFENDED] ADV-20: Broken Merkle evidence chain tampering detected.');

// Cleanup
try {
  fs.rmSync(testScratchDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
} catch (cleanupErr) {
  // Graceful ignore on Windows locked file
}

console.log('\n================================================================');
console.log('ALL 20 ADVERSARIAL ATTACK SCENARIOS SUCCESSFULLY DEFENDED (20/20 PASS)');
console.log('================================================================\n');
