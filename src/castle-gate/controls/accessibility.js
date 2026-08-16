import fs from 'node:fs';
import path from 'node:path';

function findHtmlFiles(dir, list = [], baseDir = dir) {
  if (!fs.existsSync(dir)) return list;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
    if (entry.isDirectory()) {
      if (!['node_modules', '.git'].includes(entry.name)) {
        findHtmlFiles(fullPath, list, baseDir);
      }
    } else if (entry.isFile() && (entry.name.endsWith('.html') || entry.name.endsWith('.astro'))) {
      list.push({ fullPath, relPath });
    }
  }
  return list;
}

export function evaluateAccessibility(targetDir) {
  const findings = [];
  let score = 100;
  let gateBreakersActive = 0;

  // Search dist directory first, or fallback to src/pages
  const distDir = path.join(targetDir, 'dist');
  const searchDir = fs.existsSync(distDir) ? distDir : targetDir;
  const pages = findHtmlFiles(searchDir, [], targetDir);

  for (const { fullPath, relPath } of pages) {
    if (relPath.includes('node_modules') || relPath.includes('.castle')) continue;

    let content = '';
    try {
      content = fs.readFileSync(fullPath, 'utf8');
    } catch {
      continue;
    }

    // A11Y-01: Main landmark
    if (relPath.endsWith('.html') && !content.includes('<main') && !content.includes('role="main"')) {
      findings.push({
        id: 'A11Y-01-MAIN',
        name: 'Missing Main Landmark',
        file: relPath,
        rule: 'Page is missing a <main> landmark element',
        severity: 'HIGH',
        isGateBreaker: false
      });
      score -= 10;
    }

    // A11Y-02: Single H1 check on rendered HTML
    if (relPath.endsWith('.html')) {
      const h1Matches = content.match(/<h1[\s>]/gi);
      const h1Count = h1Matches ? h1Matches.length : 0;
      if (h1Count === 0) {
        findings.push({
          id: 'A11Y-02-NO-H1',
          name: 'Missing H1 Heading',
          file: relPath,
          rule: 'Page must have exactly one top-level <h1> heading',
          severity: 'HIGH',
          isGateBreaker: false
        });
        score -= 10;
      } else if (h1Count > 1) {
        findings.push({
          id: 'A11Y-02-MULTI-H1',
          name: 'Multiple H1 Headings',
          file: relPath,
          rule: `Found ${h1Count} <h1> headings; standard recommends exactly one <h1> per page`,
          severity: 'MEDIUM',
          isGateBreaker: false
        });
        score -= 5;
      }
    }

    // A11Y-03: Img alt attribute
    const imgTags = content.match(/<img[^>]+>/gi) || [];
    for (const img of imgTags) {
      if (!img.includes('alt=') && !img.includes('aria-hidden="true"')) {
        findings.push({
          id: 'A11Y-03-IMG-ALT',
          name: 'Missing Image Alt Attribute',
          file: relPath,
          rule: `Image tag missing alt attribute: ${img.slice(0, 40)}...`,
          severity: 'MEDIUM',
          isGateBreaker: false
        });
        score -= 5;
        break; // Count once per page to avoid score collapse
      }
    }
  }

  // A11Y-06: Reduced Motion support in CSS / components
  const cssDir = path.join(targetDir, 'src', 'styles');
  if (fs.existsSync(cssDir)) {
    const cssFiles = fs.readdirSync(cssDir).filter(f => f.endsWith('.css'));
    let hasReducedMotion = false;
    for (const f of cssFiles) {
      const c = fs.readFileSync(path.join(cssDir, f), 'utf8');
      if (c.includes('prefers-reduced-motion')) {
        hasReducedMotion = true;
        break;
      }
    }
    if (!hasReducedMotion) {
      // Check in tokens or index
      const idxCss = path.join(targetDir, 'src', 'styles', 'index.css');
      if (fs.existsSync(idxCss)) {
        const c = fs.readFileSync(idxCss, 'utf8');
        hasReducedMotion = c.includes('prefers-reduced-motion');
      }
    }
    if (!hasReducedMotion) {
      findings.push({
        id: 'A11Y-06-MOTION',
        name: 'Prefers-Reduced-Motion Handling',
        rule: 'CSS styles should respect `prefers-reduced-motion: reduce`',
        severity: 'LOW',
        isGateBreaker: false
      });
      score -= 5;
    }
  }

  if (score < 0) score = 0;
  const passed = gateBreakersActive === 0 && score >= 70;

  return {
    domainId: 'DOM-04',
    domainName: 'Accessibility & Semantic HTML (WCAG AA)',
    score,
    status: passed ? 'PASS' : 'FAIL',
    gateBreakersActive,
    findings,
    summary: {
      pagesEvaluated: pages.length,
      issuesCount: findings.length
    }
  };
}
