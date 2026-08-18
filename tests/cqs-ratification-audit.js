/**
 * CQS v1.1 Ratification Verification Script
 * 
 * Demonstrates:
 * 1. total_controls: 65
 * 2. total_domains: 7
 * 3. nominal_weight_total: 100.00
 * 4. specification_version: 1.1.0
 * 5. status: RATIFIED_FROZEN
 */

'use strict';

const assert = require('assert');
const path = require('path');
const fs = require('fs');

const { loadNormativeAssets } = require('../cqs/engine/evaluator');
const { validateCqsIntegrity } = require('../cqs/engine/validator');

console.log('================================================================');
console.log('CQS v1.1 RATIFICATION & NORMATIVE ASSET AUDIT');
console.log('================================================================\n');

const assets = loadNormativeAssets();
const { controls, domains, subcriteria, invariants, specification } = assets;

// 1. Total Controls Count
const totalControls = controls.length;
console.log(`[1] Total Controls Count:       ${totalControls} (Expected: 65)`);
assert.strictEqual(totalControls, 65, `Expected 65 controls, found ${totalControls}`);

// 2. Total Domains Count
const totalDomains = Object.keys(domains).length;
const domainCodes = Object.keys(domains);
console.log(`[2] Total Domains Count:        ${totalDomains} [${domainCodes.join(', ')}] (Expected: 7)`);
assert.strictEqual(totalDomains, 7, `Expected 7 domains, found ${totalDomains}`);

// 3. Nominal Weight Total
const controlsWeightSum = controls.reduce((acc, c) => acc + c.inherited_weight, 0);
const domainsWeightSum = Object.values(domains).reduce((acc, d) => acc + d.nominal_weight, 0);
console.log(`[3] Nominal Controls Weight:    ${controlsWeightSum.toFixed(2)} (Expected: 100.00)`);
console.log(`    Nominal Domains Weight:     ${domainsWeightSum.toFixed(2)} (Expected: 100.00)`);
assert.ok(Math.abs(controlsWeightSum - 100.0) < 1e-6, `Controls weight must be 100.00, got ${controlsWeightSum}`);
assert.ok(Math.abs(domainsWeightSum - 100.0) < 1e-6, `Domains weight must be 100.00, got ${domainsWeightSum}`);

// 4. Specification Version
const specVersion = specification.version;
const invariantVersion = invariants.specification_version;
console.log(`[4] Specification Version:      "${specVersion}" (invariants.json: "${invariantVersion}")`);
assert.strictEqual(specVersion, '1.1.0', `Expected version '1.1.0', got '${specVersion}'`);
assert.strictEqual(invariantVersion, '1.1.0', `Expected invariant version '1.1.0', got '${invariantVersion}'`);

// 5. Specification Status
const specStatus = specification.status;
const invariantStatus = invariants.status;
console.log(`[5] Specification Status:       "${specStatus}" (invariants.json: "${invariantStatus}")`);
assert.strictEqual(specStatus, 'RATIFIED_FROZEN', `Expected status 'RATIFIED_FROZEN', got '${specStatus}'`);
assert.strictEqual(invariantStatus, 'RATIFIED_FROZEN', `Expected invariant status 'RATIFIED_FROZEN', got '${invariantStatus}'`);

// 6. Validator Execution
const validation = validateCqsIntegrity();
console.log('\n[6] CQS Integrity Validator Result:');
console.log(JSON.stringify(validation, null, 2));
assert.strictEqual(validation.integrity, 'PASS');
assert.strictEqual(validation.specification_version, '1.1.0');
assert.strictEqual(validation.status, 'VALIDATED');
assert.strictEqual(validation.metrics.total_controls, 65);
assert.strictEqual(validation.metrics.total_domains, 7);
assert.ok(Math.abs(validation.metrics.nominal_weight_total - 100.0) < 1e-6);

console.log('\n================================================================');
console.log('AUDIT VERDICT: 100% RATIFIED, VALIDATED & FROZEN (1.1.0)');
console.log('================================================================');
