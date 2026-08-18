#!/usr/bin/env node

/**
 * Castle Security & Quality Gate — CLI Interface
 * 
 * Commands:
 *   scan           Executes Native Probes, evaluates Gate rules, and emits sealed certificate.
 *   evaluate       Evaluates pre-collected evidence against a Gate level.
 *   verify-cert    Cryptographically verifies a Release Certificate, Evidence Package, or DSSE Envelope.
 *   keygen         Generates an Ed25519 asymmetric key pair.
 *   key-backup     Encrypts and backs up an Ed25519 private key using AES-256-GCM.
 *   key-restore    Restores an Ed25519 private key from an encrypted backup envelope.
 *   version        Displays engine and frozen specification metadata.
 *   help           Displays usage and command syntax.
 */

'use strict';

const path = require('path');
const fs = require('fs');
const gate = require('../index');
const { loadKey, generateKeyPair, saveKeyPair } = require('../crypto/signing-key');
const { verifyAssuranceArtifact } = require('../verifier/castle-verify');
const { createKeyBackup, restoreKeyBackup, saveKeyBackupToFile } = require('../crypto/key-backup');
const { loadCastleGateConfig } = require('../config/config-loader');

function printUsage() {
  console.log(`
Castle Security & Quality Gate CLI (v${gate.GATE_VERSION})
Usage: castle-gate <command> [options]

Commands:
  scan                   Run native probes on a directory and evaluate release gate
  evaluate               Evaluate pre-collected evidence package against a gate policy
  verify-cert            Verify digital signature, digest, and trust chain of release certificate
  keygen                 Generate a new Ed25519 signing keypair
  key-backup             Encrypt and backup an Ed25519 private key using AES-256-GCM
  key-restore            Restore an Ed25519 private key from an encrypted backup
  version                Print version and CQS specification metadata
  help                   Print this message

Options:
  --dir, -d <path>           Target directory for scanning (default: current directory)
  --level, -l <level>        Gate policy level to enforce: C1, C2, C3, C4, C5, C6 (default: C1)
  --project, -p <name>       Project name identifier
  --env <environment>        Environment target (default: production)
  --commit <sha>             Git commit SHA for immutable binding
  --cert, -c <path>          Path to release certificate for verification
  --key, -k <path>           Path to Ed25519 private key (for signing) or public key (for verification)
  --pubkey <path>            Path to Ed25519 public key file
  --trust-anchor <path>      Path to independent trust anchor store JSON
  --revocations <path>       Path to signed key revocation manifest JSON
  --passphrase <phrase>      Passphrase for key backup / recovery
  --out, -o <path>           Output file path for backup or artifacts
  --sign                     Generate signature extension on release certificate
  --output-dir <path>        Directory to store artifacts and compliance report (default: .castle)
  --config <path>            Path to explicit configuration file (.castlegaterc.json)
  --json                     Output evaluation result as JSON
`);
}

