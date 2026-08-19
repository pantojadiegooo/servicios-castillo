/**
 * Castle Gate — v1.0.1 Surgical Fixes Test Suite (F-01, F-03, F-07)
 * 
 * Verifies:
 *   [F-01] CLI castle-verify exposes and strictly enforces:
 *          --trust-anchor <file>, --require-trust-anchor,
 *          --revocations <file>, --require-revocation-check.
 *   [F-03] Version string consistency (1.0.1 across active components).
 *   [F-07] Documentation link integrity (0 local Windows file:/// URLs in README & docs).
 */

'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { execSync } = require('child_process');

const gate = require('../castle-gate/index');
const { parseArgs } = require('../bin/castle-verify');
const { verifyAssuranceArtifact } = require('../castle-gate/verifier/castle-verify');
const { TrustAnchorStore } = require('../castle-gate/crypto/trust-anchor');
const { createRevocationManifest } = require('../castle-gate/crypto/key-revocation');

const scratchDir = path.join(__dirname, '..', '.test-v1-0-1-scratch');
if (fs.existsSync(scratchDir)) {
  fs.rmSync(scratchDir, { recursive: true, force: true });
}
fs.mkdirSync(scratchDir, { recursive: true });

console.log('================================================================');
console.log('CASTLE GATE — v1.0.1 SURGICAL FIXES TEST SUITE');
console.log('================================================================\n');

// -----------------------------------------------------------------------------
// [SECTION 1] Setup Mock Cryptographic Fixtures
// -----------------------------------------------------------------------------
console.log('--- [SECTION 1: TEST FIXTURES SETUP] ---');

const keyA = gate.generateKeyPair(); // Root authority / Anchor
const keyB = gate.generateKeyPair(); // Active release key
const keyC = gate.generateKeyPair(); // Revoked release key
const keyRogue = gate.generateKeyPair(); // Untrusted / rogue key

// Save keys
const keyBPubPath = path.join(scratchDir, 'key-b-pub.pem');
fs.writeFileSync(keyBPubPath, keyB.publicKeyPem, 'utf8');

// Build Trust Anchor Store
const anchorStore = new TrustAnchorStore([
  {
    key_id: keyB.keyId,
    public_key_pem: keyB.publicKeyPem,
    identity: { name: 'Alice Tech Lead', role: 'RELEASE_AUTHORITY' },
    valid_from: '2026-01-01T00:00:00.000Z',
    valid_until: '2028-01-01T00:00:00.000Z'
  },
  {
    key_id: keyC.keyId,
    public_key_pem: keyC.publicKeyPem,
    identity: { name: 'Bob Security Lead', role: 'RELEASE_AUTHORITY' },
    valid_from: '2026-01-01T00:00:00.000Z',
    valid_until: '2028-01-01T00:00:00.000Z'
  }
], {
  authority: 'Grupo Castillo Security Authority'
});

const anchorPath = path.join(scratchDir, 'trust-anchors.json');
anchorStore.saveToFile(anchorPath);
console.log('[+] Trust anchor store created with 2 anchored keys.');

// Build Revocation Manifest
const revocationManifest = createRevocationManifest([
  {
    key_id: keyC.keyId,
    revoked_at: '2026-06-01T12:00:00.000Z',
    revocation_reason: 'KEY_COMPROMISE',
    revoked_by: 'Grupo Castillo Security Board'
  }
], keyA.privateKeyPem, {
  authority: 'Grupo Castillo Security Authority'
});

const revManifestPath = path.join(scratchDir, 'revocations.json');
fs.writeFileSync(revManifestPath, JSON.stringify(revocationManifest, null, 2), 'utf8');
console.log('[+] Signed key revocation manifest created with 1 revoked key.');

