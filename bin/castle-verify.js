#!/usr/bin/env node

/**
 * Castle Gate — Independent Cryptographic Verifier CLI (`castle-verify`)
 * 
 * Standalone, offline CLI tool for third-party cryptographic verification
 * of Castle Gate evidence, release certificates, and DSSE attestations.
 * 
 * Exit Codes:
 *   0 = VALID (Cryptographically verified & authentic)
 *   1 = INVALID (Tampered, forged, expired, or mismatch)
 *   3 = CLI_ERROR (Missing arguments, unreadable file)
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { verifyAssuranceArtifact } = require('../castle-gate/verifier/castle-verify');

function printUsage() {
  console.log(`
Castle Gate Independent Verifier (castle-verify v1.0.1)
Cryptographic Offline Software Assurance Verification Tool | Grupo Castillo

USAGE:
  castle-verify --artifact <file> [options]
  castle-verify <file> [options]

OPTIONS:
  --artifact, -a <file>         Path to evidence.json, release-certificate.json, or dsse.json.
  --key, -k <file>              Path to Ed25519 public key (.pem) for asymmetric signature verification.
  --trust-anchor, --anchor <f>  Path to independent trust-anchors.json store.
  --require-trust-anchor        Enforce fail-closed check that signing key is anchored in a trusted root.
  --revocations, --rev-manifest <f> Path to signed key revocation manifest JSON.
  --require-revocation-check    Enforce fail-closed check against key revocation manifest.
  --commit <sha>                Expected Git commit SHA to assert against evidence binding.
  --policy-hash <hash>          Expected canonical policy SHA-256 hash.
  --html, --report <file>       Path to compliance-report.html to verify report integrity binding.
  --sarif <file>                Path to sarif.json to verify SARIF integrity binding.
  --sbom <file>                 Path to sbom.json to verify SBOM integrity binding.
  --json                        Output verification verdict and diagnostics in JSON format.
  --help, -h                    Displays this help screen.

EXIT CODES:
  0 = VALID
  1 = INVALID
  3 = CLI_ERROR
`);
}

function parseArgs(argv) {
  const parsed = {
    artifactPath: null,
    publicKeyPath: null,
    trustAnchorPath: null,
    requireTrustAnchor: false,
    revocationManifestPath: null,
    requireRevocationCheck: false,
    expectedCommit: null,
    expectedPolicyHash: null,
    reportHtmlPath: null,
    sarifPath: null,
    sbomPath: null,
    jsonOutput: false,
    help: false,
    cliError: null
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') {
      parsed.help = true;
    } else if (arg === '--json') {
      parsed.jsonOutput = true;
    } else if (arg === '--require-trust-anchor') {
      parsed.requireTrustAnchor = true;
    } else if (arg === '--require-revocation-check') {
      parsed.requireRevocationCheck = true;
    } else if (arg === '--artifact' || arg === '-a' || arg === '--cert' || arg === '--evidence') {
      if (i + 1 >= argv.length || argv[i + 1].startsWith('-')) {
        parsed.cliError = `Missing required value for ${arg}`;
      } else {
        parsed.artifactPath = argv[++i];
      }
    } else if (arg === '--key' || arg === '-k') {
      if (i + 1 >= argv.length || argv[i + 1].startsWith('-')) {
        parsed.cliError = `Missing required value for ${arg}`;
      } else {
        parsed.publicKeyPath = argv[++i];
      }
    } else if (arg === '--trust-anchor' || arg === '--anchor') {
      if (i + 1 >= argv.length || argv[i + 1].startsWith('-')) {
        parsed.cliError = `Missing required value for ${arg}`;
      } else {
        parsed.trustAnchorPath = argv[++i];
      }
    } else if (arg === '--revocations' || arg === '--revocation-manifest' || arg === '--rev-manifest') {
      if (i + 1 >= argv.length || argv[i + 1].startsWith('-')) {
        parsed.cliError = `Missing required value for ${arg}`;
      } else {
        parsed.revocationManifestPath = argv[++i];
      }
    } else if (arg === '--commit') {
      if (i + 1 >= argv.length || argv[i + 1].startsWith('-')) {
        parsed.cliError = `Missing required value for ${arg}`;
      } else {
        parsed.expectedCommit = argv[++i];
      }
    } else if (arg === '--policy-hash' || arg === '--policy') {
      if (i + 1 >= argv.length || argv[i + 1].startsWith('-')) {
        parsed.cliError = `Missing required value for ${arg}`;
      } else {
        parsed.expectedPolicyHash = argv[++i];
      }
    } else if (arg === '--html' || arg === '--report') {
      if (i + 1 >= argv.length || argv[i + 1].startsWith('-')) {
        parsed.cliError = `Missing required value for ${arg}`;
      } else {
        parsed.reportHtmlPath = argv[++i];
      }
    } else if (arg === '--sarif') {
      if (i + 1 >= argv.length || argv[i + 1].startsWith('-')) {
        parsed.cliError = `Missing required value for ${arg}`;
      } else {
        parsed.sarifPath = argv[++i];
      }
    } else if (arg === '--sbom') {
      if (i + 1 >= argv.length || argv[i + 1].startsWith('-')) {
        parsed.cliError = `Missing required value for ${arg}`;
      } else {
        parsed.sbomPath = argv[++i];
      }
    } else if (!arg.startsWith('-') && !parsed.artifactPath) {
      parsed.artifactPath = arg;
    } else if (arg.startsWith('-')) {
      parsed.cliError = `Unknown option: ${arg}`;
    }
  }

  return parsed;
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help || (!args.artifactPath && process.argv.length <= 2)) {
    printUsage();
    process.exit(args.help ? 0 : 3);
  }

  if (args.cliError) {
    console.error(`[CLI ERROR] ${args.cliError}`);
    process.exit(3);
  }

  if (!args.artifactPath) {
    console.error('[CLI ERROR] Missing required argument: --artifact <file>');
    process.exit(3);
  }

  const result = verifyAssuranceArtifact({
    artifactPath: args.artifactPath,
    publicKeyPath: args.publicKeyPath,
    trustAnchorPath: args.trustAnchorPath,
    requireTrustAnchor: args.requireTrustAnchor,
    revocationManifestPath: args.revocationManifestPath,
    requireRevocationCheck: args.requireRevocationCheck,
    expectedCommit: args.expectedCommit,
    expectedPolicyHash: args.expectedPolicyHash,
    reportHtmlPath: args.reportHtmlPath,
    sarifPath: args.sarifPath,
    sbomPath: args.sbomPath
  });

  if (args.jsonOutput) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log('================================================================');
    console.log('Castle Gate — Independent Cryptographic Assurance Verification');
    console.log('================================================================');
    console.log(`Target Artifact:        ${args.artifactPath}`);
    if (args.publicKeyPath) console.log(`Public Key:             ${args.publicKeyPath}`);
    if (args.trustAnchorPath) console.log(`Trust Anchor Store:     ${args.trustAnchorPath}`);
    if (args.revocationManifestPath) console.log(`Revocation Manifest:    ${args.revocationManifestPath}`);
    if (args.requireTrustAnchor) console.log(`Trust Anchor Enforced:  YES`);
    if (args.requireRevocationCheck) console.log(`Revocation Enforced:    YES`);
    if (result.metadata) {
      console.log(`Evaluation ID:          ${result.metadata.evaluation_id || 'N/A'}`);
      console.log(`Target System:          ${result.metadata.target_project} (${result.metadata.environment})`);
      console.log(`Commit SHA:             ${result.metadata.commit_sha || 'N/A'}`);
      console.log(`Gate Level:             ${result.metadata.gate_level || 'N/A'}`);
      console.log(`Gate Decision:          ${result.metadata.gate_decision || 'N/A'}`);
      console.log(`CQS Score:              ${result.metadata.cqs_score !== null ? result.metadata.cqs_score : 'N/A'}`);
    }
    console.log('----------------------------------------------------------------');
    console.log('DIAGNOSTIC LOG:');
    result.details.forEach((d, idx) => console.log(`  [${idx + 1}] ${d}`));
    console.log('----------------------------------------------------------------');
    if (result.status === 'VALID') {
      console.log(`VERDICT: [VALID] (Cryptographically verified & authentic)`);
    } else {
      console.log(`VERDICT: [INVALID] (Verification failed)`);
    }
    console.log('================================================================\n');
  }

  process.exit(result.status === 'VALID' ? 0 : 1);
}

if (require.main === module) {
  main();
}

module.exports = {
  parseArgs,
  main
};

