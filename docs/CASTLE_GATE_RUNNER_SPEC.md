# Castle Gate Runner — CQS v1.1 Technical Specification
## Engine Architecture, Taxonomy, CLI Reference & Governance Protocol

**Version:** 1.1.0  
**Protocol:** CQS v1.1 (Castle Quality Standard)  
**Author:** Grupo Castillo — Dirección de Ingeniería y Gobernanza Digital  
**Classification:** Technical Specification & CI/CD Operator Manual  

---

## 1. Executive Summary & Fundamental Principle

**Castle Gate Runner** is an autonomous, zero-dependency static evaluation engine engineered to enforce deterministic code quality and security policies directly within CI/CD runner memory.

```
┌────────────────────────────────────────────────────────────────────────┐
│  1. TARGET REPOSITORY  (Client-owned codebase)                         │
│           │                                                            │
│           ▼                                                            │
│  2. CASTLE GATE RUNNER (In-memory execution, 0 data exfiltration)      │
│           │                                                            │
│           ▼                                                            │
│  3. CQS v1.1 ENGINE    (7 Domains • Static Control Catalog)            │
│           │                                                            │
│     ┌─────┴────────────────────────┐                                   │
│     ▼                              ▼                                   │
│  [ PASS ] (Exit Code 0)         [ FAIL ] (Exit Code 1)                 │
│     │                              │                                   │
│     ▼                              ▼                                   │
│  • Validation ID (CG-YYYY-XXXXXX) • Gate Breaker Active                │
│  • Release Certificate (JSON)     • Pipeline Veto                      │
│  • Compliance Report (HTML)       • Blocked Deployment                 │
│  • SHA-256 Signature Digest                                            │
└────────────────────────────────────────────────────────────────────────┘
```

### 1.1 Core Truth & Ownership Principles
1. **Client Ownership:** Software, repositories, configurations, and domains belong 100% to the client. Castle Gate claims zero intellectual or operational ownership.
2. **Local Memory Execution:** Evaluation executes entirely within runner memory without sending source code, tokens, or environment variables to external servers.
3. **No False Promises:** Castle Gate is a deterministic static gate breaker; it is **NOT** a certificate of absolute invulnerability nor an external governmental accreditation (e.g. ISO 27001 / SOC 2).

---

## 2. CLI Reference & Invocation

### 2.1 Basic Syntax
```bash
# Direct runner invocation
node bin/castle-gate.js scan [options]

# Via package script
npm run castle-gate -- scan [options]

# Unix / Windows wrappers
./bin/castle-gate-runner scan --dir ./api-service --level C4
```

### 2.2 Commands
- `scan`: Evaluates the target directory against the selected CQS v1.1 policy level.
- `verify-cert`: Cryptographically verifies the SHA-256 signature digest of a generated `release-certificate.json`.

### 2.3 Options & Flags
| Flag | Short | Default | Description |
| :--- | :--- | :--- | :--- |
| `--dir <path>` | `-d` | `.` | Path to target project repository root. |
| `--level <C1..C6>` | `-l` | `C1` | Target policy level to enforce. |
| `--out <dir>` | `-o` | `./.castle` | Directory where evidence artifacts are written. |
| `--json` | | `false` | Output evaluation results in raw JSON format. |
| `--skip-audit` | | `false` | Skip live `npm audit` execution (for offline / test fixture scans). |
| `--cert <path>` | | | Path to `release-certificate.json` when running `verify-cert`. |
| `--version` | `-v` | | Print runner version. |
| `--help` | `-h` | | Print CLI manual. |

### 2.4 Exit Codes
- `0` — **PASS:** Composite score meets policy threshold and zero Gate Breakers are active.
- `1` — **FAIL:** Composite score below threshold OR at least 1 Gate Breaker triggered.
- `2` — **CONFIG_ERROR:** Invalid CLI arguments, unknown policy level, or missing required flags.
- `3` — **RUNTIME_ERROR:** File system I/O error or parser crash.

---

## 3. CQS v1.1 Taxonomy: 7 Domains of Inspection

