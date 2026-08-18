/**
 * Castle Security & Quality Gate — Dogfooding End-to-End Verification Suite
 * 
 * Verifies that Castle Gate audits its own repository end-to-end:
 * 1. Scans castle-engineering codebase using all Native Probes (AST, Security, Dom, Maintainability).
 * 2. Generates OASIS SARIF v2.1.0 report.
 * 3. Generates CycloneDX v1.5 JSON SBOM.
 * 4. Produces RFC 8785 canonical bound evidence package with DSSE in-toto attestation.
 * 5. Cryptographically signs with Ed25519 asymmetric private key.
 * 6. Emits cryptographically bound Release Certificate.
 * 7. Executes independent verifier (castle-verify) verifying authenticity -> VALID (Exit 0).
 * 8. Tampers a single byte of evidence -> castle-verify detects corruption -> INVALID (Exit 1).
 */

'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const gate = require('../castle-gate/index');
const { generateKeyPair, saveKeyPair } = require('../castle-gate/crypto/signing-key');
const { verifyAssuranceArtifact } = require('../castle-gate/verifier/castle-verify');

const repoRootDir = path.resolve(__dirname, '..');
const dogfoodOutputDir = path.join(repoRootDir, '.castle-dogfood-artifacts');

if (fs.existsSync(dogfoodOutputDir)) {
  fs.rmSync(dogfoodOutputDir, { recursive: true, force: true });
}
fs.mkdirSync(dogfoodOutputDir, { recursive: true });

console.log('================================================================');
console.log('Castle Gate — End-to-End Dogfooding Self-Assurance Audit');
console.log(`Auditing target: ${repoRootDir}`);
console.log('================================================================\n');

// 1. Generate Ed25519 Assurance Keypair
const keyPair = generateKeyPair();
const keyPaths = saveKeyPair(keyPair, dogfoodOutputDir, 'dogfood-auditor');
console.log(`[DOGFOOD 1] Generated Ed25519 signing keypair (Key ID: ${keyPair.keyId})`);

// 2. Scan repository with Castle Native Probes
console.log('[DOGFOOD 2] Executing Castle Native Probes (Security, AST, DOM, Maintainability)...');
const scanResult = gate.runNativeScan(repoRootDir, {
  ignoredDirs: ['node_modules', '.git', 'tests', '.castle', '.castle-dogfood-artifacts', '.test-scratch-phase10', '.test-scratch-ast', '.test-scratch-githistory', '.test-scratch-sarif-sbom', '.test-scratch-ledger', '.test-scratch-determinism', '.test-scratch-adversarial-master']
});

console.log(`           Scanned ${scanResult.total_files_scanned} files across repository in ${scanResult.total_duration_ms} ms.`);
console.log(`           Aggregated Evidence SHA-256: ${scanResult.aggregated_sha256.substring(0, 16)}...`);

// 3. Execute Castle Gate Pipeline (Target Level: C2)
console.log('[DOGFOOD 3] Executing Gate Decision Engine & Release Authorizer [Level C2]...');
const execution = gate.executeCastleGate({
  target_system: {
    name: 'castle-gate-engine',
    environment: 'production',
    source_dir: repoRootDir,
    commit_sha: 'd09f00d112233445566778899aabbccddeeff001'
  },
  auditor: {
    name: 'Castle Gate Autonomous Assurance Engine',
    organization: 'Grupo Castillo Security Architecture'
  },
  gate_level: 'C2',
  raw_evidence: scanResult.raw_evidence,
  gate_evidence: scanResult.gate_evidence,
  commit_sha: 'd09f00d112233445566778899aabbccddeeff001',
  output_dir: dogfoodOutputDir,
  private_key_pem: keyPair.privateKeyPem,
  public_key_pem: keyPair.publicKeyPem,
  detailed_findings: scanResult.detailed_findings,
  scanner_metadata: { probes_executed: scanResult.probes_executed }
});

console.log(`           Gate Decision State: ${execution.gate_decision.gate_state}`);
if (execution.gate_decision.blockers && execution.gate_decision.blockers.length > 0) {
  console.log('           Blockers:', JSON.stringify(execution.gate_decision.blockers, null, 2));
}

// 4. Verify Generated Artifacts on Disk
const evidencePath = path.join(dogfoodOutputDir, 'evidence.json');
const certPath = path.join(dogfoodOutputDir, 'release-certificate.json');
const sarifPath = path.join(dogfoodOutputDir, 'sarif.json');
const sbomPath = path.join(dogfoodOutputDir, 'sbom-cyclonedx.json');
const htmlPath = path.join(dogfoodOutputDir, 'compliance-report.html');

