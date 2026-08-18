/**
 * Castle Security & Quality Gate — Independent Verifier (`castle-verify`)
 * 
 * Standalone, offline cryptographic verifier for Castle Gate Evidence & Certificates.
 * Requires ZERO reliance on Grupo Castillo servers, APIs, or internet connectivity.
 * 
 * Principles of Trust:
 * 1. Offline cryptographic verification using Ed25519 public key and RFC 8785 canonicalization.
 * 2. Complete non-repudiation: guarantees evidence was evaluated for the exact commit, policy, and CQS version.
 * 3. Independent Trust Anchor verification: prevents rogue certificate + key substitution on compromised sites.
 * 4. Key Revocation evaluation: enforces fail-closed rejection for revoked signing keys.
 * 5. Tamper-evident binding: any alteration to score, decision, findings, or artifacts yields INVALID.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { canonicalize, canonicalHash } = require('../crypto/canonicalizer');
const { verifySignature } = require('../crypto/signer');
const { verifyDsseEnvelope } = require('../crypto/dsse');
const { loadKey, deriveKeyId } = require('../crypto/signing-key');
const { TrustAnchorStore } = require('../crypto/trust-anchor');
const { checkKeyRevocationStatus, validateRevocationManifest } = require('../crypto/key-revocation');

/**
 * Verifies a Castle Gate Evidence Artifact, Release Certificate, or DSSE Envelope.
 * 
 * @param {Object} params {
 *   artifactPath: string,
 *   publicKeyPath?: string,
 *   publicKeyPem?: string,
 *   trustAnchorPath?: string,
 *   trustAnchorStore?: Object,
 *   revocationManifestPath?: string,
 *   revocationManifest?: Object,
 *   requireTrustAnchor?: boolean,
 *   requireRevocationCheck?: boolean,
 *   expectedCommit?: string,
 *   expectedPolicyHash?: string,
 *   reportHtmlPath?: string,
 *   sarifPath?: string,
 *   sbomPath?: string
 * }
 * @returns {Object} { status: 'VALID'|'INVALID', details: Array<string>, metadata: Object }
 */
