/**
 * Castle Security & Quality Gate — Approver Trust Ring
 * 
 * Manages versioned, canonical-hashed directories of authorized waiver approvers.
 * Binds Ed25519 public keys to verified organizational identities and governance roles.
 */

'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { canonicalize, canonicalHash } = require('../crypto/canonicalizer');
const { deriveKeyId } = require('../crypto/signing-key');

const TRUST_RING_SCHEMA_VERSION = '2.0.0-assurance';

// Role Hierarchy: Higher index = Greater authority
const ROLE_HIERARCHY = Object.freeze({
  'DEVELOPER': 1,
  'TECHNICAL_LEAD': 2,
  'QA_LEAD': 2,
  'LEAD_ARCHITECT': 3,
  'SECURITY_OFFICER': 4,
  'CISO': 5
});

/**
 * Returns minimum required role for a given CQS control.
 * 
 * @param {string} controlId e.g. 'SEC-04.1', 'ACC-01.1'
 * @returns {string} Minimum required role
 */
function getRequiredRoleForControl(controlId) {
  if (!controlId) return 'SECURITY_OFFICER';
  const prefix = controlId.split('-')[0].toUpperCase();

  switch (prefix) {
    case 'SEC':
      return 'SECURITY_OFFICER';
    case 'REL':
    case 'MNT':
      return 'LEAD_ARCHITECT';
    case 'PER':
    case 'ACC':
    case 'UX':
    case 'SEO':
      return 'QA_LEAD';
    default:
      return 'TECHNICAL_LEAD';
  }
}

/**
 * Checks if a given approver role satisfies the required role.
 */
function isRoleSufficient(approverRole, requiredRole) {
  const approverLevel = ROLE_HIERARCHY[approverRole] || 0;
  const requiredLevel = ROLE_HIERARCHY[requiredRole] || 999;
  return approverLevel >= requiredLevel;
}

class ApproverTrustRing {
  constructor(approvers = [], metadata = {}) {
    this.schema_version = TRUST_RING_SCHEMA_VERSION;
    this.trust_ring_id = metadata.trust_ring_id || `TRUST-RING-${Date.now()}`;
    this.name = metadata.name || 'Grupo Castillo Engineering & Security Authorized Approvers';
    this.created_at = metadata.created_at || new Date().toISOString();
    this.approvers = [];

    for (const a of approvers) {
      this.addApprover(a);
    }
  }

  /**
   * Registers an authorized approver with their Ed25519 public key.
   */
  addApprover(approver) {
    if (!approver.public_key_pem) {
      throw new Error('[Trust Ring] Approver must contain public_key_pem');
    }
    if (!approver.identity || !approver.identity.name || !approver.identity.role) {
      throw new Error('[Trust Ring] Approver must contain identity.name and identity.role');
    }

    let pubKeyObj = crypto.createPublicKey(approver.public_key_pem);
    const keyId = approver.key_id || deriveKeyId(pubKeyObj);

    const now = new Date();
    const validFrom = (approver.validity && approver.validity.valid_from) || now.toISOString();
    const validUntil = (approver.validity && approver.validity.valid_until) || new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString();

    const normalizedApprover = {
      key_id: keyId,
      public_key_pem: approver.public_key_pem.trim(),
      identity: {
        name: approver.identity.name,
        email: approver.identity.email || 'unspecified@grupocastillo.com',
        role: approver.identity.role.toUpperCase()
      },
      validity: {
        valid_from: validFrom,
        valid_until: validUntil
      }
    };

    this.approvers.push(normalizedApprover);
    return normalizedApprover;
  }

  /**
   * Finds an approver by their Key ID or Public Key PEM.
   */
  findApprover(keyIdOrPem) {
    if (!keyIdOrPem) return null;
    return this.approvers.find(a => a.key_id === keyIdOrPem || a.public_key_pem === keyIdOrPem.trim()) || null;
  }

  /**
   * Computes RFC 8785 canonical hash of the Trust Ring.
   */
  getDigest() {
    const rawData = {
      schema_version: this.schema_version,
      trust_ring_id: this.trust_ring_id,
      name: this.name,
      approvers: this.approvers.map(a => ({
        key_id: a.key_id,
        public_key_pem: a.public_key_pem,
        identity: a.identity,
        validity: a.validity
      }))
    };
    return canonicalHash(rawData);
  }

  /**
   * Exports Trust Ring to file.
   */
  saveToFile(filePath) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(this.toJSON(), null, 2), 'utf8');
  }

  toJSON() {
    return {
      schema_version: this.schema_version,
      trust_ring_id: this.trust_ring_id,
      name: this.name,
      created_at: this.created_at,
      trust_ring_sha256: this.getDigest(),
      approvers: this.approvers
    };
  }

  /**
   * Loads Trust Ring from file.
   */
  static loadFromFile(filePath) {
    if (!fs.existsSync(filePath)) {
      return new ApproverTrustRing([]);
    }
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return new ApproverTrustRing(data.approvers || [], data);
  }
}

module.exports = {
  ROLE_HIERARCHY,
  ApproverTrustRing,
  getRequiredRoleForControl,
  isRoleSufficient
};
