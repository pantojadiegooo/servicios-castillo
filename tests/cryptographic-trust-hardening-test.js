/**
 * Castle Security & Quality Gate — Cryptographic Trust Chain Hardening Test Suite
 * 
 * Verifies:
 * 1. Key Revocation Lifecycle & Fail-Closed Adversarial Protections (1A - 1F).
 * 2. Independent Trust Anchor & Compromised Site Defense (2A - 2C).
 * 3. Secure AES-256-GCM Encrypted Key Backup & Disaster Recovery (3A - 3E).
 * 4. End-to-End Trust Chain Validation (4A).
 * 5. Backward Compatibility with Existing Ratified Certificates (5A).
 */

'use strict';

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const {
  generateKeyPair,
  deriveKeyId,
  saveKeyPair,
  loadKey,
  signPayload,
  verifySignature,
  canonicalize,
  TrustAnchorStore,
  createRevocationManifest,
  validateRevocationManifest,
  checkKeyRevocationStatus,
  createKeyBackup,
  restoreKeyBackup,
  saveKeyBackupToFile,
  verifyAssuranceArtifact,
  executeCastleGate,
  generateReleaseCertificate
} = require('../castle-gate');

console.log('================================================================');
console.log('CASTLE GATE — CRYPTOGRAPHIC TRUST HARDENING TEST SUITE');
console.log('================================================================\n');

const testScratchDir = path.join(__dirname, '..', '.test-crypto-hardening-scratch');
if (fs.existsSync(testScratchDir)) {
  try {
    fs.rmSync(testScratchDir, { recursive: true, force: true });
  } catch (e) {}
}
fs.mkdirSync(testScratchDir, { recursive: true });

// Setup Test Keys
const rootAuthorityKeys = generateKeyPair();
const signerAliceKeys = generateKeyPair();
const compromisedBobKeys = generateKeyPair();
const attackerEveKeys = generateKeyPair();

// Setup Trust Anchor Store with Alice & Bob registered
const trustStore = new TrustAnchorStore([
  {
    key_id: signerAliceKeys.keyId,
    public_key_pem: signerAliceKeys.publicKeyPem,
    identity: { name: 'Alice Technical Lead', role: 'RELEASE_AUTHORITY', scope: 'PRODUCTION' },
    trust_level: 'OFFICIAL_SIGNER'
  },
  {
    key_id: compromisedBobKeys.keyId,
    public_key_pem: compromisedBobKeys.publicKeyPem,
    identity: { name: 'Bob Security Officer', role: 'RELEASE_AUTHORITY', scope: 'PRODUCTION' },
    trust_level: 'OFFICIAL_SIGNER'
  }
], {
  authority: 'Grupo Castillo Cryptographic Root of Trust',
  store_id: 'TRUST-STORE-ROOT-001'
});

const trustStorePath = path.join(testScratchDir, 'trust-anchors.json');
trustStore.saveToFile(trustStorePath);

