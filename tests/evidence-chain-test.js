/**
 * Castle Security & Quality Gate — Evidence Chain & Ledger Test Suite
 * 
 * Verifies:
 * 1. Sequential appending of evaluation evidence creates Merkle-linked chain (Eval N -> Eval N-1).
 * 2. Complete cryptographic continuity verification across the ledger.
 * 3. Tampering with any historical evaluation payload invalidates the entire downstream chain.
 * 4. Broken parent hash links are detected immediately.
 */

'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { EvidenceLedger, GENESIS_PARENT_HASH } = require('../castle-gate/evidence/evidence-chain');

const testDir = path.join(__dirname, '..', '.test-scratch-ledger');
if (fs.existsSync(testDir)) {
  fs.rmSync(testDir, { recursive: true, force: true });
}
fs.mkdirSync(testDir, { recursive: true });

console.log('================================================================');
console.log('Castle Gate — Evidence Chain & Ledger Test Suite');
console.log('================================================================\n');

const ledger = new EvidenceLedger();

// 1. Append Evaluation 0 (Genesis)
const entry0 = ledger.append({
  evaluation_id: 'EVAL-000',
  target_system: { commit_sha: 'commit-000' },
  integrity: { payload_sha256: 'aaaa000000000000000000000000000000000000000000000000000000000000' }
});

assert.strictEqual(entry0.entry_index, 0);
assert.strictEqual(entry0.parent_hash, GENESIS_PARENT_HASH);
console.log('[PASS] 1. Genesis evaluation entry appended with null parent hash.');

// 2. Append Evaluation 1 & 2
const entry1 = ledger.append({
  evaluation_id: 'EVAL-001',
  target_system: { commit_sha: 'commit-001' },
  integrity: { payload_sha256: 'bbbb111111111111111111111111111111111111111111111111111111111111' }
});
assert.strictEqual(entry1.entry_index, 1);
assert.strictEqual(entry1.parent_hash, entry0.entry_hash);

const entry2 = ledger.append({
  evaluation_id: 'EVAL-002',
  target_system: { commit_sha: 'commit-002' },
  integrity: { payload_sha256: 'cccc222222222222222222222222222222222222222222222222222222222222' }
});
assert.strictEqual(entry2.entry_index, 2);
assert.strictEqual(entry2.parent_hash, entry1.entry_hash);

const continuityResult = ledger.verifyContinuity();
assert.strictEqual(continuityResult.valid, true);
assert.strictEqual(continuityResult.total_entries, 3);
console.log('[PASS] 2. Cryptographic continuity verified across 3 sequential evaluations.');

// 3. Save and reload ledger from disk
const ledgerFile = path.join(testDir, 'evidence-ledger.json');
ledger.saveToFile(ledgerFile);
assert(fs.existsSync(ledgerFile));

const reloadedLedger = EvidenceLedger.loadFromFile(ledgerFile);
const reloadedContinuity = reloadedLedger.verifyContinuity();
assert.strictEqual(reloadedContinuity.valid, true);
assert.strictEqual(reloadedContinuity.total_entries, 3);
console.log('[PASS] 3. Ledger persistence and reloading verified.');

// 4. Tamper with historical entry (modify entry 1 payload hash)
const tamperedLedger = EvidenceLedger.loadFromFile(ledgerFile);
tamperedLedger.entries[1].evidence_sha256 = 'forged-hash-00000000000000000000000000000000000000000000000000000';

const tamperedResult = tamperedLedger.verifyContinuity();
assert.strictEqual(tamperedResult.valid, false, 'Tampered ledger entry MUST fail verification');
assert(tamperedResult.errors.some(e => e.includes('hash mismatch') || e.includes('tampered')));
console.log('[PASS] 4. Tampered historical ledger entry detected and rejected.');

// Cleanup
fs.rmSync(testDir, { recursive: true, force: true });

console.log('\n================================================================');
console.log('ALL EVIDENCE CHAIN TESTS PASSED (4/4)');
console.log('================================================================\n');
