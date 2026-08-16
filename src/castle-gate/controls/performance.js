import fs from 'node:fs';
import path from 'node:path';

export function evaluatePerformance(targetDir) {
  const findings = [];
  let score = 100;
  let gateBreakersActive = 0;

  const distDir = path.join(targetDir, 'dist');
  let jsBundleSizeTotal = 0;

  // Check dist output assets if available
  if (fs.existsSync(distDir)) {
    const checkDir = (dir) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          checkDir(full);
        } else if (entry.isFile()) {
          if (entry.name.endsWith('.js')) {
            jsBundleSizeTotal += fs.statSync(full).size;
          }
          if (entry.name.endsWith('.html')) {
            const html = fs.readFileSync(full, 'utf8');
            // PERF-01: Viewport tag
            if (!html.includes('<meta name="viewport"') && !html.includes("<meta name='viewport'")) {
              findings.push({
                id: 'PERF-01-VIEWPORT',
                name: 'Missing Responsive Viewport Meta Tag',
                file: path.relative(targetDir, full),
                rule: 'Missing `<meta name="viewport" content="width=device-width, initial-scale=1.0">`',
                severity: 'HIGH',
                isGateBreaker: false
              });
              score -= 10;
            }
          }
        }
      }
    };
    checkDir(distDir);
  }

  // PERF-02: Total client JS budget (< 300KB)
  if (jsBundleSizeTotal > 300 * 1024) {
    findings.push({
      id: 'PERF-02-BUNDLE',
      name: 'Client JavaScript Budget Exceeded',
      rule: `Total client JS (${(jsBundleSizeTotal / 1024).toFixed(1)} KB) exceeds 300KB budget`,
      severity: 'MEDIUM',
      isGateBreaker: false
    });
    score -= 15;
  }

  // PERF-03: Canvas Lifecycle & Memory Safety
  const componentsDir = path.join(targetDir, 'src', 'components');
  if (fs.existsSync(componentsDir)) {
    const files = fs.readdirSync(componentsDir).filter(f => f.endsWith('.astro') || f.endsWith('.js'));
    for (const f of files) {
      const content = fs.readFileSync(path.join(componentsDir, f), 'utf8');
      if (content.includes('requestAnimationFrame') && !content.includes('cancelAnimationFrame')) {
        findings.push({
          id: 'PERF-03-RAF-LEAK',
          name: 'Uncanceled Animation Frame Loop',
          file: `src/components/${f}`,
          rule: 'Components using requestAnimationFrame must implement cancelAnimationFrame or observer unmount to prevent memory leaks',
          severity: 'HIGH',
          isGateBreaker: false
        });
        score -= 10;
      }
    }
  }

  if (score < 0) score = 0;
  const passed = gateBreakersActive === 0 && score >= 70;

  return {
    domainId: 'DOM-05',
    domainName: 'Web Performance & Core Web Vitals Hygiene',
    score,
    status: passed ? 'PASS' : 'FAIL',
    gateBreakersActive,
    findings,
    summary: {
      jsBundleSizeBytes: jsBundleSizeTotal,
      issuesCount: findings.length
    }
  };
}