// Helper to create a signed mock release certificate
function createMockCertificate(keyPair, issuedAt, overrides = {}) {
  const payload = {
    schema_version: '2.0.0-assurance',
    certificate_id: `REL-CERT-TEST-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    authorization_status: 'AUTHORIZED_FOR_RELEASE',
    issued_at: issuedAt,
    nonce: crypto.randomBytes(16).toString('hex'),
    target_system: {
      name: 'servicios-castillo',
      environment: 'production',
      commit_sha: '9a096c67de2be2c6c733a772908296513a4c256d'
    },
    governance: {
      cqs_specification_version: '1.1.0',
      gate_policy_version: '1.0.0-ratified',
      gate_level: 'C1',
      gate_level_name: 'FOUNDATION',
      authority_class: ['Technical Lead'],
      policy_reference: {
        policy_id: 'POL-C1',
        policy_sha256: 'e15a29e2089c3e73673bd8d29af3db692c88925bfcea0dfb116906530e70350b'
      }
    },
    evaluation_reference: {
      evaluation_id: 'EVAL-TEST-12345',
      gate_decision_id: 'GATE-DEC-C1-001',
      evidence_package_hash: '47f52e00c9729945a5574ca3479409def38bb571156daecb77d027224e2bce73'
    },
    applied_waivers: [],
    metrics_summary: {
      cqs_raw_score: 93.13,
      cqs_display_score: 93.13,
      final_verdict: 'PASS_RELEASE',
      gate_breakers_status: 'CLEARED'
    },
    post_verification_obligation: {
      required: false,
      verification_window_hours: 48,
      status: 'NOT_REQUIRED'
    },
    ...overrides
  };

  const canonicalString = canonicalize(payload);
  const digest = crypto.createHash('sha256').update(canonicalString, 'utf8').digest('hex');
  const signResult = signPayload(payload, keyPair.privateKeyPem);

  const cert = {
    ...payload,
    integrity: {
      canonical_algorithm: 'RFC-8785-JCS',
      digest_algorithm: 'SHA-256',
      certificate_digest: digest,
      signature_mode: 'ED25519_ASYMMETRIC_SIGNED',
      signing_authority: 'Grupo Castillo Release Gate Authority',
      pki_signature_extension: {
        enabled: true,
        algorithm: 'ed25519',
        key_id: signResult.key_id,
        signature_base64: signResult.signature_base64,
        public_key_pem: keyPair.publicKeyPem
      }
    }
  };

  return cert;
}

// -----------------------------------------------------------------------------
// SECTION 1: KEY REVOCATION TESTS (1A - 1F)
// -----------------------------------------------------------------------------
console.log('--- [SECTION 1: KEY REVOCATION LIFECYCLE & ADVERSARIAL DEFENSE] ---');

// Create a Revocation Manifest revoking Bob's key on 2026-08-15T00:00:00Z
const revocationManifest = createRevocationManifest([
  {
    key_id: compromisedBobKeys.keyId,
    revoked_at: '2026-08-15T00:00:00.000Z',
    revocation_reason: 'KEY_COMPROMISE',
    revoked_by: 'CISO Office',
    scope: { invalidates_prior_certificates: false, cutoff_timestamp: '2026-08-15T00:00:00.000Z' }
  }
], rootAuthorityKeys.privateKeyPem);

const revManifestPath = path.join(testScratchDir, 'revocations.json');
fs.writeFileSync(revManifestPath, JSON.stringify(revocationManifest, null, 2), 'utf8');

// Test 1A: Valid certificate + Active key (Alice) -> VALID
const cert1A = createMockCertificate(signerAliceKeys, '2026-08-18T10:00:00.000Z');
const cert1APath = path.join(testScratchDir, 'cert-1a.json');
fs.writeFileSync(cert1APath, JSON.stringify(cert1A, null, 2), 'utf8');

const res1A = verifyAssuranceArtifact({
  artifactPath: cert1APath,
  trustAnchorPath: trustStorePath,
  revocationManifestPath: revManifestPath
});
assert.strictEqual(res1A.status, 'VALID', '1A: Valid cert + active key must be VALID');
console.log('[PASS] Test 1A: Certificate with active key verified -> VALID (ACTIVE).');

// Test 1B: Valid certificate + Revoked key (Bob, issued AFTER revocation 2026-08-16) -> INVALID
const cert1B = createMockCertificate(compromisedBobKeys, '2026-08-16T12:00:00.000Z');
const cert1BPath = path.join(testScratchDir, 'cert-1b.json');
fs.writeFileSync(cert1BPath, JSON.stringify(cert1B, null, 2), 'utf8');

const res1B = verifyAssuranceArtifact({
  artifactPath: cert1BPath,
  trustAnchorPath: trustStorePath,
  revocationManifestPath: revManifestPath
});
assert.strictEqual(res1B.status, 'INVALID', '1B: Valid cert with revoked key must be INVALID');
assert.ok(res1B.details.some(d => d.includes('Key Revocation Check FAILED')), '1B: Must report revocation failure');
console.log('[PASS] Test 1B: Certificate issued after key revocation -> INVALID (REVOKED).');

// Test 1C: Historical certificate issued BEFORE revocation (Bob, issued 2026-08-10) -> VALID with Advisory
const cert1C = createMockCertificate(compromisedBobKeys, '2026-08-10T12:00:00.000Z');
const cert1CPath = path.join(testScratchDir, 'cert-1c.json');
fs.writeFileSync(cert1CPath, JSON.stringify(cert1C, null, 2), 'utf8');

const res1C = verifyAssuranceArtifact({
  artifactPath: cert1CPath,
  trustAnchorPath: trustStorePath,
  revocationManifestPath: revManifestPath
});
assert.strictEqual(res1C.status, 'VALID', '1C: Historical cert issued prior to revocation remains valid');
assert.ok(res1C.details.some(d => d.includes('Historical certificate validity is preserved')), '1C: Must include advisory notice');
console.log('[PASS] Test 1C: Historical certificate issued prior to revocation -> VALID (HISTORICAL_VALID_RETIRED).');

// Test 1D: Adversarial attempt to forge/modify revocation manifest -> FAIL-CLOSED
const tamperedManifest = JSON.parse(JSON.stringify(revocationManifest));
tamperedManifest.revocations[0].status = 'ACTIVE'; // Attacker attempts to un-revoke Bob
const tamperedManifestPath = path.join(testScratchDir, 'tampered-revocations.json');
fs.writeFileSync(tamperedManifestPath, JSON.stringify(tamperedManifest, null, 2), 'utf8');

const res1D = verifyAssuranceArtifact({
  artifactPath: cert1BPath,
  trustAnchorPath: trustStorePath,
  revocationManifestPath: tamperedManifestPath
});
assert.strictEqual(res1D.status, 'INVALID', '1D: Tampered revocation manifest must be rejected');
assert.ok(res1D.details.some(d => d.includes('tampered with') || d.includes('digest mismatch')), '1D: Must detect tamper');
console.log('[PASS] Test 1D: Tampered revocation manifest -> INVALID (Fail-Closed Tamper Defense).');

// Test 1E: Corrupted revocation manifest (malformed JSON) -> FAIL-CLOSED
const corruptManifestPath = path.join(testScratchDir, 'corrupt-revocations.json');
fs.writeFileSync(corruptManifestPath, '{"invalid_json": true, incomplete...', 'utf8');

const res1E = verifyAssuranceArtifact({
  artifactPath: cert1APath,
  trustAnchorPath: trustStorePath,
  revocationManifestPath: corruptManifestPath
});
assert.strictEqual(res1E.status, 'INVALID', '1E: Corrupted revocation manifest must fail-closed');
console.log('[PASS] Test 1E: Corrupted revocation manifest -> INVALID (Fail-Closed).');

// Test 1F: Absence of revocation manifest behavior
// F.1 When policy requires manifest (requireRevocationCheck: true) -> FAIL-CLOSED
const res1F_required = verifyAssuranceArtifact({
  artifactPath: cert1APath,
  trustAnchorPath: trustStorePath,
  requireRevocationCheck: true
});
assert.strictEqual(res1F_required.status, 'INVALID', '1F.1: Missing required revocation manifest must fail-closed');

// F.2 Offline fallback with no manifest provided -> VALID with explicit unverified status
const res1F_offline = verifyAssuranceArtifact({
  artifactPath: cert1APath,
  trustAnchorPath: trustStorePath
});
assert.strictEqual(res1F_offline.status, 'VALID', '1F.2: Offline verification succeeds when no manifest is required');
assert.strictEqual(res1F_offline.metadata.trust_chain.key_revocation.status, 'UNCHECKED');
console.log('[PASS] Test 1F: Absence of revocation manifest handled explicitly (Strict requirement: FAIL-CLOSED | Offline: UNCHECKED).');

// -----------------------------------------------------------------------------
// SECTION 2: INDEPENDENT TRUST ANCHOR & COMPROMISED SITE DEFENSE
// -----------------------------------------------------------------------------
console.log('\n--- [SECTION 2: INDEPENDENT TRUST ANCHOR & COMPROMISED SITE DEFENSE] ---');

// Test 2A: Compromised Site Attack: Attacker generates rogue keypair (Eve), creates fake cert,
// and hosts fake cert + fake public key. Verifier checks against independent Trust Anchor Store.
const rogueCert = createMockCertificate(attackerEveKeys, '2026-08-18T10:00:00.000Z', {
  target_system: { name: 'servicios-castillo-pwned', environment: 'production', commit_sha: '0000000000000000000000000000000000000000' }
});
const rogueCertPath = path.join(testScratchDir, 'rogue-cert.json');
fs.writeFileSync(rogueCertPath, JSON.stringify(rogueCert, null, 2), 'utf8');

const res2A = verifyAssuranceArtifact({
  artifactPath: rogueCertPath,
  trustAnchorPath: trustStorePath // Verifier uses independent trust anchor
});
assert.strictEqual(res2A.status, 'INVALID', '2A: Rogue certificate with unanchored public key MUST be rejected');
assert.ok(res2A.details.some(d => d.includes('Independent Trust Anchor Verification FAILED')), '2A: Must detect unanchored key');
console.log('[PASS] Test 2A: Compromised site with fake certificate + fake public key -> REJECTED by Independent Trust Anchor.');

// Test 2B: Legitimate Certificate with key in Trust Anchor Store -> VALID
const res2B = verifyAssuranceArtifact({
  artifactPath: cert1APath,
  trustAnchorPath: trustStorePath
});
assert.strictEqual(res2B.status, 'VALID', '2B: Legitimate certificate in trust anchor must be VALID');
assert.strictEqual(res2B.metadata.trust_chain.trust_anchor.trusted, true);
console.log('[PASS] Test 2B: Legitimate certificate verified against Independent Trust Anchor -> VALID.');

// Test 2C: Expired Trust Anchor -> INVALID
const expiredStore = new TrustAnchorStore([
  {
    key_id: signerAliceKeys.keyId,
    public_key_pem: signerAliceKeys.publicKeyPem,
    valid_from: '2020-01-01T00:00:00.000Z',
    valid_until: '2021-01-01T00:00:00.000Z' // Expired in 2021
  }
]);
const expiredStorePath = path.join(testScratchDir, 'expired-trust-store.json');
expiredStore.saveToFile(expiredStorePath);

const res2C = verifyAssuranceArtifact({
  artifactPath: cert1APath,
  trustAnchorPath: expiredStorePath
});
assert.strictEqual(res2C.status, 'INVALID', '2C: Expired trust anchor must be rejected');
console.log('[PASS] Test 2C: Expired Trust Anchor -> INVALID (Fail-Closed).');

// -----------------------------------------------------------------------------
// SECTION 3: SECURE ENCRYPTED KEY BACKUP & DISASTER RECOVERY
// -----------------------------------------------------------------------------
console.log('\n--- [SECTION 3: SECURE ENCRYPTED KEY BACKUP & DISASTER RECOVERY] ---');

const testPassphrase = 'CorrectHorseBatteryStaple-2026-SuperSecure!';
const wrongPassphrase = 'WrongPassword-1234!';

// Test 3A: Create Encrypted Backup with AES-256-GCM + PBKDF2 (100k iterations)
const keyBackup = createKeyBackup(signerAliceKeys.privateKeyPem, testPassphrase, {
  description: 'Production Release Signer Key Backup'
});
assert.strictEqual(keyBackup.schema_version, '1.0.0-key-backup');
assert.strictEqual(keyBackup.crypto_params.cipher, 'aes-256-gcm');
assert.strictEqual(keyBackup.crypto_params.iterations, 100000);
assert.strictEqual(keyBackup.key_id, signerAliceKeys.keyId);
assert.ok(!JSON.stringify(keyBackup).includes('BEGIN PRIVATE KEY'), '3A: Private key plaintext MUST NOT be present in backup payload');

const backupFilePath = path.join(testScratchDir, 'alice-key-backup.enc.json');
saveKeyBackupToFile(keyBackup, backupFilePath);
console.log('[PASS] Test 3A: Encrypted key backup created (AES-256-GCM, 100,000 iterations, 0 plaintext exposure).');

// Test 3B: Restore Key Backup with Correct Passphrase
const restoredKey = restoreKeyBackup(backupFilePath, testPassphrase);
assert.strictEqual(restoredKey.restored, true);
assert.strictEqual(restoredKey.keyId, signerAliceKeys.keyId);
assert.strictEqual(restoredKey.publicKeyPem.trim(), signerAliceKeys.publicKeyPem.trim());

// Verify restored private key can actually sign and verify certificates
const testCertWithRestoredKey = createMockCertificate(restoredKey, '2026-08-18T12:00:00.000Z');
const { integrity: _, ...rawPayloadToVerify } = testCertWithRestoredKey;
const verifyRestoredSig = verifySignature(rawPayloadToVerify, testCertWithRestoredKey.integrity.pki_signature_extension.signature_base64, restoredKey.publicKeyPem);
assert.strictEqual(verifyRestoredSig.valid, true, '3B: Restored key must produce mathematically valid signatures');
console.log('[PASS] Test 3B: Disaster recovery test: Key successfully restored and produces valid signatures.');

// Test 3C: Restore Key Backup with Incorrect Passphrase -> FAIL-CLOSED
let wrongPassError = null;
try {
  restoreKeyBackup(backupFilePath, wrongPassphrase);
} catch (err) {
  wrongPassError = err;
}
assert.ok(wrongPassError, '3C: Incorrect passphrase MUST fail decryption');
assert.ok(wrongPassError.message.includes('Authentication failed') || wrongPassError.message.includes('incorrect passphrase'));
console.log('[PASS] Test 3C: Restore with incorrect passphrase -> REJECTED (GCM Authentication Tag Mismatch).');

// Test 3D: Restore Tampered Key Backup Ciphertext -> FAIL-CLOSED
const tamperedBackup = JSON.parse(JSON.stringify(keyBackup));
const buf = Buffer.from(tamperedBackup.encrypted_key_base64, 'base64');
buf[10] ^= 0xFF; // Flip bit in ciphertext
tamperedBackup.encrypted_key_base64 = buf.toString('base64');

let tamperError = null;
try {
  restoreKeyBackup(tamperedBackup, testPassphrase);
} catch (err) {
  tamperError = err;
}
assert.ok(tamperError, '3D: Tampered ciphertext MUST fail GCM tag validation');
console.log('[PASS] Test 3D: Tampered backup ciphertext -> REJECTED (GCM Auth Tag Failure).');

// Test 3E: Verify Git ignore rules for private keys and backup files
const gitignorePath = path.join(__dirname, '..', '.gitignore');
const gitignoreContent = fs.existsSync(gitignorePath) ? fs.readFileSync(gitignorePath, 'utf8') : '';
assert.ok(gitignoreContent.includes('*.pem') || gitignoreContent.includes('.castle/'), '3E: .gitignore must protect key files');
console.log('[PASS] Test 3E: Repository security posture verified: Key materials prevented from Git commits.');

// -----------------------------------------------------------------------------
// SECTION 4: END-TO-END TRUST CHAIN VERIFICATION
// -----------------------------------------------------------------------------
console.log('\n--- [SECTION 4: END-TO-END TRUST CHAIN VERIFICATION] ---');

const endToEndVerification = verifyAssuranceArtifact({
  artifactPath: cert1APath,
  trustAnchorPath: trustStorePath,
  revocationManifestPath: revManifestPath,
  expectedCommit: '9a096c67de2be2c6c733a772908296513a4c256d',
  expectedPolicyHash: 'e15a29e2089c3e73673bd8d29af3db692c88925bfcea0dfb116906530e70350b'
});

assert.strictEqual(endToEndVerification.status, 'VALID');
const chain = endToEndVerification.metadata.trust_chain;

console.log('[+] Complete Trust Chain Resolution:');
console.log('    1. Certificate:            ', chain.certificate_id);
console.log('    2. Canonical Digest:       ', chain.digest_algorithm);
console.log('    3. Ed25519 Signature:      ', chain.signature_verified ? 'VERIFIED (PASS)' : 'FAIL');
console.log('    4. Signing Key ID:         ', chain.signing_key_id);
console.log('    5. Independent Anchor:     ', chain.trust_anchor.trusted ? `TRUSTED (Authority: ${chain.trust_anchor.anchor.identity.name})` : 'UNTRUSTED');
console.log('    6. Key Status:             ', chain.key_revocation.status);
console.log('    7. Commit & Policy SHA:    ', 'BOUND & MATCHED');
console.log('    8. Final Verdict:          ', chain.chain_status);

assert.strictEqual(chain.chain_status, 'TRUSTED_AND_VALID');
console.log('[PASS] Test 4A: End-to-end cryptographic trust chain proven and documented.');

// -----------------------------------------------------------------------------
// SECTION 5: BACKWARD COMPATIBILITY
// -----------------------------------------------------------------------------
console.log('\n--- [SECTION 5: BACKWARD COMPATIBILITY WITH EXISTING ARTIFACTS] ---');

const dogfoodingCertPath = path.join(__dirname, '..', '.castle-dogfooding', 'release-certificate.json');
assert.ok(fs.existsSync(dogfoodingCertPath), 'Dogfooding certificate must exist');

const dogfoodingVerification = verifyAssuranceArtifact({
  artifactPath: dogfoodingCertPath,
  expectedCommit: '9a096c67de2be2c6c733a772908296513a4c256d'
});

assert.strictEqual(dogfoodingVerification.status, 'VALID');
console.log('[PASS] Test 5A: Existing ratified dogfooding certificate verified 100% VALID without rewriting.');

// Cleanup
try {
  fs.rmSync(testScratchDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 });
} catch (e) {}

console.log('\n================================================================');
console.log('ALL CRYPTOGRAPHIC TRUST HARDENING TESTS PASSED (100% DEFENDED)');
console.log('================================================================\n');
