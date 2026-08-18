#!/usr/bin/env node

/**
 * Castle Security & Quality Gate — Command Line Interface (CLI)
 * 
 * World-Class Verifiable Software Assurance Platform | Grupo Castillo
 * 
 * Usage:
 *   castle-gate scan --dir ./app --level C2 [--output-dir ./.castle] [--sign --key ./private.pem]
 *   castle-gate evaluate --evidence ./evidence.json --level C2
 *   castle-gate verify-cert --cert ./.castle/release-certificate.json [--key ./public.pem]
 *   castle-gate verify --artifact ./.castle/evidence.json [--key ./public.pem]
 *   castle-gate keygen [--output-dir ./.castle]
 *   castle-gate version [--json]
 * 
 * Exit Codes:
 *   0 = PASSED / VALID (Release Authorized)
 *   1 = BLOCKED / INVALID (Mandatory Veto / Verification Failed)
 *   2 = REQUIRES_REMEDIATION / EVIDENCE_PENDING (Release Held)
 *   3 = CLI_ERROR / INVALID_ARGUMENTS / CONFIGURATION_ERROR
 */

'use strict';

const fs = require('fs');
const path = require('path');
const gate = require('../index');
const { loadCastleGateConfig } = require('../config/config-loader');
const { generateComplianceReportHtml } = require('../reports/compliance-report-generator');
const { generateKeyPair, saveKeyPair, loadKey } = require('../crypto/signing-key');
const { verifyAssuranceArtifact } = require('../verifier/castle-verify');

function printUsage() {
  console.log(`
Castle Security & Quality Gate CLI (v${gate.GATE_VERSION})
Deterministic Multi-Domain Release Governance Platform | Grupo Castillo

COMMANDS:
  scan               Scan local source directory with Castle Native Probes & evaluate Gate.
  evaluate           Evaluate release readiness against ratified C1-C6 policy using JSON evidence.
  verify-cert        Cryptographically verify integrity of a release-certificate.json artifact.
  verify             Independently verify any assurance artifact (evidence, certificate, DSSE).
  keygen             Generate a new Ed25519 asymmetric cryptographic signing keypair.
  version            Display CLI, CQS specification, and ratified policy version numbers.
  help, --help       Displays this help screen.

GLOBAL & COMMAND OPTIONS:
  --dir, -d <path>         [scan] Path to project source code directory to scan.
  --level, -l <level>      [scan/evaluate] Target Gate Level (C1, C2, C3, C4, C5, C6).
  --evidence, -e <file>    [evaluate] Path to Evidence Package JSON file.
  --cert, -c <file>        [verify-cert] Path to release-certificate.json file to verify.
  --artifact, -a <file>    [verify] Path to evidence.json, release-certificate.json, or DSSE envelope.
  --output-dir, -o <path>  Directory to save release certificate, SARIF, SBOM, and HTML reports.
  --project, -p <name>     Target project name (Default: directory name or config).
  --env <env>              Target environment: production (default), staging, development.
  --commit <sha>           Git commit SHA associated with the release.
  --sign                   Digitally sign evidence and release certificates using Ed25519.
  --key, -k <file>         Path to Ed25519 private key (.pem) for signing, or public key for verification.
  --pubkey <file>          Path to Ed25519 public key (.pem) to embed in certificates.
  --waivers <file>         Path to JSON file containing active governed waivers.
  --offline                Enforce strictly local/offline scanning without remote network sensors.
  --sarif <file>           Custom output path for SARIF v2.1.0 report.
  --sbom <file>            Custom output path for CycloneDX v1.5 SBOM report.
  --config <path>          Path to custom configuration file (.castlegaterc.json).
  --format <fmt>           Output format: text (default) or json.
  --json                   Shortcut for --format json.

EXIT CODES:
  0 = PASSED (Release Authorized)
  1 = BLOCKED (Mandatory Release Veto)
  2 = REQUIRES_REMEDIATION / EVIDENCE_PENDING
  3 = CLI_ERROR / INVALID_ARGUMENTS
`);
}

