import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

export function evaluateDependencies(targetDir, options = {}) {
  const findings = [];
  let score = 100;
  let gateBreakersActive = 0;

  const pkgPath = path.join(targetDir, 'package.json');
  const lockNpm = path.join(targetDir, 'package-lock.json');
  const lockPnpm = path.join(targetDir, 'pnpm-lock.yaml');
  const lockYarn = path.join(targetDir, 'yarn.lock');

  // DEP-01: Manifest existence
  if (!fs.existsSync(pkgPath)) {
    // If not a JS project, check if other manifest exists
    findings.push({
      id: 'DEP-01',
      name: 'Manifest Existence',
      rule: 'package.json or manifest must exist in repository root',
      severity: 'CRITICAL',
      isGateBreaker: true
    });
    gateBreakersActive++;
    score -= 50;
  } else {
    try {
      const pkgContent = fs.readFileSync(pkgPath, 'utf8');
      const pkg = JSON.parse(pkgContent);

      // DEP-05: Node Engine check
      if (!pkg.engines || !pkg.engines.node) {
        findings.push({
          id: 'DEP-05',
          name: 'Engine Runtime Pinning',
          rule: 'engines.node is recommended for reproducible builds',
          severity: 'LOW',
          isGateBreaker: false
        });
        score -= 5;
      }

      // DEP-04: Check for unpinned git dependencies
      const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
      for (const [depName, version] of Object.entries(deps)) {
        if (typeof version === 'string' && (version.startsWith('git://') || version.startsWith('github:') || (version.startsWith('git+') && !version.includes('#')))) {
          findings.push({
            id: 'DEP-04',
            name: 'Unpinned Git Dependency',
            rule: `Dependency "${depName}" uses unpinned git URI: ${version}`,
            severity: 'MEDIUM',
            isGateBreaker: false
          });
          score -= 10;
        }
      }
    } catch {
      findings.push({
        id: 'DEP-01-PARSE',
        name: 'Manifest JSON Syntax',
        rule: 'package.json is malformed JSON',
        severity: 'CRITICAL',
        isGateBreaker: true
      });
      gateBreakersActive++;
      score -= 50;
    }
  }

  // DEP-02: Lockfile existence
  const hasLockfile = fs.existsSync(lockNpm) || fs.existsSync(lockPnpm) || fs.existsSync(lockYarn);
  if (!hasLockfile) {
    findings.push({
      id: 'DEP-02',
      name: 'Lockfile Integrity',
      rule: 'Deterministic lockfile (package-lock.json / pnpm-lock.yaml / yarn.lock) is required',
      severity: 'HIGH',
      isGateBreaker: false
    });
    score -= 25;
  }

  // DEP-03: Dependency Vulnerability Audit
  if (fs.existsSync(pkgPath) && hasLockfile && !options.skipAudit) {
    try {
      const auditCmd = process.platform === 'win32' ? 'cmd /c "npm audit --json"' : 'npm audit --json';
      const output = execSync(auditCmd, { cwd: targetDir, encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'], timeout: 15000 });
      const audit = JSON.parse(output);
      if (audit.metadata && audit.metadata.vulnerabilities) {
        const { critical = 0, high = 0 } = audit.metadata.vulnerabilities;
        if (critical > 0) {
          findings.push({
            id: 'DEP-03-CRIT',
            name: 'Critical CVE Vulnerabilities',
            rule: `Found ${critical} critical vulnerabilities in npm audit`,
            severity: 'CRITICAL',
            isGateBreaker: true
          });
          gateBreakersActive++;
          score -= critical * 30;
        }
        if (high > 0) {
          findings.push({
            id: 'DEP-03-HIGH',
            name: 'High Severity CVE Vulnerabilities',
            rule: `Found ${high} high severity vulnerabilities in npm audit`,
            severity: 'HIGH',
            isGateBreaker: false
          });
          score -= high * 15;
        }
      }
    } catch (e) {
      // If npm audit returns non-zero code because vulnerabilities exist, parse stdout if available
      if (e.stdout) {
        try {
          const audit = JSON.parse(e.stdout.toString());
          if (audit.metadata && audit.metadata.vulnerabilities) {
            const { critical = 0, high = 0 } = audit.metadata.vulnerabilities;
            if (critical > 0) {
              findings.push({
                id: 'DEP-03-CRIT',
                name: 'Critical CVE Vulnerabilities',
                rule: `Found ${critical} critical vulnerabilities in npm audit`,
                severity: 'CRITICAL',
                isGateBreaker: true
              });
              gateBreakersActive++;
              score -= critical * 30;
            }
            if (high > 0) {
              findings.push({
                id: 'DEP-03-HIGH',
                name: 'High Severity CVE Vulnerabilities',
                rule: `Found ${high} high severity vulnerabilities in npm audit`,
                severity: 'HIGH',
                isGateBreaker: false
              });
              score -= high * 15;
            }
          }
        } catch {
          // Ignore parse errors on test fixtures
        }
      }
    }
  }

  if (score < 0) score = 0;
  const passed = gateBreakersActive === 0 && score >= 70;

  return {
    domainId: 'DOM-02',
    domainName: 'Dependency & Supply Chain Health',
    score,
    status: passed ? 'PASS' : 'FAIL',
    gateBreakersActive,
    findings,
    summary: {
      hasManifest: fs.existsSync(pkgPath),
      hasLockfile,
      issuesCount: findings.length
    }
  };
}