| Domain ID | Domain Name | Weight | Key Inspections | Gate Breakers |
| :--- | :--- | :---: | :--- | :---: |
| **DOM-01** | **Secret & Credential Detection** | 25% | RSA/EC private keys, AWS access keys, GitHub/GitLab PATs, Stripe secret keys, database URIs with passwords, committed `.env` files. | **YES (GB-01)** |
| **DOM-02** | **Dependency & Supply Chain** | 20% | Manifest syntax (`package.json`), lockfile presence and integrity, `npm audit` CVE scan, unpinned git dependencies. | **YES (GB-02)** |
| **DOM-03** | **Static Code Quality** | 15% | Syntax integrity, absence of `debugger;` breakpoints, uncompressed asset budgets (< 5MB). | **YES (GB-03)** |
| **DOM-04** | **Accessibility (WCAG AA)** | 15% | Semantic landmarks (`<main>`, `<nav>`, `<header>`, `<footer>`), single `<h1>`, image `alt` attributes, reduced motion media queries. | NO |
| **DOM-05** | **Performance & Web Vitals** | 10% | Viewport meta tag, client JS bundle size budget (< 300KB), Canvas `cancelAnimationFrame` lifecycle safety. | NO |
| **DOM-06** | **Build & Production Hygiene** | 10% | Custom 404 handler, security headers (`CSP`, `X-Frame-Options`, `nosniff`), zero hardcoded localhost/127.0.0.1 URLs. | NO |
| **DOM-07** | **SEO & Governance Metadata** | 5% | Canonical URL tags, OpenGraph metadata tags, `sitemap.xml`, `robots.txt`. | NO |

---

## 4. Policy Hierarchy (C1 to C6)

```
[ C6 Ultimate / Diamond ]   ────────── Threshold: 98.0% (100% nominal control compliance)
[ C5 Enterprise ]           ────────── Threshold: 95.0% (Strict CSP, zero warnings)
[ C4 Advanced ]             ────────── Threshold: 90.0% (Full WCAG AA + Lifecycle checks)
[ C3 Professional ]         ────────── Threshold: 80.0% (Semantic landmarks + Canonical tags)
[ C2 Standard ]             ────────── Threshold: 70.0% (Dependency audit clean + Viewport)
[ C1 Foundation ]           ────────── Threshold: 60.0% (Gate Breakers clear: 0 Secrets, 0 CVEs)
```

---

## 5. Validation ID & Cryptographic Evidence

### 5.1 Validation ID Format
$$\text{Validation ID} = \mathbf{CG\text{-}YYYY\text{-}XXXXXX}$$
*Example:* `CG-2026-E60998`

### 5.2 Release Certificate Schema (`.castle/release-certificate.json`)
```json
{
  "validation_id": "CG-2026-E60998",
  "protocol": "CQS_v1.1",
  "policy_level": "C4",
  "target_release_sha": "e5fce57bfbe6100c190c0bf4b4ea00664e808549",
  "evaluation_timestamp_utc": "2026-08-16T20:57:11.000Z",
  "status": "PASS",
  "exit_code": 0,
  "score": 100.0,
  "secrets_detected": 0,
  "gate_breakers_active": 0,
  "domains_summary": { ... },
  "ownership": "CLIENT_EXCLUSIVE",
  "signature_digest_sha256": "6cf0f5e90e8baa3fdae559764edaeafdd7c600ceb12f06bf26d4706006cb387b"
}
```

---

## 6. Comparison with Complementary Industry Tools

| Dimension | SonarQube | Semgrep / Snyk | Castle Gate Runner |
| :--- | :--- | :--- | :--- |
| **Primary Scope** | General AST code smell & cyclomatic complexity. | Deep SAST security rule engine & dependency vulnerability tracking. | Multi-domain static gate breaker (Secrets + A11y + CWV + Hygiene + Cryptographic Evidence). |
| **Execution Model** | Centralized server / cloud database. | CLI / cloud integration. | 100% offline local memory execution in CI/CD runner. |
| **Evidence Output** | Dashboard metrics. | PR comments / JSON. | Signed `.castle/release-certificate.json` + standalone `compliance-report.html`. |
| **Role in Pipeline** | Developer feedback tool. | AppSec vulnerability triage. | Final release gatekeeper & deployment authorization veto. |

---

## 7. CI/CD Integration Guide

### GitHub Actions
```yaml
# .github/workflows/castle-gate.yml
name: Castle Quality & Security Gate
on: [push, pull_request]

jobs:
  gate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm ci
      - run: npm run build
      - name: Run Castle Gate (Policy C4)
        run: node bin/castle-gate.js scan --dir . --level C4
      - name: Verify Certificate Integrity
        run: node bin/castle-gate.js verify-cert --cert .castle/release-certificate.json
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: castle-gate-evidence
          path: .castle/
```