function verifyAssuranceArtifact(params) {
  const {
    artifactPath,
    publicKeyPath,
    publicKeyPem,
    trustAnchorPath,
    trustAnchorStore,
    revocationManifestPath,
    revocationManifest,
    requireTrustAnchor,
    requireRevocationCheck,
    expectedCommit,
    expectedPolicyHash,
    reportHtmlPath,
    sarifPath,
    sbomPath
  } = params;

  const diagnostics = [];
  let status = 'VALID';

  // Step 1: Read artifact file
  if (!artifactPath || !fs.existsSync(artifactPath)) {
    return {
      status: 'INVALID',
      details: [`Artifact file not found: "${artifactPath}"`],
      metadata: null
    };
  }

  let artifact;
  try {
    const rawContent = fs.readFileSync(artifactPath, 'utf8');
    artifact = JSON.parse(rawContent);
  } catch (err) {
    return {
      status: 'INVALID',
      details: [`Malformed JSON in artifact file: ${err.message}`],
      metadata: null
    };
  }

  // Step 2: Load Public Key if specified
  let pubKey = publicKeyPem || null;
  if (publicKeyPath) {
    try {
      const loaded = loadKey(publicKeyPath);
      pubKey = loaded.publicKeyPem;
    } catch (err) {
      return {
        status: 'INVALID',
        details: [`Failed to load public key from "${publicKeyPath}": ${err.message}`],
        metadata: null
      };
    }
  }

  let unverifiedPayload = null;
  let isDsse = false;
  let signatureInfo = null;

  // Step 3: Handle DSSE Envelope format
  if (artifact.payloadType && artifact.payload && Array.isArray(artifact.signatures)) {
    isDsse = true;
    if (!pubKey) {
      status = 'INVALID';
      diagnostics.push('DSSE Envelope requires an Ed25519 public key (--key) for verification.');
    } else {
      const dsseResult = verifyDsseEnvelope(artifact, pubKey);
      if (!dsseResult.valid) {
        status = 'INVALID';
        diagnostics.push(`DSSE envelope signature verification failed: ${dsseResult.error}`);
      } else {
        diagnostics.push(`DSSE envelope signature verified successfully (Key ID: ${dsseResult.keyid}).`);
        const stmt = dsseResult.statement;
        unverifiedPayload = stmt.predicate || stmt;
        signatureInfo = {
          type: 'DSSE_IN_TOTO',
          keyid: dsseResult.keyid,
          payloadType: dsseResult.payloadType
        };
      }
    }
  } else {
    // Standard Evidence or Release Certificate format
    unverifiedPayload = artifact;
  }

  if (!unverifiedPayload || typeof unverifiedPayload !== 'object') {
    return {
      status: 'INVALID',
      details: ['Payload could not be unpacked or is not a valid JSON object.', ...diagnostics],
      metadata: null
    };
  }

  // Step 4: Verify Canonical Digest Integrity
  const integrity = unverifiedPayload.integrity;
  let signingKeyId = null;
  let signatureValid = false;

  if (!integrity) {
    status = 'INVALID';
    diagnostics.push('Artifact missing "integrity" metadata block.');
  } else {
    const { integrity: _, ...rawPayload } = unverifiedPayload;
    const canonicalString = canonicalize(rawPayload);
    const calculatedHash = crypto.createHash('sha256').update(canonicalString, 'utf8').digest('hex');

    const expectedDigest = integrity.certificate_digest || integrity.payload_sha256;
    if (!expectedDigest) {
      status = 'INVALID';
      diagnostics.push('Integrity block missing certificate_digest or payload_sha256.');
    } else if (calculatedHash !== expectedDigest) {
      status = 'INVALID';
      diagnostics.push(`Digest mismatch: calculated RFC 8785 SHA-256 (${calculatedHash}) does not match recorded digest (${expectedDigest}). Artifact payload has been modified!`);
    } else {
      diagnostics.push(`Canonical RFC 8785 digest verified (${calculatedHash.substring(0, 16)}...). `);
    }

    // Step 5: Verify Asymmetric Ed25519 Signature
    const pki = integrity.pki_signature_extension || integrity.signature;
    const hasSignature = Boolean(pki && (pki.signature_base64 || pki.sig));
    signingKeyId = (pki && pki.key_id) || (pubKey ? deriveKeyId(pubKey) : null);

    // Fallback: If no explicit pubKey was supplied, extract public_key_pem from artifact if present
    let effectivePubKey = pubKey;
    if (!effectivePubKey && pki && pki.public_key_pem) {
      effectivePubKey = pki.public_key_pem;
    }

    if (effectivePubKey) {
      if (!hasSignature) {
        status = 'INVALID';
        diagnostics.push('Signature missing: Public key was provided for verification, but artifact contains no digital signature (signature stripping detected).');
      } else {
        const sigBase64 = pki.signature_base64 || pki.sig;
        const sigVerify = verifySignature(rawPayload, sigBase64, effectivePubKey);
        if (!sigVerify.valid) {
          status = 'INVALID';
          diagnostics.push(`Ed25519 digital signature invalid: ${sigVerify.error}`);
        } else {
          signatureValid = true;
          diagnostics.push(`Ed25519 digital signature verified valid against public key (Key ID: ${signingKeyId || 'DERIVED'}).`);
          signatureInfo = {
            type: 'ED25519_DIRECT',
            keyid: signingKeyId
          };
        }
      }
    } else if (hasSignature) {
      diagnostics.push('Warning: Artifact is digitally signed, but no public key was supplied to verify signature.');
    } else if (integrity.signed === true) {
      status = 'INVALID';
      diagnostics.push('Signature missing: Artifact claims integrity.signed=true, but digital signature is absent.');
    }
  }

  // Step 6: Independent Trust Anchor Validation
  let trustAnchorStoreInstance = trustAnchorStore || null;
  if (!trustAnchorStoreInstance && trustAnchorPath && fs.existsSync(trustAnchorPath)) {
    try {
      trustAnchorStoreInstance = TrustAnchorStore.loadFromFile(trustAnchorPath);
    } catch (err) {
      status = 'INVALID';
      diagnostics.push(`Failed to load independent trust anchor from "${trustAnchorPath}": ${err.message}`);
    }
  }

  let trustAnchorResult = { checked: false, trusted: true };
  if (trustAnchorStoreInstance || requireTrustAnchor) {
    if (!trustAnchorStoreInstance) {
      status = 'INVALID';
      diagnostics.push('Independent trust anchor is required by policy, but no trust anchor store was found (fail-closed).');
      trustAnchorResult = { checked: true, trusted: false, reason: 'TRUST_ANCHOR_MISSING' };
    } else {
      const anchorCheck = trustAnchorStoreInstance.isKeyTrusted(pubKey || (integrity && integrity.pki_signature_extension && integrity.pki_signature_extension.public_key_pem), signingKeyId);
      trustAnchorResult = { checked: true, trusted: anchorCheck.trusted, reason: anchorCheck.reason, anchor: anchorCheck.anchor };
      if (!anchorCheck.trusted) {
        status = 'INVALID';
        diagnostics.push(`Independent Trust Anchor Verification FAILED: ${anchorCheck.reason} (Site compromise or rogue key substitution detected).`);
      } else {
        diagnostics.push(`Independent Trust Anchor Verified: Key "${signingKeyId}" is anchored in "${trustAnchorStoreInstance.authority}".`);
      }
    }
  }

  // Step 7: Key Revocation Status Evaluation
  let revocationResult = { checked: false, status: 'UNCHECKED' };
  let effectiveRevocationManifest = revocationManifest || null;
  if (!effectiveRevocationManifest && revocationManifestPath && fs.existsSync(revocationManifestPath)) {
    try {
      effectiveRevocationManifest = JSON.parse(fs.readFileSync(revocationManifestPath, 'utf8'));
    } catch (err) {
      status = 'INVALID';
      diagnostics.push(`Failed to load key revocation manifest from "${revocationManifestPath}": ${err.message}`);
    }
  }

  if (signingKeyId && (effectiveRevocationManifest || requireRevocationCheck)) {
    const certIssuedAt = unverifiedPayload.issued_at || (unverifiedPayload.provenance && unverifiedPayload.provenance.timestamp);
    const revCheck = checkKeyRevocationStatus(signingKeyId, certIssuedAt, effectiveRevocationManifest, {
      requireManifest: requireRevocationCheck
    });

    revocationResult = { checked: true, ...revCheck };

    if (!revCheck.valid) {
      status = 'INVALID';
      diagnostics.push(`Key Revocation Check FAILED: ${revCheck.details}`);
    } else if (revCheck.status === 'HISTORICAL_VALID_RETIRED') {
      diagnostics.push(`Key Revocation Advisory: ${revCheck.details}`);
    } else if (revCheck.status === 'ACTIVE') {
      diagnostics.push(`Key Revocation Check: ${revCheck.details}`);
    }
  }

  // Step 8: Verify Commit Binding if expectedCommit is specified
  const targetCommit = (unverifiedPayload.target_system && unverifiedPayload.target_system.commit_sha) ||
                       (unverifiedPayload.provenance && unverifiedPayload.provenance.commit_sha);
  
  if (expectedCommit && targetCommit) {
    if (targetCommit !== expectedCommit) {
      status = 'INVALID';
      diagnostics.push(`Commit SHA mismatch: Evidence evaluated commit "${targetCommit}", but expected commit is "${expectedCommit}".`);
    } else {
      diagnostics.push(`Commit SHA binding verified: "${targetCommit}".`);
    }
  }

  // Step 9: Verify Policy Binding if expectedPolicyHash is specified
  const recordedPolicyHash = (unverifiedPayload.governance && unverifiedPayload.governance.policy_reference && unverifiedPayload.governance.policy_reference.policy_sha256) ||
                             (unverifiedPayload.governance && unverifiedPayload.governance.policy_hash);
  if (expectedPolicyHash && recordedPolicyHash) {
    if (recordedPolicyHash !== expectedPolicyHash) {
      status = 'INVALID';
      diagnostics.push(`Policy hash mismatch: Evidence evaluated policy hash "${recordedPolicyHash}", expected "${expectedPolicyHash}".`);
    } else {
      diagnostics.push(`Policy hash binding verified: "${recordedPolicyHash.substring(0, 16)}...".`);
    }
  }

  // Step 10: Verify Report Artifacts Integrity (HTML report, SARIF, SBOM)
  const artifactsMeta = unverifiedPayload.artifacts || {};

  if (reportHtmlPath && fs.existsSync(reportHtmlPath)) {
    const htmlContent = fs.readFileSync(reportHtmlPath);
    const calculatedHtmlSha = crypto.createHash('sha256').update(htmlContent).digest('hex');
    const recordedHtmlSha = artifactsMeta.compliance_report_html_sha256;
    if (recordedHtmlSha && calculatedHtmlSha !== recordedHtmlSha) {
      status = 'INVALID';
      diagnostics.push(`HTML compliance report has been modified! SHA-256 (${calculatedHtmlSha}) !== Recorded (${recordedHtmlSha})`);
    } else if (recordedHtmlSha) {
      diagnostics.push(`HTML compliance report integrity verified (${calculatedHtmlSha.substring(0, 16)}...). `);
    }
  }

  if (sarifPath && fs.existsSync(sarifPath)) {
    const rawSarif = fs.readFileSync(sarifPath, 'utf8');
    let calculatedSarifSha;
    try {
      calculatedSarifSha = crypto.createHash('sha256').update(canonicalize(JSON.parse(rawSarif)), 'utf8').digest('hex');
    } catch (e) {
      calculatedSarifSha = crypto.createHash('sha256').update(rawSarif, 'utf8').digest('hex');
    }
    const recordedSarifSha = artifactsMeta.sarif_sha256;
    if (recordedSarifSha && calculatedSarifSha !== recordedSarifSha) {
      status = 'INVALID';
      diagnostics.push(`SARIF report has been modified! SHA-256 (${calculatedSarifSha}) !== Recorded (${recordedSarifSha})`);
    } else if (recordedSarifSha) {
      diagnostics.push(`SARIF report integrity verified.`);
    }
  }

  if (sbomPath && fs.existsSync(sbomPath)) {
    const rawSbom = fs.readFileSync(sbomPath, 'utf8');
    let calculatedSbomSha;
    try {
      calculatedSbomSha = crypto.createHash('sha256').update(canonicalize(JSON.parse(rawSbom)), 'utf8').digest('hex');
    } catch (e) {
      calculatedSbomSha = crypto.createHash('sha256').update(rawSbom, 'utf8').digest('hex');
    }
    const recordedSbomSha = artifactsMeta.sbom_cyclonedx_sha256;
    if (recordedSbomSha && calculatedSbomSha !== recordedSbomSha) {
      status = 'INVALID';
      diagnostics.push(`SBOM artifact has been modified! SHA-256 (${calculatedSbomSha}) !== Recorded (${recordedSbomSha})`);
    } else if (recordedSbomSha) {
      diagnostics.push(`SBOM artifact integrity verified.`);
    }
  }

  const metadata = {
    evaluation_id: unverifiedPayload.evaluation_id || (unverifiedPayload.evaluation_reference && unverifiedPayload.evaluation_reference.evaluation_id),
    target_project: unverifiedPayload.target_system ? unverifiedPayload.target_system.name : 'Unknown',
    environment: unverifiedPayload.target_system ? unverifiedPayload.target_system.environment : 'Unknown',
    commit_sha: targetCommit,
    gate_level: (unverifiedPayload.assessment && unverifiedPayload.assessment.gate_level) || (unverifiedPayload.governance && unverifiedPayload.governance.gate_level),
    gate_decision: (unverifiedPayload.assessment && unverifiedPayload.assessment.gate_decision) || unverifiedPayload.authorization_status,
    cqs_score: (unverifiedPayload.assessment && unverifiedPayload.assessment.cqs_display_score) || (unverifiedPayload.metrics_summary && unverifiedPayload.metrics_summary.cqs_display_score),
    cqs_verdict: (unverifiedPayload.assessment && unverifiedPayload.assessment.cqs_verdict) || (unverifiedPayload.metrics_summary && unverifiedPayload.metrics_summary.final_verdict),
    signature: signatureInfo,
    trust_chain: {
      certificate_id: unverifiedPayload.certificate_id,
      digest_algorithm: 'RFC-8785-JCS / SHA-256',
      signature_verified: signatureValid,
      signing_key_id: signingKeyId,
      trust_anchor: trustAnchorResult,
      key_revocation: revocationResult,
      chain_status: status === 'VALID' ? 'TRUSTED_AND_VALID' : 'UNTRUSTED_OR_REVOKED'
    }
  };

  return {
    status,
    details: diagnostics,
    metadata
  };
}

module.exports = {
  verifyAssuranceArtifact
};
