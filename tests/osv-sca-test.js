/**
 * Castle Security & Quality Gate — OSV.dev SCA Integration Test Suite
 * 
 * Verifies:
 * 1. Extraction of package queries from package-lock.json
 * 2. Parsing of real OSV.dev batch response format with known CVEs
 * 3. Fail-closed behavior on 504 Gateway Timeout (FAILCLOSE-03)
 * 4. Fail-closed behavior on connection timeout / network down
 */

'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const http = require('http');
const { OsvAdapter } = require('../castle-gate/evidence/adapters/osv-adapter');

console.log('================================================================');
console.log('Castle Gate — OSV.dev SCA Test Suite (Phase 4 Block 4)');
console.log('================================================================\n');

const adapter = new OsvAdapter();

const testDir = path.join(__dirname, '..', '.test-scratch-osv');
if (fs.existsSync(testDir)) {
  fs.rmSync(testDir, { recursive: true, force: true });
}
fs.mkdirSync(testDir, { recursive: true });

// 1. Create fixture package-lock.json with vulnerable lodash & minimist
const sampleLockfile = path.join(testDir, 'package-lock.json');
fs.writeFileSync(sampleLockfile, JSON.stringify({
  name: 'vulnerable-test-app',
  version: '1.0.0',
  lockfileVersion: 3,
  packages: {
    '': { name: 'vulnerable-test-app', version: '1.0.0' },
    'node_modules/lodash': { version: '4.17.15' },
    'node_modules/minimist': { version: '1.2.0' },
    'node_modules/acorn': { version: '8.14.0' }
  }
}, null, 2), 'utf8');

// Test 1: Extract lockfile queries
const queries = adapter.extractLockfileQueries(sampleLockfile);
assert.strictEqual(queries.length, 3);
assert.deepStrictEqual(queries[0], { package: { name: 'lodash', ecosystem: 'npm' }, version: '4.17.15' });
assert.deepStrictEqual(queries[1], { package: { name: 'minimist', ecosystem: 'npm' }, version: '1.2.0' });
console.log('[PASS] 1. Extracted lockfile dependencies for OSV batch query.');

// Test 2: Parse real OSV.dev response format with vulnerabilities
const sampleOsvResponse = {
  results: [
    {
      package: { name: 'lodash', ecosystem: 'npm' },
      vulns: [
        {
          id: 'GHSA-p6mc-m468-83gw',
          summary: 'Prototype Pollution in lodash',
          database_specific: { severity: 'HIGH' },
          published: '2020-07-15T00:00:00Z',
          aliases: ['CVE-2020-8203']
        }
      ]
    },
    {
      package: { name: 'minimist', ecosystem: 'npm' },
      vulns: [
        {
          id: 'GHSA-vh95-rm6w-qq85',
          summary: 'Prototype Pollution in minimist',
          database_specific: { severity: 'CRITICAL' },
          published: '2020-03-12T00:00:00Z',
          aliases: ['CVE-2020-7598']
        }
      ]
    },
    {
      package: { name: 'acorn', ecosystem: 'npm' },
      vulns: []
    }
  ]
};

const resParsed = adapter.parse(sampleOsvResponse);
assert.strictEqual(resParsed.adapter_status, 'FAIL');
assert.strictEqual(resParsed.controls['MNT-02.2'].status, 'FAIL');
assert.strictEqual(resParsed.gate_evidence['GB-03'], true, 'Critical vuln must trigger GB-03');
assert.strictEqual(resParsed.findings.length, 2);
console.log('[PASS] 2. Parsed OSV.dev vulnerability format with CVSS/GHSA mapping & GB-03 veto.');

// Test 3: Fail-Closed on 504 Gateway Timeout (FAILCLOSE-03)
async function testFailClosed504() {
  const server = http.createServer((req, res) => {
    res.writeHead(504, { 'Content-Type': 'text/plain' });
    res.end('Gateway Timeout');
  });

  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const port = server.address().port;

  const res504 = await adapter.scanLockfile(sampleLockfile, {
    apiUrl: `http://127.0.0.1:${port}/v1/querybatch`,
    timeoutMs: 1000
  });

  server.close();

  assert.strictEqual(res504.adapter_status, 'INCONCLUSIVE');
  assert.strictEqual(res504.controls['MNT-02.2'].status, 'UNEXECUTED');
  assert.strictEqual(res504.controls['MNT-02.2'].inconclusive, true);
  assert.strictEqual(res504.gate_evidence['INCONCLUSIVE_SCA_AUDIT'], true);
  console.log('[PASS] 3. Fail-Closed on 504 Gateway Timeout verified: returned INCONCLUSIVE (never PASS).');
}

// Test 4: Fail-Closed on Network Timeout
async function testFailClosedTimeout() {
  const server = http.createServer((req, res) => {
    // Intentionally never respond to trigger client timeout
  });

  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const port = server.address().port;

  const resTimeout = await adapter.scanLockfile(sampleLockfile, {
    apiUrl: `http://127.0.0.1:${port}/v1/querybatch`,
    timeoutMs: 100
  });

  server.close();

  assert.strictEqual(resTimeout.adapter_status, 'INCONCLUSIVE');
  assert.strictEqual(resTimeout.controls['MNT-02.2'].status, 'UNEXECUTED');
  assert.strictEqual(resTimeout.controls['MNT-02.2'].inconclusive, true);
  console.log('[PASS] 4. Fail-Closed on Network Timeout verified: returned INCONCLUSIVE (never PASS).');
}

async function runAll() {
  await testFailClosed504();
  await testFailClosedTimeout();

  // Cleanup
  fs.rmSync(testDir, { recursive: true, force: true });

  console.log('\n================================================================');
  console.log('ALL OSV.DEV SCA TESTS PASSED (4/4)');
  console.log('================================================================\n');
}

runAll().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