function parseArgs(args) {
  const parsed = {
    command: null,
    level: null,
    scanDir: null,
    evidencePath: null,
    gateEvidencePath: null,
    policyPath: null,
    outputDir: null,
    project: null,
    env: null,
    commit: null,
    certificatePath: null,
    artifactPath: null,
    configPath: null,
    keyPath: null,
    pubkeyPath: null,
    waiversPath: null,
    sarifPath: null,
    sbomPath: null,
    sign: false,
    offline: false,
    jsonOutput: false
  };

  if (args.length === 0) return parsed;
  parsed.command = args[0];

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') {
      parsed.command = 'help';
    } else if (arg === '--version' || arg === '-v') {
      parsed.command = 'version';
    } else if ((arg === '--level' || arg === '-l') && args[i + 1]) {
      parsed.level = args[++i].toUpperCase();
    } else if ((arg === '--dir' || arg === '-d') && args[i + 1]) {
      parsed.scanDir = args[++i];
    } else if ((arg === '--evidence' || arg === '-e') && args[i + 1]) {
      parsed.evidencePath = args[++i];
    } else if ((arg === '--cert' || arg === '--certificate' || arg === '-c') && args[i + 1]) {
      parsed.certificatePath = args[++i];
    } else if ((arg === '--artifact' || arg === '-a') && args[i + 1]) {
      parsed.artifactPath = args[++i];
    } else if (arg === '--gate-evidence' && args[i + 1]) {
      parsed.gateEvidencePath = args[++i];
    } else if (arg === '--policy' && args[i + 1]) {
      parsed.policyPath = args[++i];
    } else if ((arg === '--output-dir' || arg === '-o') && args[i + 1]) {
      parsed.outputDir = args[++i];
    } else if ((arg === '--project' || arg === '-p') && args[i + 1]) {
      parsed.project = args[++i];
    } else if (arg === '--env' && args[i + 1]) {
      parsed.env = args[++i];
    } else if (arg === '--commit' && args[i + 1]) {
      parsed.commit = args[++i];
    } else if ((arg === '--key' || arg === '-k') && args[i + 1]) {
      parsed.keyPath = args[++i];
    } else if (arg === '--pubkey' && args[i + 1]) {
      parsed.pubkeyPath = args[++i];
    } else if (arg === '--waivers' && args[i + 1]) {
      parsed.waiversPath = args[++i];
    } else if (arg === '--sarif' && args[i + 1]) {
      parsed.sarifPath = args[++i];
    } else if (arg === '--sbom' && args[i + 1]) {
      parsed.sbomPath = args[++i];
    } else if (arg === '--sign') {
      parsed.sign = true;
    } else if (arg === '--offline') {
      parsed.offline = true;
    } else if (arg === '--config' && args[i + 1]) {
      parsed.configPath = args[++i];
    } else if (arg === '--json' || (arg === '--format' && args[i + 1] === 'json')) {
      parsed.jsonOutput = true;
      if (arg === '--format') i++;
    }
  }

  return parsed;
}

