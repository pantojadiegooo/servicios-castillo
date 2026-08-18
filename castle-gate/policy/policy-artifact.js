/**
 * Castle Security & Quality Gate — Policy Artifact Manager
 * 
 * Manages versioned, hashed, auditable Policy-as-Code objects.
 * Guarantees every evaluation is cryptographically linked to the exact policy applied.
 */

'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { canonicalize, canonicalHash } = require('../crypto/canonicalizer');
const { signPayload, verifySignature } = require('../crypto/signer');

const POLICY_SCHEMA_VERSION = '2.0.0-assurance';

/**
 * Creates a ratified Policy Artifact.
 * 
 * @param {Object} params { policyId, name, level, rules, governance, privateKeyPem }
 * @returns {Object} Hashed and optionally signed Policy Artifact
 */
function createPolicyArtifact(params) {
  const {
    policyId = `POL-${params.level || 'C1'}-v1.0.0`,
    name = 'Standard Gate Policy',
    level = 'C1',
    version = '1.0.0-ratified',
    rules = {},
    governance = {},
    privateKeyPem = null
  } = params;

  const rawPolicy = {
    schema_version: POLICY_SCHEMA_VERSION,
    policy_id: policyId,
    name: name,
    level: level,
    version: version,
    created_at: new Date().toISOString(),
    governance: {
      ratified_by: governance.ratified_by || 'Grupo Castillo Engineering Governance Committee',
      status: governance.status || 'RATIFIED',
      legal_framework_alignment: governance.legal_framework_alignment || ['NIST-SSDF-v1.1', 'OWASP-ASVS-v4.0']
    },
    rules: {
      minimum_cqs_score: rules.minimum_cqs_score ?? 70.0,
      allow_unexecuted_controls: rules.allow_unexecuted_controls ?? false,
      allow_inconclusive_sensors: rules.allow_inconclusive_sensors ?? false,
      blocked_gate_breakers: rules.blocked_gate_breakers || ['GB-01', 'GB-02', 'GB-03', 'GB-04', 'GB-05'],
      approval_roles_required: rules.approval_roles_required || 'QA_LEAD',
      post_verification_required: rules.post_verification_required ?? false,
      max_waiver_duration_days: rules.max_waiver_duration_days || 30
    }
  };

  const canonicalString = canonicalize(rawPolicy);
  const policyHash = crypto.createHash('sha256').update(canonicalString, 'utf8').digest('hex');

  let signature = null;
  if (privateKeyPem) {
    signature = signPayload(rawPolicy, privateKeyPem);
  }

  return {
    ...rawPolicy,
    integrity: {
      canonical_algorithm: 'RFC-8785-JCS',
      policy_sha256: policyHash,
      signature: signature
    }
  };
}

/**
 * Validates the cryptographic integrity and canonical hash of a Policy Artifact.
 * 
 * @param {Object} policy 
 * @param {string} [publicKeyPem] 
 * @returns {Object} { valid: boolean, errors: Array<string>, policyHash: string }
 */
function verifyPolicyArtifact(policy, publicKeyPem = null) {
  if (!policy || typeof policy !== 'object') {
    return { valid: false, errors: ['Invalid policy object'], policyHash: null };
  }

  const errors = [];
  const { integrity, ...rawPolicy } = policy;

  if (!integrity || !integrity.policy_sha256) {
    errors.push('Policy missing integrity block or policy_sha256');
    return { valid: false, errors, policyHash: null };
  }

  const canonicalString = canonicalize(rawPolicy);
  const calculatedHash = crypto.createHash('sha256').update(canonicalString, 'utf8').digest('hex');

  if (calculatedHash !== integrity.policy_sha256) {
    errors.push(`Policy hash mismatch: calculated (${calculatedHash}) !== recorded (${integrity.policy_sha256})`);
  }

  if (integrity.signature && publicKeyPem) {
    const sigVerify = verifySignature(rawPolicy, integrity.signature.signature_base64, publicKeyPem);
    if (!sigVerify.valid) {
      errors.push(`Policy digital signature verification failed: ${sigVerify.error}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors,
    policyHash: calculatedHash
  };
}

module.exports = {
  POLICY_SCHEMA_VERSION,
  createPolicyArtifact,
  verifyPolicyArtifact
};
