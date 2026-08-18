/**
 * Castle Security & Quality Gate — Independent Trust Anchor Store
 * 
 * Establishes an out-of-band root of trust for public keys independent of target repositories or websites.
 * Prevents "compromised site replaces certificate + public key" attack vector.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { canonicalize, canonicalHash } = require('./canonicalizer');
const { deriveKeyId } = require('./signing-key');

const TRUST_ANCHOR_SCHEMA = '1.0.0-trust-anchor';

class TrustAnchorStore {
  /**
   * @param {Array<Object>} [initialAnchors]
   * @param {Object} [metadata]
   */
  constructor(initialAnchors = [], metadata = {}) {
    this.schema_version = TRUST_ANCHOR_SCHEMA;
    this.store_id = metadata.store_id || `TRUST-STORE-${Date.now()}`;
    this.authority = metadata.authority || 'Grupo Castillo Root Security & Release Authority';
    this.updated_at = metadata.updated_at || new Date().toISOString();
    this.anchors = new Map();

    for (const a of initialAnchors) {
      this.addAnchor(a);
    }
  }

  /**
   * Registers a trusted public key anchor.
   * 
   * @param {Object} anchor { key_id?, public_key_pem, identity: { name, role, scope }, valid_from?, valid_until? }
   */
  addAnchor(anchor) {
    if (!anchor || !anchor.public_key_pem) {
      throw new Error('[Trust Anchor] Anchor must contain public_key_pem');
    }

    const pubKeyPem = anchor.public_key_pem.trim();
    const keyId = anchor.key_id || deriveKeyId(pubKeyPem);

    const anchorEntry = {
      key_id: keyId,
      public_key_pem: pubKeyPem,
      identity: {
        name: (anchor.identity && anchor.identity.name) || 'Official Castle Release Signer',
        role: (anchor.identity && anchor.identity.role) || 'RELEASE_AUTHORITY',
        scope: (anchor.identity && anchor.identity.scope) || 'ALL_LEVELS'
      },
      valid_from: anchor.valid_from || '2026-01-01T00:00:00.000Z',
      valid_until: anchor.valid_until || '2030-01-01T00:00:00.000Z',
      trust_level: anchor.trust_level || 'OFFICIAL_ROOT'
    };

    this.anchors.set(keyId, anchorEntry);
    return anchorEntry;
  }

  /**
   * Checks if a given public key or key ID is trusted by this store.
   * 
   * @param {string} [publicKeyPem]
   * @param {string} [keyId]
   * @returns {Object} { trusted: boolean, anchor?: Object, reason?: string }
   */
  isKeyTrusted(publicKeyPem, keyId) {
    let targetKeyId = keyId;
    if (!targetKeyId && publicKeyPem) {
      targetKeyId = deriveKeyId(publicKeyPem);
    }

    if (!targetKeyId) {
      return { trusted: false, reason: 'No key ID or public key provided for trust anchor check.' };
    }

    const anchor = this.anchors.get(targetKeyId);
    if (!anchor) {
      return {
        trusted: false,
        reason: `Key "${targetKeyId}" is not present in independent trust anchor store.`
      };
    }

    // If both public_key_pem and keyId are provided, ensure PEM fingerprint matches anchor PEM
    if (publicKeyPem) {
      const computedId = deriveKeyId(publicKeyPem);
      if (computedId !== anchor.key_id) {
        return {
          trusted: false,
          reason: `Public key fingerprint mismatch: computed "${computedId}" !== anchor "${anchor.key_id}".`
        };
      }
    }

    // Check validity window
    const now = new Date().toISOString();
    if (anchor.valid_from && now < anchor.valid_from) {
      return { trusted: false, reason: `Trust anchor for "${targetKeyId}" is not yet active (valid from ${anchor.valid_from}).` };
    }
    if (anchor.valid_until && now > anchor.valid_until) {
      return { trusted: false, reason: `Trust anchor for "${targetKeyId}" has expired (valid until ${anchor.valid_until}).` };
    }

    return {
      trusted: true,
      anchor: anchor,
      trust_level: anchor.trust_level
    };
  }

  /**
   * Serializes the trust store to canonical JSON.
   */
  toJSON() {
    return {
      schema_version: this.schema_version,
      store_id: this.store_id,
      authority: this.authority,
      updated_at: this.updated_at,
      anchors: Array.from(this.anchors.values())
    };
  }

  /**
   * Computes canonical RFC 8785 SHA-256 hash of the store.
   */
  getCanonicalHash() {
    return canonicalHash(this.toJSON());
  }

  /**
   * Saves trust store to disk.
   */
  saveToFile(filePath) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(this.toJSON(), null, 2), 'utf8');
  }

  /**
   * Loads trust store from disk.
   */
  static loadFromFile(filePath) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`[Trust Anchor] File not found: ${filePath}`);
    }
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return new TrustAnchorStore(data.anchors || [], data);
  }
}

module.exports = {
  TrustAnchorStore,
  TRUST_ANCHOR_SCHEMA
};
