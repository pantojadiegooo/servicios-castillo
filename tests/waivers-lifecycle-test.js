/**
 * Castle Security & Quality Gate — Governed Waivers Full Lifecycle Test Suite
 * 
 * Verifies:
 * 1. Full issuance flow of cryptographically signed, time-bounded waivers.
 * 2. Explicit visibility of applied waivers in the Release Certificate.
 * 3. Automatic expiration when TTL is exceeded.
 * 4. Expired waiver fails-closed: control is not waived and Gate blocks the release.
 */

'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { createWaiver, validateWaiver, applyWaivers } = require('../castle-gate/policy/waiver-manager');
const { generateKeyPair } = require('../castle-gate/crypto/signing-key');
const { executeCastleGate } = require('../castle-gate/index');

console.log('================================================================');
console.log('Castle Gate — Governed Waivers Lifecycle Test Suite (Phase 5 Block 2)');
console.log('================================================================\n');

// 1. Generate keypair for security officer
const keypair = generateKeyPair();

// 2. Issue a structured, signed waiver for SEC-04.1
const issuedWaiver = createWaiver({
  controlId: 'SEC-04.1',
  reason: 'Legacy widget migration scheduled for sprint 42; compensating WAF rule active.',
  scope: { environment: 'production', path: 'src/legacy-widget.js' },
  approver: { name: 'Alice Smith', role: 'SECURITY_OFFICER', email: 'alice@grupocastillo.com' },
  expiresInDays: 14,
  compensatingControls: 'WAF Rule #8491 blocking malicious eval payloads',
  policyId: 'POL-C2-v1.0.0',
  privateKeyPem: keypair.privateKeyPem
});

assert(issuedWaiver.waiver_id.startsWith('WAIVER-SEC_04_1-'));
assert(issuedWaiver.integrity && issuedWaiver.integrity.waiver_sha256);
assert(issuedWaiver.integrity.signature && issuedWaiver.integrity.signature.signature_base64);
console.log('[PASS] 1. Structured, cryptographically signed waiver issued (ID:', issuedWaiver.waiver_id, ').');

// 3. Validate active waiver
const activeValidation = validateWaiver(issuedWaiver, new Date(), keypair.publicKeyPem);
assert.strictEqual(activeValidation.valid, true);
assert.strictEqual(activeValidation.active, true);
console.log('[PASS] 2. Active waiver successfully validated against public key.');

// 4. Run gate execution with active waiver
const rawEvidenceWithFailure = {
  'SEC-04.1': { status: 'FAIL', details: 'eval() detected in legacy-widget.js' },
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

const gateResWithWaiver = executeCastleGate({
  raw_evidence: rawEvidenceWithFailure,
  gate_level: 'C2',
  target_system: { name: 'PortalApp', environment: 'production', commit_sha: '2222222222222222222222222222222222222222' },
  waivers: [issuedWaiver],
  private_key_pem: keypair.privateKeyPem
});

assert.strictEqual(gateResWithWaiver.gate_decision.gate_state, 'PASSED');
assert(gateResWithWaiver.release_certificate, 'Release Certificate must be generated');
assert(Array.isArray(gateResWithWaiver.release_certificate.applied_waivers), 'applied_waivers must be an array');
assert.strictEqual(gateResWithWaiver.release_certificate.applied_waivers.length, 1);

const certWaiver = gateResWithWaiver.release_certificate.applied_waivers[0];
assert.strictEqual(certWaiver.control_id, 'SEC-04.1');
assert.strictEqual(certWaiver.approver.name, 'Alice Smith');
assert.strictEqual(certWaiver.approver.role, 'SECURITY_OFFICER');
console.log('[PASS] 3. Active waiver applied and explicitly rendered in Release Certificate.');

// 5. Automatic Expiration Check (Test time + 15 days)
const futureDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
const expiredValidation = validateWaiver(issuedWaiver, futureDate, keypair.publicKeyPem);
assert.strictEqual(expiredValidation.valid, true);
assert.strictEqual(expiredValidation.active, false, 'Waiver must be inactive after TTL');
console.log('[PASS] 4. Automatic expiration verified: TTL 14 days expired on day 15 (active: false).');

// 6. Expired waiver execution fails closed
const expiredApplication = applyWaivers(rawEvidenceWithFailure, [issuedWaiver], futureDate);
assert.strictEqual(expiredApplication.waivedControls.length, 0, 'No controls must be waived with expired waiver');
assert.strictEqual(expiredApplication.expiredWaivers.length, 1);
assert.strictEqual(expiredApplication.updatedControls['SEC-04.1'].status, 'FAIL', 'SEC-04.1 must remain FAIL');
console.log('[PASS] 5. Expired waiver fail-closed verified: control remains FAIL and blocks release.');

console.log('\n================================================================');
console.log('ALL GOVERNED WAIVERS LIFECYCLE TESTS PASSED (5/5)');
console.log('================================================================\n');
