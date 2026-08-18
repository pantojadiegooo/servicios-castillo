/**
 * Castle Security & Quality Gate — Cross-Process Evidence Ledger Persistence Test
 * 
 * Verifies:
 * 1. CLI scan in Process 1 initializes physical ledger.json on disk.
 * 2. CLI scan in Process 2 (completely separate OS process) reads ledger.json,
 *    links previous evaluation E1 into certificate E2, and appends to disk ledger.
 * 3. CLI scan in Process 3 links E2 and appends to disk ledger.
 * 4. Physical ledger file on disk survives process exit and maintains cryptographic continuity.
 */

'use strict';

const assert = require('assert');
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { EvidenceLedger } = require('../castle-gate/evidence/evidence-chain');

const repoRoot = path.join(__dirname, '..');
const testScratchDir = path.join(repoRoot, '.test-cross-process-scratch');
const ledgerOutputDir = path.join(testScratchDir, 'out-ledger');
const targetAppDir = path.join(testScratchDir, 'app');

if (fs.existsSync(testScratchDir)) {
  fs.rmSync(testScratchDir, { recursive: true, force: true });
}
fs.mkdirSync(targetAppDir, { recursive: true });

console.log('================================================================');
console.log('Castle Gate — Cross-Process Ledger Persistence Test (Phase 5 Punto 2)');
console.log('================================================================\n');

// Create minimal valid fixture app
fs.writeFileSync(path.join(targetAppDir, 'index.html'), `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cross Process App</title>
  <meta name="description" content="Auditable app for multi-process ledger testing.">
</head>
<body>
  <header><nav><a href="/">Home</a></nav></header>
  <main><h1>Main Title</h1><p>Content</p><img src="logo.png" alt="Company Logo"></main>
  <footer><p>&copy; 2026</p></footer>
</body>
</html>`, 'utf8');

fs.writeFileSync(path.join(targetAppDir, 'app.js'), 'export function run() { return true; }\n', 'utf8');

// --- EXECUTION 1 (Process 1) ---
console.log('Spawning independent Process 1 (Commit A)...');
const p1 = spawnSync('node', [
  'bin/castle-gate.js', 'scan',
  '--dir', targetAppDir,
  '--level', 'C1',
  '--project', 'CrossProcessApp',
  '--commit', 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  '--output-dir', ledgerOutputDir
], { cwd: repoRoot, encoding: 'utf8' });

assert.strictEqual(p1.status, 0, `Process 1 failed: ${p1.stderr}`);
console.log('[PASS] Process 1 exited cleanly with code 0.');

const physicalLedgerFile = path.join(ledgerOutputDir, 'ledger.json');
assert(fs.existsSync(physicalLedgerFile), 'Physical ledger.json file must exist on disk after Process 1');

const ledgerAfterP1 = EvidenceLedger.loadFromFile(physicalLedgerFile);
assert.strictEqual(ledgerAfterP1.entries.length, 1);
const entry1 = ledgerAfterP1.entries[0];
assert.strictEqual(entry1.commit_sha, 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
console.log('[PASS] Physical ledger on disk contains Entry #0 for Commit A (Digest:', entry1.entry_hash.substring(0, 16) + '...).');

// --- EXECUTION 2 (Process 2: completely new OS process) ---
console.log('\nSpawning independent Process 2 (Commit B)...');
const p2 = spawnSync('node', [
  'bin/castle-gate.js', 'scan',
  '--dir', targetAppDir,
  '--level', 'C1',
  '--project', 'CrossProcessApp',
  '--commit', 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
  '--output-dir', ledgerOutputDir
], { cwd: repoRoot, encoding: 'utf8' });

assert.strictEqual(p2.status, 0, `Process 2 failed: ${p2.stderr}`);
console.log('[PASS] Process 2 exited cleanly with code 0.');

const ledgerAfterP2 = EvidenceLedger.loadFromFile(physicalLedgerFile);
assert.strictEqual(ledgerAfterP2.entries.length, 2);
const entry2 = ledgerAfterP2.entries[1];
assert.strictEqual(entry2.commit_sha, 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb');
assert.strictEqual(entry2.parent_hash, entry1.entry_hash, 'Entry #1 must chain parent_hash to Entry #0');

// Verify certificate on disk references previous evaluation
const certAfterP2 = JSON.parse(fs.readFileSync(path.join(ledgerOutputDir, 'release-certificate.json'), 'utf8'));
assert(certAfterP2.evaluation_reference.previous_evaluation, 'Certificate from Process 2 must reference previous evaluation');
assert.strictEqual(certAfterP2.evaluation_reference.previous_evaluation.commit_sha, 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
console.log('[PASS] Process 2 discovered physical ledger on disk and chained E2 -> E1.');

// --- EXECUTION 3 (Process 3: completely new OS process) ---
console.log('\nSpawning independent Process 3 (Commit C)...');
const p3 = spawnSync('node', [
  'bin/castle-gate.js', 'scan',
  '--dir', targetAppDir,
  '--level', 'C1',
  '--project', 'CrossProcessApp',
  '--commit', 'cccccccccccccccccccccccccccccccccccccccc',
  '--output-dir', ledgerOutputDir
], { cwd: repoRoot, encoding: 'utf8' });

assert.strictEqual(p3.status, 0, `Process 3 failed: ${p3.stderr}`);
console.log('[PASS] Process 3 exited cleanly with code 0.');

const ledgerAfterP3 = EvidenceLedger.loadFromFile(physicalLedgerFile);
assert.strictEqual(ledgerAfterP3.entries.length, 3);
const entry3 = ledgerAfterP3.entries[2];
assert.strictEqual(entry3.commit_sha, 'cccccccccccccccccccccccccccccccccccccccc');
assert.strictEqual(entry3.parent_hash, entry2.entry_hash, 'Entry #2 must chain parent_hash to Entry #1');

// Test Cryptographic Continuity of the physical ledger file on disk
const continuity = ledgerAfterP3.verifyContinuity();
assert.strictEqual(continuity.valid, true);
assert.strictEqual(continuity.total_entries, 3);
console.log('[PASS] Physical Evidence Ledger continuity verified across 3 separate OS processes (E1 -> E2 -> E3).');

// Cleanup (with retry for Windows file handle release)
try {
  fs.rmSync(testScratchDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 });
} catch (e) {
  // Ignored on locked temp dir
}

console.log('\n================================================================');
console.log('ALL CROSS-PROCESS LEDGER TESTS PASSED (100% PERSISTED)');
console.log('================================================================\n');
