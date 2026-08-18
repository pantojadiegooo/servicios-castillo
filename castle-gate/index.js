/**
 * Castle Security & Quality Gate (C1 to C6) — Unified Main Entrypoint (World-Class Assurance Edition)
 * 
 * Architecture Principle:
 * "CQS = WHAT IS MEASURED (FROZEN v1.1)"
 * "CQS ENGINE = HOW IT IS COMPUTED"
 * "CASTLE GATE = HOW THE RESULT IS USED TO CONTROL DELIVERY & ASSURE TRUST"
 */

'use strict';

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const cqs = require('../cqs');
const { resolveGatePolicy, loadPolicyAssets, validateGatePolicy, VALID_GATE_LEVELS } = require('./policy/policy-resolver');
const { createPolicyArtifact, verifyPolicyArtifact } = require('./policy/policy-artifact');
const { createWaiver, validateWaiver, applyWaivers } = require('./policy/waiver-manager');
const { evaluateGateDecision, GATE_VERSION } = require('./engine/gate-decision-engine');
const { generateReleaseCertificate, verifyReleaseCertificate, exportReleaseCertificateToFile, CERTIFICATE_SCHEMA_VERSION } = require('./engine/release-authorizer');

// Crypto & Evidence Layer
const { canonicalize, canonicalHash } = require('./crypto/canonicalizer');
const { generateKeyPair, deriveKeyId, saveKeyPair, loadKey } = require('./crypto/signing-key');
const { signPayload, verifySignature } = require('./crypto/signer');
const { createDsseEnvelope, verifyDsseEnvelope, createInTotoStatement } = require('./crypto/dsse');
const { TrustAnchorStore } = require('./crypto/trust-anchor');
const { createRevocationManifest, validateRevocationManifest, checkKeyRevocationStatus } = require('./crypto/key-revocation');
const { createKeyBackup, restoreKeyBackup, saveKeyBackupToFile } = require('./crypto/key-backup');
const { createEvidencePackage } = require('./evidence/evidence-package');
const { createBoundEvidenceArtifact, EVIDENCE_SCHEMA_VERSION } = require('./evidence/evidence-binding');
const { resolveGitProvenance } = require('./evidence/git-resolver');
const { EvidenceLedger } = require('./evidence/evidence-chain');

// Independent Verifier
const { verifyAssuranceArtifact } = require('./verifier/castle-verify');

// Probes & Security Guard
const { BaseAnalyzer } = require('./analyzers/base-analyzer');
const { SecurityProbe } = require('./analyzers/security-probe');
const { DomSemanticsProbe } = require('./analyzers/dom-semantics-probe');
const { MaintainabilityProbe } = require('./analyzers/maintainability-probe');
const { AstProbe } = require('./analyzers/ast-probe');
const { GitHistoryProbe } = require('./analyzers/git-history-probe');
const { AnalyzerOrchestrator, runNativeScan } = require('./analyzers/analyzer-orchestrator');
const { validatePathWithinWorkspace, safeDiscoverFiles, safeRegexTest } = require('./analyzers/security-guard');

// Adapters
const { BaseEvidenceAdapter, ADAPTER_STATUS_PASS, ADAPTER_STATUS_FAIL, ADAPTER_STATUS_INCONCLUSIVE, ADAPTER_STATUS_UNEXECUTED, ADAPTER_STATUS_NA } = require('./evidence/adapters/base-adapter');
const { NpmAuditAdapter } = require('./evidence/adapters/npm-audit-adapter');
const { OsvAdapter } = require('./evidence/adapters/osv-adapter');
const { GitleaksAdapter } = require('./evidence/adapters/gitleaks-adapter');
const { SemgrepAdapter } = require('./evidence/adapters/semgrep-adapter');
const { AxeAdapter } = require('./evidence/adapters/axe-adapter');
const { LighthouseAdapter } = require('./evidence/adapters/lighthouse-adapter');

// Reports & Artifacts
const { generateComplianceReportHtml } = require('./reports/compliance-report-generator');
const { generateSarifReport, exportSarifToFile } = require('./reports/sarif-generator');
const { generateCycloneDxSbom, generateSpdxSbom, exportSbomToFile } = require('./reports/sbom-generator');
const { mapEvaluationToFrameworks, mappingsData } = require('./governance/framework-mapper');

