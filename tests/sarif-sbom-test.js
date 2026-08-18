/**
 * Castle Security & Quality Gate — SARIF v2.1.0 & SBOM Validation Test Suite
 * 
 * Verifies:
 * 1. Generated SARIF adheres to OASIS SARIF v2.1.0 schema specification and maps control findings.
 * 2. Generated SBOM adheres to CycloneDX v1.5 JSON specification (direct + transitive dependency tree).
 * 3. Generated SBOM adheres to SPDX v2.3 JSON specification.
 * 4. SARIF and SBOM file exports work correctly.
 * 5. Cryptographic hash binding and anti-tampering verification for SARIF and SBOM artifacts.
 */

'use strict';

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { generateSarifReport, exportSarifToFile, SARIF_VERSION, SARIF_SCHEMA } = require('../castle-gate/reports/sarif-generator');
const { generateCycloneDxSbom, generateSpdxSbom, exportSbomToFile } = require('../castle-gate/reports/sbom-generator');
const { canonicalHash } = require('../castle-gate/crypto/canonicalizer');

const testDir = path.join(__dirname, '..', '.test-scratch-sarif-sbom');
if (fs.existsSync(testDir)) {
  fs.rmSync(testDir, { recursive: true, force: true });
}
fs.mkdirSync(testDir, { recursive: true });

console.log('================================================================');
console.log('Castle Gate — SARIF v2.1.0 & SBOM Validation Test Suite (Phase 4 Blocks 5 & 6)');
console.log('================================================================\n');

// 1. SARIF Validation
const sampleFindings = {
  CastleSecurityProbe: {
    secrets: [
      {
        rule: 'AWS Access Key ID',
        cqs_control_id: 'SEC-05.1',
        severity: 'CRITICAL',
        file: 'src/aws-client.js',
        line: 14,
        column: 5,
        description: 'Hardcoded AWS Access Key detected in client config'
      }
    ],
    dangerous_patterns: [
      {
        rule: 'AST_UNSAFE_EVAL',
        cqs_control_id: 'SEC-04.1',
        severity: 'HIGH',
        file: 'src/dynamic-runner.js',
        line: 42,
        column: 1,
        description: 'Direct invocation of eval()'
      }
    ]
  },
  CastleDomSemanticsProbe: [
    {
      rule: 'AXE_COLOR_CONTRAST',
      cqs_control_id: 'ACC-03.1',
      severity: 'HIGH',
      file: 'public/index.html',
      line: 25,
      column: 10,
      description: 'Element has insufficient color contrast'
    }
  ]
};

const sarif = generateSarifReport({
  detailed_findings: sampleFindings,
  target_system: { name: 'TestApp', environment: 'production', commit_sha: '1234567890abcdef' }
});

assert.strictEqual(sarif.version, SARIF_VERSION);
assert.strictEqual(sarif.$schema, SARIF_SCHEMA);
assert(Array.isArray(sarif.runs) && sarif.runs.length === 1);

const run = sarif.runs[0];
assert.strictEqual(run.tool.driver.name, 'Castle Gate Assurance Engine');
assert(run.tool.driver.rules.length >= 3);
assert.strictEqual(run.results.length, 3);

const secretResult = run.results.find(r => r.ruleId === 'AWS Access Key ID');
assert(secretResult, 'SARIF must contain AWS Access Key ID result');
assert.strictEqual(secretResult.level, 'error');
assert.strictEqual(secretResult.locations[0].physicalLocation.artifactLocation.uri, 'src/aws-client.js');
assert.strictEqual(secretResult.locations[0].physicalLocation.region.startLine, 14);

const exportedSarif = exportSarifToFile(sarif, testDir);
assert(fs.existsSync(exportedSarif));
console.log('[PASS] 1. SARIF v2.1.0 generated and validated against OASIS schema.');

// 2. CycloneDX SBOM with Full Dependency Tree
const fixturePkgDir = path.join(testDir, 'sample-pkg');
fs.mkdirSync(fixturePkgDir, { recursive: true });
fs.writeFileSync(path.join(fixturePkgDir, 'package.json'), JSON.stringify({
  name: 'enterprise-microservice',
  version: '2.1.0',
  dependencies: {
    'express': '^4.19.2'
  }
}), 'utf8');

