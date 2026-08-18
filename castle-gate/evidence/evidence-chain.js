/**
 * Castle Security & Quality Gate — Evidence Chain & Transparency Ledger
 * 
 * Provides an auditable, append-only Merkle-linked evidence chain (Evaluation N -> Evaluation N-1).
 * Compatible with transparency log architectures (e.g. Sigstore Rekor / in-toto).
 * Zero blockchain complexity: pure deterministic cryptographic hash chaining.
 */

'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { canonicalize } = require('../crypto/canonicalizer');

const GENESIS_PARENT_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

class EvidenceLedger {
  constructor(entries = []) {
    this.entries = entries;
  }

  /**
   * Appends an evaluation evidence artifact to the immutable chain.
   * 
   * @param {Object} evidenceArtifact Bound evidence artifact or release certificate
   * @returns {Object} Newly created ledger entry
   */
  append(evidenceArtifact) {
    const prevEntry = this.entries.length > 0 ? this.entries[this.entries.length - 1] : null;
    const parentHash = prevEntry ? prevEntry.entry_hash : GENESIS_PARENT_HASH;
    const entryIndex = this.entries.length;

    const evalId = evidenceArtifact.evaluation_id || (evidenceArtifact.evaluation_reference && evidenceArtifact.evaluation_reference.evaluation_id) || `EVAL-${Date.now()}`;
    const commitSha = (evidenceArtifact.target_system && evidenceArtifact.target_system.commit_sha) || (evidenceArtifact.provenance && evidenceArtifact.provenance.commit_sha) || 'unspecified_commit';
    const evidenceHash = (evidenceArtifact.integrity && (evidenceArtifact.integrity.payload_sha256 || evidenceArtifact.integrity.certificate_digest)) || crypto.createHash('sha256').update(canonicalize(evidenceArtifact)).digest('hex');

    const rawEntry = {
      entry_index: entryIndex,
      evaluation_id: evalId,
      commit_sha: commitSha,
      parent_hash: parentHash,
      evidence_sha256: evidenceHash,
      timestamp: new Date().toISOString()
    };

    const canonicalEntryString = canonicalize(rawEntry);
    const entryHash = crypto.createHash('sha256').update(canonicalEntryString, 'utf8').digest('hex');

    const entry = {
      ...rawEntry,
      entry_hash: entryHash
    };

    this.entries.push(entry);
    return entry;
  }

  /**
   * Verifies the full cryptographic hash continuity of the evidence ledger.
   * 
   * @returns {Object} { valid: boolean, errors: Array<string>, totalEntries: number }
   */
  verifyContinuity() {
    const errors = [];
    let expectedParentHash = GENESIS_PARENT_HASH;

    for (let i = 0; i < this.entries.length; i++) {
      const entry = this.entries[i];

      if (entry.entry_index !== i) {
        errors.push(`Entry at position ${i} has invalid index ${entry.entry_index}`);
      }

      if (entry.parent_hash !== expectedParentHash) {
        errors.push(`Entry #${i} parent_hash (${entry.parent_hash}) does not match previous entry hash (${expectedParentHash})`);
      }

      const { entry_hash, ...rawPayload } = entry;
      const canonicalString = canonicalize(rawPayload);
      const calculatedHash = crypto.createHash('sha256').update(canonicalString, 'utf8').digest('hex');

      if (calculatedHash !== entry_hash) {
        errors.push(`Entry #${i} hash mismatch: recorded (${entry_hash}) !== calculated (${calculatedHash}). Ledger tampered!`);
      }

      expectedParentHash = entry.entry_hash;
    }

    return {
      valid: errors.length === 0,
      errors: errors,
      total_entries: this.entries.length,
      head_hash: expectedParentHash
    };
  }

  /**
   * Exports ledger to a JSON file.
   */
  saveToFile(filePath) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(this.entries, null, 2), 'utf8');
  }

  /**
   * Loads ledger from a JSON file.
   */
  static loadFromFile(filePath) {
    if (!fs.existsSync(filePath)) {
      return new EvidenceLedger([]);
    }
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return new EvidenceLedger(Array.isArray(data) ? data : []);
  }
}

module.exports = {
  GENESIS_PARENT_HASH,
  EvidenceLedger
};
