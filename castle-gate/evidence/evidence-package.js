/**
 * Castle Security & Quality Gate — Evidence Package Manager
 * 
 * Packages evaluation evidence, manages provenance, validates structure,
 * and maintains immutable evidence snapshots using RFC 8785 canonicalization.
 */

'use strict';

const crypto = require('crypto');
const { canonicalize, canonicalHash } = require('../crypto/canonicalizer');
const { resolveGitProvenance } = require('./git-resolver');
const { createBoundEvidenceArtifact, EVIDENCE_SCHEMA_VERSION } = require('./evidence-binding');

/**
 * Creates a structured Evidence Package for Gate ingestion.
 * 
 * @param {Object} params { project_id, environment, raw_evidence, gate_evidence, collected_by, source_repo, commit_sha, source_dir }
 * @returns {Object} Evidence Package
 */
function createEvidencePackage(params) {
  const timestamp = new Date().toISOString();
  const rawControls = params.raw_evidence || {};
  const gateEvidence = params.gate_evidence || {};

  const gitInfo = resolveGitProvenance(params.source_dir || '.', {
    commit_sha: params.commit_sha
  });

  const canonicalPayload = canonicalize({ controls: rawControls, gate_evidence: gateEvidence });
  const checksum = crypto.createHash('sha256').update(canonicalPayload, 'utf8').digest('hex');
  const nonce = crypto.randomBytes(16).toString('hex');
  const packageId = `EVP-${Date.now()}-${checksum.substring(0, 8)}`;

  return {
    package_id: packageId,
    specification_version: '2.0.0-assurance',
    nonce: nonce,
    provenance: {
      project_id: params.project_id || gitInfo.repository_name || 'unspecified_project',
      environment: params.environment || 'evaluation',
      collected_by: params.collected_by || 'automated_agent',
      source_repo: params.source_repo || gitInfo.repository_url || 'unspecified_repo',
      commit_sha: params.commit_sha || gitInfo.commit_sha || 'unspecified_sha',
      git_tree_hash: gitInfo.git_tree_hash,
      timestamp: timestamp,
      payload_sha256: checksum
    },
    evidence: rawControls,
    gate_evidence: gateEvidence,
    snapshots: [
      {
        snapshot_id: 'SNAP-01',
        created_at: timestamp,
        checksum: checksum
      }
    ]
  };
}

module.exports = {
  createEvidencePackage,
  createBoundEvidenceArtifact,
  EVIDENCE_SCHEMA_VERSION
};
