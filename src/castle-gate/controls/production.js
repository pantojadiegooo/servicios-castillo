import fs from 'node:fs';
import path from 'node:path';

export function evaluateProduction(targetDir) {
  const findings = [];
  let score = 100;
  let gateBreakersActive = 0;

  // PROD-03: Security Headers check in vercel.json or headers config
  const vercelPath = path.join(targetDir, 'vercel.json');
  if (fs.existsSync(vercelPath)) {
    try {
      const vercelConfig = JSON.parse(fs.readFileSync(vercelPath, 'utf8'));
      const headers = (vercelConfig.headers && vercelConfig.headers[0] && vercelConfig.headers[0].headers) || [];
      const headerNames = headers.map(h => h.key.toLowerCase());

      const requiredHeaders = ['content-security-policy', 'x-frame-options', 'x-content-type-options', 'referrer-policy'];
      for (const req of requiredHeaders) {
        if (!headerNames.includes(req)) {
          findings.push({
            id: 'PROD-03-HEADER',
            name: `Missing Security Header (${req})`,
            rule: `Recommended security header ${req} is missing in vercel.json`,
            severity: 'HIGH',
            isGateBreaker: false
          });
          score -= 10;
        }
      }
    } catch {
      findings.push({
        id: 'PROD-03-PARSE',
        name: 'Malformed vercel.json',
        rule: 'vercel.json syntax error',
        severity: 'MEDIUM',
        isGateBreaker: false
      });
      score -= 15;
    }
  }

  // PROD-04: 404 Page Check
  const has404 = fs.existsSync(path.join(targetDir, 'src', 'pages', '404.astro')) ||
                 fs.existsSync(path.join(targetDir, 'dist', '404.html')) ||
                 fs.existsSync(path.join(targetDir, '404.html'));
  if (!has404) {
    findings.push({
      id: 'PROD-04-404',
      name: 'Missing Custom 404 Handler',
      rule: 'Custom 404 error page should be configured for resilience',
      severity: 'MEDIUM',
      isGateBreaker: false
    });
    score -= 10;
  }

  // PROD-05: Localhost / dev URL leaks in HTML or Astro files
  const pagesDir = path.join(targetDir, 'src', 'pages');
  if (fs.existsSync(pagesDir)) {
    const files = fs.readdirSync(pagesDir, { recursive: true }).filter(f => typeof f === 'string' && (f.endsWith('.astro') || f.endsWith('.html')));
    for (const f of files) {
      const full = path.join(pagesDir, f);
      const content = fs.readFileSync(full, 'utf8');
      if (content.includes('http://localhost') || content.includes('http://127.0.0.1')) {
        findings.push({
          id: 'PROD-05-LOCALHOST',
          name: 'Hardcoded Localhost URL',
          file: `src/pages/${f}`,
          rule: 'Avoid hardcoding localhost/127.0.0.1 URLs in production templates',
          severity: 'MEDIUM',
          isGateBreaker: false
        });
        score -= 10;
        break;
      }
    }
  }

  if (score < 0) score = 0;
  const passed = gateBreakersActive === 0 && score >= 70;

  return {
    domainId: 'DOM-06',
    domainName: 'Build & Production Configuration Hygiene',
    score,
    status: passed ? 'PASS' : 'FAIL',
    gateBreakersActive,
    findings,
    summary: {
      hasVercelHeaders: fs.existsSync(vercelPath),
      has404Handler: has404,
      issuesCount: findings.length
    }
  };
}
