/**
 * Castle Security & Quality Gate — Semgrep SAST Adapter
 * 
 * Ingests Semgrep JSON findings and maps static security rules to CQS SEC-04 & SEC-05.
 */

'use strict';

const {
  BaseEvidenceAdapter,
  ADAPTER_STATUS_PASS,
  ADAPTER_STATUS_FAIL
} = require('./base-adapter');

class SemgrepAdapter extends BaseEvidenceAdapter {
  constructor() {
    super('SemgrepAdapter', 'Semgrep', '1.60.0');
  }

  /**
   * Ingests Semgrep JSON scan output.
   * 
   * @param {Object|string} semgrepInput 
   * @param {Object} [options]
   * @returns {Object}
   */
  parse(semgrepInput, options = {}) {
    let rawData = semgrepInput;
    if (typeof semgrepInput === 'string') {
      try {
        rawData = JSON.parse(semgrepInput);
      } catch (err) {
        return {
          adapter_status: ADAPTER_STATUS_FAIL,
          source_tool: this.sourceTool,
          controls: {
            'SEC-04.1': { status: 'UNEXECUTED', details: `Semgrep output unparseable: ${err.message}`, findings: [] }
          },
          gate_evidence: {},
          findings: [],
          error: err.message
        };
      }
    }

    const results = (rawData && Array.isArray(rawData.results)) ? rawData.results : [];
    const rawHash = this.hashRawData(rawData);
    const findings = [];
    let highSeverityCount = 0;

    for (const res of results) {
      const checkId = res.check_id || 'SEMGREP_RULE';
      const severity = (res.extra && res.extra.severity ? res.extra.severity.toUpperCase() : 'MEDIUM');
      const message = (res.extra && res.extra.message) || 'SAST vulnerability detected by Semgrep';
      const file = res.path || 'unknown';
      const start = res.start || { line: 1, col: 1 };

      if (severity === 'ERROR' || severity === 'CRITICAL' || severity === 'HIGH') {
        highSeverityCount++;
      }

      // Map to CQS control ID based on rule classification
      let controlId = 'SEC-04.1'; // OWASP XSS / Injection
      if (checkId.toLowerCase().includes('secret') || checkId.toLowerCase().includes('key') || checkId.toLowerCase().includes('token')) {
        controlId = 'SEC-05.1';
      } else if (checkId.toLowerCase().includes('csrf')) {
        controlId = 'SEC-04.2';
      } else if (checkId.toLowerCase().includes('sqli') || checkId.toLowerCase().includes('sql-injection')) {
        controlId = 'SEC-04.3';
      }

      findings.push(this.createNormalizedFinding({
        ruleId: checkId,
        severity: severity === 'ERROR' ? 'HIGH' : (severity === 'WARNING' ? 'MEDIUM' : severity),
        controlId: controlId,
        file: file,
        line: start.line,
        column: start.col,
        message: message,
        details: {
          lines: res.extra ? res.extra.lines : null,
          metadata: res.extra ? res.extra.metadata : {}
        }
      }));
    }

    const controls = {};
    const gate_evidence = {};

    if (findings.length === 0) {
      controls['SEC-04.1'] = {
        status: 'PASS',
        details: 'Zero static application security vulnerabilities identified by Semgrep SAST.',
        findings: []
      };
    } else {
      controls['SEC-04.1'] = {
        status: 'FAIL',
        details: `${findings.length} SAST vulnerability finding(s) detected (${highSeverityCount} high/error severity).`,
        findings: findings
      };
    }

    if (highSeverityCount > 0) {
      gate_evidence['GB-03'] = true;
      gate_evidence['GB-03_details'] = `Gate Breaker Triggered: ${highSeverityCount} high severity SAST vulnerability(ies) detected by Semgrep.`;
    }

    return {
      adapter_status: findings.length === 0 ? ADAPTER_STATUS_PASS : ADAPTER_STATUS_FAIL,
      source_tool: this.sourceTool,
      raw_payload_sha256: rawHash,
      controls: controls,
      gate_evidence: gate_evidence,
      findings: findings,
      summary: {
        total_findings: findings.length,
        high_severity: highSeverityCount
      }
    };
  }
}

module.exports = {
  SemgrepAdapter
};
