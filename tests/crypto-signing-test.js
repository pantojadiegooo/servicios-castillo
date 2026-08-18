/**
 * Castle Security & Quality Gate — Cryptographic Layer Verification Test
 * 
 * Validates:
 * 1. RFC 8785 Canonicalization determinism across permuted keys & formats
 * 2. Asymmetric Ed25519 key generation & key ID derivation
 * 3. Digital signing and verification of evidence
 * 4. Tamper detection on modified payload
 * 5. Wrong public key rejection
 * 6. DSSE Pre-Authentication Encoding (PAE) and envelope verification
 * 7. in-toto statement attestation
 */

'use strict';

const assert = require('assert');
const { canonicalize, canonicalHash } = require('../castle-gate/crypto/canonicalizer');
const { generateKeyPair, deriveKeyId } = require('../castle-gate/crypto/signing-key');
const { signPayload, verifySignature } = require('../castle-gate/crypto/signer');
const { createDsseEnvelope, verifyDsseEnvelope, createInTotoStatement } = require('../castle-gate/crypto/dsse');

console.log('================================================================');
console.log('Castle Gate — Cryptographic Layer Verification Test');
console.log('================================================================\n');

// 1. RFC 8785 Canonicalization Test
const objA = { z: 1, a: 2, m: { y: 'test', x: 42 }, list: [3, 2, 1] };
const objB = { a: 2, list: [3, 2, 1], m: { x: 42, y: 'test' }, z: 1 };

const canonA = canonicalize(objA);
const canonB = canonicalize(objB);
assert.strictEqual(canonA, canonB, 'Canonicalized strings for permuted objects must be identical');
assert.strictEqual(canonA, '{"a":2,"list":[3,2,1],"m":{"x":42,"y":"test"},"z":1}');

const hashA = canonicalHash(objA);
const hashB = canonicalHash(objB);
assert.strictEqual(hashA, hashB, 'Canonical hashes must be identical');
console.log('[PASS] 1. RFC 8785 Canonicalization is deterministic across object permutations.');

// Number formatting per RFC 8785
assert.strictEqual(canonicalize({ zero: -0 }), '{"zero":0}');
assert.strictEqual(canonicalize({ float: 12.34 }), '{"float":12.34}');
console.log('[PASS] 2. RFC 8785 Number formatting adheres to specification.');

// 2. Ed25519 Key Generation
const keyPair1 = generateKeyPair();
const keyPair2 = generateKeyPair();
assert(keyPair1.privateKeyPem.includes('BEGIN PRIVATE KEY'));
assert(keyPair1.publicKeyPem.includes('BEGIN PUBLIC KEY'));
assert(keyPair1.keyId.startsWith('ed25519:'));
assert.notStrictEqual(keyPair1.keyId, keyPair2.keyId);
console.log(`[PASS] 3. Ed25519 keypair generated with Key ID: ${keyPair1.keyId}`);

// 3. Digital Signing & Verification
const payload = {
  evaluation_id: 'EVAL-TEST-001',
  score: 95.5,
  gate_state: 'PASSED',
  timestamp: '2026-08-18T10:00:00.000Z'
};

const signatureMeta = signPayload(payload, keyPair1.privateKeyPem);
assert.strictEqual(signatureMeta.signature_algorithm, 'ed25519');
assert(signatureMeta.signature_base64.length > 20);

const verifyResult = verifySignature(payload, signatureMeta.signature_base64, keyPair1.publicKeyPem);
assert.strictEqual(verifyResult.valid, true);
assert.strictEqual(verifyResult.error, null);
console.log('[PASS] 4. Ed25519 digital signature verified successfully.');

// 4. Tamper Detection
const tamperedPayload = { ...payload, score: 99.9 };
const tamperedVerify = verifySignature(tamperedPayload, signatureMeta.signature_base64, keyPair1.publicKeyPem);
assert.strictEqual(tamperedVerify.valid, false);
assert(tamperedVerify.error.includes('tampered'));
console.log('[PASS] 5. Tampered payload is decisively rejected.');

// 5. Wrong Public Key Detection
const wrongKeyVerify = verifySignature(payload, signatureMeta.signature_base64, keyPair2.publicKeyPem);
assert.strictEqual(wrongKeyVerify.valid, false);
console.log('[PASS] 6. Signature rejected when verified against wrong public key.');

// 6. DSSE Envelope & in-toto Statement
const inTotoStatement = createInTotoStatement({
  subjectName: 'git@github.com:grupo-castillo/sample-app.git',
  commitSha: 'a1b2c3d4e5f60718293a4b5c6d7e8f9012345678',
  predicate: {
    cqs_version: '1.1.0 (FROZEN)',
    gate_level: 'C2',
    decision: 'PASSED',
    score: 94.44
  }
});

const dsseEnvelope = createDsseEnvelope(inTotoStatement, keyPair1.privateKeyPem);
assert.strictEqual(dsseEnvelope.payloadType, 'application/vnd.in-toto+json');
assert(dsseEnvelope.signatures.length === 1);

const dsseVerify = verifyDsseEnvelope(dsseEnvelope, keyPair1.publicKeyPem);
assert.strictEqual(dsseVerify.valid, true);
assert.strictEqual(dsseVerify.statement._type, 'https://in-toto.io/Statement/v1');
assert.strictEqual(dsseVerify.statement.predicate.decision, 'PASSED');
console.log('[PASS] 7. DSSE in-toto Envelope signed and verified successfully.');

// Tampered DSSE envelope
const tamperedDsse = {
  ...dsseEnvelope,
  payload: Buffer.from(JSON.stringify({ forged: true })).toString('base64')
};
const dsseTamperedVerify = verifyDsseEnvelope(tamperedDsse, keyPair1.publicKeyPem);
assert.strictEqual(dsseTamperedVerify.valid, false);
console.log('[PASS] 8. Tampered DSSE envelope is decisively rejected.');

console.log('\n================================================================');
console.log('ALL CRYPTOGRAPHIC TESTS PASSED (8/8)');
console.log('================================================================\n');
