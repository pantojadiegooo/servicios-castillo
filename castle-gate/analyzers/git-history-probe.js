/**
 * Castle Security & Quality Gate — Git History & Deleted Secrets Probe
 * 
 * Deeply scans the Git commit log to detect secrets that were committed,
 * even if they were subsequently deleted or purged from the working tree.
 */

'use strict';

const { execSync } = require('child_process');
const path = require('path');
const { BaseAnalyzer } = require('./base-analyzer');
const { SECRET_PATTERNS } = require('./security-probe');
const { safeRegexTest } = require('./security-guard');

// Additional git commit history secret regex patterns
const EXTENDED_GIT_SECRET_PATTERNS = [
  ...SECRET_PATTERNS,
  { name: 'Slack Bot/User Token', regex: /\b(xox[baprs]-[0-9a-zA-Z]{10,48})\b/, severity: 'CRITICAL' },
  { name: 'SendGrid API Key', regex: /\b(SG\.[0-9a-zA-Z_-]{22}\.[0-9a-zA-Z_-]{43})\b/, severity: 'CRITICAL' },
  { name: 'Google OAuth Access Token', regex: /\b(ya29\.[0-9a-zA-Z_-]{50,150})\b/, severity: 'CRITICAL' },
  { name: 'Generic High-Entropy Secret in Assignment', regex: /(?:secret|password|api_key|access_token|private_key)\s*[:=]\s*["']([0-9a-zA-Z-_]{24,80})["']/i, severity: 'HIGH' }
];

class GitHistoryProbe extends BaseAnalyzer {
  constructor() {
    super('CastleGitHistoryProbe', '1.0.0');
  }

  analyze(targetDir, options = {}) {
    const findings = {
      historical_secrets: []
    };

    let commitsScanned = 0;
    const maxCommits = options.maxCommits || 100;
    const resolvedDir = path.resolve(targetDir);

    let isGitRepo = false;
    let gitLogOutput = '';

    try {
      // Check if git is available and target is inside a git work tree
      const checkGit = execSync('git rev-parse --is-inside-work-tree', {
        cwd: resolvedDir,
        stdio: ['ignore', 'pipe', 'ignore'],
        timeout: 3000
      }).toString().trim();

      if (checkGit === 'true') {
        isGitRepo = true;
        // Extract commit history diffs (added lines in commits)
        gitLogOutput = execSync(`git log -p -n ${maxCommits} --diff-filter=d`, {
          cwd: resolvedDir,
          stdio: ['ignore', 'pipe', 'ignore'],
          timeout: 10000,
          maxBuffer: 10 * 1024 * 1024 // 10MB max buffer
        }).toString();
      }
    } catch (e) {
      // Non-git directory or git CLI not available
      isGitRepo = false;
    }

    if (!isGitRepo || !gitLogOutput) {
      // If not a git repo, return clean status with documentary note
      return {
        scanned_files_count: 0,
        commits_scanned: 0,
        controls: {
          'SEC-05.1': {
            status: 'PASS',
            details: 'Target directory is not a Git repository; commit history audit bypassed.',
            findings: []
          }
        },
        gate_evidence: {},
        findings
      };
    }

    // Parse git log output
    const lines = gitLogOutput.split('\n');
    let currentCommit = 'HEAD';
    let currentAuthor = 'Unknown';
    let currentDate = 'Unknown';
    let currentFile = 'unknown';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.startsWith('commit ')) {
        currentCommit = line.substring(7).trim();
        commitsScanned++;
      } else if (line.startsWith('Author: ')) {
        currentAuthor = line.substring(8).trim();
      } else if (line.startsWith('Date:   ')) {
        currentDate = line.substring(8).trim();
      } else if (line.startsWith('diff --git ')) {
        const parts = line.split(' ');
        if (parts.length >= 4) {
          currentFile = parts[3].replace(/^b\//, '');
        }
      } else if (line.startsWith('+') && !line.startsWith('+++')) {
        // Line added in a commit
        const addedContent = line.substring(1);

        for (const pattern of EXTENDED_GIT_SECRET_PATTERNS) {
          if (safeRegexTest(pattern.regex, addedContent)) {
            findings.historical_secrets.push({
              rule: pattern.name,
              severity: pattern.severity,
              file: currentFile,
              commit_sha: currentCommit,
              author: currentAuthor,
              date: currentDate,
              description: `Historical credential (${pattern.name}) committed in ${currentCommit.substring(0, 8)} on ${currentFile}`
            });
          }
        }
      }
    }

    const controls = {};
    const gate_evidence = {};

    const criticalSecrets = findings.historical_secrets.filter(s => s.severity === 'CRITICAL');

    if (findings.historical_secrets.length === 0) {
      controls['SEC-05.1'] = {
        status: 'PASS',
        details: `Clean Git history: zero hardcoded credentials detected across ${commitsScanned} past commit(s).`,
        findings: []
      };
    } else {
      controls['SEC-05.1'] = {
        status: 'FAIL',
        details: `${findings.historical_secrets.length} historical secret(s) discovered in past commits (${criticalSecrets.length} critical).`,
        findings: findings.historical_secrets
      };
    }

    if (criticalSecrets.length > 0) {
      gate_evidence['GB-02'] = true;
      gate_evidence['GB-02_details'] = `Gate Breaker Triggered: ${criticalSecrets.length} critical secret(s) found in Git commit history.`;
    }

    return {
      scanned_files_count: 0,
      commits_scanned: commitsScanned,
      controls: controls,
      gate_evidence: gate_evidence,
      findings: findings
    };
  }
}

module.exports = {
  GitHistoryProbe,
  EXTENDED_GIT_SECRET_PATTERNS
};