function runCli(rawArgs) {
  const args = parseArgs(rawArgs);

  if (!args.command || args.command === 'help') {
    printUsage();
    return 0;
  }

  if (args.command === 'version') {
    if (args.jsonOutput) {
      console.log(JSON.stringify({
        castle_gate_version: gate.GATE_VERSION,
        cqs_specification_version: '1.1.0 (FROZEN)',
        policy_matrix_version: '1.0.0-ratified',
        probes: ['SecurityProbe', 'DomSemanticsProbe', 'MaintainabilityProbe', 'AstProbe', 'GitHistoryProbe'],
        standards: ['RFC-8785-JCS', 'Ed25519-DSSE', 'SARIF-2.1.0', 'CycloneDX-1.5', 'SPDX-2.3']
      }, null, 2));
    } else {
      console.log(`Castle Gate Engine:   ${gate.GATE_VERSION}`);
      console.log(`CQS Specification:    1.1.0 (FROZEN)`);
      console.log(`Policy Matrix:        1.0.0-ratified`);
      console.log(`Native Probes:        SecurityProbe, DomSemanticsProbe, MaintainabilityProbe, AstProbe, GitHistoryProbe`);
      console.log(`Standards Compliance: RFC 8785 JCS, Ed25519 DSSE, SARIF v2.1.0, CycloneDX v1.5, SPDX v2.3`);
    }
    return 0;
  }

  if (args.command === 'keygen') {
    const outputDir = args.outputDir || './.castle';
    const keyPair = generateKeyPair();
    const paths = saveKeyPair(keyPair, outputDir, args.project || 'castle-gate');
    console.log(`[KEYGEN SUCCESS] Ed25519 Keypair generated (Key ID: ${keyPair.keyId}):`);
    console.log(`  Private Key: ${paths.privateKeyPath}`);
    console.log(`  Public Key:  ${paths.publicKeyPath}`);
    return 0;
  }

  if (args.command === 'verify-cert' || args.command === 'verify') {
    const targetFile = args.artifactPath || args.certificatePath;
    if (!targetFile) {
      console.error('[CLI ERROR] Missing --cert or --artifact argument.');
      return 3;
    }
    if (!fs.existsSync(targetFile)) {
      console.error(`[CLI ERROR] Certificate or artifact file not found: ${targetFile}`);
      return 3;
    }

    let pubKeyPem = null;
    if (args.keyPath) {
      try {
        const loaded = loadKey(args.keyPath);
        pubKeyPem = loaded.publicKeyPem;
      } catch (e) {
        console.error(`[CLI ERROR] Failed to load key: ${e.message}`);
        return 3;
      }
    }

    const verification = verifyAssuranceArtifact({
      artifactPath: targetFile,
      publicKeyPem: pubKeyPem,
      expectedCommit: args.commit
    });

    if (verification.status === 'VALID') {
      const targetSys = verification.metadata && verification.metadata.target_project;
      const targetEnv = verification.metadata && verification.metadata.environment;
      const verId = verification.metadata && verification.metadata.evaluation_id;
      console.log(`[CERTIFICATE VALID] ${verId || targetFile} authorized for release on "${targetSys || 'target'}" (${targetEnv || 'production'}).`);
      return 0;
    } else {
      console.error(`[CERTIFICATE INVALID] ${verification.details.join('; ')}`);
      return 1;
    }
  }

  if (args.command === 'scan') {
    const targetDir = args.scanDir || '.';
    let config;
    try {
      config = loadCastleGateConfig(targetDir, args.configPath);
    } catch (err) {
      console.error(`[CLI ERROR] Configuration error: ${err.message}`);
      return 3;
    }

    const level = args.level || config.default_level;
    if (!level || !gate.VALID_GATE_LEVELS.includes(level)) {
      console.error(`[CLI ERROR] Invalid or missing --level. Allowed levels: ${gate.VALID_GATE_LEVELS.join(', ')}`);
      return 3;
    }

    if (!fs.existsSync(targetDir)) {
      console.error(`[CLI ERROR] Target scan directory not found: ${targetDir}`);
      return 3;
    }

    const projectName = args.project || config.project_name || path.basename(path.resolve(targetDir));
    const environment = args.env || config.default_environment || 'production';
    const outputDir = args.outputDir || config.output_directory || './.castle';

    // Load signing keys if specified
    let privateKeyPem = null;
    let publicKeyPem = null;
    if (args.keyPath && fs.existsSync(args.keyPath)) {
      const loaded = loadKey(args.keyPath);
      if (loaded.type === 'private') {
        privateKeyPem = loaded.privateKeyPem;
        publicKeyPem = loaded.publicKeyPem;
      }
    } else if (args.sign) {
      // Ephemeral key generation for signed execution
      const ephemeral = generateKeyPair();
      privateKeyPem = ephemeral.privateKeyPem;
      publicKeyPem = ephemeral.publicKeyPem;
    }

    if (args.pubkeyPath && fs.existsSync(args.pubkeyPath)) {
      publicKeyPem = fs.readFileSync(args.pubkeyPath, 'utf8');
    }

    // Load governed waivers if present
    let waivers = [];
    if (args.waiversPath && fs.existsSync(args.waiversPath)) {
      try {
        const waiverData = JSON.parse(fs.readFileSync(args.waiversPath, 'utf8'));
        waivers = Array.isArray(waiverData) ? waiverData : [waiverData];
      } catch (e) {
        console.error(`[CLI ERROR] Malformed waiver file: ${e.message}`);
        return 3;
      }
    }

    // Execute Castle Native Probes (including AST and Git History)
    const scanResult = gate.runNativeScan(targetDir, {
      ignoredDirs: config.ignored_directories,
      maxFileSizeBytes: config.max_file_size_bytes
    });

    // Execute Gate Pipeline with scanned evidence, SARIF, SBOM, and signatures
    const execution = gate.executeCastleGate({
      target_system: { name: projectName, environment, source_dir: targetDir },
      gate_level: level,
      raw_evidence: scanResult.raw_evidence,
      gate_evidence: scanResult.gate_evidence,
      commit_sha: args.commit,
      output_dir: outputDir,
      waivers: waivers,
      private_key_pem: privateKeyPem,
      public_key_pem: publicKeyPem,
      detailed_findings: scanResult.detailed_findings,
      scanner_metadata: { probes_executed: scanResult.probes_executed }
    });

    if (args.jsonOutput) {
      console.log(JSON.stringify({ scan_result: scanResult, gate_execution: execution }, null, 2));
    } else {
      console.log('================================================================');
      console.log(`Castle Native Probes Scan & Gate Evaluation: [${level}]`);
      console.log(`Target Project:     ${projectName} (${environment})`);
      console.log(`Target Directory:   ${targetDir}`);
      console.log(`Files Scanned:      ${scanResult.total_files_scanned}`);
      console.log(`Scan Duration:      ${scanResult.total_duration_ms} ms`);
      console.log(`Evidence SHA-256:   ${scanResult.aggregated_sha256.substring(0, 16)}...`);
      console.log('----------------------------------------------------------------');
      console.log(`CQS Raw Score:      ${execution.cqs_result.summary.cqs_raw_score !== null ? execution.cqs_result.summary.cqs_raw_score.toFixed(2) : 'N/A'}`);
      console.log(`CQS Display Score:  ${execution.cqs_result.summary.cqs_display_score.toFixed(2)} / 100.00`);
      console.log(`CQS Verdict:        ${execution.cqs_result.summary.final_verdict}`);
      console.log(`Gate Breakers:      ${execution.cqs_result.gate_breakers.status}`);
      console.log(`Gate Decision:      ${execution.gate_decision.gate_state}`);
      console.log(`Exit Code:          ${execution.exit_code}`);
      
      if (execution.gate_decision.blockers.length > 0) {
        console.log('\nBLOCKERS / DEFICIENCIES:');
        execution.gate_decision.blockers.forEach((b, idx) => {
          console.log(`  ${idx + 1}. [${b.code || b.type}] ${b.name || b.details}`);
        });
      }

      if (execution.release_certificate) {
        console.log(`\nRELEASE AUTHORIZED: Certificate ID ${execution.release_certificate.certificate_id}`);
      }
      console.log('================================================================\n');
    }

    return execution.exit_code;
  }

  if (args.command === 'evaluate') {
    if (!args.level || !gate.VALID_GATE_LEVELS.includes(args.level)) {
      console.error(`[CLI ERROR] Invalid or missing --level. Allowed levels: ${gate.VALID_GATE_LEVELS.join(', ')}`);
      return 3;
    }

    if (!args.evidencePath) {
      console.error('[CLI ERROR] Missing --evidence path.');
      return 3;
    }

    if (!fs.existsSync(args.evidencePath)) {
      console.error(`[CLI ERROR] Evidence file not found: ${args.evidencePath}`);
      return 3;
    }

    let rawEvidence = {};
    try {
      rawEvidence = JSON.parse(fs.readFileSync(args.evidencePath, 'utf8'));
    } catch (err) {
      console.error(`[CLI ERROR] Malformed JSON in evidence file: ${err.message}`);
      return 3;
    }

    let gateEvidence = {};
    if (args.gateEvidencePath) {
      if (!fs.existsSync(args.gateEvidencePath)) {
        console.error(`[CLI ERROR] Gate evidence file not found: ${args.gateEvidencePath}`);
        return 3;
      }
      try {
        gateEvidence = JSON.parse(fs.readFileSync(args.gateEvidencePath, 'utf8'));
      } catch (err) {
        console.error(`[CLI ERROR] Malformed JSON in gate evidence file: ${err.message}`);
        return 3;
      }
    }

    let policyOverride = null;
    if (args.policyPath) {
      if (!fs.existsSync(args.policyPath)) {
        console.error(`[CLI ERROR] Policy file not found: ${args.policyPath}`);
        return 3;
      }
      try {
        policyOverride = JSON.parse(fs.readFileSync(args.policyPath, 'utf8'));
      } catch (err) {
        console.error(`[CLI ERROR] Malformed JSON in policy override file: ${err.message}`);
        return 3;
      }
    }

    const outputDir = args.outputDir || './.castle';
    const projectName = args.project || 'Target System';
    const environment = args.env || 'production';

    // Execute Gate Pipeline
    const execution = gate.executeCastleGate({
      target_system: { name: projectName, environment },
      gate_level: args.level,
      raw_evidence: rawEvidence,
      gate_evidence: gateEvidence,
      policy_override: policyOverride,
      commit_sha: args.commit,
      output_dir: outputDir
    });

    if (args.jsonOutput) {
      console.log(JSON.stringify(execution, null, 2));
    } else {
      console.log('================================================================');
      console.log(`Castle Gate Evaluation: [${args.level}] on ${projectName} (${environment})`);
      console.log('================================================================');
      console.log(`CQS Raw Score:      ${execution.cqs_result.summary.cqs_raw_score !== null ? execution.cqs_result.summary.cqs_raw_score.toFixed(2) : 'N/A'}`);
      console.log(`CQS Display Score:  ${execution.cqs_result.summary.cqs_display_score.toFixed(2)} / 100.00`);
      console.log(`CQS Verdict:        ${execution.cqs_result.summary.final_verdict}`);
      console.log(`Gate Breakers:      ${execution.cqs_result.gate_breakers.status}`);
      console.log(`Gate Decision:      ${execution.gate_decision.gate_state}`);
      console.log(`Exit Code:          ${execution.exit_code}`);
      
      if (execution.gate_decision.blockers.length > 0) {
        console.log('\nBLOCKERS / DEFICIENCIES:');
        execution.gate_decision.blockers.forEach((b, idx) => {
          console.log(`  ${idx + 1}. [${b.code || b.type}] ${b.name || b.details}`);
        });
      }

      if (execution.release_certificate) {
        console.log(`\nRELEASE AUTHORIZED: Certificate ID ${execution.release_certificate.certificate_id}`);
      }
      console.log('================================================================\n');
    }

    return execution.exit_code;
  }

  console.error(`[CLI ERROR] Unknown command: "${args.command}". Use "help" for options.`);
  return 3;
}

if (require.main === module) {
  const exitCode = runCli(process.argv.slice(2));
  process.exit(exitCode);
}

module.exports = {
  runCli,
  parseArgs
};
