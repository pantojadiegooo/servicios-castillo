/**
 * Castle Security & Quality Gate — npm audit SCA Adapter (Fail-Closed)
 * 
 * Ingests npm audit JSON reports and maps dependency vulnerabilities into CQS MNT-02.2.
 * CRITICAL RULE: Fails closed. A failed npm audit run (network failure, ENOAUDIT, parse error)
 * NEVER defaults to PASS or 0 vulnerabilities. It yields INCONCLUSIVE / FAIL_CLOSED.
 */

'use strict';

const {
  BaseEvidenceAdapter,
  ADAPTER_STATUS_PASS,
  ADAPTER_STATUS_FAIL,
  ADAPTER_STATUS_INCONCLUSIVE
} = require('./base-adapter');

class NpmAuditAdapter extends BaseEvidenceAdapter {
  constructor() {
    super('NpmAuditAdapter', 'npm-audit', '1.0.0');
  }

  /**
   * Ingests npm audit JSON output.
   * 
   * @param {Object|string} auditInput JSON string or object from `npm audit --json`
   * @param {Object} [options]
   * @returns {Object} { status, controls, gate_evidence, findings, provenance }
   */
  parse(auditInput, options = {}) {
    let rawData = auditInput;
    if (typeof auditInput === 'string') {
      try {
        rawData = JSON.parse(auditInput);
      } catch (err) {
        // Corrupt or failed JSON output -> FAIL CLOSED
        return {
          adapter_status: ADAPTER_STATUS_INCONCLUSIVE,
          source_tool: this.sourceTool,
          controls: {
            'MNT-02.2': {
              status: 'UNEXECUTED',
              inconclusive: true,
              details: `SCA audit failed closed: Malformed or unparseable JSON output (${err.message}).`,
              findings: []
            }
          },
          gate_evidence: {
            'INCONCLUSIVE_SCA_AUDIT': true,
            'INCONCLUSIVE_SCA_AUDIT_details': `npm audit output was unparseable: ${err.message}`
          },
          findings: [],
          error: `Malformed JSON in npm audit report: ${err.message}`
        };
      }
    }

    // Check for audit error or failure conditions in npm output
    if (!rawData || rawData.error || (rawData.code && rawData.code.startsWith('E'))) {
      const errorMsg = (rawData && rawData.error && rawData.error.summary) || (rawData && rawData.message) || 'Unknown npm audit error';
      return {
        adapter_status: ADAPTER_STATUS_INCONCLUSIVE,
        source_tool: this.sourceTool,
        controls: {
          'MNT-02.2': {
            status: 'UNEXECUTED',
            inconclusive: true,
            details: `SCA audit failed closed: External scanner reported an error (${errorMsg}).`,
            findings: []
          }
        },
        gate_evidence: {
          'INCONCLUSIVE_SCA_AUDIT': true,
          'INCONCLUSIVE_SCA_AUDIT_details': `npm audit reported failure: ${errorMsg}`
        },
        findings: [],
        error: errorMsg
      };
    }

    const rawHash = this.hashRawData(rawData);
    const findings = [];
    let criticalCount = 0;
    let highCount = 0;
    let moderateCount = 0;
    let lowCount = 0;

    // Handle npm audit v2 format (npm 7+)
    if (rawData.vulnerabilities) {
      for (const [pkgName, vulnData] of Object.entries(rawData.vulnerabilities)) {
        const severity = (vulnData.severity || 'low').toUpperCase();
        if (severity === 'CRITICAL') criticalCount++;
        else if (severity === 'HIGH') highCount++;
        else if (severity === 'MODERATE') moderateCount++;
        else lowCount++;

        const viaList = Array.isArray(vulnData.via) ? vulnData.via : [];
        for (const via of viaList) {
          const title = typeof via === 'object' ? via.title : `Vulnerability in dependency ${pkgName}`;
          const url = typeof via === 'object' ? via.url : null;
          const cwe = typeof via === 'object' && via.cwe ? via.cwe : [];
          
          findings.push(this.createNormalizedFinding({
            ruleId: typeof via === 'object' ? (via.source ? `GHSA-${via.source}` : via.name) : 'DEPENDENCY_VULNERABILITY',
            severity: severity,
            controlId: 'MNT-02.2',
            file: 'package-lock.json',
            line: 1,
            column: 1,
            message: `[${severity}] ${pkgName}: ${title}`,
            details: {
              package: pkgName,
              range: vulnData.range,
              url: url,
              cwe: cwe,
              fixAvailable: vulnData.fixAvailable
            }
          }));
        }
      }
    } 
    // Handle npm audit v1 format (npm 6)
    else if (rawData.advisories) {
      for (const [id, adv] of Object.entries(rawData.advisories)) {
        const severity = (adv.severity || 'low').toUpperCase();
        if (severity === 'CRITICAL') criticalCount++;
        else if (severity === 'HIGH') highCount++;
        else if (severity === 'MODERATE') moderateCount++;
        else lowCount++;

        findings.push(this.createNormalizedFinding({
          ruleId: `ADVISORY-${id}`,
          severity: severity,
          controlId: 'MNT-02.2',
          file: 'package-lock.json',
          line: 1,
          column: 1,
          message: `[${severity}] ${adv.module_name}: ${adv.title}`,
          details: {
            package: adv.module_name,
            cves: adv.cves || [],
            overview: adv.overview,
            url: adv.url
          }
        }));
      }
    } else {
      // Incomplete structure
      return {
        adapter_status: ADAPTER_STATUS_INCONCLUSIVE,
        source_tool: this.sourceTool,
        controls: {
          'MNT-02.2': {
            status: 'UNEXECUTED',
            inconclusive: true,
            details: 'SCA audit failed closed: No vulnerability or advisories block present in npm audit output.',
            findings: []
          }
        },
        gate_evidence: {
          'INCONCLUSIVE_SCA_AUDIT': true
        },
        findings: [],
        error: 'Missing vulnerabilities block in audit report.'
      };
    }

    const totalHighRisk = criticalCount + highCount;
    const controls = {};
    const gate_evidence = {};

    if (totalHighRisk === 0 && findings.length === 0) {
      controls['MNT-02.2'] = {
        status: 'PASS',
        details: 'Zero known vulnerabilities detected across dependency tree.',
        findings: []
      };
    } else if (totalHighRisk === 0 && findings.length > 0) {
      // Only moderate or low vulnerabilities
      controls['MNT-02.2'] = {
        status: 'PASS',
        details: `Zero critical/high vulnerabilities (${findings.length} moderate/low advisories observed).`,
        findings: findings
      };
    } else {
      controls['MNT-02.2'] = {
        status: 'FAIL',
        details: `${totalHighRisk} high/critical vulnerability advisory(ies) found (${criticalCount} critical, ${highCount} high).`,
        findings: findings
      };
    }

    // Gate Breaker GB-03: Critical injection or remote code execution in dependencies
    if (criticalCount > 0) {
      gate_evidence['GB-03'] = true;
      gate_evidence['GB-03_details'] = `Gate Breaker Triggered: ${criticalCount} critical vulnerability(ies) present in dependency tree.`;
    }

    return {
      adapter_status: totalHighRisk > 0 ? ADAPTER_STATUS_FAIL : ADAPTER_STATUS_PASS,
      source_tool: this.sourceTool,
      raw_payload_sha256: rawHash,
      controls: controls,
      gate_evidence: gate_evidence,
      findings: findings,
      summary: {
        critical: criticalCount,
        high: highCount,
        moderate: moderateCount,
        low: lowCount,
        total: findings.length
      }
    };
  }
}

module.exports = {
  NpmAuditAdapter
};
