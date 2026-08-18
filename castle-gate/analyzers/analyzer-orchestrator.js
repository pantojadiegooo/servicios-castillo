/**
 * Castle Security & Quality Gate — Analyzer Orchestrator
 * 
 * Aggregates and executes all Castle Native Probes across a target codebase,
 * consolidating findings into a unified, cryptographically hashed Evidence Package.
 */

'use strict';

const crypto = require('crypto');
const { canonicalize } = require('../crypto/canonicalizer');
const { DEFAULT_RESOURCE_LIMITS } = require('./security-guard');
const { SecurityProbe } = require('./security-probe');
const { DomSemanticsProbe } = require('./dom-semantics-probe');
const { MaintainabilityProbe } = require('./maintainability-probe');
const { AstProbe } = require('./ast-probe');
const { GitHistoryProbe } = require('./git-history-probe');

class AnalyzerOrchestrator {
  constructor(customProbes = null) {
    this.probes = customProbes || [
      new SecurityProbe(),
      new DomSemanticsProbe(),
      new MaintainabilityProbe(),
      new AstProbe(),
      new GitHistoryProbe()
    ];
  }

  /**
   * Runs all native probes on the target directory and aggregates the evidence.
   * 
   * @param {string} targetDir Target repository directory path
   * @param {Object} [options] Execution options
   * @returns {Object} Consolidated raw evidence and provenance metadata
   */
  runAllProbes(targetDir, options = {}) {
    const startTime = Date.now();
    const probeResults = [];
    const aggregatedControls = {};
    const aggregatedGateEvidence = {};
    const allFindings = {};
    let totalFilesScanned = 0;
    const maxGlobalTimeoutMs = options.globalTimeoutMs || DEFAULT_RESOURCE_LIMITS.GLOBAL_EVALUATION_TIMEOUT_MS;

    for (const probe of this.probes) {
      if (Date.now() - startTime > maxGlobalTimeoutMs) {
        probeResults.push({
          probe_name: probe.name,
          probe_version: probe.version,
          files_scanned: 0,
          duration_ms: 0,
          payload_sha256: null,
          errors: [`Evaluation timed out after ${Date.now() - startTime}ms (limit: ${maxGlobalTimeoutMs}ms). Probe execution aborted for DoS protection.`]
        });
        break;
      }

      const res = probe.run(targetDir, options);
      probeResults.push({
        probe_name: res.probe_name,
        probe_version: res.probe_version,
        files_scanned: res.scanned_files_count,
        duration_ms: res.execution_duration_ms,
        payload_sha256: res.payload_sha256,
        errors: res.errors
      });

      totalFilesScanned += (res.scanned_files_count || 0);

      // Merge controls (FAIL takes precedence over PASS)
      if (res.controls) {
        for (const [ctrlId, ctrlData] of Object.entries(res.controls)) {
          if (!aggregatedControls[ctrlId]) {
            aggregatedControls[ctrlId] = ctrlData;
          } else if (ctrlData.status === 'FAIL') {
            aggregatedControls[ctrlId] = ctrlData;
          }
        }
      }

      // Merge gate evidence (e.g. GB-01, GB-02, GB-03)
      if (res.gate_evidence) {
        for (const [gbId, gbVal] of Object.entries(res.gate_evidence)) {
          if (gbVal === true) {
            aggregatedGateEvidence[gbId] = true;
          } else if (aggregatedGateEvidence[gbId] === undefined) {
            aggregatedGateEvidence[gbId] = gbVal;
          }
        }
      }

      // Merge findings
      if (res.findings) {
        allFindings[res.probe_name] = res.findings;
      }
    }

    const totalDurationMs = Date.now() - startTime;

    // Canonical RFC 8785 SHA-256 over aggregated controls & gate evidence
    const canonicalPayloadString = canonicalize({ controls: aggregatedControls, gate_evidence: aggregatedGateEvidence });
    const aggregatedSha256 = crypto
      .createHash('sha256')
      .update(canonicalPayloadString, 'utf8')
      .digest('hex');

    return {
      orchestrator_version: '2.0.0',
      target_directory: targetDir,
      total_files_scanned: totalFilesScanned,
      total_duration_ms: totalDurationMs,
      aggregated_sha256: aggregatedSha256,
      probes_executed: probeResults,
      raw_evidence: aggregatedControls,
      gate_evidence: aggregatedGateEvidence,
      detailed_findings: allFindings
    };
  }
}

function runNativeScan(targetDir, options = {}) {
  const orchestrator = new AnalyzerOrchestrator();
  return orchestrator.runAllProbes(targetDir, options);
}

module.exports = {
  AnalyzerOrchestrator,
  runNativeScan
};
