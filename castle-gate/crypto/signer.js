/**
 * Castle Security & Quality Gate — Cryptographic Signer & Verifier (Ed25519)
 * 
 * Provides asymmetric digital signing and verification over RFC 8785 canonical payloads.
 */

'use strict';

const crypto = require('crypto');
const { canonicalize, canonicalHash } = require('./canonicalizer');
const { deriveKeyId } = require('./signing-key');

/**
 * Digitally signs a payload using Ed25519 private key after RFC 8785 canonicalization.
 * 
 * @param {Object|string} payload Object or string to sign
 * @param {string|crypto.KeyObject} privateKeyPem Ed25519 private key in PEM format
 * @param {Object} [options]
 * @returns {Object} Signature metadata { signature_algorithm, signature_base64, key_id, signed_at, canonical_sha256 }
 */
function signPayload(payload, privateKeyPem, options = {}) {
  if (!privateKeyPem) {
    throw new Error('[Castle Signer] Private key is required for digital signing.');
  }

  const canonicalString = canonicalize(payload);
  const canonicalBuffer = Buffer.from(canonicalString, 'utf8');
  const digest = crypto.createHash('sha256').update(canonicalBuffer).digest('hex');

  let privKeyObj;
  if (typeof privateKeyPem === 'string') {
    privKeyObj = crypto.createPrivateKey(privateKeyPem);
  } else {
    privKeyObj = privateKeyPem;
  }

  // Create public key to derive key ID
  const pubKeyObj = crypto.createPublicKey(privKeyObj);
  const keyId = options.keyId || deriveKeyId(pubKeyObj);

  // Ed25519 signature
  const signatureBuffer = crypto.sign(null, canonicalBuffer, privKeyObj);
  const signatureBase64 = signatureBuffer.toString('base64');

  return {
    signature_algorithm: 'ed25519',
    signature_base64: signatureBase64,
    key_id: keyId,
    signed_at: new Date().toISOString(),
    canonical_sha256: digest
  };
}

/**
 * Verifies an Ed25519 digital signature over an RFC 8785 canonical payload.
 * 
 * @param {Object|string} payload The original uncanonicalized or canonicalized payload
 * @param {string} signatureBase64 Base64-encoded Ed25519 signature
 * @param {string|crypto.KeyObject} publicKeyPem Ed25519 public key in PEM format
 * @returns {Object} { valid: boolean, error?: string, canonical_sha256: string }
 */
function verifySignature(payload, signatureBase64, publicKeyPem) {
  if (!publicKeyPem) {
    return { valid: false, error: 'Missing public key for signature verification.' };
  }
  if (!signatureBase64) {
    return { valid: false, error: 'Missing signature.' };
  }

  try {
    const canonicalString = canonicalize(payload);
    const canonicalBuffer = Buffer.from(canonicalString, 'utf8');
    const digest = crypto.createHash('sha256').update(canonicalBuffer).digest('hex');

    let pubKeyObj;
    if (typeof publicKeyPem === 'string') {
      pubKeyObj = crypto.createPublicKey(publicKeyPem);
    } else {
      pubKeyObj = publicKeyPem;
    }

    const signatureBuffer = Buffer.from(signatureBase64, 'base64');
    const isValid = crypto.verify(null, canonicalBuffer, pubKeyObj, signatureBuffer);

    return {
      valid: isValid,
      error: isValid ? null : 'Ed25519 signature verification failed (payload tampered or wrong public key)',
      canonical_sha256: digest
    };
  } catch (err) {
    return {
      valid: false,
      error: `Signature verification error: ${err.message}`
    };
  }
}

module.exports = {
  signPayload,
  verifySignature
};
