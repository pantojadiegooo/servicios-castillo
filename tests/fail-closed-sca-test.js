/**
 * Castle Security & Quality Gate — DOM-02 / SCA Fail-Closed Test Suite
 * 
 * Verifies:
 * 1. npm audit failure/network error NEVER fabricates a PASS (yields INCONCLUSIVE / UNEXECUTED).
 * 2. npm audit corrupted JSON output fails closed.
 * 3. npm audit with critical vulnerability triggers Gate Breaker GB-03 and MNT-02.2 FAIL.
 * 4. npm audit clean output yields PASS.
 * 5. OSV.dev corrupted output fails closed.
 * 6. OSV.dev with vulnerabilities maps to MNT-02.2 FAIL and GB-03.
 * 7. Strict Gate policy rejects release when required SCA sensor is INCONCLUSIVE.
 */

'use strict';

const assert = require('assert');
const { NpmAuditAdapter } = require('../castle-gate/evidence/adapters/npm-audit-adapter');
const { OsvAdapter } = require('../castle-gate/evidence/adapters/osv-adapter');
const gate = require('../castle-gate/index');

console.log('================================================================');
console.log('Castle Gate — DOM-02 / SCA Fail-Closed Test Suite');
console.log('================================================================\n');

const npmAdapter = new NpmAuditAdapter();
const osvAdapter = new OsvAdapter();

// 1. Network Failure / ENOAUDIT simulation
const networkErrorOutput = JSON.stringify({
  error: {
    code: 'ENOTFOUND',
    summary: 'getaddrinfo ENOTFOUND registry.npmjs.org',
    detail: 'network connection timed out while contacting npm registry'
  }
});

const netResult = npmAdapter.parse(networkErrorOutput);
assert.strictEqual(netResult.adapter_status, 'INCONCLUSIVE');
assert.strictEqual(netResult.controls['MNT-02.2'].status, 'UNEXECUTED');
assert.strictEqual(netResult.controls['MNT-02.2'].inconclusive, true);
assert.notStrictEqual(netResult.controls['MNT-02.2'].status, 'PASS', 'CRITICAL: Must NEVER fabricate PASS on sensor failure');
assert.strictEqual(netResult.gate_evidence['INCONCLUSIVE_SCA_AUDIT'], true);
console.log('[PASS] 1. Network failure in npm audit correctly fails closed to INCONCLUSIVE / UNEXECUTED.');

// 2. Corrupted JSON output
const corruptJson = '{"vulnerabilities": { invalid json';
const corruptResult = npmAdapter.parse(corruptJson);
assert.strictEqual(corruptResult.adapter_status, 'INCONCLUSIVE');
assert.strictEqual(corruptResult.controls['MNT-02.2'].status, 'UNEXECUTED');
assert.strictEqual(corruptResult.controls['MNT-02.2'].inconclusive, true);
console.log('[PASS] 2. Corrupted JSON in npm audit fails closed.');

// 3. Real Vulnerability Ingestion (npm audit v2 format)
const auditWithVulns = JSON.stringify({
  auditReportVersion: 2,
  vulnerabilities: {
    'lodash': {
      name: 'lodash',
      severity: 'critical',
      range: '<4.17.21',
      via: [
        {
          source: 1065,
          name: 'lodash',
          dependency: 'lodash',
          title: 'Prototype Pollution in lodash',
          url: 'https://github.com/advisories/GHSA-p6mc-m468-83gw',
          severity: 'critical',
          cwe: ['CWE-1321']
        }
      ]
    }
  }
});

const vulnResult = npmAdapter.parse(auditWithVulns);
assert.strictEqual(vulnResult.adapter_status, 'FAIL');
assert.strictEqual(vulnResult.controls['MNT-02.2'].status, 'FAIL');
assert.strictEqual(vulnResult.gate_evidence['GB-03'], true, 'Critical vulnerability must trigger Gate Breaker GB-03');
assert.strictEqual(vulnResult.summary.critical, 1);
console.log('[PASS] 3. Critical vulnerability detected in npm audit triggers MNT-02.2 FAIL and GB-03 veto.');

// 4. Clean npm audit
const cleanAudit = JSON.stringify({
  auditReportVersion: 2,
  vulnerabilities: {}
});
const cleanResult = npmAdapter.parse(cleanAudit);
assert.strictEqual(cleanResult.adapter_status, 'PASS');
assert.strictEqual(cleanResult.controls['MNT-02.2'].status, 'PASS');
console.log('[PASS] 4. Authentic clean npm audit results in MNT-02.2 PASS.');

// 5. OSV.dev Corrupt Output
const osvCorrupt = osvAdapter.parse('null');
assert.strictEqual(osvCorrupt.adapter_status, 'INCONCLUSIVE');
assert.strictEqual(osvCorrupt.controls['MNT-02.2'].inconclusive, true);
console.log('[PASS] 5. OSV.dev empty payload fails closed.');

// 6. OSV.dev Critical Vulnerability
const osvWithVulns = JSON.stringify({
  results: [
    {
      package: { name: 'axios', ecosystem: 'npm' },
      vulns: [
        {
          id: 'GHSA-42xw-2xvc-cxcp',
          summary: 'Axios Server-Side Request Forgery',
          database_specific: { severity: 'CRITICAL' }
        }
      ]
    }
  ]
});
const osvVulnResult = osvAdapter.parse(osvWithVulns);
assert.strictEqual(osvVulnResult.adapter_status, 'FAIL');
assert.strictEqual(osvVulnResult.controls['MNT-02.2'].status, 'FAIL');
assert.strictEqual(osvVulnResult.gate_evidence['GB-03'], true);
console.log('[PASS] 6. OSV.dev critical vulnerability maps to MNT-02.2 FAIL and GB-03.');

// 7. Gate Decision with Inconclusive SCA at High Gate Level (e.g. C5)
const c5Policy = {
  level: 'C5',
  policy_version: '1.0.0-ratified',
  rules: {
    minimum_cqs_score: 90.0,
    allow_unexecuted_controls: false,
    allow_inconclusive_sensors: false
  }
};

const execution = gate.executeCastleGate({
  target_system: { name: 'StrictProdApp', environment: 'production' },
  gate_level: 'C5',
  policy_override: c5Policy,
  raw_evidence: {
    ...cleanResult.controls,
    ...netResult.controls // Inconclusive MNT-02.2
  },
  gate_evidence: netResult.gate_evidence
});

assert.notStrictEqual(execution.gate_decision.gate_state, 'PASSED', 'Release MUST NOT pass when required SCA is inconclusive');
assert(execution.gate_decision.gate_state === 'EVIDENCE_PENDING' || execution.gate_decision.gate_state === 'BLOCKED');
assert.strictEqual(execution.release_certificate, null, 'No release certificate permitted on inconclusive SCA');
console.log(`[PASS] 7. Strict Gate policy enforces fail-closed hold (Gate State: ${execution.gate_decision.gate_state}).`);

console.log('\n================================================================');
console.log('ALL SCA FAIL-CLOSED TESTS PASSED (7/7)');
console.log('================================================================\n');
