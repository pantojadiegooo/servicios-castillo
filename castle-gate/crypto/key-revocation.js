/**
 * Castle Security & Quality Gate — Key Status & Revocation Management
 * 
 * Provides signed, canonical-hashed, offline-verifiable key revocation manifests.
 * Enforces fail-closed evaluation against revoked Ed25519 signing keys.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { canonicalize, canonicalHash } = require('./canonicalizer');
const { signPayload, verifySignature } = require('./signer');
const { deriveKeyId } = require('./signing-key');

const REVOCATION_SCHEMA = '1.0.0-revocation';

const REVOCATION_REASONS = Object.freeze([
  'KEY_COMPROMISE',
  'KEY_SUPERSEDED',
  'ROUTINE_ROTATION',
  'AUTHORITY_TERMINATED',
  'SECURITY_POLICY_UPDATE'
]);

/**
 * Creates a cryptographically signed Key Revocation Manifest.
 * 
 * @param {Array<Object>} revocations Array of revocation entries
 * @param {string} signingPrivateKeyPem Ed25519 private key of the Revocation Authority
 * @param {Object} [options]
 * @returns {Object} Signed Revocation Manifest
 */
function createRevocationManifest(revocations = [], signingPrivateKeyPem, options = {}) {
  const timestamp = options.issued_at || new Date().toISOString();
  const manifestId = options.manifest_id || `REVOCATIONS-${Date.now()}`;
  const authority = options.authority || 'Grupo Castillo Security Governance & Architecture Board';

  const normalizedRevocations = revocations.map(r => {
    if (!r.key_id) {
      throw new Error('[Revocation] Revocation entry missing key_id');
    }
    return {
      key_id: r.key_id,
      status: 'REVOKED',
      revoked_at: r.revoked_at || timestamp,
      revocation_reason: r.revocation_reason || 'KEY_COMPROMISE',
      revoked_by: r.revoked_by || authority,
      scope: {
        invalidates_prior_certificates: r.scope && typeof r.scope.invalidates_prior_certificates === 'boolean'
          ? r.scope.invalidates_prior_certificates
          : false,
        cutoff_timestamp: (r.scope && r.scope.cutoff_timestamp) || r.revoked_at || timestamp
      }
    };
  });

  const rawManifest = {
    schema_version: REVOCATION_SCHEMA,
    manifest_id: manifestId,
    authority: authority,
    issued_at: timestamp,
    revocations: normalizedRevocations
  };

  const canonicalString = canonicalize(rawManifest);
  const digest = crypto.createHash('sha256').update(canonicalString, 'utf8').digest('hex');

  let signatureBase64 = null;
  let keyId = null;

  if (signingPrivateKeyPem) {
    const signResult = signPayload(rawManifest, signingPrivateKeyPem);
    signatureBase64 = signResult.signature_base64;
    keyId = signResult.key_id;
  }

  return {
    ...rawManifest,
    integrity: {
      canonical_algorithm: 'RFC-8785-JCS',
      digest_algorithm: 'SHA-256',
      manifest_digest: digest,
      signature: {
        algorithm: 'ed25519',
        key_id: keyId,
        signature_base64: signatureBase64
      }
    }
  };
}

/**
 * Validates the cryptographic integrity and digital signature of a Revocation Manifest.
 * 
 * @param {Object|string} manifest Manifest object or JSON string
 * @param {string} [authorityPublicKeyPem] Optional authority public key to verify signature
 * @returns {Object} { valid: boolean, error?: string, manifest?: Object }
 */
function validateRevocationManifest(manifest, authorityPublicKeyPem = null) {
  let parsedManifest = manifest;
  if (typeof manifest === 'string') {
    try {
      parsedManifest = JSON.parse(manifest);
    } catch (err) {
      return { valid: false, error: `Malformed JSON in revocation manifest: ${err.message}` };
    }
  }

  if (!parsedManifest || typeof parsedManifest !== 'object') {
    return { valid: false, error: 'Revocation manifest is not a valid object.' };
  }

  const integrity = parsedManifest.integrity;
  if (!integrity || !integrity.manifest_digest) {
    return { valid: false, error: 'Revocation manifest missing integrity metadata block.' };
  }

  const { integrity: _, ...rawPayload } = parsedManifest;
  const canonicalString = canonicalize(rawPayload);
  const calculatedHash = crypto.createHash('sha256').update(canonicalString, 'utf8').digest('hex');

  if (calculatedHash !== integrity.manifest_digest) {
    return {
      valid: false,
      error: `Manifest digest mismatch: calculated RFC 8785 SHA-256 (${calculatedHash}) !== recorded (${integrity.manifest_digest}). Manifest has been tampered with!`
    };
  }

  // If authority public key is supplied, verify signature
  if (authorityPublicKeyPem && integrity.signature && integrity.signature.signature_base64) {
    const sigVerify = verifySignature(rawPayload, integrity.signature.signature_base64, authorityPublicKeyPem);
    if (!sigVerify.valid) {
      return { valid: false, error: `Revocation manifest digital signature invalid: ${sigVerify.error}` };
    }
  }

  return { valid: true, manifest: parsedManifest };
}

