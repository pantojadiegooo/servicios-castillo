/**
 * Castle Security & Quality Gate — Approver Trust Ring & Cryptographic Identity Test Suite
 * 
 * Verifies (Phase 6 Block 1):
 * 1. Test A: Waiver signed with an UNREGISTERED key is REJECTED, despite fake text metadata.
 * 2. Test B: Waiver signed with a REGISTERED key with INSUFFICIENT ROLE is REJECTED.
 * 3. Test C: Waiver signed with a REGISTERED key with SUFFICIENT ROLE is ACCEPTED.
 */

'use strict';

const assert = require('assert');
const { generateKeyPair } = require('../castle-gate/crypto/signing-key');
const { ApproverTrustRing } = require('../castle-gate/policy/approver-trust-ring');
const { createWaiver, validateWaiver, applyWaivers } = require('../castle-gate/policy/waiver-manager');
const { executeCastleGate } = require('../castle-gate/index');

console.log('================================================================');
console.log('Castle Gate — Approver Trust Ring Test Suite (Phase 6 Block 1)');
console.log('================================================================\n');

// 1. Setup Keypairs for different identities
const aliceKeys = generateKeyPair();    // Legitimate Security Officer
const bobKeys = generateKeyPair();      // Legitimate QA Lead
const charlieKeys = generateKeyPair();  // Legitimate Developer
const eveKeys = generateKeyPair();      // Attacker / Unregistered Key

// 2. Build the Official Governance Trust Ring
const trustRing = new ApproverTrustRing([
  {
    public_key_pem: aliceKeys.publicKeyPem,
    identity: { name: 'Alice Smith', email: 'alice@grupocastillo.com', role: 'SECURITY_OFFICER' }
  },
  {
    public_key_pem: bobKeys.publicKeyPem,
    identity: { name: 'Bob QA', email: 'bob@grupocastillo.com', role: 'QA_LEAD' }
  },
  {
    public_key_pem: charlieKeys.publicKeyPem,
    identity: { name: 'Charlie Dev', email: 'charlie@grupocastillo.com', role: 'DEVELOPER' }
  }
]);

console.log('Trust Ring initialized with 3 registered keys (Digest:', trustRing.getDigest().substring(0, 16) + '...).');

// Base failing evidence (SEC-04.1 failing due to dangerous pattern)
const failingEvidence = {
  'SEC-04.1': { status: 'FAIL', details: 'eval() detected' },
  'PER-01.1': { status: 'PASS', details: 'LCP ok' },
  'PER-02.1': { status: 'PASS', details: 'TBT ok' },
  'PER-04.1': { status: 'PASS', details: 'Image formats ok' },
  'SEC-01.1': { status: 'PASS', details: 'TLS ok' },
  'SEC-01.2': { status: 'PASS', details: 'HTTPS ok' },
  'SEC-02.1': { status: 'PASS', details: 'CSP ok' },
  'SEC-02.2': { status: 'PASS', details: 'XFO ok' },
  'SEC-02.3': { status: 'PASS', details: 'HSTS ok' },
  'SEC-02.4': { status: 'PASS', details: 'XCTO ok' },
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

// ================================================================
// TEST A: Waiver signed by an UNREGISTERED key (Attacker Spoofing Alice)
// ================================================================
console.log('\n[TEST A] Forged Waiver: signed by Eve with Alice metadata text...');
const spoofedWaiver = createWaiver({
  controlId: 'SEC-04.1',
  reason: 'Spoofed waiver attempt',
  approver: { name: 'Alice Smith', role: 'SECURITY_OFFICER' }, // Impersonation in text
  expiresInDays: 14,
  privateKeyPem: eveKeys.privateKeyPem // Signed with Eve's key!
});

const valA = validateWaiver(spoofedWaiver, new Date(), trustRing);
assert.strictEqual(valA.valid, false, 'Unregistered key must be INVALID');
assert.strictEqual(valA.active, false);
assert(valA.reason.includes('NOT registered in Approver Trust Ring'));

const gateA = executeCastleGate({
  raw_evidence: failingEvidence,
  gate_level: 'C2',
  target_system: { name: 'AppA', environment: 'production' },
  waivers: [spoofedWaiver],
  trust_ring: trustRing
});
assert.strictEqual(gateA.gate_decision.gate_state, 'BLOCKED', 'Forged waiver must not waive control');
console.log('[PASS] Test A: Waiver signed by unregistered key rejected (BLOCKED).');

// ================================================================
// TEST B: Waiver signed by a REGISTERED key with INSUFFICIENT ROLE
// ================================================================
console.log('\n[TEST B] Insufficient Role: signed by Charlie (DEVELOPER) for SEC-04.1...');
const devWaiver = createWaiver({
  controlId: 'SEC-04.1',
  reason: 'Developer self-approved waiver',
  approver: { name: 'Charlie Dev', role: 'DEVELOPER' },
  expiresInDays: 14,
  privateKeyPem: charlieKeys.privateKeyPem // Signed with registered Developer key
});

const valB = validateWaiver(devWaiver, new Date(), trustRing);
assert.strictEqual(valB.valid, false, 'Insufficient role must be INVALID');
assert.strictEqual(valB.active, false);
assert(valB.reason.includes('insufficient to waive control'));

const gateB = executeCastleGate({
  raw_evidence: failingEvidence,
  gate_level: 'C2',
  target_system: { name: 'AppB', environment: 'production' },
  waivers: [devWaiver],
  trust_ring: trustRing
});
assert.strictEqual(gateB.gate_decision.gate_state, 'BLOCKED', 'Insufficient role waiver must not waive control');
console.log('[PASS] Test B: Waiver signed by registered key with insufficient role rejected (BLOCKED).');

// ================================================================
// TEST C: Waiver signed by a REGISTERED key with AUTHORIZED ROLE
// ================================================================
console.log('\n[TEST C] Legitimate Waiver: signed by Alice (SECURITY_OFFICER) for SEC-04.1...');
const legitWaiver = createWaiver({
  controlId: 'SEC-04.1',
  reason: 'Approved migration exception by Security Lead',
  approver: { name: 'Alice Smith', role: 'SECURITY_OFFICER' },
  expiresInDays: 14,
  privateKeyPem: aliceKeys.privateKeyPem // Signed with registered Security Officer key!
});

const valC = validateWaiver(legitWaiver, new Date(), trustRing);
assert.strictEqual(valC.valid, true, 'Authorized role must be VALID');
assert.strictEqual(valC.active, true);
assert.strictEqual(valC.approver_verified, true);
assert.strictEqual(valC.verified_identity.name, 'Alice Smith');
assert.strictEqual(valC.verified_identity.role, 'SECURITY_OFFICER');

const gateC = executeCastleGate({
  raw_evidence: failingEvidence,
  gate_level: 'C2',
  target_system: { name: 'AppC', environment: 'production' },
  waivers: [legitWaiver],
  trust_ring: trustRing
});
assert.strictEqual(gateC.gate_decision.gate_state, 'PASSED', 'Legitimate waiver must authorize release');
assert(gateC.release_certificate, 'Release certificate must be generated');
assert.strictEqual(gateC.release_certificate.applied_waivers.length, 1);
assert.strictEqual(gateC.release_certificate.applied_waivers[0].approver.name, 'Alice Smith');
console.log('[PASS] Test C: Waiver signed by authorized Security Officer accepted and release PASSED.');

console.log('\n================================================================');
console.log('ALL APPROVER TRUST RING TESTS PASSED (3/3)');
console.log('================================================================\n');
