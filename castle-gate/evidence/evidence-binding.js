/**
 * Castle Security & Quality Gate — Complete Evidence Binding & Anti-Replay Engine
 * 
 * Strictly binds:
 * - repository identity, commit SHA, Git tree hash
 * - CQS specification version & hash (FROZEN)
 * - policy version & canonical policy hash
 * - engine & CLI versions
 * - evaluation ID, score, Gate result, controls, findings
 * - scanner/adapter versions, timestamp, cryptographic anti-replay nonce
 * - artifact hashes (compliance report, HTML, SARIF, SBOM)
 */

'use strict';

const crypto = require('crypto');
const { canonicalize, canonicalHash } = require('../crypto/canonicalizer');
const { signPayload, verifySignature } = require('../crypto/signer');
const { createDsseEnvelope, createInTotoStatement } = require('../crypto/dsse');
const { resolveGitProvenance } = require('./git-resolver');

const EVIDENCE_SCHEMA_VERSION = '2.0.0-assurance';

/**
 * Builds a bound, canonicalized, tamper-evident Evidence Artifact.
 * 
 * @param {Object} params {
 *   target_system,
 *   cqs_result,
 *   gate_decision,
 *   effective_policy,
 *   scanner_metadata,
 *   detailed_findings,
 *   raw_evidence,
 *   gate_evidence,
 *   artifacts_hashes,
 *   private_key_pem
 * }
 * @returns {Object} Complete bound Evidence Artifact with optional Ed25519 DSSE attestation
 */
function createBoundEvidenceArtifact(params) {
  const {
    target_system = {},
    cqs_result = {},
    gate_decision = {},
    effective_policy = {},
    scanner_metadata = {},
    detailed_findings = {},
    raw_evidence = {},
    gate_evidence = {},
    artifacts_hashes = {},
    private_key_pem = null,
    evaluation_id = null,
    commit_sha = null,
    source_dir = null
  } = params;

  const timestamp = new Date().toISOString();
  const nonce = crypto.randomBytes(16).toString('hex');
  const evalId = evaluation_id || (cqs_result && cqs_result.evaluation_id) || `EVAL-${Date.now()}`;
  const gitInfo = resolveGitProvenance(source_dir || target_system.source_dir || '.', {
    commit_sha: commit_sha || target_system.commit_sha
  });

  const policyHash = canonicalHash(effective_policy);
  const cqsVersion = (cqs_result && cqs_result.specification_version) || '1.1.0 (FROZEN)';

  const rawBoundData = {
    schema_version: EVIDENCE_SCHEMA_VERSION,
    evaluation_id: evalId,
    nonce: nonce,
    timestamp: timestamp,
    target_system: {
      name: target_system.name || gitInfo.repository_name || 'unspecified_target',
      environment: target_system.environment || 'production',
      repository_url: gitInfo.repository_url,
      commit_sha: gitInfo.commit_sha,
      git_tree_hash: gitInfo.git_tree_hash,
      branch: gitInfo.branch,
      is_dirty: gitInfo.is_dirty
    },
    governance: {
      cqs_specification_version: cqsVersion,
      policy_version: effective_policy.policy_version || effective_policy.version || '1.0.0-ratified',
      policy_hash: policyHash,
      engine_version: '1.0.1',
      castle_gate_version: gate_decision.versioning ? gate_decision.versioning.gate_version : '1.0.1'
    },
    assessment: {
      gate_level: gate_decision.gate_level || 'UNSPECIFIED',
      gate_level_name: gate_decision.gate_level_name || 'Unspecified',
      gate_decision: gate_decision.gate_state || 'UNSPECIFIED',
      cqs_raw_score: (cqs_result.summary && cqs_result.summary.cqs_raw_score) ?? null,
      cqs_display_score: (cqs_result.summary && cqs_result.summary.cqs_display_score) ?? null,
      cqs_verdict: (cqs_result.summary && cqs_result.summary.final_verdict) || 'UNSPECIFIED',
      gate_breakers_status: (cqs_result.gate_breakers && cqs_result.gate_breakers.status) || 'CLEARED'
    },
    controls: raw_evidence || {},
    gate_evidence: gate_evidence || {},
    findings: detailed_findings || {},
    scanners: scanner_metadata || { native_probes: ['SecurityProbe', 'DomSemanticsProbe', 'MaintainabilityProbe'] },
    artifacts: {
      compliance_report_html_sha256: artifacts_hashes.report_html_sha256 || null,
      compliance_report_json_sha256: artifacts_hashes.report_json_sha256 || null,
      sarif_sha256: artifacts_hashes.sarif_sha256 || null,
      sbom_cyclonedx_sha256: artifacts_hashes.sbom_cyclonedx_sha256 || null
    }
  };

  const canonicalPayloadString = canonicalize(rawBoundData);
  const payloadSha256 = crypto.createHash('sha256').update(canonicalPayloadString, 'utf8').digest('hex');

  let signature = null;
  let dsseEnvelope = null;

  if (private_key_pem) {
    signature = signPayload(rawBoundData, private_key_pem);
    const inTotoStmt = createInTotoStatement({
      subjectName: rawBoundData.target_system.repository_url,
      commitSha: rawBoundData.target_system.commit_sha,
      predicate: rawBoundData
    });
    dsseEnvelope = createDsseEnvelope(inTotoStmt, private_key_pem);
  }

  return {
    ...rawBoundData,
    integrity: {
      canonical_algorithm: 'RFC-8785-JCS',
      payload_sha256: payloadSha256,
      signed: Boolean(signature),
      signature: signature,
      dsse_envelope: dsseEnvelope
    }
  };
}

module.exports = {
  EVIDENCE_SCHEMA_VERSION,
  createBoundEvidenceArtifact
};
