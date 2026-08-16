import fs from 'node:fs';
import path from 'node:path';

function findHtmlFiles(dir, list = [], baseDir = dir) {
  if (!fs.existsSync(dir)) return list;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
    if (entry.isDirectory()) {
      if (!['node_modules', '.git', '.astro', '.castle'].includes(entry.name)) {
        findHtmlFiles(fullPath, list, baseDir);
      }
    } else if (entry.isFile() && (entry.name.endsWith('.html') || entry.name.endsWith('.astro'))) {
      list.push({ fullPath, relPath });
    }
  }
  return list;
}

export function evaluateSeoGovernance(targetDir) {
  const findings = [];
  let score = 100;
  let gateBreakersActive = 0;

  const distDir = path.join(targetDir, 'dist');
  const searchDir = fs.existsSync(distDir) ? distDir : targetDir;
  const pages = findHtmlFiles(searchDir, [], targetDir);

  for (const { fullPath, relPath } of pages) {
    if (relPath.includes('404')) continue;

    let content = '';
    try {
      content = fs.readFileSync(fullPath, 'utf8');
    } catch {
      continue;
    }

    // SEO-01: Canonical tag
    if (relPath.endsWith('.html')) {
      if (!content.includes('rel="canonical"') && !content.includes("rel='canonical'")) {
        findings.push({
          id: 'SEO-01-CANONICAL',
          name: 'Missing Canonical Tag',
          file: relPath,
          rule: 'Every indexable page must declare a canonical URL',
          severity: 'HIGH',
          isGateBreaker: false
        });
        score -= 8;
      }

      // SEO-02: Open Graph tags
      if (!content.includes('og:title') || !content.includes('og:description')) {
        findings.push({
          id: 'SEO-02-OG',
          name: 'Missing OpenGraph Tags',
          file: relPath,
          rule: 'Page is missing required OpenGraph metadata tags (og:title, og:description)',
          severity: 'MEDIUM',
          isGateBreaker: false
        });
        score -= 6;
      }
    }
  }

  // SEO-03: Sitemap Check
  const hasSitemap = fs.existsSync(path.join(targetDir, 'public', 'sitemap.xml')) ||
                     fs.existsSync(path.join(targetDir, 'dist', 'sitemap.xml')) ||
                     fs.existsSync(path.join(targetDir, 'sitemap.xml'));
  if (!hasSitemap) {
    findings.push({
      id: 'SEO-03-SITEMAP',
      name: 'Missing XML Sitemap',
      rule: 'sitemap.xml is recommended for search index discovery',
      severity: 'LOW',
      isGateBreaker: false
    });
    score -= 5;
  }

  // SEO-04: Robots Check
  const hasRobots = fs.existsSync(path.join(targetDir, 'public', 'robots.txt')) ||
                    fs.existsSync(path.join(targetDir, 'dist', 'robots.txt')) ||
                    fs.existsSync(path.join(targetDir, 'robots.txt'));
  if (!hasRobots) {
    findings.push({
      id: 'SEO-04-ROBOTS',
      name: 'Missing robots.txt',
      rule: 'robots.txt is recommended to control crawler access',
      severity: 'LOW',
      isGateBreaker: false
    });
    score -= 5;
  }

  if (score < 0) score = 0;
  const passed = gateBreakersActive === 0 && score >= 70;

  return {
    domainId: 'DOM-07',
    domainName: 'SEO, Canonical & Governance Metadata',
    score,
    status: passed ? 'PASS' : 'FAIL',
    gateBreakersActive,
    findings,
    summary: {
      pagesAudited: pages.length,
      hasSitemap,
      hasRobots,
      issuesCount: findings.length
    }
  };
}
