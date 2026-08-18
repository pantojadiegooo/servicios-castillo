# Castle Security & Quality Gate — Public CLI Specification
**Document ID:** `SPEC-CLI-PHASE-10-2026-01`  
**Command Name:** `castle-gate`  
**Package Scope:** `@grupo-castillo/castle-gate`  
**Stability Level:** `STABLE / PRODUCTION CANDIDATE`  

---

## 1. Global CLI Grammar & Syntax

```text
castle-gate <command> [options]

COMMANDS:
  scan          Scan local source directory with Castle Native Probes and evaluate Gate.
  evaluate      Evaluate Gate using an existing pre-computed Evidence Package JSON file.
  verify-cert   Cryptographically verify a release-certificate.json artifact.
  version       Display CLI, CQS specification, and ratified policy version numbers.
  help          Show comprehensive command line help and usage examples.
```

---

## 2. Command Details & Flag Reference

### A. Command: `castle-gate scan`
Executes Castle Native Probes on the target source directory, compiles an Evidence Package, executes CQS v1.1, applies the specified policy level (C1..C6), and enforces release gating.

```text
USAGE:
  castle-gate scan --dir <path> --level <C1..C6> [options]

REQUIRED FLAGS:
  --dir, -d <path>         Path to the target source code directory to scan.
  --level, -l <level>      Target policy level (C1, C2, C3, C4, C5, C6).

OPTIONAL FLAGS:
  --output-dir, -o <path>  Directory to save output artifacts (Default: ./.castle).
  --format, -f <fmt>       Output format: text (default), json, or compact.
  --project, -p <name>     Target project name (Default: directory name).
  --env, -e <env>          Target environment: production (default), staging, development.
  --commit, -c <sha>       Git commit hash associated with this release build.
  --config <path>          Path to custom configuration file (.castlegaterc.json).
  --ignore-dirs <list>     Comma-separated directories to skip (Default: node_modules,.git,dist).
  --fail-on-remediation    Treat Exit Code 2 (REQUIRES_REMEDIATION) as fatal CI failure.
```

### B. Command: `castle-gate evaluate`
Ingests an externally generated Evidence Package (e.g. from custom automated pipelines) and executes Gate evaluation.

```text
USAGE:
  castle-gate evaluate --evidence <file.json> --level <C1..C6> [options]

REQUIRED FLAGS:
  --evidence, -e <file>    Path to valid Evidence Package JSON file.
  --level, -l <level>      Target policy level (C1, C2, C3, C4, C5, C6).
```

### C. Command: `castle-gate verify-cert`
Verifies the cryptographic payload integrity of a previously issued `release-certificate.json`.

```text
USAGE:
  castle-gate verify-cert --cert <path/to/release-certificate.json>

OUTPUT:
  - Exit Code 0: Certificate is authentic, valid, and matches payload digest.
  - Exit Code 1: Certificate has been TAMPERED with or signature mismatch detected.
  - Exit Code 3: File not found or malformed JSON.
```

### D. Command: `castle-gate version`
Prints version metadata in standard or JSON format.

```text
USAGE:
  castle-gate version [--json]

SAMPLE OUTPUT:
  Castle Gate Engine:   1.0.0
  CQS Specification:    1.1.0 (FROZEN)
  Policy Matrix:        1.0.0-ratified
```

---

## 3. Canonical POSIX Exit Codes

Castle Gate guarantees deterministic exit codes across all operating systems and CI/CD runners:

```text
+-----------+-----------------------+----------------------------------------------------------------+
| EXIT CODE | STATUS NAME           | MEANING & CI/CD BEHAVIOR                                       |
+-----------+-----------------------+----------------------------------------------------------------+
|     0     | PASSED                | Release authorized. Build pipeline proceeds to deployment.     |
|     1     | BLOCKED               | Gate Breaker triggered or fatal flaw. Pipeline MUST HALT.      |
|     2     | REQUIRES_REMEDIATION  | Score deficit or missing evidence. Release held pending review.|
|     3     | CLI_ERROR             | Invalid arguments, missing files, or bad configuration.        |
+-----------+-----------------------+----------------------------------------------------------------+
```

---

## 4. Configuration File Specification (`.castlegaterc.json`)

Developers can define workspace defaults in a `.castlegaterc.json` file in the root of their repository:

```json
{
  "$schema": "https://grupocastillo.com/schemas/castlegaterc.v1.json",
  "project_name": "MyEnterpriseApp",
  "default_level": "C2",
  "default_environment": "production",
  "output_directory": "./.castle",
  "ignored_directories": [
    "node_modules",
    ".git",
    "dist",
    "build",
    "coverage"
  ],
  "probes": {
    "security": { "enabled": true },
    "dom_semantics": { "enabled": true },
    "maintainability": { "enabled": true }
  }
}
```
