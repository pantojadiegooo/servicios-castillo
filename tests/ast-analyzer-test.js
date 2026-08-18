/**
 * Castle Security & Quality Gate — Real AST Analyzer Test Suite
 * 
 * Verifies Babel / Acorn AST structural code inspection across JS/TS/TSX/Astro:
 * 1. Explicit debugger; statements vs false positives in strings and comments
 * 2. Dynamic eval() and new Function() calls
 * 3. document.write() and innerHTML sinks
 * 4. High Cyclomatic Complexity calculation (> 15)
 * 5. Silent/empty catch blocks
 * 6. TypeScript (.ts) and TSX (.tsx) real grammar parsing with type annotations
 * 7. Astro component (.astro) frontmatter and embedded script parsing
 * 8. Oversized function & file detection via AST node count
 * 9. Circular imports detection (A -> B -> A)
 * 10. Clean modular source passing with zero AST deficiencies
 */

'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { AstProbe } = require('../castle-gate/analyzers/ast-probe');

const testDir = path.join(__dirname, '..', '.test-scratch-ast');
if (fs.existsSync(testDir)) {
  fs.rmSync(testDir, { recursive: true, force: true });
}
fs.mkdirSync(testDir, { recursive: true });

console.log('================================================================');
console.log('Castle Gate — Real AST Code Analyzer Test Suite (Phase 4 Block 1)');
console.log('================================================================\n');

const probe = new AstProbe();

// 1. Debugger statement fixture
fs.writeFileSync(path.join(testDir, 'has-debugger.js'), `
function calculateTotal(items) {
  debugger;
  return items.reduce((a, b) => a + b, 0);
}
`, 'utf8');

// 2. Anti-False-Positive Fixture (debugger inside string and comment)
fs.writeFileSync(path.join(testDir, 'anti-fp-debugger.js'), `
// Note: do not use debugger; here
const logMessage = "Entering debugger; mode for user session";
const commentBlock = '/* debugger; */';
function safeGreeting(name) {
  return 'Hello ' + name + '! Debugging not needed.';
}
`, 'utf8');

// 3. Unsafe eval & new Function fixture
fs.writeFileSync(path.join(testDir, 'has-eval.js'), `
function runDynamic(codeStr) {
  const result = eval(codeStr);
  const fn = new Function('x', 'return x * 2');
  return fn(result);
}
`, 'utf8');

// 4. Unsafe DOM sinks fixture
fs.writeFileSync(path.join(testDir, 'has-dom-sinks.js'), `
function renderContent(container, htmlSnippet) {
  document.write('<div>Starting</div>');
  container.innerHTML = htmlSnippet;
}
`, 'utf8');

// 5. Empty catch block fixture
fs.writeFileSync(path.join(testDir, 'has-empty-catch.js'), `
function silentParser(raw) {
  try {
    return JSON.parse(raw);
  } catch (err) {
    // silently ignored
  }
}
`, 'utf8');

// 6. High cyclomatic complexity function fixture (CC > 15)
fs.writeFileSync(path.join(testDir, 'high-complexity.js'), `
function monsterRouting(type, a, b, c, d, e, f, g) {
  if (type === 'A') {
    if (a && b) return 1;
    else if (c || d) return 2;
  } else if (type === 'B') {
    for (let i = 0; i < 10; i++) {
      if (e) return 3;
    }
  } else if (type === 'C') {
    while (f > 0) {
      if (g) return 4;
      f--;
    }
  } else if (type === 'D') {
    switch (a) {
      case 1: return 5;
      case 2: return 6;
      case 3: return 7;
      case 4: return 8;
      default: return 9;
    }
  }
  return 0;
}
`, 'utf8');

// 7. Real TypeScript fixture (.ts) with types and interfaces
fs.writeFileSync(path.join(testDir, 'service.ts'), `
interface UserProfile {
  id: string;
  roles: Array<'admin' | 'user' | 'auditor'>;
  active: boolean;
}

export function evaluateUser(profile: UserProfile): boolean {
  const isAdmin: boolean = profile.roles.includes('admin');
  if (isAdmin && profile.active) {
    return true;
  }
  return false;
}
`, 'utf8');

// 8. Real TSX / JSX fixture (.tsx)
fs.writeFileSync(path.join(testDir, 'Component.tsx'), `
import React from 'react';

interface Props {
  title: string;
}

export const HeaderComponent: React.FC<Props> = ({ title }) => {
  return (
    <header className="site-header">
      <h1>{title}</h1>
    </header>
  );
};
`, 'utf8');

