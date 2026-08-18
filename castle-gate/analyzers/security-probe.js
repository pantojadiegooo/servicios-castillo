/**
 * Castle Security & Quality Gate — Security Native Probe
 * 
 * Performs deterministic static pattern analysis over source code to identify:
 * - Hardcoded credentials and private keys (SEC-05.1)
 * - Dangerous DOM execution / XSS injection vectors (SEC-04.1)
 * - Insecure plaintext HTTP transport (SEC-01.2 & GB-01)
 * - HTTP Security Headers configuration (SEC-02.1 .. SEC-02.4)
 */

'use strict';

const path = require('path');
const { BaseAnalyzer } = require('./base-analyzer');

// Regex patterns for secret detection
const SECRET_PATTERNS = [
  { name: 'AWS Access Key ID', regex: /\b(AKIA[0-9A-Z]{16})\b/, severity: 'CRITICAL' },
  { name: 'Stripe Live Secret Key', regex: /\b(sk_live_[0-9a-zA-Z]{24,34})\b/, severity: 'CRITICAL' },
  { name: 'GitHub Personal Access Token', regex: /\b(ghp_[0-9a-zA-Z]{36})\b/, severity: 'CRITICAL' },
  { name: 'RSA/EC Private Key Header', regex: /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/, severity: 'CRITICAL' },
  { name: 'Generic Password in Connection String', regex: /(postgres|mysql|mongodb|redis):\/\/[^:\s]+:[^@\s]+@/, severity: 'HIGH' }
];

