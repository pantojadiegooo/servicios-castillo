/**
 * Castle Security & Quality Gate — Gitleaks & Git Secrets Adapter
 * 
 * Ingests Gitleaks JSON audit reports over working trees and Git commit histories.
 * Maps discovered credentials, private keys, and tokens into CQS SEC-05.1 and Gate Breakers.
 */

'use strict';

const {
  BaseEvidenceAdapter,
  ADAPTER_STATUS_PASS,
  ADAPTER_STATUS_FAIL
} = require('./base-adapter');

class GitleaksAdapter extends BaseEvidenceAdapter {
  constructor() {
    super('GitleaksAdapter', 'Gitleaks', '8.18.0');
  }

  /**
   * Ingests Gitleaks JSON report.
   * 
   * @param {Array|string} gitleaksInput 
   * @param {Object} [options]
   * @returns {Object}
   */
  parse(gitleaksInput, options = {}) {
    let rawData = gitleaksInput;
    if (typeof gitleaksInput === 'string') {
      try {
        rawData = JSON.parse(gitleaksInput);
      } catch (err) {
        return {
          adapter_status: ADAPTER_STATUS_FAIL,
          source_tool: this.sourceTool,
          controls: {
            'SEC-05.1': { status: 'UNEXECUTED', details: `Gitleaks output unparseable: ${err.message}`, findings: [] }
          },
          gate_evidence: {},
          findings: [],
          error: err.message
        };
      }
    }

    const leaks = Array.isArray(rawData) ? rawData : (rawData ? [rawData] : []);
    const rawHash = this.hashRawData(leaks);
    const findings = [];
    let criticalCount = 0;

    for (const leak of leaks) {
      const ruleId = leak.RuleID || leak.Description || 'GENERIC_SECRET';
      const file = leak.File || leak.file || 'unknown';
      const line = leak.StartLine || leak.line || 1;
      const commit = leak.Commit || leak.commit || null;
      const secretDesc = leak.Description || leak.RuleID || 'Hardcoded secret detected in repository';

      let severity = 'HIGH';
      const upperRule = ruleId.toUpperCase();
      if (upperRule.includes('PRIVATE-KEY') || upperRule.includes('AWS') || upperRule.includes('STRIPE') || upperRule.includes('GITHUB') || upperRule.includes('SLACK')) {
        severity = 'CRITICAL';
        criticalCount++;
      }

      findings.push(this.createNormalizedFinding({
        ruleId: ruleId,
        severity: severity,
        controlId: 'SEC-05.1',
        file: file,
        line: line,
        column: leak.StartColumn || 1,
        message: `${secretDesc}${commit ? ` in commit ${commit.substring(0, 8)}` : ''}`,
        details: {
          commit: commit,
          author: leak.Author || null,
          date: leak.Date || null,
          entropy: leak.Entropy || null,
          fingerprint: leak.Fingerprint || null
        }
      }));
    }

    const controls = {};
    const gate_evidence = {};

    if (findings.length === 0) {
      controls['SEC-05.1'] = {
        status: 'PASS',
        details: 'Zero credentials, private keys, or API tokens detected in repository history.',
        findings: []
      };
    } else {
      controls['SEC-05.1'] = {
        status: 'FAIL',
        details: `${findings.length} secret finding(s) detected (${criticalCount} critical).`,
        findings: findings
      };
    }

    // Gate Breakers GB-01 (Insecure Transport) / GB-02 (Exposed Credentials)
    if (criticalCount > 0 || findings.length > 0) {
      gate_evidence['GB-02'] = true;
      gate_evidence['GB-02_details'] = `Gate Breaker Triggered: ${findings.length} secret(s) found in repository by Gitleaks.`;
    }

    return {
      adapter_status: findings.length === 0 ? ADAPTER_STATUS_PASS : ADAPTER_STATUS_FAIL,
      source_tool: this.sourceTool,
      raw_payload_sha256: rawHash,
      controls: controls,
      gate_evidence: gate_evidence,
      findings: findings,
      summary: {
        total_leaks: findings.length,
        critical_leaks: criticalCount
      }
    };
  }
}

module.exports = {
  GitleaksAdapter
};
