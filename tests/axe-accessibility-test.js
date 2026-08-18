/**
 * Castle Security & Quality Gate — axe-core & WCAG Accessibility Test Suite
 * 
 * Verifies real accessibility and semantic inspections:
 * 1. WCAG 2.1 AA Color Contrast violation detection (#cccccc on #ffffff)
 * 2. Invalid ARIA boolean attribute values (aria-expanded="not-a-bool")
 * 3. Missing image alt attributes without presentation role
 * 4. Positive tabindex antipattern disrupting keyboard focus order
 * 5. Full WCAG AA clean accessible HTML document passing with 100% score
 */

'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { DomSemanticsProbe } = require('../castle-gate/analyzers/dom-semantics-probe');

const testDir = path.join(__dirname, '..', '.test-scratch-axe');
if (fs.existsSync(testDir)) {
  fs.rmSync(testDir, { recursive: true, force: true });
}
fs.mkdirSync(testDir, { recursive: true });

console.log('================================================================');
console.log('Castle Gate — axe-core & WCAG Accessibility Test Suite (Phase 4 Block 2)');
console.log('================================================================\n');

const probe = new DomSemanticsProbe();

// 1. Bad Contrast fixture
const badContrastDir = path.join(testDir, 'bad-contrast');
fs.mkdirSync(badContrastDir, { recursive: true });
fs.writeFileSync(path.join(badContrastDir, 'index.html'), `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bad Contrast</title>
  <meta name="description" content="Test page">
</head>
<body>
  <header><h1>Header</h1></header>
  <main>
    <p style="color: #cccccc; background-color: #ffffff;">Unreadable text failing WCAG 4.5:1 ratio</p>
  </main>
  <footer>Footer</footer>
</body>
</html>`, 'utf8');

// 2. Bad ARIA fixture
const badAriaDir = path.join(testDir, 'bad-aria');
fs.mkdirSync(badAriaDir, { recursive: true });
fs.writeFileSync(path.join(badAriaDir, 'index.html'), `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bad ARIA</title>
  <meta name="description" content="Test page">
</head>
<body>
  <header><h1>Header</h1></header>
  <main>
    <button aria-expanded="sometimes">Click</button>
  </main>
  <footer>Footer</footer>
</body>
</html>`, 'utf8');

// 3. Positive Tabindex fixture
const badTabindexDir = path.join(testDir, 'bad-tabindex');
fs.mkdirSync(badTabindexDir, { recursive: true });
fs.writeFileSync(path.join(badTabindexDir, 'index.html'), `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bad Tabindex</title>
  <meta name="description" content="Test page">
</head>
<body>
  <header><h1>Header</h1></header>
  <main>
    <a href="#" tabindex="5">Disrupted link</a>
  </main>
  <footer>Footer</footer>
</body>
</html>`, 'utf8');

// 4. Missing Alt Text fixture
const badAltDir = path.join(testDir, 'bad-alt');
fs.mkdirSync(badAltDir, { recursive: true });
fs.writeFileSync(path.join(badAltDir, 'index.html'), `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bad Alt</title>
  <meta name="description" content="Test page">
</head>
<body>
  <header><h1>Header</h1></header>
  <main>
    <img src="banner.jpg">
  </main>
  <footer>Footer</footer>
</body>
</html>`, 'utf8');

// 5. Clean Accessible fixture (WCAG 2.1 AA Compliant)
const cleanA11yDir = path.join(testDir, 'clean-accessible');
fs.mkdirSync(cleanA11yDir, { recursive: true });
fs.writeFileSync(path.join(cleanA11yDir, 'index.html'), `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Accessible Portal | Grupo Castillo</title>
  <meta name="description" content="Fully WCAG 2.1 AA accessible software assurance interface.">
</head>
<body>
  <header>
    <nav>
      <a href="/" tabindex="0">Home</a>
    </nav>
  </header>
  <main>
    <h1>Software Release Governance</h1>
    <p style="color: #111111; background-color: #ffffff;">High contrast readable body text.</p>
    <img src="logo.svg" alt="Grupo Castillo Company Logo">
    <button aria-expanded="false">Expand Details</button>
  </main>
  <footer>
    <p>&copy; 2026 Grupo Castillo</p>
  </footer>
</body>
</html>`, 'utf8');

// Run tests
// Test 1: Color Contrast Detection
const resContrast = probe.run(badContrastDir);
assert.strictEqual(resContrast.controls['ACC-03.1'].status, 'FAIL');
assert(resContrast.findings.color_contrast_violations.length >= 1, 'Expected color contrast violation');
console.log('[PASS] 1. WCAG 2.1 AA Color Contrast violation correctly detected (ratio < 4.5:1).');

// Test 2: Invalid ARIA Detection
const resAria = probe.run(badAriaDir);
assert.strictEqual(resAria.controls['ACC-04.1'].status, 'FAIL');
assert(resAria.findings.aria_violations.length >= 1, 'Expected ARIA violation');
console.log('[PASS] 2. Invalid boolean ARIA attribute value detected.');

// Test 3: Positive Tabindex Detection
const resTab = probe.run(badTabindexDir);
assert.strictEqual(resTab.controls['ACC-02.1'].status, 'FAIL');
assert(resTab.findings.keyboard_focus_violations.length >= 1, 'Expected keyboard focus violation');
console.log('[PASS] 3. Positive tabindex disrupting natural focus order detected.');

// Test 4: Missing Alt Text Detection
const resAlt = probe.run(badAltDir);
assert.strictEqual(resAlt.controls['ACC-03.1'].status, 'FAIL');
assert(resAlt.findings.missing_alt_images.length >= 1, 'Expected missing alt text');
console.log('[PASS] 4. Missing image alt attribute detected.');

// Test 5: Clean Accessible Document Passing
const resClean = probe.run(cleanA11yDir);
assert.strictEqual(resClean.controls['ACC-01.1'].status, 'PASS');
assert.strictEqual(resClean.controls['ACC-01.2'].status, 'PASS');
assert.strictEqual(resClean.controls['ACC-02.1'].status, 'PASS');
assert.strictEqual(resClean.controls['ACC-03.1'].status, 'PASS');
assert.strictEqual(resClean.controls['ACC-04.1'].status, 'PASS');
assert.strictEqual(resClean.controls['UX-01.1'].status, 'PASS');
assert.strictEqual(resClean.controls['SEO-02.1'].status, 'PASS');
console.log('[PASS] 5. Full WCAG 2.1 AA compliant HTML passes accessibility probe with 100% clean verdict.');

// Cleanup
fs.rmSync(testDir, { recursive: true, force: true });

console.log('\n================================================================');
console.log('ALL AXE ACCESSIBILITY TESTS PASSED (5/5)');
console.log('================================================================\n');
