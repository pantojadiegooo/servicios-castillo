# Castle Security & Quality Gate — CLI Specification
**Document ID:** `SPEC-GATE-CLI-2026-01`  
**Command:** `node castle-gate/cli/bin.js`  
**Operational Version:** `1.0.0-candidate`  

---

## 1. Commands Overview

### `evaluate`
Evaluates release readiness of a target system at a specified Gate Level against ratified CQS quality and security requirements.

```bash
node castle-gate/cli/bin.js evaluate \
  --level <C1|C2|C3|C4|C5|C6> \
  --evidence <path-to-evidence.json> \
  [--gate-evidence <path-to-gate-evidence.json>] \
  [--policy <path-to-custom-policy.json>] \
  [--output-dir <path-to-output-dir>] \
  [--project <system-name>] \
  [--env <environment>] \
  [--commit <sha>] \
  [--json]
```

### `verify-cert`
Verifies the cryptographic integrity digest of an issued Release Certificate.

```bash
node castle-gate/cli/bin.js verify-cert --certificate ./dist-gate-artifacts/release-certificate.json
```

---

## 2. Standard Exit Codes

| Exit Code | Gate Decision State | Meaning | CI/CD Pipeline Behavior |
|:---:|---|---|---|
| **`0`** | `PASSED` | Quality & Security requirements satisfied. Zero blockers. | **Proceed to Deployment** |
| **`1`** | `BLOCKED` | Critical release veto (Gate Breaker active or fatal violation). | **Terminate Pipeline (Hard Failure)** |
| **`2`** | `REQUIRES_REMEDIATION` / `CONDITIONAL` / `EVIDENCE_PENDING` | Quality deficit, pending sign-off, or missing telemetry. | **Hold Pipeline (Remediation Required)** |
| **`3`** | `CLI_USAGE_ERROR` | Missing arguments, malformed JSON, or missing input files. | **Fail Build Configuration** |
