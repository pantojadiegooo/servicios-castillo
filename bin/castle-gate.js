#!/usr/bin/env node

import path from 'node:path';
import { runCastleGate, POLICY_LEVELS } from '../src/castle-gate/engine.js';
import { verifyCertificate } from '../src/castle-gate/certificate.js';

const VERSION = '1.1.0';

function printHelp() {
  console.log(`
Castle Gate Runner — CQS v1.1 Quality & Security Engine (v${VERSION})
Grupo Castillo • Deterministic Local Static Evaluation

USAGE:
  castle-gate-runner scan [options]
  castle-gate-runner verify-cert --cert <path>
  castle-gate-runner --version
  castle-gate-runner --help

COMMANDS:
  scan                  Evaluate target directory against CQS v1.1 policy
  verify-cert           Cryptographically verify a release certificate digest

OPTIONS:
  --dir, -d <path>      Target repository directory (default: current directory ".")
  --level, -l <level>   Policy level: C1, C2, C3, C4, C5, C6 (default: C1)
  --out, -o <dir>       Output directory for evidence artifacts (default: "./.castle")
  --json                Output result in JSON format only
  --skip-audit          Skip live npm audit execution during offline evaluation
  --help, -h            Show this help message
  --version, -v         Show version

EXIT CODES:
  0 = PASS              All policy thresholds and gate breaker conditions met
  1 = FAIL              Gate breaker active or composite score below threshold
  2 = CONFIG_ERROR      Invalid command line options or missing arguments
  3 = RUNTIME_ERROR     Execution failed due to unhandled I/O or parser error
`);
}

function parseArgs(args) {
  const options = {
    command: 'scan',
    dir: '.',
    level: 'C1',
    out: null,
    json: false,
    skipAudit: false,
    cert: null
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') {
      options.command = 'help';
    } else if (arg === '--version' || arg === '-v') {
      options.command = 'version';
    } else if (arg === 'scan') {
      options.command = 'scan';
    } else if (arg === 'verify-cert') {
      options.command = 'verify-cert';
    } else if (arg === '--dir' || arg === '-d') {
      options.dir = args[++i];
    } else if (arg === '--level' || arg === '-l') {
      options.level = args[++i];
    } else if (arg === '--out' || arg === '-o') {
      options.out = args[++i];
    } else if (arg === '--cert') {
      options.cert = args[++i];
    } else if (arg === '--json') {
      options.json = true;
    } else if (arg === '--skip-audit') {
      options.skipAudit = true;
    }
  }

  return options;
}

async function main() {
  const args = process.argv.slice(2);
  const options = parseArgs(args);

  if (options.command === 'help') {
    printHelp();
    process.exit(0);
  }

  if (options.command === 'version') {
    console.log(`castle-gate-runner v${VERSION} (CQS v1.1)`);
    process.exit(0);
  }

  if (options.command === 'verify-cert') {
    if (!options.cert) {
      console.error('[CONFIG ERROR] Missing required argument: --cert <path_to_release_certificate.json>');
      process.exit(2);
    }
    const result = verifyCertificate(path.resolve(options.cert));
    if (result.valid) {
      console.log(`\n[CERTIFICATE VALID]: SHA-256 Digest matches EvidencePackage.`);
      console.log(`  └─ Validation ID: ${result.validationId}`);
      console.log(`  └─ Policy Level : ${result.policyLevel}`);
      console.log(`  └─ Target SHA   : ${result.releaseSha}`);
      console.log(`  └─ SHA-256      : ${result.actualDigest}\n`);
      process.exit(0);
    } else {
      console.error(`\n[CERTIFICATE INVALID / CORRUPTED]: ${result.error || 'Digest mismatch'}`);
      if (result.expectedDigest) {
        console.error(`  └─ Expected: ${result.expectedDigest}`);
        console.error(`  └─ Actual  : ${result.actualDigest}`);
      }
      process.exit(1);
    }
  }

  if (options.command === 'scan') {
    try {
      const level = (options.level || 'C1').toUpperCase();
      if (!POLICY_LEVELS[level]) {
        console.error(`[CONFIG ERROR] Invalid policy level "${options.level}". Available levels: C1, C2, C3, C4, C5, C6.`);
        process.exit(2);
      }

      if (!options.json) {
        console.log(`\n===============================================================`);
        console.log(` CASTLE QUALITY & SECURITY GATE (CQS v1.1) — RUNNER v${VERSION}`);
        console.log(` Grupo Castillo • Deterministic Local Evaluation`);
        console.log(`===============================================================`);
        console.log(`  Target Directory : ${path.resolve(options.dir)}`);
        console.log(`  Policy Level     : ${level} (${POLICY_LEVELS[level].name} — Threshold: ${POLICY_LEVELS[level].threshold}%)`);
        console.log(`  Evaluating 7 CQS domains in memory...\n`);
      }

      const res = await runCastleGate(options.dir, {
        level,
        out: options.out,
        skipAudit: options.skipAudit
      });

      if (options.json) {
        console.log(JSON.stringify(res, null, 2));
        process.exit(res.exitCode);
      }

      // Terminal Summary Output
      for (const d of res.evaluation.domains) {
        const icon = d.status === 'PASS' ? '✓' : '✗';
        const colorPrefix = d.status === 'PASS' ? '\x1b[32m' : '\x1b[31m';
        const reset = '\x1b[0m';
        console.log(`  ${colorPrefix}${icon} [${d.domainId}] ${d.domainName.padEnd(48)} ${d.score.toFixed(1).padStart(5)} / 100 [${d.status}]${reset}`);
        if (d.findings.length > 0) {
          for (const f of d.findings.slice(0, 3)) {
            console.log(`      └─ [${f.severity}] ${f.file ? `${f.file}: ` : ''}${f.name || f.rule}`);
          }
          if (d.findings.length > 3) {
            console.log(`      └─ ... and ${d.findings.length - 3} more findings in report.`);
          }
        }
      }

      console.log(`\n---------------------------------------------------------------`);
      console.log(`  Composite Score       : ${res.evaluation.score.toFixed(2)} / 100.00 (Required: ${res.evaluation.policyThreshold}%)`);
      console.log(`  Gate Breakers Active  : ${res.evaluation.gateBreakersActive}`);
      console.log(`  Secrets Detected      : ${res.evaluation.secretsDetected}`);
      console.log(`  Validation ID Issued  : ${res.certificate.validation_id}`);
      console.log(`  Release Commit SHA    : ${res.certificate.target_release_sha}`);
      console.log(`  Certificate Digest    : ${res.certificate.signature_digest_sha256.slice(0, 16)}...`);
      console.log(`  Compliance Report     : ${res.artifacts.htmlPath}`);
      console.log(`---------------------------------------------------------------`);

      if (res.exitCode === 0) {
        console.log(`\n\x1b[32m[GATE DECISION]: PASSED (Exit Code 0) — Release Authorized for ${level}.\x1b[0m\n`);
      } else {
        console.log(`\n\x1b[31m[GATE DECISION]: BLOCKED (Exit Code 1) — Release Vetoed by ${level} Policy.\x1b[0m\n`);
      }

      process.exit(res.exitCode);
    } catch (e) {
      console.error(`\n[EXECUTION ERROR]: ${e.message}`);
      process.exit(3);
    }
  }
}

main();