/**
 * Evaluates the revocation status of a specific signing key against a Revocation Manifest.
 * 
 * @param {string} keyId Key identifier to check
 * @param {string} [certificateIssuedAt] ISO timestamp when certificate was issued
 * @param {Object|string} [manifest] Revocation manifest object or path
 * @param {Object} [options] { authorityPublicKeyPem, requireManifest: boolean }
 * @returns {Object} { status: 'ACTIVE'|'REVOKED'|'HISTORICAL_VALID_RETIRED'|'UNCHECKED'|'MANIFEST_CORRUPT', valid: boolean, details: string, revocation?: Object }
 */
function checkKeyRevocationStatus(keyId, certificateIssuedAt = null, manifest = null, options = {}) {
  if (!keyId) {
    return {
      status: 'INVALID_QUERY',
      valid: false,
      details: 'Missing key_id to check revocation status.'
    };
  }

  if (!manifest) {
    if (options.requireManifest) {
      return {
        status: 'MANIFEST_REQUIRED_MISSING',
        valid: false,
        details: 'Policy requires verified revocation manifest, but none was provided (fail-closed).'
      };
    }
    return {
      status: 'UNCHECKED',
      valid: true,
      details: 'No revocation manifest provided; verification executed without active revocation list.'
    };
  }

  let manifestObj = manifest;
  if (typeof manifest === 'string' && fs.existsSync(manifest)) {
    try {
      manifestObj = JSON.parse(fs.readFileSync(manifest, 'utf8'));
    } catch (e) {
      return {
        status: 'MANIFEST_CORRUPT',
        valid: false,
        details: `Failed to parse revocation manifest file: ${e.message}`
      };
    }
  }

  // Validate manifest integrity first (Fail-Closed)
  const validation = validateRevocationManifest(manifestObj, options.authorityPublicKeyPem);
  if (!validation.valid) {
    return {
      status: 'MANIFEST_CORRUPT',
      valid: false,
      details: `Revocation manifest integrity check failed: ${validation.error}`
    };
  }

  const validManifest = validation.manifest;
  const revocations = validManifest.revocations || [];

  const foundRevocation = revocations.find(r => r.key_id === keyId);

  if (!foundRevocation) {
    return {
      status: 'ACTIVE',
      valid: true,
      details: `Signing key "${keyId}" is ACTIVE in manifest ${validManifest.manifest_id}.`
    };
  }

  // Key is in revocation list — evaluate temporal scope
  const certTimestamp = certificateIssuedAt ? new Date(certificateIssuedAt).getTime() : Date.now();
  const revokedTimestamp = new Date(foundRevocation.revoked_at).getTime();
  const invalidatesPrior = Boolean(foundRevocation.scope && foundRevocation.scope.invalidates_prior_certificates);

  if (invalidatesPrior) {
    return {
      status: 'REVOKED',
      valid: false,
      details: `Signing key "${keyId}" was revoked on ${foundRevocation.revoked_at} (Reason: ${foundRevocation.revocation_reason}) with retroactive invalidation of all prior certificates.`,
      revocation: foundRevocation
    };
  }

  if (certTimestamp >= revokedTimestamp) {
    return {
      status: 'REVOKED',
      valid: false,
      details: `Signing key "${keyId}" was REVOKED on ${foundRevocation.revoked_at} prior to certificate issuance (${certificateIssuedAt}). Release unauthorized.`,
      revocation: foundRevocation
    };
  }

  // Certificate was issued BEFORE revocation and revocation does not retroactively invalidate prior certs
  return {
    status: 'HISTORICAL_VALID_RETIRED',
    valid: true,
    details: `Signing key "${keyId}" was revoked on ${foundRevocation.revoked_at} (after certificate issuance at ${certificateIssuedAt}). Historical certificate validity is preserved.`,
    revocation: foundRevocation
  };
}

module.exports = {
  createRevocationManifest,
  validateRevocationManifest,
  checkKeyRevocationStatus,
  REVOCATION_SCHEMA,
  REVOCATION_REASONS
};