// Remediation & Audit
const { createRemediationSession, RemediationSession } = require('./remediation/remediation-tracker');
const { RemediationStore } = require('./remediation/remediation-store');
const { createGateAuditRecord, exportAuditTrailToFile } = require('./audit/gate-audit-trail');
const { loadCastleGateConfig } = require('./config/config-loader');
const { PROPOSED_GATE_STATES } = require('./engine/gate-states');

/**
 * End-to-end Gate Execution pipeline with Cryptographic Assurance & Evidence Binding.
 * 
 * @param {Object} params {
 *   target_system: Object,
 *   auditor: Object,
 *   gate_level: string ('C1'..'C6'),
 *   raw_evidence: Object,
 *   gate_evidence?: Object,
 *   policy_override?: Object,
 *   commit_sha?: string,
 *   output_dir?: string,
 *   waivers?: Array<Object>,
 *   private_key_pem?: string,
 *   public_key_pem?: string,
 *   detailed_findings?: Object,
 *   scanner_metadata?: Object
 * }
 * @returns {Object} { cqs_result, gate_decision, audit_record, evidence_package, bound_evidence, release_certificate, sarif, sbom, exit_code }
 */
function executeCastleGate(params) {
  const {
    target_system,
    auditor,
    gate_level,
    raw_evidence,
    gate_evidence,
    policy_override,
    commit_sha,
    output_dir,
    waivers = [],
    trust_ring = null,
    private_key_pem = null,
    public_key_pem = null,
    detailed_findings = {},
    scanner_metadata = {}
  } = params;

  // Step 1: Discover / Load Physical Evidence Ledger from output_dir (if exists)
  const ledgerPath = output_dir ? path.join(output_dir, 'ledger.json') : null;
  let ledger = null;
  let effectivePreviousEval = params.previous_evaluation || null;

  if (ledgerPath) {
    ledger = EvidenceLedger.loadFromFile(ledgerPath);
    if (!effectivePreviousEval && ledger.entries.length > 0) {
      const lastEntry = ledger.entries[ledger.entries.length - 1];
      effectivePreviousEval = {
        evaluation_id: lastEntry.evaluation_id,
        certificate_digest: lastEntry.entry_hash || lastEntry.evidence_sha256,
        commit_sha: lastEntry.commit_sha
      };
    }
  } else {
    ledger = new EvidenceLedger();
  }

  // Step 2: Apply Governed Waivers (if provided)
  const effectiveRawEvidence = { ...(raw_evidence || {}) };
  let appliedWaiversInfo = { waivedControls: [], expiredWaivers: [], rejectedWaivers: [] };
  if (waivers.length > 0) {
    const waiverResult = applyWaivers(effectiveRawEvidence, waivers, new Date(), trust_ring);
    Object.assign(effectiveRawEvidence, waiverResult.updatedControls);
    appliedWaiversInfo = waiverResult;
  }

  // Step 3: Create Baseline Evidence Package with Provenance
  const evidencePackage = createEvidencePackage({
    project_id: target_system ? target_system.name : 'unspecified_project',
    environment: target_system ? target_system.environment : 'evaluation',
    raw_evidence: effectiveRawEvidence,
    gate_evidence: gate_evidence || {},
    collected_by: auditor ? auditor.name : 'automated_collector',
    commit_sha: commit_sha || (target_system && target_system.commit_sha) || 'unspecified_sha',
    source_dir: target_system ? target_system.source_dir : '.'
  });

  const evalId = params.evaluation_id || (commit_sha ? `EVAL-${commit_sha.substring(0, 16)}` : (target_system && target_system.commit_sha ? `EVAL-${target_system.commit_sha.substring(0, 16)}` : `EVAL-${Date.now()}`));

  // Step 4: Execute Frozen CQS v1.1 Evaluator
  const cqsResult = cqs.evaluateCqs({
    evaluation_id: evalId,
    target_system: target_system || { name: 'Target System', environment: 'evaluation' },
    auditor: auditor || { name: 'Automated Collector', organization: 'Grupo Castillo' },
    evidence: { controls: effectiveRawEvidence },
    gate_evidence: gate_evidence || {}
  });

  // Step 5: Resolve Effective Policy (Using active Ratified Matrix if no override passed)
  let effectivePolicy = policy_override;
  if (!effectivePolicy) {
    const ratifiedPath = path.join(__dirname, 'policy', 'CASTLE-GATE-POLICY-MATRIX-RATIFIED.json');
    if (fs.existsSync(ratifiedPath)) {
      const ratifiedData = JSON.parse(fs.readFileSync(ratifiedPath, 'utf8'));
      if (ratifiedData.policies && ratifiedData.policies[gate_level]) {
        effectivePolicy = ratifiedData.policies[gate_level];
      }
    }
  }

  // Step 6: Execute Gate Decision Engine
  const gateDecision = evaluateGateDecision({
    cqs_evaluation_result: cqsResult,
    gate_level: gate_level,
    policy_override: effectivePolicy,
    evidence_package: evidencePackage
  });

  // Step 7: Generate Immutable Audit Record
  const auditRecord = createGateAuditRecord({
    gate_decision: gateDecision,
    cqs_evaluation_result: cqsResult,
    evidence_package: evidencePackage
  });

  // Step 8: Generate Ancillary Assurance Reports (SARIF, SBOM, Framework Alignment)
  const sarifReport = generateSarifReport({
    detailed_findings: detailed_findings,
    target_system: target_system,
    cqs_result: cqsResult,
    gate_decision: gateDecision
  });

  const targetDir = (target_system && target_system.source_dir) || '.';
  const cycloneDxSbom = generateCycloneDxSbom(targetDir, {
    projectName: target_system ? target_system.name : 'target-app'
  });

  const frameworkAlignment = mapEvaluationToFrameworks(cqsResult);

  // Compute artifact hashes for cryptographic evidence binding
  const sarifCanonicalString = canonicalize(sarifReport);
  const sarifSha256 = crypto.createHash('sha256').update(sarifCanonicalString, 'utf8').digest('hex');

  const sbomCanonicalString = canonicalize(cycloneDxSbom);
  const sbomSha256 = crypto.createHash('sha256').update(sbomCanonicalString, 'utf8').digest('hex');

  let reportHtmlSha256 = null;
  let complianceHtml = null;
  try {
    complianceHtml = generateComplianceReportHtml({
      target_system: target_system || { name: 'Target System', environment: 'production', commit_sha },
      cqs_summary: cqsResult.summary,
      domains: cqsResult.domains,
      gate_decision: gateDecision,
      gate_breakers: cqsResult.gate_breakers,
      provenance: { payload_sha256: evidencePackage.provenance.payload_sha256 },
      certificate_id: gateDecision.gate_state === 'PASSED' ? `REL-CERT-${gate_level}-${Date.now()}` : null
    });
    reportHtmlSha256 = crypto.createHash('sha256').update(complianceHtml, 'utf8').digest('hex');
  } catch (e) {}

  // Step 9: Build Fully Bound Cryptographic Evidence Artifact with DSSE in-toto Attestation
  const boundEvidence = createBoundEvidenceArtifact({
    target_system: target_system,
    cqs_result: cqsResult,
    gate_decision: gateDecision,
    effective_policy: effectivePolicy || {},
    scanner_metadata: scanner_metadata,
    detailed_findings: detailed_findings,
    raw_evidence: effectiveRawEvidence,
    gate_evidence: gate_evidence,
    artifacts_hashes: {
      report_html_sha256: reportHtmlSha256,
      sarif_sha256: sarifSha256,
      sbom_cyclonedx_sha256: sbomSha256
    },
    private_key_pem: private_key_pem,
    commit_sha: commit_sha,
    source_dir: targetDir
  });

  // Step 10: Optional Release Certificate Generation (ONLY on PASSED)
  let releaseCertificate = null;
  if (gateDecision.gate_state === 'PASSED') {
    const activeAppliedWaivers = waivers.filter(w => (appliedWaiversInfo.waivedControls || []).includes(w.control_id));
    releaseCertificate = generateReleaseCertificate({
      gate_decision: gateDecision,
      cqs_evaluation_result: cqsResult,
      evidence_package: evidencePackage,
      target_system: target_system,
      commit_sha: commit_sha,
      audit_trail_reference: auditRecord.audit_record_id,
      applied_waivers: activeAppliedWaivers,
      previous_evaluation: effectivePreviousEval,
      private_key_pem: private_key_pem,
      public_key_pem: public_key_pem
    });

    if (ledger) {
      ledger.append(releaseCertificate);
    }
  }

  // Step 11: Determine Standard Exit Code (0=PASS, 1=BLOCKED, 2=REMEDIATION/PENDING)
  let exitCode = 0;
  if (gateDecision.gate_state === 'PASSED') {
    exitCode = 0;
  } else if (gateDecision.gate_state === 'BLOCKED') {
    exitCode = 1;
  } else {
    exitCode = 2;
  }

  // Step 12: Export all artifacts if output_dir specified
  if (output_dir) {
    if (!fs.existsSync(output_dir)) {
      fs.mkdirSync(output_dir, { recursive: true });
    }

    exportAuditTrailToFile(auditRecord, output_dir);
    exportSarifToFile(sarifReport, output_dir, 'sarif.json');
    exportSbomToFile(cycloneDxSbom, output_dir, 'sbom-cyclonedx.json');

    if (complianceHtml) {
      fs.writeFileSync(path.join(output_dir, 'compliance-report.html'), complianceHtml, 'utf8');
    }

    fs.writeFileSync(path.join(output_dir, 'evidence.json'), JSON.stringify(boundEvidence, null, 2), 'utf8');

    if (releaseCertificate) {
      exportReleaseCertificateToFile(releaseCertificate, output_dir);
    }

    if (ledger && ledgerPath) {
      ledger.saveToFile(ledgerPath);
    }
  }

  return {
    cqs_result: cqsResult,
    gate_decision: gateDecision,
    audit_record: auditRecord,
    evidence_package: evidencePackage,
    bound_evidence: boundEvidence,
    release_certificate: releaseCertificate,
    sarif: sarifReport,
    sbom: cycloneDxSbom,
    framework_alignment: frameworkAlignment,
    applied_waivers: appliedWaiversInfo,
    exit_code: exitCode
  };
}

