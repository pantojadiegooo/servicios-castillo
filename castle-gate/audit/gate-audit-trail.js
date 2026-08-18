/**
 * Castle Security & Quality Gate — Audit Trail Generator & Exporter
 * 
 * Produces structured, immutable audit trail records connecting:
 * Evidence -> Control -> Subcriterion -> Domain -> CQS Score -> Gate Decision
 */

'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Creates an immutable Gate Audit Record.
 * 
 * @param {Object} params {
 *   gate_decision: Object,
 *   cqs_evaluation_result: Object,
 *   evidence_package?: Object,
 *   remediation_history?: Object
 * }
 * @returns {Object} Immutable Audit Record
 */
function createGateAuditRecord(params) {
  const { gate_decision, cqs_evaluation_result, evidence_package, remediation_history } = params;

  return {
    audit_record_id: `AUD-GATE-${Date.now()}`,
    recorded_at: new Date().toISOString(),
    governance_metadata: {
      cqs_specification_version: cqs_evaluation_result.specification_version,
      cqs_methodology_status: cqs_evaluation_result.governance.methodology_status,
      gate_version: gate_decision.versioning.gate_version,
      gate_policy_version: gate_decision.versioning.gate_policy_version,
      gate_level: gate_decision.gate_level,
      gate_level_name: gate_decision.gate_level_name
    },
    target_system: cqs_evaluation_result.target_system,
    auditor: cqs_evaluation_result.auditor,
    evidence_provenance: evidence_package ? evidence_package.provenance : { status: 'DIRECT_SUBMISSION' },
    cqs_evaluation_summary: {
      evaluation_id: cqs_evaluation_result.evaluation_id,
      raw_score: cqs_evaluation_result.summary.cqs_raw_score,
      display_score: cqs_evaluation_result.summary.cqs_display_score,
      nominal_weight: cqs_evaluation_result.summary.total_nominal_weight,
      applicable_weight: cqs_evaluation_result.summary.total_applicable_weight,
      excluded_weight: cqs_evaluation_result.summary.total_excluded_weight,
      cqs_verdict: cqs_evaluation_result.summary.final_verdict
    },
    gate_decision_summary: {
      decision_id: gate_decision.decision_id,
      gate_state: gate_decision.gate_state,
      blockers_count: gate_decision.blockers.length,
      blockers: gate_decision.blockers,
      required_actions: gate_decision.required_actions,
      decision_rationale: gate_decision.decision_rationale
    },
    remediation_history: remediation_history || null,
    full_traceability_chain: {
      evidence_package_id: evidence_package ? evidence_package.package_id : 'DIRECT',
      cqs_evaluation_id: cqs_evaluation_result.evaluation_id,
      domains: cqs_evaluation_result.domains.map(d => ({
        domain_code: d.domain_code,
        domain_score: d.normalized_score,
        subcriteria: d.subcriteria.map(s => ({
          subcriterion_code: s.subcriterion_code,
          subcriterion_score: s.normalized_score,
          controls: s.controls.map(c => ({
            control_id: c.control_id,
            status: c.status,
            score: c.score,
            weight: c.nominal_weight
          }))
        }))
      })),
      gate_decision_id: gate_decision.decision_id,
      final_gate_state: gate_decision.gate_state
    }
  };
}

/**
 * Persists an Audit Record to disk.
 * 
 * @param {Object} auditRecord 
 * @param {string} outputDir 
 * @returns {string} File path
 */
function exportAuditTrailToFile(auditRecord, outputDir) {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  const filePath = path.join(outputDir, `${auditRecord.audit_record_id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(auditRecord, null, 2), 'utf8');
  const canonicalPath = path.join(outputDir, 'audit-trail.json');
  fs.writeFileSync(canonicalPath, JSON.stringify(auditRecord, null, 2), 'utf8');
  return filePath;
}

module.exports = {
  createGateAuditRecord,
  exportAuditTrailToFile
};