function parseArgs(args) {
  const parsed = {
    command: null,
    level: 'C1',
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
    trustAnchorPath: null,
    revocationsPath: null,
    passphrase: null,
    outPath: null,
    waiversPath: null,
    sarifPath: null,
    sbomPath: null,
    sign: false,
    offline: false,
    jsonOutput: false
  };

  if (args.length === 0) return parsed;
  if (args[0] === '--help' || args[0] === '-h') {
    parsed.command = 'help';
    return parsed;
  }
  if (args[0] === '--version' || args[0] === '-v') {
    parsed.command = 'version';
    return parsed;
  }
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
    } else if (arg === '--trust-anchor' && args[i + 1]) {
      parsed.trustAnchorPath = args[++i];
    } else if (arg === '--revocations' && args[i + 1]) {
      parsed.revocationsPath = args[++i];
    } else if (arg === '--passphrase' && args[i + 1]) {
      parsed.passphrase = args[++i];
    } else if ((arg === '--out') && args[i + 1]) {
      parsed.outPath = args[++i];
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

  if (args.command === 'key-backup' || args.command === 'backup-key') {
    const keyPath = args.keyPath;
    const passphrase = args.passphrase || process.env.CASTLE_KEY_PASSPHRASE;
    if (!keyPath || !fs.existsSync(keyPath)) {
      console.error('[CLI ERROR] Missing or invalid --key path to private key.');
      return 3;
    }
    if (!passphrase) {
      console.error('[CLI ERROR] Missing --passphrase (or CASTLE_KEY_PASSPHRASE environment variable).');
      return 3;
    }

    try {
      const loaded = loadKey(keyPath);
      if (loaded.type !== 'private') {
        console.error('[CLI ERROR] The specified key file is not a private key.');
        return 3;
      }
      const backup = createKeyBackup(loaded.privateKeyPem, passphrase);
      const outPath = args.outPath || path.join(path.dirname(keyPath), `key-backup-${backup.key_id.replace(':', '_')}.enc.json`);
      saveKeyBackupToFile(backup, outPath);
      console.log(`[KEY BACKUP SUCCESS] Encrypted backup saved to: ${outPath}`);
      console.log(`  Key ID: ${backup.key_id}`);
      console.log(`  Cipher: ${backup.crypto_params.cipher} (${backup.crypto_params.iterations} iterations)`);
      return 0;
    } catch (err) {
      console.error(`[CLI ERROR] Backup failed: ${err.message}`);
      return 1;
    }
  }

  if (args.command === 'key-restore' || args.command === 'restore-key') {
    const backupPath = args.keyPath || args.artifactPath;
    const passphrase = args.passphrase || process.env.CASTLE_KEY_PASSPHRASE;
    if (!backupPath || !fs.existsSync(backupPath)) {
      console.error('[CLI ERROR] Missing or invalid backup file path (use --key <backup.enc.json>).');
      return 3;
    }
    if (!passphrase) {
      console.error('[CLI ERROR] Missing --passphrase (or CASTLE_KEY_PASSPHRASE environment variable).');
      return 3;
    }

    try {
      const restored = restoreKeyBackup(backupPath, passphrase);
      const outPath = args.outPath || path.join(path.dirname(backupPath), `restored-${restored.keyId.replace(':', '_')}-private.pem`);
      fs.writeFileSync(outPath, restored.privateKeyPem, { encoding: 'utf8', mode: 0o600 });
      console.log(`[KEY RESTORE SUCCESS] Private key restored successfully to: ${outPath}`);
      console.log(`  Key ID:     ${restored.keyId}`);
      console.log(`  Public Key: ${restored.publicKeyPem.split('\n')[1]}...`);
      return 0;
    } catch (err) {
      console.error(`[CLI ERROR] Restore failed: ${err.message}`);
      return 1;
    }
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
      trustAnchorPath: args.trustAnchorPath,
      revocationManifestPath: args.revocationsPath,
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

    const level = args.level || config.default_level || 'C1';
    if (!gate.VALID_GATE_LEVELS.includes(level)) {
      console.error(`[CLI ERROR] Invalid gate level: "${level}". Valid levels: ${gate.VALID_GATE_LEVELS.join(', ')}`);
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
      console.log(`Evidence SHA-256:   ${execution.evidence_package.provenance.payload_sha256.substring(0, 16)}...`);
      console.log('----------------------------------------------------------------');
      console.log(`CQS Raw Score:      ${execution.cqs_result.summary.cqs_raw_score.toFixed(2)}`);
      console.log(`CQS Display Score:  ${execution.cqs_result.summary.cqs_display_score.toFixed(2)} / 100.00`);
      console.log(`CQS Verdict:        ${execution.cqs_result.summary.final_verdict}`);
      console.log(`Gate Breakers:      ${execution.gate_decision.cqs_summary.gate_breakers_status}`);
      console.log(`Gate Decision:      ${execution.gate_decision.gate_state}`);
      console.log(`Exit Code:          ${execution.exit_code}`);

      if (execution.gate_decision.blockers.length > 0) {
        console.log('\nBLOCKERS / DEFICIENCIES:');
        execution.gate_decision.blockers.forEach((b, idx) => {
          console.log(`  ${idx + 1}. [${b.code || b.type}] ${b.message || b.details || 'Blocked'}`);
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
