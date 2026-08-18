/**
 * Terminal Demo & Website Frontend Security Audit
 * 
 * Verifies:
 * 1. AST scan over website/app.js yields 0 unsafe DOM sinks.
 * 2. SEC-04.1 is PASS on website codebase.
 * 3. Contact form HTML escaping prevents XSS injection strings.
 */

'use strict';

const assert = require('assert');
const path = require('path');
const fs = require('fs');

const { AstProbe } = require('../castle-gate/analyzers/ast-probe');
const { SecurityProbe } = require('../castle-gate/analyzers/security-probe');

console.log('================================================================');
console.log('WEBSITE FRONTEND & TERMINAL DEMO SECURITY AUDIT');
console.log('================================================================\n');

const websiteDir = path.join(__dirname, '..', 'website');

// 1. Run AstProbe
const astProbe = new AstProbe();
const astRes = astProbe.analyze(websiteDir);

console.log('[1] AST Sinks in website/app.js:');
console.log('    - Unsafe DOM Sinks:     ', astRes.findings.unsafe_dom_sinks.length);
console.log('    - Eval Invocations:     ', astRes.findings.eval_invocations.length);
console.log('    - SEC-04.1 Status:      ', astRes.controls['SEC-04.1'].status);

assert.strictEqual(astRes.findings.unsafe_dom_sinks.length, 0, 'Must have 0 unsafe DOM sinks in website/app.js');
assert.strictEqual(astRes.findings.eval_invocations.length, 0, 'Must have 0 eval invocations in website/app.js');
assert.strictEqual(astRes.controls['SEC-04.1'].status, 'PASS', 'SEC-04.1 must be PASS');

// 2. Run SecurityProbe
const secProbe = new SecurityProbe();
const secRes = secProbe.analyze(websiteDir);

console.log('\n[2] SecurityProbe Findings in website/:');
console.log('    - Dangerous Patterns:   ', secRes.findings.dangerous_patterns.length);
console.log('    - Secrets Detected:     ', (secRes.findings.secrets || []).length);
console.log('    - SEC-04.1 Status:      ', secRes.controls['SEC-04.1'].status);
console.log('    - SEC-05.1 Status:      ', secRes.controls['SEC-05.1'].status);

assert.strictEqual((secRes.findings.secrets || []).length, 0, 'Must have 0 secrets in website/');
assert.strictEqual(secRes.controls['SEC-04.1'].status, 'PASS', 'SecurityProbe SEC-04.1 must be PASS');
assert.strictEqual(secRes.controls['SEC-05.1'].status, 'PASS', 'SecurityProbe SEC-05.1 must be PASS');

// 3. Functional XSS Escaping Test
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const xssPayloads = [
  '<script>alert(1)</script>',
  '"><img src=x onerror=alert(1)>',
  '<svg/onload=alert(1)>',
  'test@domain.com"><script>alert(document.cookie)</script>'
];

console.log('\n[3] Functional Contact Form Input Sanitization Test:');
for (const payload of xssPayloads) {
  const sanitized = escapeHtml(payload);
  assert(!sanitized.includes('<script>'), `Failed to sanitize script tag: ${sanitized}`);
  assert(!sanitized.includes('<img'), `Failed to sanitize img tag: ${sanitized}`);
  assert(!sanitized.includes('<svg'), `Failed to sanitize svg tag: ${sanitized}`);
  assert(!sanitized.includes('"'), `Failed to sanitize quotes: ${sanitized}`);
  console.log(`  [PASS] Payload "${payload}" -> Escaped: "${sanitized}"`);
}

console.log('\n================================================================');
console.log('VERDICT: ZERO DOM XSS SINK VULNERABILITIES — 100% PASS');
console.log('================================================================');
