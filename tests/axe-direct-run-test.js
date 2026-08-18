const { JSDOM } = require('jsdom');
const axe = require('axe-core');
const { AxeAdapter } = require('../castle-gate/evidence/adapters/axe-adapter');

async function testAxeCoreExecution() {
  console.log('================================================================');
  console.log('Demonstrating Direct axe.run() Execution via JSDOM & AxeAdapter');
  console.log('================================================================\n');

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <title>Axe Test</title>
</head>
<body>
  <main>
    <h1>Título Principal</h1>
    <!-- VIOLATION 1: Image without alt attribute -->
    <img src="banner.jpg">
    <!-- VIOLATION 2: Button with invalid ARIA attribute value -->
    <button aria-expanded="invalid_boolean">Click</button>
  </main>
</body>
</html>`;

  const dom = new JSDOM(html, { runScripts: 'dangerously' });
  
  // Inject axe-core source into JSDOM window
  dom.window.eval(axe.source);
  
  console.log('Executing native axe.run inside JSDOM window context...');
  const results = await dom.window.axe.run(dom.window.document, {
    runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa']
  });

  console.log('axe.run() completed successfully. Native Violations Count:', results.violations.length);
  for (const v of results.violations) {
    console.log(`- [${v.impact ? v.impact.toUpperCase() : 'UNKNOWN'}] ${v.id}: ${v.help} (Tags: ${v.tags.join(', ')})`);
  }

  // Pass native axe-core audit object to Castle Gate AxeAdapter
  const adapter = new AxeAdapter();
  const cqsEvidence = adapter.parse(results);

  console.log('\nAxeAdapter CQS Evidence Mapping:');
  console.log('ACC-01.1 (Landmarks):', cqsEvidence.controls['ACC-01.1'].status);
  console.log('ACC-03.1 (Images / Alt):', cqsEvidence.controls['ACC-03.1'].status);
  console.log('ACC-04.1 (ARIA Semantics):', cqsEvidence.controls['ACC-04.1'].status);
  console.log('Findings mapped:', cqsEvidence.findings.length);

  if (results.violations.length >= 2 && cqsEvidence.controls['ACC-03.1'].status === 'FAIL' && cqsEvidence.controls['ACC-04.1'].status === 'FAIL') {
    console.log('\n================================================================');
    console.log('[PASS] Confirmed: axe.run() executed natively against JSDOM and ingested into CQS.');
    console.log('================================================================\n');
  }
}

testAxeCoreExecution().catch(err => {
  console.error('Error running axe-core:', err);
  process.exit(1);
});