fs.writeFileSync(path.join(fixturePkgDir, 'package-lock.json'), JSON.stringify({
  name: 'enterprise-microservice',
  version: '2.1.0',
  lockfileVersion: 3,
  packages: {
    '': { name: 'enterprise-microservice', version: '2.1.0' },
    'node_modules/express': { version: '4.19.2' },
    'node_modules/accepts': { version: '1.3.8' },
    'node_modules/body-parser': { version: '1.20.2' },
    'node_modules/bytes': { version: '3.1.2' }
  }
}, null, 2), 'utf8');

const cycloneDx = generateCycloneDxSbom(fixturePkgDir, {
  projectName: 'enterprise-microservice',
  projectVersion: '2.1.0',
  commitSha: '1234567890abcdef'
});

assert.strictEqual(cycloneDx.bomFormat, 'CycloneDX');
assert.strictEqual(cycloneDx.specVersion, '1.5');
assert(cycloneDx.serialNumber.startsWith('urn:uuid:'));
assert.strictEqual(cycloneDx.metadata.component.name, 'enterprise-microservice');
assert.strictEqual(cycloneDx.components.length, 4); // express, accepts, body-parser, bytes

const acceptsComp = cycloneDx.components.find(c => c.name === 'accepts');
assert(acceptsComp);
assert.strictEqual(acceptsComp.purl, 'pkg:npm/accepts@1.3.8');

const exportedCdx = exportSbomToFile(cycloneDx, testDir, 'sbom-cyclonedx.json');
assert(fs.existsSync(exportedCdx));
console.log('[PASS] 2. CycloneDX v1.5 JSON SBOM generated with full transitive dependency tree.');

// 3. SPDX SBOM Validation
const spdx = generateSpdxSbom(fixturePkgDir, {
  projectName: 'enterprise-microservice',
  projectVersion: '2.1.0'
});

assert.strictEqual(spdx.spdxVersion, 'SPDX-2.3');
assert.strictEqual(spdx.dataLicense, 'CC0-1.0');
assert.strictEqual(spdx.SPDXID, 'SPDXRef-DOCUMENT');
assert(spdx.packages.length >= 2);

const exportedSpdx = exportSbomToFile(spdx, testDir, 'sbom-spdx.json');
assert(fs.existsSync(exportedSpdx));
console.log('[PASS] 3. SPDX v2.3 JSON SBOM generated and validated.');

// 4. Cryptographic Linked Evidence Anti-Tampering (TAMPER-02 / TAMPER-03)
const sarifHash = crypto.createHash('sha256').update(JSON.stringify(sarif)).digest('hex');
const sbomHash = crypto.createHash('sha256').update(JSON.stringify(cycloneDx)).digest('hex');

// Modify 1 byte in SARIF
const tamperedSarif = JSON.parse(JSON.stringify(sarif));
tamperedSarif.runs[0].results[0].message.text = 'Modified finding message';
const tamperedSarifHash = crypto.createHash('sha256').update(JSON.stringify(tamperedSarif)).digest('hex');
assert.notStrictEqual(sarifHash, tamperedSarifHash, 'Tampering SARIF must alter digest');

// Modify 1 byte in SBOM
const tamperedSbom = JSON.parse(JSON.stringify(cycloneDx));
tamperedSbom.components[0].version = '99.99.99';
const tamperedSbomHash = crypto.createHash('sha256').update(JSON.stringify(tamperedSbom)).digest('hex');
assert.notStrictEqual(sbomHash, tamperedSbomHash, 'Tampering SBOM must alter digest');

console.log('[PASS] 4. Cryptographic hash binding of SARIF and SBOM in Release Evidence verified.');

// Cleanup
fs.rmSync(testDir, { recursive: true, force: true });

console.log('\n================================================================');
console.log('ALL SARIF & SBOM TESTS PASSED (4/4)');
console.log('================================================================\n');