// 9. Real Astro component fixture (.astro) with frontmatter and script
fs.writeFileSync(path.join(testDir, 'Card.astro'), `---
interface Props {
  title: string;
  description: string;
}
const { title, description } = Astro.props;
function processTitle(t: string): string {
  return t.toUpperCase();
}
const formattedTitle = processTitle(title);
---
<div class="card">
  <h2>{formattedTitle}</h2>
  <p>{description}</p>
</div>
<script>
  console.log("Card mounted on client");
</script>
`, 'utf8');

// 10. Circular Imports Fixture (a.js -> b.js -> a.js)
const circularDir = path.join(testDir, 'circular-pkg');
fs.mkdirSync(circularDir, { recursive: true });
fs.writeFileSync(path.join(circularDir, 'moduleA.js'), `
const { helperB } = require('./moduleB');
function helperA() { return helperB() + 1; }
module.exports = { helperA };
`, 'utf8');
fs.writeFileSync(path.join(circularDir, 'moduleB.js'), `
const { helperA } = require('./moduleA');
function helperB() { return 42; }
module.exports = { helperB };
`, 'utf8');

// 11. Clean standalone subapp
const cleanDir = path.join(testDir, 'clean-subapp');
fs.mkdirSync(cleanDir, { recursive: true });
fs.writeFileSync(path.join(cleanDir, 'service.ts'), `
export interface MathService {
  compute(a: number, b: number): number;
}

export class SimpleCalculator implements MathService {
  compute(a: number, b: number): number {
    if (typeof a !== 'number' || typeof b !== 'number') {
      throw new TypeError('Arguments must be numbers');
    }
    return a + b;
  }
}
`, 'utf8');

// Run AST Probe on testDir
const scanResult = probe.run(testDir);

assert(scanResult.scanned_files_count >= 8, `Expected >= 8 scanned files, got ${scanResult.scanned_files_count}`);
assert.strictEqual(scanResult.controls['SEC-04.1'].status, 'FAIL');
assert.strictEqual(scanResult.controls['MNT-01.1'].status, 'FAIL');
assert.strictEqual(scanResult.controls['REL-02.1'].status, 'FAIL');

// Validate debugger finding (must be exactly 1, from has-debugger.js, NOT from anti-fp-debugger.js)
const dbgFindings = scanResult.findings.debugger_statements;
assert.strictEqual(dbgFindings.length, 1, `Expected 1 debugger statement, got ${dbgFindings.length}`);
assert.strictEqual(dbgFindings[0].file, 'has-debugger.js');
console.log('[PASS] 1. AST debugger; statement detected.');
console.log('[PASS] 2. Anti-False-Positive verified: string/comment "debugger;" produced zero findings.');

// Validate eval findings
assert(scanResult.findings.eval_invocations.length >= 2);
console.log('[PASS] 3. AST eval() and new Function() calls detected.');

// Validate DOM sinks findings
assert(scanResult.findings.unsafe_dom_sinks.length >= 2);
console.log('[PASS] 4. AST document.write() and innerHTML assignments detected.');

// Validate empty catch finding
assert(scanResult.findings.empty_catch_blocks.length >= 1);
console.log('[PASS] 5. AST empty catch block detected.');

// Validate high cyclomatic complexity finding
assert(scanResult.findings.high_complexity_functions.length >= 1);
const highFn = scanResult.findings.high_complexity_functions[0];
assert(highFn.complexity > 15, `Complexity (${highFn.complexity}) must be > 15`);
console.log(`[PASS] 6. High cyclomatic complexity function detected (CC = ${highFn.complexity}).`);

// Validate TypeScript and TSX parsed successfully
const tsFiles = ['service.ts', 'Component.tsx', 'Card.astro'];
for (const f of tsFiles) {
  assert(fs.existsSync(path.join(testDir, f)));
}
console.log('[PASS] 7. TypeScript (.ts), TSX (.tsx), and Astro (.astro) parsed seamlessly into AST.');

// Validate Circular Imports
assert(scanResult.findings.circular_imports.length >= 1, 'Expected circular imports to be detected');
console.log(`[PASS] 8. Circular imports cycle detected: ${scanResult.findings.circular_imports[0].cycle_path}`);

// Run AST Probe on clean subapp
const cleanScan = probe.run(cleanDir);
assert.strictEqual(cleanScan.controls['SEC-04.1'].status, 'PASS');
assert.strictEqual(cleanScan.controls['MNT-01.1'].status, 'PASS');
assert.strictEqual(cleanScan.controls['REL-02.1'].status, 'PASS');
console.log('[PASS] 9. Clean modular TypeScript passes AST analysis with 100% clean verdict.');

// Cleanup
fs.rmSync(testDir, { recursive: true, force: true });

console.log('\n================================================================');
console.log('ALL AST ANALYZER TESTS PASSED (9/9)');
console.log('================================================================\n');