// Dangerous JavaScript execution patterns
const DANGEROUS_PATTERNS = [
  { name: 'Unsafe eval() invocation', regex: /\beval\s*\(/, rule: 'UNSAFE_EVAL', severity: 'HIGH' },
  { name: 'document.write() usage', regex: /document\.write(ln)?\s*\(/, rule: 'UNSAFE_DOC_WRITE', severity: 'HIGH' },
  { name: 'Direct innerHTML assignment', regex: /\.innerHTML\s*=/, rule: 'RAW_INNERHTML', severity: 'MEDIUM' },
  { name: 'javascript: URI in href/src', regex: /(href|src)\s*=\s*["']javascript:/i, rule: 'JAVASCRIPT_URI', severity: 'HIGH' },
  { name: 'target="_blank" without rel="noopener"', regex: /<a\s+[^>]*target=["']_blank["'](?![^>]*rel=["'][^"']*noopener)/i, rule: 'TARGET_BLANK_NO_OPENER', severity: 'LOW' }
];

class SecurityProbe extends BaseAnalyzer {
  constructor() {
    super('CastleSecurityProbe', '1.0.0');
  }

  analyze(targetDir, options = {}) {
    const files = this.discoverFiles(targetDir, {
      ...options,
      allowedExtensions: ['.js', '.mjs', '.cjs', '.ts', '.jsx', '.tsx', '.html', '.htm', '.json', '.env', '.toml', '.yml', '.yaml']
    });

    const findings = {
      secrets: [],
      dangerous_patterns: [],
      insecure_transport: [],
      security_headers: []
    };

    let hasEnvFileInRepo = false;
    let foundHeadersConfig = false;

    for (const filePath of files) {
      const relPath = path.relative(targetDir, filePath);
      const baseName = path.basename(filePath).toLowerCase();

      // Check for committed .env files
      if (baseName === '.env' || (baseName.startsWith('.env.') && !baseName.endsWith('.example') && !baseName.endsWith('.sample'))) {
        hasEnvFileInRepo = true;
        findings.secrets.push({
          file: relPath,
          line: 1,
          rule: 'COMMITTED_ENV_FILE',
          description: `Committed environment file found in repository: ${relPath}`,
          severity: 'HIGH'
        });
      }

      const content = this.safeReadFile(filePath);
      if (!content) continue;

      const lines = content.split('\n');

      // 1. Secret Scanning
      for (let i = 0; i < lines.length; i++) {
        const lineContent = lines[i];
        for (const pattern of SECRET_PATTERNS) {
          if (pattern.regex.test(lineContent)) {
            findings.secrets.push({
              file: relPath,
              line: i + 1,
              rule: pattern.name,
              description: `Suspected hardcoded credential (${pattern.name})`,
              severity: pattern.severity
            });
          }
        }
      }

      // 2. Dangerous Code Patterns (JS / TS / HTML)
      const ext = path.extname(filePath).toLowerCase();
      if (['.js', '.mjs', '.cjs', '.ts', '.jsx', '.tsx', '.html', '.htm'].includes(ext)) {
        for (let i = 0; i < lines.length; i++) {
          const lineContent = lines[i];
          for (const pattern of DANGEROUS_PATTERNS) {
            if (pattern.regex.test(lineContent)) {
              findings.dangerous_patterns.push({
                file: relPath,
                line: i + 1,
                rule: pattern.rule,
                description: pattern.name,
                severity: pattern.severity
              });
            }
          }
        }
      }

      // 3. Insecure Transport (Cleartext HTTP in links/endpoints)
      // Ignore localhost, schema definitions (http://www.w3.org), and doc headers
      const httpRegex = /http:\/\/([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
      for (let i = 0; i < lines.length; i++) {
        const lineContent = lines[i];
        let match;
        while ((match = httpRegex.exec(lineContent)) !== null) {
          const domain = match[1].toLowerCase();
          if (!domain.includes('w3.org') && !domain.includes('schema.org') && !domain.includes('localhost') && !domain.includes('127.0.0.1')) {
            findings.insecure_transport.push({
              file: relPath,
              line: i + 1,
              rule: 'PLAINTEXT_HTTP_LINK',
              description: `Unencrypted HTTP link detected: ${match[0]}`,
              severity: 'MEDIUM'
            });
          }
        }
      }

      // 4. Security Headers Configuration
      if (content.includes('Content-Security-Policy') || content.includes('X-Frame-Options') || content.includes('Strict-Transport-Security')) {
        foundHeadersConfig = true;
      }
    }

    // Map probe findings to CQS atomic controls
    const controls = {};
    const gate_evidence = {};

    // SEC-05.1: Secrets & Sensitive Data in Code
    if (findings.secrets.length === 0) {
      controls['SEC-05.1'] = {
        status: 'PASS',
        details: 'No hardcoded credentials, API keys, or committed .env files detected.',
        findings: []
      };
    } else {
      controls['SEC-05.1'] = {
        status: 'FAIL',
        details: `${findings.secrets.length} suspected secret(s) detected in source code.`,
        findings: findings.secrets
      };
    }

    // SEC-04.1: Input Sanitization & Unsafe DOM API
    const highRiskDom = findings.dangerous_patterns.filter(p => p.severity === 'HIGH' || p.severity === 'CRITICAL');
    if (highRiskDom.length === 0) {
      controls['SEC-04.1'] = {
        status: 'PASS',
        details: 'No dangerous eval(), document.write(), or javascript: URIs detected.',
        findings: findings.dangerous_patterns
      };
    } else {
      controls['SEC-04.1'] = {
        status: 'FAIL',
        details: `${highRiskDom.length} dangerous DOM/eval pattern(s) detected.`,
        findings: findings.dangerous_patterns
      };
    }

    // SEC-01.2: HTTPS Transport & Cleartext Prevention
    if (findings.insecure_transport.length === 0) {
      controls['SEC-01.2'] = {
        status: 'PASS',
        details: 'No unencrypted external HTTP links detected in production code.',
        findings: []
      };
    } else {
      controls['SEC-01.2'] = {
        status: 'FAIL',
        details: `${findings.insecure_transport.length} unencrypted external HTTP link(s) detected.`,
        findings: findings.insecure_transport
      };
    }

    // SEC-02.1: Security Headers (CSP / HSTS / Frame Options)
    if (foundHeadersConfig) {
      controls['SEC-02.1'] = {
        status: 'PASS',
        details: 'Security headers configuration (CSP/HSTS/X-Frame-Options) detected in project.',
        findings: []
      };
    } else {
      controls['SEC-02.1'] = {
        status: 'UNEXECUTED',
        details: 'No static Content-Security-Policy or server headers configuration detected in code (requires runtime probe or server config).',
        findings: []
      };
    }

    // Gate Breaker GB-01: Plaintext HTTP / Critical Secret Exposure
    const criticalSecrets = findings.secrets.filter(s => s.severity === 'CRITICAL');
    if (criticalSecrets.length > 0) {
      gate_evidence['GB-01'] = true;
      gate_evidence['GB-01_details'] = `Gate Breaker Triggered: ${criticalSecrets.length} critical secret(s) found in repository.`;
    } else {
      gate_evidence['GB-01'] = false;
    }

    return {
      scanned_files_count: files.length,
      controls,
      gate_evidence,
      findings
    };
  }
}

module.exports = {
  SecurityProbe,
  SECRET_PATTERNS,
  DANGEROUS_PATTERNS
};
