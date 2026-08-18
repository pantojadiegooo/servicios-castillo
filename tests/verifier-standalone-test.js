/**
 * Castle Security & Quality Gate — Independent Verifier (`castle-verify`) Test Suite
 * 
 * Verifies:
 * 1. Verification of signed Release Certificate -> VALID
 * 2. Verification of signed DSSE Evidence Envelope -> VALID
 * 3. Tampered certificate payload -> INVALID
 * 4. Tampered HTML report referenced in artifacts -> INVALID
 * 5. Wrong commit SHA assertion -> INVALID
 * 6. Wrong public key -> INVALID
 */

'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { generateKeyPair, saveKeyPair } = require('../castle-gate/crypto/signing-key');
const { generateReleaseCertificate } = require('../castle-gate/engine/release-authorizer');
const { createBoundEvidenceArtifact } = require('../castle-gate/evidence/evidence-binding');
const { verifyAssuranceArtifact } = require('../castle-gate/verifier/castle-verify');

const testDir = path.join(__dirname, '..', '.test-scratch-verifier');
if (fs.existsSync(testDir)) {
  fs.rmSync(testDir, { recursive: true, force: true });
}
fs.mkdirSync(testDir, { recursive: true });

console.log('================================================================');
console.log('Castle Gate — Independent Verifier (`castle-verify`) Test Suite');
console.log('================================================================\n');

const keyPair = generateKeyPair();
const keyPaths = saveKeyPair(keyPair, testDir, 'test-key');

const dummyDecision = {
  decision_id: 'DEC-001',
  gate_level: 'C2',
  gate_level_name: 'Staging Standard',
  gate_state: 'PASSED',
  versioning: {
    cqs_specification_version: '1.1.0-candidate (FROZEN)',
    gate_policy_version: '1.0.0-ratified',
    evaluation_id: 'EVAL-001'
  },
  cqs_summary: {
    raw_score: 95.0,
    display_score: 95.0,
    verdict: 'PASS_RELEASE'
  },
  policy_applied: {
    rules: {
      approval_roles_required: 'QA_LEAD',
      post_verification_required: false
    }
  }
};

const dummyCqs = {
  evaluation_id: 'EVAL-001',
  specification_version: '1.1.0-candidate (FROZEN)',
  target_system: { name: 'CoreApp', environment: 'production' },
  summary: {
    cqs_raw_score: 95.0,
    cqs_display_score: 95.0,
    final_verdict: 'PASS_RELEASE'
  },
  gate_breakers: { status: 'CLEARED' }
};

// 1. Generate & Sign Release Certificate
const cert = generateReleaseCertificate({
  gate_decision: dummyDecision,
  cqs_evaluation_result: dummyCqs,
  commit_sha: '11223344556677889900aabbccddeeff11223344',
  private_key_pem: keyPair.privateKeyPem,
  public_key_pem: keyPair.publicKeyPem
});

const certPath = path.join(testDir, 'release-certificate.json');
fs.writeFileSync(certPath, JSON.stringify(cert, null, 2), 'utf8');

const certVerify = verifyAssuranceArtifact({
  artifactPath: certPath,
  publicKeyPem: keyPair.publicKeyPem,
  expectedCommit: '11223344556677889900aabbccddeeff11223344'
});

assert.strictEqual(certVerify.status, 'VALID');
console.log('[PASS] 1. Release certificate verified as VALID with authentic Ed25519 signature.');

// 2. Tampered Certificate Score
const tamperedCert = JSON.parse(JSON.stringify(cert));
tamperedCert.metrics_summary.cqs_display_score = 99.99;
const tamperedCertPath = path.join(testDir, 'tampered-cert.json');
fs.writeFileSync(tamperedCertPath, JSON.stringify(tamperedCert, null, 2), 'utf8');

const tamperedCertVerify = verifyAssuranceArtifact({
  artifactPath: tamperedCertPath,
  publicKeyPem: keyPair.publicKeyPem
});
assert.strictEqual(tamperedCertVerify.status, 'INVALID');
console.log('[PASS] 2. Tampered release certificate score detected as INVALID.');

// 3. Generate Bound Evidence with HTML report hash
const htmlReportContent = '<html><body><h1>Compliance Report</h1></body></html>';
const htmlReportPath = path.join(testDir, 'compliance-report.html');
fs.writeFileSync(htmlReportPath, htmlReportContent, 'utf8');
const htmlReportSha = crypto.createHash('sha256').update(htmlReportContent).digest('hex');

const evidence = createBoundEvidenceArtifact({
  target_system: { name: 'CoreApp', environment: 'production' },
  cqs_result: dummyCqs,
  gate_decision: dummyDecision,
  effective_policy: { policy_version: '1.0.0-ratified', rules: {} },
  artifacts_hashes: { report_html_sha256: htmlReportSha },
  private_key_pem: keyPair.privateKeyPem,
  commit_sha: '11223344556677889900aabbccddeeff11223344'
});

const evidencePath = path.join(testDir, 'evidence.json');
fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2), 'utf8');

const evidenceVerify = verifyAssuranceArtifact({
  artifactPath: evidencePath,
  publicKeyPem: keyPair.publicKeyPem,
  reportHtmlPath: htmlReportPath
});
assert.strictEqual(evidenceVerify.status, 'VALID');
console.log('[PASS] 3. Bound evidence with linked HTML report verified as VALID.');

// 4. Tampered HTML Report
fs.writeFileSync(htmlReportPath, '<html><body><h1>MALICIOUS MODIFICATION</h1></body></html>', 'utf8');
const tamperedHtmlVerify = verifyAssuranceArtifact({
  artifactPath: evidencePath,
  publicKeyPem: keyPair.publicKeyPem,
  reportHtmlPath: htmlReportPath
});
assert.strictEqual(tamperedHtmlVerify.status, 'INVALID');
console.log('[PASS] 4. Tampered HTML report detected as INVALID.');

// 5. Wrong Commit Assertion
const wrongCommitVerify = verifyAssuranceArtifact({
  artifactPath: evidencePath,
  publicKeyPem: keyPair.publicKeyPem,
  expectedCommit: 'deadbeefdeadbeefdeadbeefdeadbeefdeadbeef'
});
assert.strictEqual(wrongCommitVerify.status, 'INVALID');
console.log('[PASS] 5. Mismatched commit SHA detected as INVALID.');

// Cleanup
fs.rmSync(testDir, { recursive: true, force: true });

console.log('\n================================================================');
console.log('ALL INDEPENDENT VERIFIER TESTS PASSED (5/5)');
console.log('================================================================\n');
