/**
 * Castle Security & Quality Gate — Release Authorizer
 * 
 * Generates verified, immutable, cryptographically signed Release Certificate artifacts.
 * Enforces release clearance invariants:
 * - Certificate is generated ONLY when gate_state === 'PASSED'.
 * - BLOCKED, CONDITIONAL, EVIDENCE_PENDING, or REQUIRES_REMEDIATION strictly forbid certificate issuance.
 * - Signs certificates using Ed25519 asymmetric cryptography and RFC 8785 canonicalization.
 */

'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { canonicalize, canonicalHash } = require('../crypto/canonicalizer');
const { signPayload, verifySignature } = require('../crypto/signer');
const { deriveKeyId } = require('../crypto/signing-key');

const CERTIFICATE_SCHEMA_VERSION = '2.0.0-assurance';

/**
 * Generates a formal Release Certificate for an authorized release.
 * 
 * @param {Object} params {
 *   gate_decision: Object,
 *   cqs_evaluation_result: Object,
 *   evidence_package?: Object,
 *   target_system?: Object,
 *   commit_sha?: string,
 *   audit_trail_reference?: string,
 *   private_key_pem?: string,
 *   public_key_pem?: string
 * }
 * @returns {Object} Cryptographically verifiable Release Certificate
 */
function generateReleaseCertificate(params) {
  const {
    gate_decision,
    cqs_evaluation_result,
    evidence_package,
    target_system,
    commit_sha,
    audit_trail_reference,
    private_key_pem,
    public_key_pem
  } = params;

  if (!gate_decision) {
    throw new Error('[Release Authorizer] Missing Gate Decision object.');
  }

  // Strict invariant: Only 'PASSED' state permits release certificate issuance
  if (gate_decision.gate_state !== 'PASSED') {
    throw new Error(`[Release Authorizer] Release Forbidden: Gate state is "${gate_decision.gate_state}". Only "PASSED" gate state authorizes release certificate generation.`);
  }

  // Strict invariant: Zero active Gate Breakers allowed
  const cqsBreakers = (cqs_evaluation_result && cqs_evaluation_result.gate_breakers) || { status: 'CLEARED' };
  if (cqsBreakers.status === 'BLOCKED') {
    throw new Error('[Release Authorizer] Release Forbidden: Active Gate Breaker detected. Mandatory veto enforced.');
  }

  const timestamp = new Date().toISOString();
  const evaluationId = (cqs_evaluation_result && cqs_evaluation_result.evaluation_id) || (gate_decision.versioning && gate_decision.versioning.evaluation_id) || 'UNSPECIFIED_EVAL';
  const releaseId = `REL-CERT-${gate_decision.gate_level}-${Date.now()}`;
  const commit = commit_sha || (evidence_package && evidence_package.provenance && evidence_package.provenance.commit_sha) || 'UNSPECIFIED_COMMIT';
  const evidenceHash = (evidence_package && evidence_package.provenance && evidence_package.provenance.payload_sha256) || (evidence_package && evidence_package.integrity && evidence_package.integrity.payload_sha256) || 'DIRECT_EVALUATION';
  const nonce = (evidence_package && evidence_package.nonce) || crypto.randomBytes(16).toString('hex');

  const rawCertificateData = {
    schema_version: CERTIFICATE_SCHEMA_VERSION,
    certificate_id: releaseId,
    authorization_status: 'AUTHORIZED_FOR_RELEASE',
    issued_at: timestamp,
    nonce: nonce,
    target_system: {
      name: (target_system && target_system.name) || (cqs_evaluation_result && cqs_evaluation_result.target_system && cqs_evaluation_result.target_system.name) || 'unspecified_target',
      environment: (target_system && target_system.environment) || (cqs_evaluation_result && cqs_evaluation_result.target_system && cqs_evaluation_result.target_system.environment) || 'production',
      commit_sha: commit,
      repository_url: (target_system && target_system.repository_url) || (evidence_package && evidence_package.provenance && evidence_package.provenance.source_repo) || null
    },
    governance: {
      cqs_specification_version: (gate_decision.versioning && gate_decision.versioning.cqs_specification_version) || '1.1.0 (FROZEN)',
      gate_policy_version: (gate_decision.versioning && gate_decision.versioning.gate_policy_version) || '1.0.0-ratified',
      gate_level: gate_decision.gate_level,
      gate_level_name: gate_decision.gate_level_name,
      authority_class: gate_decision.policy_applied ? (gate_decision.policy_applied.rules.approval_roles_required || 'AUTOMATED_GOVERNANCE') : 'AUTH_CLASS_UNSPECIFIED',
      policy_reference: {
        policy_id: gate_decision.policy_applied ? (gate_decision.policy_applied.policy_id || `POL-${gate_decision.gate_level}`) : `POL-${gate_decision.gate_level}`,
        policy_sha256: gate_decision.policy_applied && gate_decision.policy_applied.integrity ? gate_decision.policy_applied.integrity.policy_sha256 : (gate_decision.policy_applied ? canonicalHash(gate_decision.policy_applied) : 'UNSPECIFIED_POLICY_HASH')
      }
    },
    evaluation_reference: {
      evaluation_id: evaluationId,
      gate_decision_id: gate_decision.decision_id,
      audit_trail_reference: audit_trail_reference || `AUD-GATE-${Date.now()}`,
      evidence_package_hash: evidenceHash,
      previous_evaluation: params.previous_evaluation || null
    },
    applied_waivers: (params.applied_waivers || []).map(w => ({
      waiver_id: w.waiver_id,
      control_id: w.control_id,
      approver: w.approver,
      approved_at: w.approved_at,
      expires_at: w.expires_at,
      reason: w.reason,
      waiver_sha256: w.integrity ? w.integrity.waiver_sha256 : w.waiver_sha256
    })),
    metrics_summary: {
      cqs_raw_score: gate_decision.cqs_summary ? gate_decision.cqs_summary.raw_score : null,
      cqs_display_score: gate_decision.cqs_summary ? gate_decision.cqs_summary.display_score : null,
      final_verdict: gate_decision.cqs_summary ? gate_decision.cqs_summary.verdict : 'PASSED',
      gate_breakers_status: cqsBreakers.status
    },
    post_verification_obligation: {
      required: gate_decision.policy_applied ? (gate_decision.policy_applied.rules.post_verification_required || false) : false,
      verification_window_hours: 48,
      status: gate_decision.policy_applied && gate_decision.policy_applied.rules.post_verification_required ? 'POST_VERIFICATION_PENDING_48H' : 'NOT_REQUIRED'
    }
  };

  // Generate RFC 8785 canonical digest over certificate content
  const canonicalPayload = canonicalize(rawCertificateData);
  const digest = crypto.createHash('sha256').update(canonicalPayload, 'utf8').digest('hex');

  let signatureBase64 = null;
  let keyId = null;
  let signingMode = 'CANONICAL_RFC8785_DIGEST';

  if (private_key_pem) {
    const signResult = signPayload(rawCertificateData, private_key_pem);
    signatureBase64 = signResult.signature_base64;
    keyId = signResult.key_id;
    signingMode = 'ED25519_ASYMMETRIC_SIGNED';
  }

  const certificate = {
    ...rawCertificateData,
    integrity: {
      canonical_algorithm: 'RFC-8785-JCS',
      digest_algorithm: 'SHA-256',
      certificate_digest: digest,
      signature_mode: signingMode,
      signing_authority: 'Grupo Castillo Release Gate Authority',
      pki_signature_extension: {
        enabled: Boolean(signatureBase64),
        algorithm: signatureBase64 ? 'ed25519' : null,
        key_id: keyId,
        signature_base64: signatureBase64,
        public_key_pem: public_key_pem || null,
        public_verifier_url: `https://verify.grupocastillo.com/cert/${releaseId}`
      }
    }
  };

  return certificate;
}