module.exports = {
  // Main Execution Pipeline
  executeCastleGate,
  
  // Gate Components
  evaluateGateDecision,
  resolveGatePolicy,
  validateGatePolicy,
  loadPolicyAssets,
  createPolicyArtifact,
  verifyPolicyArtifact,
  createEvidencePackage,
  createBoundEvidenceArtifact,
  createRemediationSession,
  RemediationSession,
  RemediationStore,
  createGateAuditRecord,
  exportAuditTrailToFile,
  generateReleaseCertificate,
  verifyReleaseCertificate,
  exportReleaseCertificateToFile,

  // Governed Waivers
  createWaiver,
  validateWaiver,
  applyWaivers,

  // Cryptographic & Canonicalization Layer
  canonicalize,
  canonicalHash,
  generateKeyPair,
  deriveKeyId,
  saveKeyPair,
  loadKey,
  signPayload,
  verifySignature,
  createDsseEnvelope,
  verifyDsseEnvelope,
  createInTotoStatement,
  TrustAnchorStore,
  createRevocationManifest,
  validateRevocationManifest,
  checkKeyRevocationStatus,
  createKeyBackup,
  restoreKeyBackup,
  saveKeyBackupToFile,
  EvidenceLedger,

  // Independent Verifier
  verifyAssuranceArtifact,

  // Probes & Security Guard
  BaseAnalyzer,
  SecurityProbe,
  DomSemanticsProbe,
  MaintainabilityProbe,
  AstProbe,
  GitHistoryProbe,
  AnalyzerOrchestrator,
  runNativeScan,
  validatePathWithinWorkspace,
  safeDiscoverFiles,
  safeRegexTest,

  // Adapters
  BaseEvidenceAdapter,
  NpmAuditAdapter,
  OsvAdapter,
  GitleaksAdapter,
  SemgrepAdapter,
  AxeAdapter,
  LighthouseAdapter,
  ADAPTER_STATUS_PASS,
  ADAPTER_STATUS_FAIL,
  ADAPTER_STATUS_INCONCLUSIVE,
  ADAPTER_STATUS_UNEXECUTED,
  ADAPTER_STATUS_NA,

  // Reports & Governance Mappings
  generateComplianceReportHtml,
  generateSarifReport,
  exportSarifToFile,
  generateCycloneDxSbom,
  generateSpdxSbom,
  exportSbomToFile,
  mapEvaluationToFrameworks,
  mappingsData,

  // Configuration & Utilities
  loadCastleGateConfig,
  resolveGitProvenance,

  // Direct access to Underlying CQS Engine (FROZEN v1.1)
  cqs,

  // Constants
  GATE_VERSION,
  CERTIFICATE_SCHEMA_VERSION,
  EVIDENCE_SCHEMA_VERSION,
  VALID_GATE_LEVELS,
  PROPOSED_GATE_STATES
};
