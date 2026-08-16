import fs from 'node:fs';
import path from 'node:path';

// Regex patterns for secret detection
const SECRET_PATTERNS = [
  {
    id: 'SEC-01',
    name: 'Private Key Headers',
    severity: 'CRITICAL',
    isGateBreaker: true,
    regex: /-----BEGIN (RSA|EC|DSA|OPENSSH|PGP) PRIVATE KEY-----/,
    description: 'Detection of plaintext private cryptographic key headers in source tree'
  },
  {
    id: 'SEC-02',
    name: 'AWS Access Key ID & Secret',
    severity: 'CRITICAL',
    isGateBreaker: true,
    regex: /\b(AKIA|ABIA|ACCA|ASIA)[0-9A-Z]{16}\b/,
    description: 'Standard AWS IAM 20-character Access Key ID identifier'
  },
  {
    id: 'SEC-03',
    name: 'GitHub / GitLab Personal Access Token',
    severity: 'CRITICAL',
    isGateBreaker: true,
    regex: /\b(ghp_[0-9a-zA-Z]{36}|github_pat_[0-9a-zA-Z_]{82}|glpat-[0-9a-zA-Z\-_]{20,})\b/,
    description: 'High-privilege VCS personal access token string'
  },
  {
    id: 'SEC-04',
    name: 'Stripe Live Secret Key',
    severity: 'CRITICAL',
    isGateBreaker: true,
    regex: /\bsk_live_[0-9a-zA-Z]{24,}\b/,
    description: 'Stripe live production payment processing secret key'
  },
  {
    id: 'SEC-05',
    name: 'Slack Webhook / Bot Token',
    severity: 'CRITICAL',
    isGateBreaker: true,
    regex: /https:\/\/hooks\.slack\.com\/services\/T[0-9A-Z]{8,}\/B[0-9A-Z]{8,}\/[0-9a-zA-Z]{24,}/,
    description: 'Hardcoded Slack incoming webhook URL with embedded authentication token'
  },
  {
    id: 'SEC-06',
    name: 'Database URI with Embedded Credentials',
    severity: 'CRITICAL',
    isGateBreaker: true,
    regex: /(postgres|postgresql|mysql|mongodb|redis):\/\/[a-zA-Z0-9_-]+:[^@\s]{4,}@[a-zA-Z0-9.-]+:[0-9]+/,
    description: 'Database connection string containing plaintext user and password'
  },
  {
    id: 'SEC-07',
    name: 'Hardcoded JWT Signature Secret',
    severity: 'HIGH',
    isGateBreaker: false,
    regex: /(jwt_secret|jwtSecret|JWT_SECRET)\s*=\s*['"][a-zA-Z0-9!@#$%^&*()_+=-]{8,}['"]/,
    description: 'Plaintext JWT signing secret assigned in source code'
  },
  {
    id: 'SEC-08',
    name: 'Hardcoded Generic Bearer Token',
    severity: 'MEDIUM',
    isGateBreaker: false,
    regex: /['"]Bearer\s+[a-zA-Z0-9._\-]{32,}['"]/,
    description: 'Hardcoded Bearer authorization token literal in code'
  }
];

const IGNORE_DIRS = new Set([
  'node_modules',
  '.git',
  '.astro',
  'dist',
  '.castle',
  'brand_extracted'
]);

const IGNORE_FILES = new Set([
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock'
]);

function scanFilesRecursively(dir, fileList = [], baseDir = dir) {
  if (!fs.existsSync(dir)) return fileList;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(baseDir, fullPath).replace(/\\/g, '/');

    if (entry.isDirectory()) {
      if (!IGNORE_DIRS.has(entry.name) && !relPath.startsWith('test/fixtures/fail-project')) {
        scanFilesRecursively(fullPath, fileList, baseDir);
      }
    } else if (entry.isFile()) {
      if (!IGNORE_FILES.has(entry.name)) {
        // Skip binary / image files
        const ext = path.extname(entry.name).toLowerCase();
        const nonTextExts = ['.png', '.jpg', '.jpeg', '.gif', '.ico', '.pdf', '.webp', '.woff', '.woff2', '.ttf', '.eot', '.zip'];
        if (!nonTextExts.includes(ext)) {
          fileList.push({ fullPath, relPath });
        }
      }
    }
  }
  return fileList;
}

export function evaluateSecrets(targetDir) {
  const files = scanFilesRecursively(targetDir, [], targetDir);
  const findings = [];

  // Check committed .env files
  const envFiles = ['.env', '.env.local', '.env.production'];
  for (const envFile of envFiles) {
    const p = path.join(targetDir, envFile);
    if (fs.existsSync(p)) {
      findings.push({
        id: 'SEC-09',
        file: envFile,
        line: 1,
        rule: 'Committed environment file in repository root',
        severity: 'CRITICAL',
        isGateBreaker: true
      });
    }
  }

  // Scan file contents
  for (const { fullPath, relPath } of files) {
    // Avoid self-scanning the detector rules file itself if evaluating own codebase
    if (relPath.includes('src/castle-gate/controls/secrets.js')) continue;

    let content = '';
    try {
      content = fs.readFileSync(fullPath, 'utf8');
    } catch {
      continue;
    }

    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      // Check each pattern
      for (const pattern of SECRET_PATTERNS) {
        if (pattern.regex.test(line)) {
          // Check for false-positive dummy examples in docs or comments
          const isDocExample = line.includes('ej.') || line.includes('example') || line.includes('dummy') || line.includes('CG-YYYY');
          if (isDocExample && !pattern.isGateBreaker) continue;

          findings.push({
            id: pattern.id,
            name: pattern.name,
            file: relPath,
            line: idx + 1,
            snippet: line.trim().slice(0, 60) + '...',
            severity: pattern.severity,
            isGateBreaker: pattern.isGateBreaker,
            description: pattern.description
          });
        }
      }
    });
  }

  const gateBreakersActive = findings.filter(f => f.isGateBreaker).length;
  const criticalCount = findings.filter(f => f.severity === 'CRITICAL').length;
  const highCount = findings.filter(f => f.severity === 'HIGH').length;

  let domainScore = 100;
  domainScore -= criticalCount * 40;
  domainScore -= highCount * 15;
  if (domainScore < 0) domainScore = 0;

  const passed = gateBreakersActive === 0 && domainScore >= 80;

  return {
    domainId: 'DOM-01',
    domainName: 'Secret & Credential Detection',
    score: domainScore,
    status: passed ? 'PASS' : 'FAIL',
    gateBreakersActive,
    findings,
    summary: {
      filesScanned: files.length,
      secretsDetected: findings.length,
      gateBreakers: gateBreakersActive
    }
  };
}
