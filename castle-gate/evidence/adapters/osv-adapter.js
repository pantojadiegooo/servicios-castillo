/**
 * Castle Security & Quality Gate — OSV.dev SCA Adapter
 * 
 * Ingests Open Source Vulnerability (OSV.dev) standard JSON results.
 * Supports batch querying against OSV.dev API (https://api.osv.dev/v1/querybatch)
 * from package-lock.json with strict fail-closed handling on timeout/network errors.
 * 
 * Invariant: Never assume 0 vulnerabilities on network failure.
 */

'use strict';

const fs = require('fs');
const https = require('https');
const http = require('http');
const {
  BaseEvidenceAdapter,
  ADAPTER_STATUS_PASS,
  ADAPTER_STATUS_FAIL,
  ADAPTER_STATUS_INCONCLUSIVE
} = require('./base-adapter');

class OsvAdapter extends BaseEvidenceAdapter {
  constructor() {
    super('OsvAdapter', 'OSV.dev', '1.0.0');
  }

  /**
   * Extracts dependencies and versions from package-lock.json.
   * 
   * @param {string} lockfilePath 
   * @returns {Array<{ package: { name: string, ecosystem: string }, version: string }>}
   */
  extractLockfileQueries(lockfilePath) {
    if (!fs.existsSync(lockfilePath)) return [];
    try {
      const content = fs.readFileSync(lockfilePath, 'utf8');
      const lock = JSON.parse(content);
      const queries = [];

      // Lockfile v2/v3 packages map
      if (lock.packages && typeof lock.packages === 'object') {
        for (const [pkgPath, info] of Object.entries(lock.packages)) {
          if (pkgPath === '' || !info.version) continue;
          const pkgName = info.name || pkgPath.replace(/^node_modules\//, '');
          queries.push({
            package: { name: pkgName, ecosystem: 'npm' },
            version: info.version
          });
        }
      } else if (lock.dependencies && typeof lock.dependencies === 'object') {
        // Lockfile v1 dependencies map
        for (const [name, info] of Object.entries(lock.dependencies)) {
          if (info.version) {
            queries.push({
              package: { name: name, ecosystem: 'npm' },
              version: info.version
            });
          }
        }
      }

      return queries;
    } catch (err) {
      return [];
    }
  }

  /**
   * Performs fail-closed HTTP/HTTPS POST request with strict timeout.
   */
  postBatch(queries, options = {}) {
    return new Promise((resolve, reject) => {
      const timeoutMs = options.timeoutMs || 5000;
      const payload = JSON.stringify({ queries });
      const url = new URL(options.apiUrl || 'https://api.osv.dev/v1/querybatch');

      const client = url.protocol === 'https:' ? https : http;
      const req = client.request(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
          'User-Agent': 'CastleGate-SCA/1.0.0'
        },
        timeout: timeoutMs
      }, (res) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(body));
            } catch (err) {
              reject(new Error(`OSV API returned malformed JSON: ${err.message}`));
            }
          } else {
            reject(new Error(`OSV API returned HTTP ${res.statusCode} ${res.statusMessage || ''}`));
          }
        });
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error(`OSV API request timed out after ${timeoutMs}ms (Fail-Closed)`));
      });

      req.on('error', (err) => {
        reject(new Error(`OSV API network error: ${err.message} (Fail-Closed)`));
      });

      req.write(payload);
      req.end();
    });
  }

  /**
   * Scans a lockfile against OSV.dev with fail-closed guarantee.
   */
  async scanLockfile(lockfilePath, options = {}) {
    const queries = this.extractLockfileQueries(lockfilePath);
    if (queries.length === 0) {
      return {
        adapter_status: ADAPTER_STATUS_PASS,
        source_tool: this.sourceTool,
        controls: {
          'MNT-02.2': { status: 'PASS', details: 'Zero dependencies in lockfile or no lockfile present.', findings: [] }
        },
        gate_evidence: {},
        findings: []
      };
    }

    try {
      const osvResponse = await this.postBatch(queries, options);
      return this.parse(osvResponse, options);
    } catch (err) {
      // Fail-closed invariant: Never fabricate PASS on network failure
      return {
        adapter_status: ADAPTER_STATUS_INCONCLUSIVE,
        source_tool: this.sourceTool,
        controls: {
          'MNT-02.2': {
            status: 'UNEXECUTED',
            inconclusive: true,
            details: `OSV.dev SCA audit failed closed: ${err.message}`,
            findings: []
          }
        },
        gate_evidence: { 'INCONCLUSIVE_SCA_AUDIT': true },
        findings: [],
        error: err.message
      };
    }
  }

  /**
   * Parses OSV.dev JSON scan results.
   * 
   * @param {Object|string} osvInput 
   * @param {Object} [options]
   * @returns {Object}
   */
  parse(osvInput, options = {}) {
    let rawData = osvInput;
    if (typeof osvInput === 'string') {
      try {
        rawData = JSON.parse(osvInput);
      } catch (err) {
        return {
          adapter_status: ADAPTER_STATUS_INCONCLUSIVE,
          source_tool: this.sourceTool,
          controls: {
            'MNT-02.2': {
              status: 'UNEXECUTED',
              inconclusive: true,
              details: `OSV SCA audit failed closed: Malformed JSON output (${err.message}).`,
              findings: []
            }
          },
          gate_evidence: { 'INCONCLUSIVE_SCA_AUDIT': true },
          findings: [],
          error: err.message
        };
      }
    }

    if (!rawData) {
      return {
        adapter_status: ADAPTER_STATUS_INCONCLUSIVE,
        source_tool: this.sourceTool,
        controls: {
          'MNT-02.2': { status: 'UNEXECUTED', inconclusive: true, details: 'OSV scan payload missing or null.', findings: [] }
        },
        gate_evidence: { 'INCONCLUSIVE_SCA_AUDIT': true },
        findings: []
      };
    }

    const rawHash = this.hashRawData(rawData);
    const findings = [];
    let criticalCount = 0;
    let highCount = 0;
    let moderateCount = 0;
    let lowCount = 0;

    const resultsList = Array.isArray(rawData.results) ? rawData.results : (Array.isArray(rawData) ? rawData : (rawData.vulns ? [rawData] : []));

    for (const res of resultsList) {
      const pkgName = res.package ? res.package.name : (res.name || 'unspecified_dependency');
      const vulns = res.vulns || (res.id ? [res] : []);

      for (const v of vulns) {
        let severity = 'MEDIUM';
        if (v.database_specific && v.database_specific.severity) {
          severity = v.database_specific.severity.toUpperCase();
        } else if (v.severity && Array.isArray(v.severity)) {
          const cvssObj = v.severity.find(s => s.type === 'CVSS_V3');
          if (cvssObj && cvssObj.score) {
            if (cvssObj.score.includes('/AV:N') && cvssObj.score.includes('/C:H')) severity = 'HIGH';
          }
        }

        if (severity === 'CRITICAL') criticalCount++;
        else if (severity === 'HIGH') highCount++;
        else if (severity === 'MODERATE' || severity === 'MEDIUM') moderateCount++;
        else lowCount++;

        findings.push(this.createNormalizedFinding({
          ruleId: v.id || 'OSV_VULNERABILITY',
          severity: severity,
          controlId: 'MNT-02.2',
          file: 'package-lock.json',
          line: 1,
          column: 1,
          message: `[${severity}] ${pkgName}: ${v.summary || v.details || 'Known vulnerability in OSV database'}`,
          details: {
            package: pkgName,
            id: v.id,
            aliases: v.aliases || [],
            published: v.published,
            references: v.references || []
          }
        }));
      }
    }

    const totalHighRisk = criticalCount + highCount;
    const controls = {};
    const gate_evidence = {};

    if (totalHighRisk === 0 && findings.length === 0) {
      controls['MNT-02.2'] = {
        status: 'PASS',
        details: 'Zero known vulnerabilities identified in OSV.dev database.',
        findings: []
      };
    } else if (totalHighRisk === 0 && findings.length > 0) {
      controls['MNT-02.2'] = {
        status: 'PASS',
        details: `Zero critical/high vulnerabilities (${findings.length} moderate/low advisories in OSV).`,
        findings: findings
      };
    } else {
      controls['MNT-02.2'] = {
        status: 'FAIL',
        details: `${totalHighRisk} high/critical vulnerability advisory(ies) found in OSV database.`,
        findings: findings
      };
    }

    if (criticalCount > 0) {
      gate_evidence['GB-03'] = true;
      gate_evidence['GB-03_details'] = `Gate Breaker Triggered: ${criticalCount} critical vulnerability(ies) reported by OSV.dev.`;
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
  OsvAdapter
};

