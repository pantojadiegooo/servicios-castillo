/**
 * Castle Security & Quality Gate — Governed Waivers Test Suite
 * 
 * Verifies:
 * 1. Creation and signing of governed waivers.
 * 2. Active waiver application converts failing control into waived PASS.
 * 3. Expired waiver is automatically rejected and does NOT grant exception.
 * 4. Tampered waiver payload fails cryptographic integrity check.
 */

'use strict';

const assert = require('assert');
const { generateKeyPair } = require('../castle-gate/crypto/signing-key');
const { createWaiver, validateWaiver, applyWaivers } = require('../castle-gate/policy/waiver-manager');

console.log('================================================================');
console.log('Castle Gate — Governed Waivers Test Suite');
console.log('================================================================\n');

const keyPair = generateKeyPair();

// 1. Create Active Waiver
const activeWaiver = createWaiver({
  controlId: 'MNT-01.1',
  reason: 'Legacy monolithic architecture scheduled for refactoring in Sprint 42',
  scope: { environment: 'production', path: 'src/legacy/' },
  approver: { name: 'Chief Architect', role: 'SECURITY_LEAD' },
  expiresInDays: 14,
  compensatingControls: 'Manual peer review and static AST gating',
  policyId: 'POL-C2-v1.0.0',
  privateKeyPem: keyPair.privateKeyPem
});

const activeValidation = validateWaiver(activeWaiver, new Date(), keyPair.publicKeyPem);
assert.strictEqual(activeValidation.valid, true);
assert.strictEqual(activeValidation.active, true);
console.log('[PASS] 1. Active governed waiver created, signed, and validated.');

// 2. Apply Active Waiver to Failing Control
const initialControls = {
  'MNT-01.1': {
    status: 'FAIL',
    details: 'Monolithic file (>800 lines) detected.',
    findings: [{ rule: 'MONOLITHIC_FILE' }]
  },
  'SEC-01.2': {
    status: 'PASS',
    details: 'HTTPS compliant.',
    findings: []
  }
};

const appliedResult = applyWaivers(initialControls, [activeWaiver], new Date());
assert.strictEqual(appliedResult.updatedControls['MNT-01.1'].status, 'PASS');
assert.strictEqual(appliedResult.updatedControls['MNT-01.1'].waived, true);
assert(appliedResult.updatedControls['MNT-01.1'].waiver_metadata.waiver_id.startsWith('WAIVER-MNT_01_1'));
assert.strictEqual(appliedResult.waivedControls.length, 1);
assert.strictEqual(appliedResult.expiredWaivers.length, 0);
console.log('[PASS] 2. Active waiver successfully applied with auditable metadata.');

// 3. Expired Waiver Test
const expiredWaiver = createWaiver({
  controlId: 'MNT-01.1',
  reason: 'Temporary exception',
  expiresInDays: -1, // Expired yesterday
  privateKeyPem: keyPair.privateKeyPem
});

const expiredValidation = validateWaiver(expiredWaiver, new Date(), keyPair.publicKeyPem);
assert.strictEqual(expiredValidation.active, false, 'Expired waiver MUST NOT be active');
assert(expiredValidation.reason.includes('expired'));

const expiredApplied = applyWaivers(initialControls, [expiredWaiver], new Date());
assert.strictEqual(expiredApplied.updatedControls['MNT-01.1'].status, 'FAIL', 'Expired waiver MUST NOT convert FAIL to PASS');
assert.strictEqual(expiredApplied.waivedControls.length, 0);
assert.strictEqual(expiredApplied.expiredWaivers.length, 1);
console.log('[PASS] 3. Expired waiver is automatically rejected and fails closed.');

// 4. Tampered Waiver Payload
const tamperedWaiver = JSON.parse(JSON.stringify(activeWaiver));
tamperedWaiver.control_id = 'SEC-05.1'; // Attacker attempts to apply waiver to secrets control

const tamperedValidation = validateWaiver(tamperedWaiver, new Date(), keyPair.publicKeyPem);
assert.strictEqual(tamperedValidation.valid, false, 'Tampered waiver must fail verification');
assert(tamperedValidation.reason.includes('tampered'));
console.log('[PASS] 4. Tampered waiver payload is decisively rejected.');

console.log('\n================================================================');
console.log('ALL GOVERNED WAIVER TESTS PASSED (4/4)');
console.log('================================================================\n');