// Helper to create valid signed certificate
function createTestCert(keyPair, issuedAt, commitSha = 'abcd1234abcd1234abcd1234abcd1234abcd1234') {
  const payload = {
    schema_version: '2.0.0-assurance',
    certificate_id: `REL-CERT-TEST-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    authorization_status: 'AUTHORIZED_FOR_RELEASE',
    issued_at: issuedAt,
    target_system: {
      name: 'test-app',
      environment: 'production',
      commit_sha: commitSha
    },
    cqs_evaluation: {
      specification_version: '1.1.0',
      cqs_score: 95.0,
      gate_decision: 'PASSED'
    }
  };

  const canonical = gate.canonicalize(payload);
  const digest = gate.canonicalHash(payload);
  const sigResult = gate.signPayload(payload, keyPair.privateKeyPem);

  const cert = {
    ...payload,
    integrity: {
      canonical_algorithm: 'RFC-8785-JCS',
      digest_algorithm: 'SHA-256',
      certificate_digest: digest,
      signature_mode: 'CANONICAL_RFC8785_DIGEST',
      signing_authority: 'Grupo Castillo Release Gate Authority',
      pki_signature_extension: {
        algorithm: 'Ed25519',
        key_id: keyPair.keyId,
        signature_base64: sigResult.signature_base64,
        public_key_pem: keyPair.publicKeyPem
      }
    }
  };

  return cert;
}

// Generate test certs
const certValid = createTestCert(keyB, '2026-07-01T00:00:00.000Z');
const certValidPath = path.join(scratchDir, 'cert-valid.json');
fs.writeFileSync(certValidPath, JSON.stringify(certValid, null, 2), 'utf8');

const certRevoked = createTestCert(keyC, '2026-07-01T00:00:00.000Z'); // Issued AFTER revocation (2026-06-01)
const certRevokedPath = path.join(scratchDir, 'cert-revoked.json');
fs.writeFileSync(certRevokedPath, JSON.stringify(certRevoked, null, 2), 'utf8');

const certRogue = createTestCert(keyRogue, '2026-07-01T00:00:00.000Z'); // Not in trust anchor
const certRoguePath = path.join(scratchDir, 'cert-rogue.json');
fs.writeFileSync(certRoguePath, JSON.stringify(certRogue, null, 2), 'utf8');

const certTampered = JSON.parse(JSON.stringify(certValid));
certTampered.target_system.commit_sha = 'forgedcommit0000000000000000000000000';
const certTamperedPath = path.join(scratchDir, 'cert-tampered.json');
fs.writeFileSync(certTamperedPath, JSON.stringify(certTampered, null, 2), 'utf8');

// -----------------------------------------------------------------------------
// [SECTION 2] F-01: Verifier Trust Anchor & Revocation Enforcement Tests
// -----------------------------------------------------------------------------
console.log('\n--- [SECTION 2: F-01 CASTLE-VERIFY TRUST ANCHOR & REVOCATION TESTS] ---');

// Test A: Certificado válido + Trust anchor válido -> VALID
{
  const res = verifyAssuranceArtifact({
    artifactPath: certValidPath,
    trustAnchorPath: anchorPath,
    requireTrustAnchor: true
  });
  assert.strictEqual(res.status, 'VALID', 'Valid cert with valid anchor must be VALID');
  console.log('[PASS] Test A: Valid certificate + valid trust anchor -> VALID');
}

// Test B: Certificado falso / tampered + Trust anchor -> INVALID
{
  const res = verifyAssuranceArtifact({
    artifactPath: certTamperedPath,
    trustAnchorPath: anchorPath,
    requireTrustAnchor: true
  });
  assert.strictEqual(res.status, 'INVALID', 'Tampered cert must be INVALID');
  console.log('[PASS] Test B: Tampered certificate + trust anchor -> INVALID');
}

// Test C: Certificado firmado con clave no anclada -> INVALID
{
  const res = verifyAssuranceArtifact({
    artifactPath: certRoguePath,
    trustAnchorPath: anchorPath,
    requireTrustAnchor: true
  });
  assert.strictEqual(res.status, 'INVALID', 'Unanchored key must be rejected');
  assert.ok(res.details.some(d => d.includes('Trust Anchor Verification FAILED')), 'Must state anchor failure');
  console.log('[PASS] Test C: Valid certificate + unanchored rogue key -> INVALID');
}

// Test D: Revocation manifest válido con clave activa -> VALID
{
  const res = verifyAssuranceArtifact({
    artifactPath: certValidPath,
    revocationManifestPath: revManifestPath,
    requireRevocationCheck: true
  });
  assert.strictEqual(res.status, 'VALID', 'Active key in revocation manifest must pass');
  console.log('[PASS] Test D: Valid active key against revocation manifest -> VALID');
}

// Test E: Certificado con clave revocada -> INVALID
{
  const res = verifyAssuranceArtifact({
    artifactPath: certRevokedPath,
    revocationManifestPath: revManifestPath,
    requireRevocationCheck: true
  });
  assert.strictEqual(res.status, 'INVALID', 'Revoked key must be rejected');
  assert.ok(res.details.some(d => d.includes('Key Revocation Check FAILED')), 'Must state revocation failure');
  console.log('[PASS] Test E: Revoked key certificate -> INVALID');
}

// Test F: Manifest corrupto / inexistente -> INVALID
{
  const corruptedManifestPath = path.join(scratchDir, 'corrupt-manifest.json');
  fs.writeFileSync(corruptedManifestPath, '{ invalid json...', 'utf8');

  const res = verifyAssuranceArtifact({
    artifactPath: certValidPath,
    revocationManifestPath: corruptedManifestPath,
    requireRevocationCheck: true
  });
  assert.strictEqual(res.status, 'INVALID', 'Corrupted manifest must fail closed');
  console.log('[PASS] Test F: Corrupted revocation manifest -> INVALID (Fail-Closed)');
}

// Test G: --require-trust-anchor sin archivo de anchor o archivo inexistente -> FAIL-CLOSED
{
  const res = verifyAssuranceArtifact({
    artifactPath: certValidPath,
    trustAnchorPath: path.join(scratchDir, 'non-existent-anchor.json'),
    requireTrustAnchor: true
  });
  assert.strictEqual(res.status, 'INVALID', 'Missing trust anchor file must fail closed');
  console.log('[PASS] Test G: Missing trust anchor with --require-trust-anchor -> INVALID (Fail-Closed)');
}

// Test H: --require-revocation-check sin archivo o inexistente -> FAIL-CLOSED
{
  const res = verifyAssuranceArtifact({
    artifactPath: certValidPath,
    revocationManifestPath: path.join(scratchDir, 'non-existent-rev.json'),
    requireRevocationCheck: true
  });
  assert.strictEqual(res.status, 'INVALID', 'Missing revocation manifest must fail closed');
  console.log('[PASS] Test H: Missing revocation manifest with --require-revocation-check -> INVALID (Fail-Closed)');
}

// Test I: Ejecución sin flags mantiene compatibilidad hacia atrás
{
  const res = verifyAssuranceArtifact({
    artifactPath: certValidPath
  });
  assert.strictEqual(res.status, 'VALID', 'Execution without strict flags must pass valid cert');
  console.log('[PASS] Test I: Backward-compatible execution without strict flags -> VALID');
}

// -----------------------------------------------------------------------------
// [SECTION 3] CLI Integration Tests (`castle-verify`)
// -----------------------------------------------------------------------------
console.log('\n--- [SECTION 3: CLI PARSER & INVOCATION TESTS] ---');

// Test CLI Argument Parser
const parsed = parseArgs([
  '--cert', certValidPath,
  '--trust-anchor', anchorPath,
  '--require-trust-anchor',
  '--revocations', revManifestPath,
  '--require-revocation-check',
  '--commit', 'abcd1234abcd1234abcd1234abcd1234abcd1234'
]);

assert.strictEqual(parsed.artifactPath, certValidPath);
assert.strictEqual(parsed.trustAnchorPath, anchorPath);
assert.strictEqual(parsed.requireTrustAnchor, true);
assert.strictEqual(parsed.revocationManifestPath, revManifestPath);
assert.strictEqual(parsed.requireRevocationCheck, true);
assert.strictEqual(parsed.cliError, null);
console.log('[PASS] CLI Argument Parser correctly parsed all new security flags.');

// Test CLI execution with full strict enforcement
const cliExecCmd = `node bin/castle-verify.js --cert "${certValidPath}" --trust-anchor "${anchorPath}" --require-trust-anchor --revocations "${revManifestPath}" --require-revocation-check --commit abcd1234abcd1234abcd1234abcd1234abcd1234`;
const cliOut = execSync(cliExecCmd, { cwd: path.join(__dirname, '..'), encoding: 'utf8' });
assert.ok(cliOut.includes('VERDICT: [VALID]'), 'CLI must output VALID');
assert.ok(cliOut.includes('Trust Anchor Enforced:  YES'), 'CLI must show Trust Anchor Enforced');
assert.ok(cliOut.includes('Revocation Enforced:    YES'), 'CLI must show Revocation Enforced');
console.log('[PASS] CLI execution with all strict flags verified successfully (Exit Code 0).');

// Test CLI execution on revoked certificate -> Exit Code 1
try {
  const cliRevCmd = `node bin/castle-verify.js --cert "${certRevokedPath}" --revocations "${revManifestPath}" --require-revocation-check`;
  execSync(cliRevCmd, { cwd: path.join(__dirname, '..'), stdio: 'pipe' });
  assert.fail('Should have failed with exit code 1');
} catch (err) {
  assert.strictEqual(err.status, 1, 'Revoked certificate must exit with code 1');
  console.log('[PASS] CLI on revoked certificate correctly exited with code 1.');
}

// Test CLI with missing argument value -> Exit Code 3
try {
  const cliErrCmd = `node bin/castle-verify.js --cert "${certValidPath}" --trust-anchor`;
  execSync(cliErrCmd, { cwd: path.join(__dirname, '..'), stdio: 'pipe' });
  assert.fail('Should have failed with exit code 3');
} catch (err) {
  assert.strictEqual(err.status, 3, 'Missing argument value must exit with code 3 (CLI_ERROR)');
  console.log('[PASS] CLI with missing argument value correctly exited with code 3.');
}

// -----------------------------------------------------------------------------
// [SECTION 4] F-03: Version String Tests
// -----------------------------------------------------------------------------
console.log('\n--- [SECTION 4: F-03 VERSION STRING INTEGRITY TESTS] ---');

const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
assert.strictEqual(pkg.version, '1.0.1', 'package.json version must be 1.0.1');

const cliVerOut = execSync('node bin/castle-gate.js --version', { cwd: path.join(__dirname, '..'), encoding: 'utf8' });
assert.ok(cliVerOut.includes('Castle Gate Engine:   1.0.1'), `castle-gate --version must display 1.0.1 (got: ${cliVerOut})`);
assert.ok(cliVerOut.includes('CQS Specification:    1.1.0 (FROZEN)'), 'CQS version must display 1.1.0 (FROZEN)');
console.log('[PASS] castle-gate --version outputs exact package version "1.0.1" and CQS "1.1.0 (FROZEN)".');

// -----------------------------------------------------------------------------
// [SECTION 5] F-07: README & Documentation Links Integrity Tests
// -----------------------------------------------------------------------------
console.log('\n--- [SECTION 5: F-07 DOCUMENTATION LINK INTEGRITY TESTS] ---');

// 1. README.md check
const readmeContent = fs.readFileSync(path.join(__dirname, '..', 'README.md'), 'utf8');
assert.ok(!readmeContent.includes('file:///C:'), 'README.md must not contain local Windows file:/// URLs');
assert.ok(!readmeContent.includes('file:///'), 'README.md must not contain any file:/// URLs');

const links = readmeContent.match(/\[([^\]]+)\]\(([^)]+)\)/g) || [];
let validatedLinks = 0;
for (const l of links) {
  const target = l.match(/\]\(([^)]+)\)/)[1];
  if (target.startsWith('#') || target.startsWith('http')) continue;
  const resolvedPath = path.resolve(path.join(__dirname, '..'), target);
  assert.ok(fs.existsSync(resolvedPath), `Relative link in README must exist: ${target} -> ${resolvedPath}`);
  validatedLinks++;
}
console.log(`[PASS] README.md contains 0 file:/// URLs. All ${validatedLinks} relative documentation links verified to exist.`);

// 2. docs/RELEASE_HANDOFF_v1.0.0.md check
const handoffPath = path.join(__dirname, '..', 'docs', 'RELEASE_HANDOFF_v1.0.0.md');
const handoffContent = fs.readFileSync(handoffPath, 'utf8');
assert.ok(!handoffContent.includes('file:///C:'), 'RELEASE_HANDOFF_v1.0.0.md must not contain local Windows file:/// URLs');
assert.ok(!handoffContent.includes('file:///'), 'RELEASE_HANDOFF_v1.0.0.md must not contain any file:/// URLs');
assert.ok(!handoffContent.includes('C:/Users/panto'), 'RELEASE_HANDOFF_v1.0.0.md must not contain C:/Users/panto');

const handoffLinks = handoffContent.match(/\[([^\]]+)\]\(([^)]+)\)/g) || [];
let validatedHandoffLinks = 0;
for (const l of handoffLinks) {
  const target = l.match(/\]\(([^)]+)\)/)[1];
  if (target.startsWith('#') || target.startsWith('http')) continue;
  const resolvedPath = path.resolve(path.dirname(handoffPath), target);
  assert.ok(fs.existsSync(resolvedPath), `Relative link in RELEASE_HANDOFF must exist: ${target} -> ${resolvedPath}`);
  validatedHandoffLinks++;
}
console.log(`[PASS] RELEASE_HANDOFF_v1.0.0.md contains 0 file:/// URLs. All ${validatedHandoffLinks} relative documentation links verified to exist.`);

// Cleanup scratch
fs.rmSync(scratchDir, { recursive: true, force: true });

console.log('\n================================================================');
console.log('ALL v1.0.1 SURGICAL FIXES TESTS PASSED (100% VERIFIED)');
console.log('================================================================\n');
