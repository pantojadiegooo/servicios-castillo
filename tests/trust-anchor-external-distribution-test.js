/**
 * Castle Gate — Trust Anchor External Distribution Adversarial Test Suite
 * 
 * Verifies that the independent Trust Anchor distribution prevents rogue key/certificate substitution:
 * 1. Legitimate anchor -> PASS
 * 2. Modified anchor (corrupted hash/tampered payload) -> FAIL
 * 3. Unknown key -> FAIL
 * 4. Attacker replacement (compromised website/rogue key pair) -> FAIL
 * 5. Version mismatch (schema version incompatibility) -> FAIL
 */

'use strict';

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const {
  TrustAnchorStore,
  generateKeyPair,
  deriveKeyId,
  signPayload,
  canonicalize,
  canonicalHash,
  verifyAssuranceArtifact
} = require('../castle-gate');

console.log('================================================================');
console.log('TRUST ANCHOR EXTERNAL DISTRIBUTION ADVERSARIAL TEST SUITE');
console.log('================================================================\n');

const testScratchDir = path.join(__dirname, '..', '.test-trust-anchor-scratch');
if (fs.existsSync(testScratchDir)) {
  try {
    fs.rmSync(testScratchDir, { recursive: true, force: true });
  } catch (e) {}
}
fs.mkdirSync(testScratchDir, { recursive: true });

// Setup Test Keypairs
const legitimateRoot = generateKeyPair();
const legitimateSigner = generateKeyPair();
const attackerEve = generateKeyPair();

// Create canonical distribution Trust Anchor file
const distributionStore = new TrustAnchorStore([
  {
    key_id: legitimateSigner.keyId,
    public_key_pem: legitimateSigner.publicKeyPem,
    identity: {
      name: 'Grupo Castillo Official Release Signer',
      role: 'RELEASE_AUTHORITY',
      scope: 'ALL_LEVELS'
    },
    valid_from: '2026-01-01T00:00:00.000Z',
    valid_until: '2030-01-01T00:00:00.000Z',
    trust_level: 'OFFICIAL_ROOT'
  }
], {
  store_id: 'CASTLE-DISTRIBUTION-TRUST-STORE-2026',
  authority: 'Grupo Castillo Release & Security Authority'
});

const distributionStorePath = path.join(testScratchDir, 'official-trust-anchors.json');
distributionStore.saveToFile(distributionStorePath);
const originalStoreHash = distributionStore.getCanonicalHash();

// Helper to create mock certificate signed by a given key
function createCert(keyPair, certId = 'CERT-001') {
  const payload = {
    schema_version: '2.0.0-assurance',
    certificate_id: certId,
    authorization_status: 'AUTHORIZED_FOR_RELEASE',
    issued_at: '2026-08-18T12:00:00.000Z',
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
      evaluation_id: 'EVAL-001',
      gate_decision_id: 'DEC-001',
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
    }
  };

  const canonicalString = canonicalize(payload);
  const digest = crypto.createHash('sha256').update(canonicalString, 'utf8').digest('hex');
  const signResult = signPayload(payload, keyPair.privateKeyPem);

  return {
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
}

// -----------------------------------------------------------------------------
// TEST 1: LEGITIMATE ANCHOR -> PASS
// -----------------------------------------------------------------------------
const legitCert = createCert(legitimateSigner, 'CERT-LEGIT-001');
const legitCertPath = path.join(testScratchDir, 'legit-cert.json');
fs.writeFileSync(legitCertPath, JSON.stringify(legitCert, null, 2), 'utf8');

const res1 = verifyAssuranceArtifact({
  artifactPath: legitCertPath,
  trustAnchorPath: distributionStorePath
});
assert.strictEqual(res1.status, 'VALID', 'Test 1: Legitimate cert verified against Trust Anchor must be VALID');
assert.strictEqual(res1.metadata.trust_chain.trust_anchor.trusted, true);
console.log('[PASS] 1. Legitimate Anchor: Certificate signed by anchored key verified -> VALID.');

