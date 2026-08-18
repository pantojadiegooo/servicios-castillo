/**
 * Castle Security & Quality Gate — Core Web Vitals (Lighthouse) Test Suite
 * 
 * Verifies:
 * 1. Policy-aware CWV threshold evaluation (C1 vs C2)
 * 2. LCP, CLS, and TBT metric parsing from real Lighthouse JSON structure
 * 3. Linked evidence generation with SHA-256 cryptographic provenance
 * 4. Anti-tampering defense on linked Lighthouse evidence
 */

'use strict';

const assert = require('assert');
const crypto = require('crypto');
const path = require('path');
const { LighthouseAdapter, CWV_POLICY_THRESHOLDS } = require('../castle-gate/evidence/adapters/lighthouse-adapter');

console.log('================================================================');
console.log('Castle Gate — Core Web Vitals (Lighthouse) Test Suite (Phase 4 Block 3)');
console.log('================================================================\n');

const adapter = new LighthouseAdapter();

// 1. Good CWV Report (LCP = 1850ms, CLS = 0.035, TBT = 110ms)
const goodReport = {
  lighthouseVersion: '11.4.0',
  fetchTime: '2026-08-18T18:00:00.000Z',
  finalUrl: 'https://servicios-castillo.vercel.app',
  audits: {
    'largest-contentful-paint': { numericValue: 1850.5, score: 0.95 },
    'cumulative-layout-shift': { numericValue: 0.035, score: 0.98 },
    'total-blocking-time': { numericValue: 110.0, score: 0.96 },
    'modern-image-formats': { score: 1, displayValue: 'All images optimized' },
    'uses-text-compression': { score: 1, displayValue: 'Brotli compression active' },
    'is-on-https': { score: 1 },
    'heading-order': { score: 1 },
    'color-contrast': { score: 1 },
    'document-title': { score: 1 },
    'meta-description': { score: 1 },
    'viewport': { score: 1 },
    'tap-targets': { score: 1 }
  }
};

// 2. Intermediate CWV Report (LCP = 3200ms - Good for C1, Fail for C2)
const intermediateReport = {
  lighthouseVersion: '11.4.0',
  fetchTime: '2026-08-18T18:00:00.000Z',
  finalUrl: 'https://servicios-castillo.vercel.app',
  audits: {
    'largest-contentful-paint': { numericValue: 3200.0, score: 0.65 },
    'cumulative-layout-shift': { numericValue: 0.04, score: 0.98 },
    'total-blocking-time': { numericValue: 150.0, score: 0.90 }
  }
};

// 3. Degraded CWV Report (CLS = 0.35 - Fails all tiers)
const degradedReport = {
  lighthouseVersion: '11.4.0',
  fetchTime: '2026-08-18T18:00:00.000Z',
  finalUrl: 'https://servicios-castillo.vercel.app',
  audits: {
    'largest-contentful-paint': { numericValue: 4500.0, score: 0.40 },
    'cumulative-layout-shift': { numericValue: 0.35, score: 0.30 },
    'total-blocking-time': { numericValue: 750.0, score: 0.20 }
  }
};

// Test 1: Good report under Policy C2 (Baseline)
const resGood = adapter.parse(goodReport, { gateLevel: 'C2' });
assert.strictEqual(resGood.controls['PER-01.1'].status, 'PASS');
assert.strictEqual(resGood.controls['PER-02.1'].status, 'PASS');
assert.strictEqual(resGood.controls['PER-03.1'].status, 'PASS');
assert.strictEqual(resGood.findings.length, 0);
console.log('[PASS] 1. Good Core Web Vitals report passes C2 policy (LCP: 1.85s, CLS: 0.035, TBT: 110ms).');

// Test 2: Policy-Aware Evaluation (C1 pass vs C2 fail on LCP = 3.2s)
const resC1 = adapter.parse(intermediateReport, { gateLevel: 'C1' });
const resC2 = adapter.parse(intermediateReport, { gateLevel: 'C2' });
assert.strictEqual(resC1.controls['PER-01.1'].status, 'PASS', 'LCP 3.2s must pass C1 (threshold 4.0s)');
assert.strictEqual(resC2.controls['PER-01.1'].status, 'FAIL', 'LCP 3.2s must fail C2 (threshold 2.5s)');
console.log('[PASS] 2. Policy-aware thresholding verified: LCP 3.2s PASSES C1 (<= 4.0s) and FAILS C2 (<= 2.5s).');

// Test 3: Degraded report fails all thresholds
const resDegraded = adapter.parse(degradedReport, { gateLevel: 'C1' });
assert.strictEqual(resDegraded.controls['PER-01.1'].status, 'FAIL');
assert.strictEqual(resDegraded.controls['PER-02.1'].status, 'FAIL');
assert.strictEqual(resDegraded.controls['PER-03.1'].status, 'FAIL');
assert(resDegraded.findings.length >= 3);
console.log('[PASS] 3. Degraded Core Web Vitals report correctly flagged with normalized findings.');

// Test 4: Linked Evidence Hashing & Anti-Tampering
const originalHash = resGood.provenance.raw_payload_hash;
assert(originalHash && originalHash.length === 64);
assert.strictEqual(resGood.linked_evidence.raw_payload_hash, originalHash);

// Tamper payload by mutating LCP score
const tamperedReport = JSON.parse(JSON.stringify(goodReport));
tamperedReport.audits['largest-contentful-paint'].numericValue = 100.0;
const resTampered = adapter.parse(tamperedReport, { gateLevel: 'C2' });
const tamperedHash = resTampered.provenance.raw_payload_hash;

assert.notStrictEqual(originalHash, tamperedHash, 'Tampered report must produce different SHA-256');
console.log('[PASS] 4. Cryptographic linked evidence hashing verified: payload mutation invalidates hash.');

console.log('\n================================================================');
console.log('ALL LIGHTHOUSE CORE WEB VITALS TESTS PASSED (4/4)');
console.log('================================================================\n');
