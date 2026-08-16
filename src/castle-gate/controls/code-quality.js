import fs from 'node:fs';
import path from 'node:path';

function findFiles(dir, exts, list = [], baseDir = dir) {
  if (!fs.existsSync(dir)) return list;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
    if (entry.isDirectory()) {
      if (!['node_modules', '.git', '.astro', 'dist', '.castle'].includes(entry.name)) {
        findFiles(fullPath, exts, list, baseDir);
      }
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (exts.includes(ext)) {
        list.push({ fullPath, relPath, size: fs.statSync(fullPath).size });
      }
    }
  }
  return list;
}

export function evaluateCodeQuality(targetDir) {
  const findings = [];
  let score = 100;
  let gateBreakersActive = 0;

  const srcFiles = findFiles(targetDir, ['.js', '.ts', '.astro', '.jsx', '.tsx', '.mjs', '.cjs'], [], targetDir);

  for (const { fullPath, relPath } of srcFiles) {
    if (relPath.includes('src/castle-gate/')) continue;

    let content = '';
    try {
      content = fs.readFileSync(fullPath, 'utf8');
    } catch {
      continue;
    }

    // CODE-03: debugger statements in source
    if (content.includes('debugger;')) {
      findings.push({
        id: 'CODE-03-DEBUG',
        name: 'Debugger Statement in Source',
        file: relPath,
        rule: 'Avoid committing active `debugger;` breakpoints in release code',
        severity: 'MEDIUM',
        isGateBreaker: false
      });
      score -= 10;
    }

    // CODE-02: syntax / parse check for plain JS files
    if (relPath.endsWith('.js') || relPath.endsWith('.mjs') || relPath.endsWith('.cjs')) {
      try {
        new Function(content);
      } catch (e) {
        // Only trigger if not ES module import syntax which Function() cannot parse
        if (!content.includes('import ') && !content.includes('export ')) {
          findings.push({
            id: 'CODE-02-SYNTAX',
            name: 'JavaScript Syntax Error',
            file: relPath,
            rule: `Syntax error: ${e.message}`,
            severity: 'CRITICAL',
            isGateBreaker: true
          });
          gateBreakersActive++;
          score -= 35;
        }
      }
    }
  }

  // CODE-04: Asset size check
  const assetFiles = findFiles(targetDir, ['.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif', '.zip', '.pdf'], [], targetDir);
  for (const { relPath, size } of assetFiles) {
    // 5MB threshold
    if (size > 5 * 1024 * 1024) {
      findings.push({
        id: 'CODE-04-SIZE',
        name: 'Uncompressed Large Asset',
        file: relPath,
        rule: `Asset exceeds 5MB (${(size / 1024 / 1024).toFixed(2)} MB)`,
        severity: 'LOW',
        isGateBreaker: false
      });
      score -= 5;
    }
  }

  if (score < 0) score = 0;
  const passed = gateBreakersActive === 0 && score >= 70;

  return {
    domainId: 'DOM-03',
    domainName: 'Static Code Quality & Architecture',
    score,
    status: passed ? 'PASS' : 'FAIL',
    gateBreakersActive,
    findings,
    summary: {
      sourceFilesScanned: srcFiles.length,
      assetsScanned: assetFiles.length,
      issuesCount: findings.length
    }
  };
}
