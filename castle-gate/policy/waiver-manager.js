/**
 * Castle Security & Quality Gate — Governed Waivers Engine
 * 
 * Manages auditable, time-bounded, cryptographically signed exception waivers.
 * Strict Invariant: No ad-hoc `ignore=true`. Expired waivers automatically become invalid.
 */

'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { canonicalize, canonicalHash } = require('../crypto/canonicalizer');
const { signPayload, verifySignature } = require('../crypto/signer');

const WAIVER_SCHEMA_VERSION = '2.0.0-assurance';

/**
 * Creates a structured, signed Governance Waiver.
 * 
 * @param {Object} params {
 *   controlId: string,
 *   reason: string,
 *   scope: Object,
 *   approver: Object,
 *   expiresInDays: number,
 *   compensatingControls: string,
 *   policyId: string,
 *   privateKeyPem?: string
 * }
 * @returns {Object} Governed Waiver Object
 */
function createWaiver(params) {
  const {
    controlId,
    reason,
    scope = { environment: 'production', path: '*' },
    approver = { name: 'Security Lead', role: 'SECURITY_OFFICER' },
    expiresInDays = 14,
    compensatingControls = 'Manual compensating review performed',
    policyId = 'POL-C2-v1.0.0',
    privateKeyPem = null
  } = params;

  if (!controlId) throw new Error('[Waiver Manager] Missing controlId for waiver.');
  if (!reason) throw new Error('[Waiver Manager] Missing justification reason for waiver.');

  const now = new Date();
  const approvedAt = now.toISOString();
  const expiresAt = new Date(now.getTime() + expiresInDays * 24 * 60 * 60 * 1000).toISOString();
  const waiverId = `WAIVER-${controlId.replace(/[^a-zA-Z0-9]/g, '_')}-${Date.now()}`;

  const rawWaiver = {
    schema_version: WAIVER_SCHEMA_VERSION,
    waiver_id: waiverId,
    control_id: controlId,
    reason: reason,
    scope: scope,
    approver: approver,
    approved_at: approvedAt,
    expires_at: expiresAt,
    compensating_controls: compensatingControls,
    policy_id: policyId
  };

  const canonicalString = canonicalize(rawWaiver);
  const waiverHash = crypto.createHash('sha256').update(canonicalString, 'utf8').digest('hex');

  let signature = null;
  if (privateKeyPem) {
    signature = signPayload(rawWaiver, privateKeyPem);
  }

  return {
    ...rawWaiver,
    integrity: {
      canonical_algorithm: 'RFC-8785-JCS',
      waiver_sha256: waiverHash,
      signature: signature
    }
  };
}

/**
 * Validates whether a waiver is currently active, non-expired, and cryptographically valid against the Trust Ring.
 * 
 * @param {Object} waiver 
 * @param {Date|string} [currentTimestamp] 
 * @param {Object|string} [trustRingOrPublicKey] ApproverTrustRing instance or public key PEM string
 * @returns {Object} { valid: boolean, active: boolean, reason?: string, approver_verified?: boolean }
 */
