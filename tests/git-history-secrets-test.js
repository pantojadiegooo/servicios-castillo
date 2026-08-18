/**
 * Castle Security & Quality Gate — Git History & Deleted Secrets Test Suite
 * 
 * Verifies:
 * 1. Secrets committed in past Git commits and subsequently deleted from the working tree
 *    are detected by GitHistoryProbe.
 * 2. Historical secrets trigger CQS SEC-05.1 FAIL and Gate Breaker GB-02 veto.
 * 3. GitleaksAdapter correctly ingests and normalizes historical commit secrets.
 * 4. Clean Git repositories with zero secrets pass with SEC-05.1 PASS.
 */

'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { GitHistoryProbe } = require('../castle-gate/analyzers/git-history-probe');
const { GitleaksAdapter } = require('../castle-gate/evidence/adapters/gitleaks-adapter');

const testDir = path.join(__dirname, '..', '.test-scratch-githistory');
if (fs.existsSync(testDir)) {
  fs.rmSync(testDir, { recursive: true, force: true });
}
fs.mkdirSync(testDir, { recursive: true });

console.log('================================================================');
console.log('Castle Gate — Git History & Deleted Secrets Test Suite');
console.log('================================================================\n');

// Initialize a temporary Git repository
execSync('git init', { cwd: testDir, stdio: 'ignore' });
execSync('git config user.name "Test Auditor"', { cwd: testDir, stdio: 'ignore' });
execSync('git config user.email "auditor@castlegate.test"', { cwd: testDir, stdio: 'ignore' });

// Commit 1: Introduce AWS Secret Key
const secretFilePath = path.join(testDir, 'config.js');
fs.writeFileSync(secretFilePath, 'const AWS_KEY = "AKIAIOSFODNN7EXAMPLE"; // Committed in error\n', 'utf8');
execSync('git add config.js', { cwd: testDir, stdio: 'ignore' });
execSync('git commit -m "feat: add initial config with aws key"', { cwd: testDir, stdio: 'ignore' });

// Commit 2: Delete/replace the secret from working tree (developer realizes mistake and deletes it)
fs.writeFileSync(secretFilePath, 'const AWS_KEY = process.env.AWS_KEY;\n', 'utf8');
execSync('git add config.js', { cwd: testDir, stdio: 'ignore' });
execSync('git commit -m "fix: remove hardcoded aws key and use env"', { cwd: testDir, stdio: 'ignore' });

// Verify that working tree now has zero secrets
assert(!fs.readFileSync(secretFilePath, 'utf8').includes('AKIAIOSFODNN7EXAMPLE'));

// Run GitHistoryProbe
const probe = new GitHistoryProbe();
const historyResult = probe.run(testDir);

assert.strictEqual(historyResult.controls['SEC-05.1'].status, 'FAIL');
assert(historyResult.findings.historical_secrets.length >= 1);
assert.strictEqual(historyResult.gate_evidence['GB-02'], true, 'Historical secret must trigger Gate Breaker GB-02');

const detectedSecret = historyResult.findings.historical_secrets[0];
assert(detectedSecret.description.includes('AWS Access Key ID'));
assert(detectedSecret.commit_sha && detectedSecret.commit_sha.length > 5);
console.log(`[PASS] 1. Deleted secret detected in Git commit history (${detectedSecret.rule} in commit ${detectedSecret.commit_sha.substring(0, 8)}).`);
console.log('[PASS] 2. Historical secret triggers Gate Breaker GB-02 veto.');

// Test GitleaksAdapter with historical commit finding
const gitleaksAdapter = new GitleaksAdapter();
const gitleaksMockReport = JSON.stringify([
  {
    RuleID: 'aws-access-key',
    Description: 'AWS Access Key ID',
    File: 'config.js',
    StartLine: 1,
    Commit: 'a1b2c3d4e5f60718293a4b5c6d7e8f9012345678',
    Author: 'developer@example.com',
    Date: '2026-08-10T12:00:00Z',
    Secret: 'AKIAIOSFODNN7EXAMPLE'
  }
]);

const gitleaksResult = gitleaksAdapter.parse(gitleaksMockReport);
assert.strictEqual(gitleaksResult.adapter_status, 'FAIL');
assert.strictEqual(gitleaksResult.controls['SEC-05.1'].status, 'FAIL');
assert.strictEqual(gitleaksResult.gate_evidence['GB-02'], true);
assert.strictEqual(gitleaksResult.findings.length, 1);
assert.strictEqual(gitleaksResult.findings[0].details.commit, 'a1b2c3d4e5f60718293a4b5c6d7e8f9012345678');
console.log('[PASS] 3. GitleaksAdapter ingested historical commit secret successfully.');

// Test clean git repository
const cleanGitDir = path.join(__dirname, '..', '.test-scratch-gitclean');
if (fs.existsSync(cleanGitDir)) fs.rmSync(cleanGitDir, { recursive: true, force: true });
fs.mkdirSync(cleanGitDir, { recursive: true });
execSync('git init', { cwd: cleanGitDir, stdio: 'ignore' });
execSync('git config user.name "Clean Dev"', { cwd: cleanGitDir, stdio: 'ignore' });
execSync('git config user.email "dev@castlegate.test"', { cwd: cleanGitDir, stdio: 'ignore' });

fs.writeFileSync(path.join(cleanGitDir, 'app.js'), 'console.log("Clean application");\n', 'utf8');
execSync('git add app.js', { cwd: cleanGitDir, stdio: 'ignore' });
execSync('git commit -m "initial clean commit"', { cwd: cleanGitDir, stdio: 'ignore' });

const cleanHistoryResult = probe.run(cleanGitDir);
assert.strictEqual(cleanHistoryResult.controls['SEC-05.1'].status, 'PASS');
assert.strictEqual(cleanHistoryResult.findings.historical_secrets.length, 0);
console.log('[PASS] 4. Clean Git repository passes historical secret analysis with SEC-05.1 PASS.');

// Cleanup
fs.rmSync(testDir, { recursive: true, force: true });
fs.rmSync(cleanGitDir, { recursive: true, force: true });

console.log('\n================================================================');
console.log('ALL GIT HISTORY SECRETS TESTS PASSED (4/4)');
console.log('================================================================\n');
