/**
 * Castle Security & Quality Gate — Evidence Supersession & Merkle Chain Test Suite
 * 
 * Verifies:
 * 1. Successive evaluations on the same repository form an immutable cryptographic chain (E1 -> E2 -> E3).
 * 2. Every superseded evaluation remains independently verifiable.
 * 3. Continuity verification across the repository ledger.
 * 4. Tamper detection: inserting an unauthorized evaluation in the middle breaks continuity.
 */

'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { executeCastleGate } = require('../castle-gate/index');
const { EvidenceLedger, GENESIS_PARENT_HASH } = require('../castle-gate/evidence/evidence-chain');
const { verifyReleaseCertificate } = require('../castle-gate/engine/release-authorizer');
const { generateKeyPair } = require('../castle-gate/crypto/signing-key');

console.log('================================================================');
console.log('Castle Gate — Evidence Supersession & Merkle Chain Test Suite (Phase 5 Block 3)');
console.log('================================================================\n');

const keypair = generateKeyPair();
const repoLedger = new EvidenceLedger();

const baseEvidence = {
  'PER-01.1': { status: 'PASS', details: 'LCP ok' },
  'PER-02.1': { status: 'PASS', details: 'TBT ok' },
  'PER-04.1': { status: 'PASS', details: 'Image formats ok' },
  'SEC-01.1': { status: 'PASS', details: 'TLS ok' },
  'SEC-01.2': { status: 'PASS', details: 'HTTPS ok' },
  'SEC-02.1': { status: 'PASS', details: 'CSP ok' },
  'SEC-02.2': { status: 'PASS', details: 'XFO ok' },
  'SEC-02.3': { status: 'PASS', details: 'HSTS ok' },
  'SEC-02.4': { status: 'PASS', details: 'XCTO ok' },
  'SEC-04.1': { status: 'PASS', details: 'Sanitization ok' },
  'ACC-01.1': { status: 'PASS', details: 'Landmarks ok' },
  'ACC-02.1': { status: 'PASS', details: 'Focus ok' },
  'ACC-03.1': { status: 'PASS', details: 'Contrast ok' },
  'SEO-01.1': { status: 'PASS', details: 'Robots ok' },
  'SEO-02.1': { status: 'PASS', details: 'Title ok' },
  'SEO-03.1': { status: 'PASS', details: 'Links ok' },
  'UX-01.1': { status: 'PASS', details: 'Viewport ok' },
  'UX-02.1': { status: 'PASS', details: 'Tap ok' },
  'REL-01.1': { status: 'PASS', details: 'Uptime ok' },
  'REL-02.1': { status: 'PASS', details: 'Error handling ok' },
  'MNT-01.1': { status: 'PASS', details: 'Modularity ok' }
};

// 1. Generate Evaluation 1 (Commit 1)
const eval1Res = executeCastleGate({
  raw_evidence: baseEvidence,
  gate_level: 'C2',
  target_system: { name: 'CoreApp', environment: 'production', commit_sha: '1111111111111111111111111111111111111111' },
  private_key_pem: keypair.privateKeyPem,
  public_key_pem: keypair.publicKeyPem
});
assert.strictEqual(eval1Res.gate_decision.gate_state, 'PASSED');
const cert1 = eval1Res.release_certificate;
const cert1Digest = cert1.integrity.certificate_digest;
repoLedger.append(cert1);

// 2. Generate Evaluation 2 superseding Evaluation 1 (Commit 2)
const eval2Res = executeCastleGate({
  raw_evidence: baseEvidence,
  gate_level: 'C2',
  target_system: { name: 'CoreApp', environment: 'production', commit_sha: '2222222222222222222222222222222222222222' },
  previous_evaluation: {
    evaluation_id: cert1.evaluation_reference.evaluation_id,
    certificate_digest: cert1Digest,
    commit_sha: '1111111111111111111111111111111111111111'
  },
  private_key_pem: keypair.privateKeyPem,
  public_key_pem: keypair.publicKeyPem
});
assert.strictEqual(eval2Res.gate_decision.gate_state, 'PASSED');
const cert2 = eval2Res.release_certificate;
const cert2Digest = cert2.integrity.certificate_digest;
repoLedger.append(cert2);

// 3. Generate Evaluation 3 superseding Evaluation 2 (Commit 3)
const eval3Res = executeCastleGate({
  raw_evidence: baseEvidence,
  gate_level: 'C2',
  target_system: { name: 'CoreApp', environment: 'production', commit_sha: '3333333333333333333333333333333333333333' },
  previous_evaluation: {
    evaluation_id: cert2.evaluation_reference.evaluation_id,
    certificate_digest: cert2Digest,
    commit_sha: '2222222222222222222222222222222222222222'
  },
  private_key_pem: keypair.privateKeyPem,
  public_key_pem: keypair.publicKeyPem
});
assert.strictEqual(eval3Res.gate_decision.gate_state, 'PASSED');
const cert3 = eval3Res.release_certificate;
repoLedger.append(cert3);

// Test 1: Verify all 3 certificates are independently authentic and valid
const v1 = verifyReleaseCertificate(cert1, keypair.publicKeyPem);
const v2 = verifyReleaseCertificate(cert2, keypair.publicKeyPem);
const v3 = verifyReleaseCertificate(cert3, keypair.publicKeyPem);
assert.strictEqual(v1.valid, true);
assert.strictEqual(v2.valid, true);
assert.strictEqual(v3.valid, true);
console.log('[PASS] 1. All 3 successive evaluations (E1, E2, E3) verified authentic independently.');

// Test 2: Verify supersession link integrity
assert.strictEqual(cert2.evaluation_reference.previous_evaluation.certificate_digest, cert1Digest);
assert.strictEqual(cert3.evaluation_reference.previous_evaluation.certificate_digest, cert2Digest);
console.log('[PASS] 2. Supersession links verified: E3 references E2 digest, E2 references E1 digest.');

// Test 3: Verify Ledger Continuity across the 3 evaluations
const continuityResult = repoLedger.verifyContinuity();
assert.strictEqual(continuityResult.valid, true);
assert.strictEqual(continuityResult.total_entries, 3);
console.log('[PASS] 3. Merkle ledger continuity verified across 3 successive evaluations.');

// Test 4: Tamper Detection (Attempt to inject a forged evaluation in position #1)
const tamperedLedger = new EvidenceLedger(JSON.parse(JSON.stringify(repoLedger.entries)));
tamperedLedger.entries[1].evidence_sha256 = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const tamperedContinuity = tamperedLedger.verifyContinuity();
assert.strictEqual(tamperedContinuity.valid, false, 'Tampered ledger entry must fail continuity check');
console.log('[PASS] 4. Tamper detection verified: Altering intermediate evaluation breaks Merkle ledger continuity.');

console.log('\n================================================================');
console.log('ALL EVIDENCE SUPERSESSION TESTS PASSED (4/4)');
console.log('================================================================\n');
