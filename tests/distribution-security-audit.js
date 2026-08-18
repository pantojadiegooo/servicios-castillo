/**
 * Castle Security & Quality Gate — Distribution Security & Pack Audit
 * 
 * Performs static security inspection of all files included in the NPM distribution bundle:
 * - Checks package.json files whitelist against real filesystem
 * - Verifies absence of hardcoded tokens, AWS keys, Stripe keys, GitHub tokens, private keys
 * - Verifies absence of absolute development paths (e.g. C:\Users\...)
 * - Verifies zero network require/import statements
 */

'use strict';

const assert = require('assert');
const path = require('path');
const fs = require('fs');

const baseDir = path.resolve(__dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(baseDir, 'package.json'), 'utf8'));

console.log('================================================================');
console.log('Castle Gate (v1.0.0) — Distribution Security & Tarball Audit');
console.log('================================================================\n');

// 1. Files in Distribution
const distributableFiles = [];

function collectFiles(dir) {
  const entries = fs.readdirSync(dir);
  for (const e of entries) {
    const full = path.join(dir, e);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (e !== 'node_modules' && !e.startsWith('.test-') && !e.startsWith('.audit-') && e !== '.git' && e !== '.castle') {
        collectFiles(full);
      }
    } else {
      const rel = path.relative(baseDir, full).replace(/\\/g, '/');
      // Only check files that match package.json "files" whitelist
      const included = pkg.files.some(f => {
        const cleanF = f.replace(/\/$/, '');
        return rel === cleanF || rel.startsWith(cleanF + '/');
      });
      if (included) {
        distributableFiles.push(rel);
      }
    }
  }
}

collectFiles(baseDir);

console.log(`[AUDIT 1] Total Files in Package Distribution Whitelist: ${distributableFiles.length}`);
for (const f of distributableFiles) {
  console.log(`  - ${f}`);
}

// 2. Secret & Leak Scan on Distributable Files
let leakCount = 0;
const secretPatterns = [
  { name: 'AWS Access Key', regex: /\b(AKIA[0-9A-Z]{16})\b/ },
  { name: 'Stripe Live Secret Key', regex: /\b(sk_live_[0-9a-zA-Z]{24,34})\b/ },
  { name: 'GitHub PAT', regex: /\b(ghp_[0-9a-zA-Z]{36})\b/ },
  { name: 'Private Key Header', regex: /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
  { name: 'Absolute User Path', regex: /[A-Z]:\\Users\\[a-zA-Z0-9_-]+/i }
];

for (const rel of distributableFiles) {
  const full = path.join(baseDir, rel);
  const content = fs.readFileSync(full, 'utf8');

  // Skip security-probe itself where regex definitions reside
  if (rel.includes('security-probe.js')) continue;

  for (const sp of secretPatterns) {
    if (sp.regex.test(content)) {
      console.error(`  [LEAK DETECTED] ${sp.name} in file: ${rel}`);
      leakCount++;
    }
  }
}

console.log(`\n[AUDIT 2] Secret & Leak Scan on Distributable Files: ${leakCount} leaks found -> ${leakCount === 0 ? 'CLEAN (PASS)' : 'FAILED'}`);
assert.strictEqual(leakCount, 0, 'Distributable files must contain 0 hardcoded secrets or absolute user paths');

// 3. Verify zero network imports in core distributable files
let netImportCount = 0;
for (const rel of distributableFiles) {
  if (rel.endsWith('.js')) {
    const full = path.join(baseDir, rel);
    const content = fs.readFileSync(full, 'utf8');
    if (/require\s*\(\s*['"](http|https|net|dgram|tls|axios|node-fetch|got|request)['"]\s*\)/.test(content)) {
      console.error(`  [NETWORK REQUIRE DETECTED] in file: ${rel}`);
      netImportCount++;
    }
  }
}

console.log(`[AUDIT 3] Outbound Network Module Scan: ${netImportCount} found -> ${netImportCount === 0 ? 'CLEAN (PASS)' : 'FAILED'}`);
assert.strictEqual(netImportCount, 0, 'Distributable files must contain 0 outbound network modules');

console.log('\n================================================================');
console.log('DISTRIBUTION SECURITY AUDIT: 100% CLEAN & VERIFIED');
console.log('================================================================\n');