function validateWaiver(waiver, currentTimestamp = new Date(), trustRingOrPublicKey = null) {
  if (!waiver || typeof waiver !== 'object') {
    return { valid: false, active: false, reason: 'Invalid waiver object' };
  }

  const { getRequiredRoleForControl, isRoleSufficient } = require('./approver-trust-ring');

  const checkTime = new Date(currentTimestamp);
  const expiryTime = new Date(waiver.expires_at);

  // Expiration check
  if (checkTime >= expiryTime) {
    return {
      valid: true,
      active: false,
      reason: `Waiver expired on ${waiver.expires_at} (current check time: ${checkTime.toISOString()})`
    };
  }

  const { integrity, ...rawWaiver } = waiver;
  if (!integrity || !integrity.waiver_sha256) {
    return { valid: false, active: false, reason: 'Missing waiver integrity digest' };
  }

  const canonicalString = canonicalize(rawWaiver);
  const calculatedHash = crypto.createHash('sha256').update(canonicalString, 'utf8').digest('hex');

  if (calculatedHash !== integrity.waiver_sha256) {
    return { valid: false, active: false, reason: 'Waiver payload has been tampered with or modified' };
  }

  let approverVerified = false;
  let verifiedIdentity = null;

  // If Approver Trust Ring is provided, enforce cryptographic identity and role checks
  if (trustRingOrPublicKey && typeof trustRingOrPublicKey.findApprover === 'function') {
    const trustRing = trustRingOrPublicKey;
    const signature = integrity.signature;
    if (!signature || !signature.signature_base64) {
      return { valid: false, active: false, reason: 'Waiver lacks cryptographic digital signature required by Trust Ring' };
    }

    const keyId = signature.key_id;
    let approverEntry = trustRing.findApprover(keyId);

    // Fallback: try finding approver by trying all registered keys if key_id missing
    if (!approverEntry && trustRing.approvers.length > 0) {
      for (const a of trustRing.approvers) {
        const sigTest = verifySignature(rawWaiver, signature.signature_base64, a.public_key_pem);
        if (sigTest.valid) {
          approverEntry = a;
          break;
        }
      }
    }

    if (!approverEntry) {
      return {
        valid: false,
        active: false,
        reason: 'Waiver signer key is NOT registered in Approver Trust Ring'
      };
    }

    // Verify signature with registered public key
    const sigVerify = verifySignature(rawWaiver, integrity.signature.signature_base64, approverEntry.public_key_pem);
    if (!sigVerify.valid) {
      return { valid: false, active: false, reason: `Waiver digital signature invalid: ${sigVerify.error}` };
    }

    // Check validity period of the approver's registered key
    const validUntil = new Date(approverEntry.validity.valid_until);
    if (checkTime >= validUntil) {
      return {
        valid: false,
        active: false,
        reason: `Approver key registration expired on ${approverEntry.validity.valid_until}`
      };
    }

    // Check role sufficiency against required control role
    const requiredRole = getRequiredRoleForControl(waiver.control_id);
    if (!isRoleSufficient(approverEntry.identity.role, requiredRole)) {
      return {
        valid: false,
        active: false,
        reason: `Approver role "${approverEntry.identity.role}" is insufficient to waive control "${waiver.control_id}" (Requires: "${requiredRole}")`
      };
    }

    approverVerified = true;
    verifiedIdentity = approverEntry.identity;
  } else if (typeof trustRingOrPublicKey === 'string' && integrity.signature) {
    const sigVerify = verifySignature(rawWaiver, integrity.signature.signature_base64, trustRingOrPublicKey);
    if (!sigVerify.valid) {
      return { valid: false, active: false, reason: `Waiver digital signature invalid: ${sigVerify.error}` };
    }
  }

  return {
    valid: true,
    active: true,
    waiver_id: waiver.waiver_id,
    control_id: waiver.control_id,
    expires_at: waiver.expires_at,
    approver_verified: approverVerified,
    verified_identity: verifiedIdentity
  };
}

/**
 * Applies a list of active waivers to a set of evaluated controls or raw evidence.
 * 
 * @param {Object} controls 
 * @param {Array<Object>} waivers 
 * @param {Date} [currentTimestamp] 
 * @param {Object|string} [trustRingOrPublicKey] 
 * @returns {Object} { updatedControls, waivedControls, expiredWaivers, rejectedWaivers }
 */
function applyWaivers(controls, waivers = [], currentTimestamp = new Date(), trustRingOrPublicKey = null) {
  const updatedControls = { ...controls };
  const waivedControls = [];
  const expiredWaivers = [];
  const rejectedWaivers = [];

  for (const waiver of waivers) {
    const validation = validateWaiver(waiver, currentTimestamp, trustRingOrPublicKey);
    if (!validation.valid) {
      rejectedWaivers.push({
        waiver_id: waiver.waiver_id,
        control_id: waiver.control_id,
        reason: validation.reason
      });
      continue;
    }

    if (!validation.active) {
      expiredWaivers.push({
        waiver_id: waiver.waiver_id,
        control_id: waiver.control_id,
        reason: validation.reason
      });
      continue;
    }

    const controlId = waiver.control_id;
    if (updatedControls[controlId]) {
      updatedControls[controlId] = {
        ...updatedControls[controlId],
        status: 'PASS',
        waived: true,
        waiver_metadata: {
          waiver_id: waiver.waiver_id,
          approver: waiver.approver,
          expires_at: waiver.expires_at,
          reason: waiver.reason,
          approver_verified: validation.approver_verified || false
        }
      };
      waivedControls.push(controlId);
    }
  }

  return {
    updatedControls,
    waivedControls,
    expiredWaivers,
    rejectedWaivers
  };
}

module.exports = {
  WAIVER_SCHEMA_VERSION,
  createWaiver,
  validateWaiver,
  applyWaivers
};