/**
 * Verifies the integrity and optional cryptographic signature of a Release Certificate.
 * 
 * @param {Object|string} certificateOrPath 
 * @param {string} [publicKeyPem] Optional Ed25519 public key in PEM format
 * @returns {Object} { valid: boolean, errors: Array<string>, signature_valid?: boolean }
 */
function verifyReleaseCertificate(certificateOrPath, publicKeyPem = null) {
  let certificate = certificateOrPath;
  if (typeof certificateOrPath === 'string') {
    const resolvedPath = path.resolve(certificateOrPath);
    if (!fs.existsSync(resolvedPath)) {
      return { valid: false, errors: [`Certificate file not found: ${certificateOrPath}`] };
    }
    try {
      certificate = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
    } catch (e) {
      return { valid: false, errors: [`Malformed certificate JSON file: ${e.message}`] };
    }
  }

  const errors = [];

  if (!certificate || typeof certificate !== 'object') {
    return { valid: false, errors: ['Invalid certificate object'] };
  }

  if (certificate.authorization_status !== 'AUTHORIZED_FOR_RELEASE') {
    errors.push(`Certificate status is not authorized: "${certificate.authorization_status}"`);
  }

  if (!certificate.integrity || !certificate.integrity.certificate_digest) {
    errors.push('Certificate missing integrity digest');
    return { valid: false, errors };
  }

  const { integrity, ...rawPayload } = certificate;
  
  // RFC 8785 Canonical verification
  const canonicalPayload = canonicalize(rawPayload);
  const calculatedDigest = crypto.createHash('sha256').update(canonicalPayload, 'utf8').digest('hex');

  if (calculatedDigest !== integrity.certificate_digest) {
    // Fallback: test legacy JSON.stringify formatting for backwards compatibility
    const legacyDigest = crypto.createHash('sha256').update(JSON.stringify(rawPayload)).digest('hex');
    if (legacyDigest !== integrity.certificate_digest) {
      errors.push('Certificate digest mismatch: certificate payload has been tampered with or modified');
    }
  }

  // If PKI signature extension is enabled or public key is supplied, verify Ed25519 signature
  let signatureValid = null;
  const pki = integrity.pki_signature_extension;
  const pubKey = publicKeyPem || (pki && pki.public_key_pem);

  if (pki && pki.enabled && pki.signature_base64) {
    if (!pubKey) {
      errors.push('Signed certificate requires a public key to verify signature');
    } else {
      const sigVerify = verifySignature(rawPayload, pki.signature_base64, pubKey);
      if (!sigVerify.valid) {
        errors.push(`Digital signature verification failed: ${sigVerify.error}`);
        signatureValid = false;
      } else {
        signatureValid = true;
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors,
    signature_valid: signatureValid,
    verified_id: certificate.certificate_id,
    target_system: certificate.target_system
  };
}

/**
 * Exports Release Certificate to JSON file.
 */
function exportReleaseCertificateToFile(certificate, outputDir) {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  const filePath = path.join(outputDir, 'release-certificate.json');
  fs.writeFileSync(filePath, JSON.stringify(certificate, null, 2), 'utf8');
  return filePath;
}

module.exports = {
  CERTIFICATE_SCHEMA_VERSION,
  generateReleaseCertificate,
  verifyReleaseCertificate,
  exportReleaseCertificateToFile
};