assert(fs.existsSync(evidencePath), 'evidence.json must be generated');
assert(fs.existsSync(certPath), 'release-certificate.json must be generated');
assert(fs.existsSync(sarifPath), 'sarif.json must be generated');
assert(fs.existsSync(sbomPath), 'sbom-cyclonedx.json must be generated');
assert(fs.existsSync(htmlPath), 'compliance-report.html must be generated');

console.log('[DOGFOOD 4] All assurance artifacts generated successfully:');
console.log(`           - Evidence Package:   ${evidencePath}`);
console.log(`           - Release Cert:       ${certPath}`);
console.log(`           - SARIF v2.1.0:       ${sarifPath}`);
console.log(`           - CycloneDX SBOM:     ${sbomPath}`);
console.log(`           - HTML Audit Report:  ${htmlPath}`);

console.log('----------------------------------------------------------------');
console.log(`CQS Display Score:  ${execution.cqs_result.summary.cqs_display_score.toFixed(2)} / 100.00`);
console.log(`CQS Verdict:        ${execution.cqs_result.summary.final_verdict}`);
console.log(`Gate Decision:      ${execution.gate_decision.gate_state}`);
console.log(`Exit Code:          ${execution.exit_code}`);
console.log('----------------------------------------------------------------');

// 5. Execute Independent Offline Verifier on Authentic Artifacts
console.log('[DOGFOOD 5] Running independent verifier (castle-verify) on Release Certificate...');
const certVerify = verifyAssuranceArtifact({
  artifactPath: certPath,
  publicKeyPem: keyPair.publicKeyPem,
  reportHtmlPath: htmlPath
});

assert.strictEqual(certVerify.status, 'VALID', `Certificate must be verified as VALID: ${certVerify.details.join(', ')}`);
console.log(`[PASS] Release Certificate verified as VALID (Verified ID: ${certVerify.metadata.evaluation_id})`);

console.log('[DOGFOOD 6] Running independent verifier (castle-verify) on Evidence Package...');
const evVerify = verifyAssuranceArtifact({
  artifactPath: evidencePath,
  publicKeyPem: keyPair.publicKeyPem,
  sarifPath: sarifPath,
  sbomPath: sbomPath,
  reportHtmlPath: htmlPath,
  expectedCommit: 'd09f00d112233445566778899aabbccddeeff001'
});

assert.strictEqual(evVerify.status, 'VALID', `Evidence must be verified as VALID: ${evVerify.details.join(', ')}`);
console.log('[PASS] Evidence Package + DSSE in-toto Statement + SARIF + SBOM verified as VALID');

// 6. Adversarial Tampering Test (Modify a single byte in evidence)
console.log('[DOGFOOD 7] Adversarial Tampering: Modifying 1 byte in evidence JSON...');
const tamperedEvidencePath = path.join(dogfoodOutputDir, 'evidence-tampered.json');
const rawEvidenceContent = fs.readFileSync(evidencePath, 'utf8');

// Modify score inside evidence payload
const parsedEvidence = JSON.parse(rawEvidenceContent);
if (parsedEvidence.payloadType && parsedEvidence.payload) {
  // DSSE Envelope: tamper unpacked payload bytes
  const unpackedStr = Buffer.from(parsedEvidence.payload, 'base64').toString('utf8');
  const tamperedStr = unpackedStr.replace(/"score":\s*[\d.]+/, '"score": 99.99');
  parsedEvidence.payload = Buffer.from(tamperedStr, 'utf8').toString('base64');
} else if (parsedEvidence.metrics_summary) {
  parsedEvidence.metrics_summary.cqs_display_score = 99.99;
} else {
  parsedEvidence.tampered_injected_property = 'malicious';
}
fs.writeFileSync(tamperedEvidencePath, JSON.stringify(parsedEvidence, null, 2), 'utf8');

const tamperedVerify = verifyAssuranceArtifact({
  artifactPath: tamperedEvidencePath,
  publicKeyPem: keyPair.publicKeyPem
});

assert.strictEqual(tamperedVerify.status, 'INVALID', 'Tampered evidence MUST be rejected as INVALID');
console.log('[PASS] Tampered evidence immediately detected and rejected as INVALID:');
tamperedVerify.details.forEach(err => console.log(`       - ${err}`));

// Cleanup
fs.rmSync(dogfoodOutputDir, { recursive: true, force: true });

console.log('\n================================================================');
console.log('DOGFOODING SELF-ASSURANCE AUDIT COMPLETE — 100% VERIFIED');
console.log('================================================================\n');