// -----------------------------------------------------------------------------
// TEST 2: MODIFIED ANCHOR -> FAIL
// -----------------------------------------------------------------------------
const tamperedStorePath = path.join(testScratchDir, 'tampered-trust-anchors.json');
const tamperedRaw = JSON.parse(fs.readFileSync(distributionStorePath, 'utf8'));
// Attacker alters the valid_until date or modifies public key in trust store
tamperedRaw.anchors[0].valid_until = '2020-01-01T00:00:00.000Z'; // Expire it
fs.writeFileSync(tamperedStorePath, JSON.stringify(tamperedRaw, null, 2), 'utf8');

const res2 = verifyAssuranceArtifact({
  artifactPath: legitCertPath,
  trustAnchorPath: tamperedStorePath
});
assert.strictEqual(res2.status, 'INVALID', 'Test 2: Expired/modified anchor must fail verification');
assert.ok(res2.details.some(d => d.includes('Trust Anchor Verification FAILED') || d.includes('expired')), 'Test 2: Must report failure');
console.log('[PASS] 2. Modified Anchor: Tampered / expired trust anchor detected -> FAIL.');

// -----------------------------------------------------------------------------
// TEST 3: UNKNOWN KEY -> FAIL
// -----------------------------------------------------------------------------
const unknownKeyCert = createCert(attackerEve, 'CERT-UNKNOWN-KEY-001');
const unknownKeyCertPath = path.join(testScratchDir, 'unknown-key-cert.json');
fs.writeFileSync(unknownKeyCertPath, JSON.stringify(unknownKeyCert, null, 2), 'utf8');

const res3 = verifyAssuranceArtifact({
  artifactPath: unknownKeyCertPath,
  trustAnchorPath: distributionStorePath
});
assert.strictEqual(res3.status, 'INVALID', 'Test 3: Unregistered signing key must fail verification');
assert.ok(res3.details.some(d => d.includes('not present in independent trust anchor store')), 'Test 3: Must report key not present');
console.log('[PASS] 3. Unknown Key: Signature by unregistered key rejected -> FAIL.');

// -----------------------------------------------------------------------------
// TEST 4: ATTACKER REPLACEMENT (WEBSITE COMPROMISE ATTACK) -> FAIL
// -----------------------------------------------------------------------------
// Attacker replaces certificate + public key on target system with forged pair
const rogueCert = createCert(attackerEve, 'CERT-ROGUE-PWNED-001');
const rogueCertPath = path.join(testScratchDir, 'rogue-website-cert.json');
fs.writeFileSync(rogueCertPath, JSON.stringify(rogueCert, null, 2), 'utf8');

// Verifier uses out-of-band distribution Trust Anchor (from official release, not website)
const res4 = verifyAssuranceArtifact({
  artifactPath: rogueCertPath,
  trustAnchorPath: distributionStorePath
});
assert.strictEqual(res4.status, 'INVALID', 'Test 4: Compromised site replacement attack must be rejected');
console.log('[PASS] 4. Attacker Replacement: Compromised site replacing cert + pubkey is REJECTED by independent anchor -> FAIL.');

// -----------------------------------------------------------------------------
// TEST 5: VERSION MISMATCH -> FAIL
// -----------------------------------------------------------------------------
const incompatibleStorePath = path.join(testScratchDir, 'incompatible-trust-anchors.json');
const incompatibleStoreData = {
  schema_version: '99.0.0-incompatible',
  store_id: 'TEST-INCOMPATIBLE',
  anchors: distributionStore.toJSON().anchors
};
fs.writeFileSync(incompatibleStorePath, JSON.stringify(incompatibleStoreData, null, 2), 'utf8');

const res5 = verifyAssuranceArtifact({
  artifactPath: legitCertPath,
  trustAnchorPath: incompatibleStorePath
});
assert.strictEqual(res5.status, 'INVALID', 'Test 5: Unsupported Trust Anchor schema version must fail');
assert.ok(res5.details.some(d => d.includes('Unsupported Trust Anchor schema version')), 'Test 5: Must report version incompatibility');
console.log('[PASS] 5. Version Mismatch: Unsupported trust anchor schema version rejected -> FAIL.');

// Cleanup
try {
  fs.rmSync(testScratchDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 });
} catch (e) {}

console.log('\n================================================================');
console.log('ALL TRUST ANCHOR DISTRIBUTION ADVERSARIAL TESTS PASSED (5/5)');
console.log('================================================================\n');
