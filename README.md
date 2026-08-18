# Castle Security & Quality Gate (`@grupo-castillo/castle-gate`)

> **Deterministic Verifiable Software Assurance & Release Governance Infrastructure**  
> *Developed by Grupo Castillo Security & Software Architecture*

[![Standards](https://img.shields.io/badge/Standards-RFC%208785%20JCS%20%7C%20DSSE%20in--toto%20%7C%20SARIF%202.1.0%20%7C%20CycloneDX%201.5-blue)](#standards--framework-mappings)
[![Cryptographic-Assurance](https://img.shields.io/badge/PKI-Ed25519%20Digital%20Signatures-success)](#cryptographic-assurance--verification)
[![Evaluator](https://img.shields.io/badge/Evaluator-CQS%20v1.1%20Frozen-orange)](#cqs-v11-frozen-foundation)

---

## 1. Overview & Architectural Philosophy

Castle Gate is an authoritative, deterministic, cryptographic release governance infrastructure. It does **not** seek to be a Sonar clone or monolithic scanner. Instead, it serves as a **verifiable software assurance decision layer** that ingests evidence from native AST/static probes and specialized third-party sensors, binds the evidence to exact commit provenance, enforces immutable mathematical governance policies, and produces tamper-proof, cryptographically signed Release Certificates and DSSE in-toto attestations.

### The Architectural Flow:
$$\text{TARGET CODEBASE} \xrightarrow{\text{Probes \& Adapters}} \text{CANONICAL EVIDENCE} \xrightarrow{\text{CQS v1.1 Evaluator}} \text{MATHEMATICAL SCORE} \xrightarrow{\text{RATIFIED POLICY (C1--C6)}} \text{GATE DECISION} \xrightarrow{\text{Ed25519 SIGNER}} \text{VERIFIABLE CERTIFICATE}$$

* **CQS v1.1 (Frozen Single Source of Truth):** 65 atomic controls across 7 domains with 100.00 nominal weight.
* **Signals & Sensors:** Native high-speed AST and regex probes + specialized adapters (npm audit, OSV.dev, Semgrep, Gitleaks, axe-core, Lighthouse).
* **Cryptographic Layer:** RFC 8785 JSON Canonicalization Scheme (JCS), Ed25519 PKI digital signatures, and DSSE in-toto Statement attestations.
* **Independent Verifier (`castle-verify`):** Standalone offline CLI enabling downstream consumers and air-gapped environments to verify release authenticity without external dependencies or cloud APIs.

---

## 2. Key Capabilities & Engineering Invariants

* **Real Asymmetric Cryptography (Ed25519):** Eliminates falsifiable bare hashes. Release certificates and evidence packages are signed with Ed25519 private keys and verified against public keys.
* **RFC 8785 JSON Canonicalization (JCS):** Guarantees bit-for-bit identical cryptographic digests regardless of whitespace, key ordering, or JSON formatting differences.
* **Fail-Closed Default (DOM-02):** If dependency auditing (`npm audit` / `OSV.dev`) encounters a network outage or invalid JSON, it yields `INCONCLUSIVE` / `UNEXECUTED`. Castle Gate **never fabricates a passing score**.
* **Zero-Trust Hardening:** Resolves all symbolic links with `fs.realpathSync`, strictly verifies workspace boundary containment, enforces 5MB file caps, 20-level depth limits, and 20,000-character ReDoS regex guards.
* **Standards Interoperability:** Generates OASIS SARIF v2.1.0 reports, CycloneDX v1.5 JSON SBOMs, and SPDX v2.3 SBOMs.
* **Governed Exception Waivers:** Eliminates ad-hoc `ignore=true`. Exceptions are auditable, signed JSON objects with strict expiration dates that automatically fail closed upon expiry.
* **Merkle-Linked Evidence Chain:** Append-only cryptographic ledger linking sequential evaluation runs ($E_N \to E_{N-1}$).

---

## 3. Sensor Architecture: Native vs Ingested Signals

| Category | Analyzer / Sensor | Execution Mode | Scope & Responsibility |
| :--- | :--- | :--- | :--- |
| **Native Probe** | `CastleAstProbe` (Acorn) | 100% Offline / Local | Real ECMAScript AST parsing: `debugger;`, `eval()`, `new Function()`, `innerHTML`, cyclomatic complexity (>15), empty catch blocks. |
| **Native Probe** | `CastleSecurityProbe` | 100% Offline / Local | High-speed static secret scanning, plaintext HTTP endpoints, security headers configuration. |
| **Native Probe** | `CastleGitHistoryProbe` | 100% Offline / Local | Git commit log and patch scanner to detect credentials committed and deleted in past commits. |
| **Native Probe** | `CastleDomSemanticsProbe` | 100% Offline / Local | HTML5 semantic landmarks, heading hierarchy, viewport, lang, and alt attributes. |
| **Native Probe** | `CastleMaintainabilityProbe` | 100% Offline / Local | File size limits, nesting depth, lockfile presence, and wildcard dependencies. |
| **Ingested Adapter** | `NpmAuditAdapter` / `OsvAdapter` | Network / Pre-run JSON | Third-party dependency vulnerability scanning with strict fail-closed handling. |
| **Ingested Adapter** | `GitleaksAdapter` / `SemgrepAdapter` | External Ingestion | Ingestion and normalization of external SAST / deep secret scanning tools. |
| **Ingested Adapter** | `AxeAdapter` / `LighthouseAdapter` | External Ingestion | Accessibility violation ingestion (axe-core) and Core Web Vitals performance benchmarks. |

---

## 4. Quick Start & CLI Usage

### Installation

```bash
# Global or local installation
npm install -g @grupo-castillo/castle-gate
```

### 1. Generate Signing Keypair
```bash
castle-gate keygen --output-dir ./.castle --project "MyProject"
# Outputs: ./.castle/MyProject-private.pem and ./.castle/MyProject-public.pem
```

### 2. Scan & Sign Local Release [Level C2]
```bash
castle-gate scan \
  --dir ./src \
  --level C2 \
  --project "PaymentService" \
  --commit "1234567890abcdef1234567890abcdef12345678" \
  --key ./.castle/MyProject-private.pem \
  --output-dir ./.castle
```
*Outputs:*
* `.castle/evidence.json` (Bound Evidence Package with DSSE in-toto Attestation)
* `.castle/release-certificate.json` (Cryptographically Signed Release Authorization)
* `.castle/sarif.json` (OASIS SARIF v2.1.0 Report)
* `.castle/sbom-cyclonedx.json` (CycloneDX v1.5 JSON SBOM)
* `.castle/compliance-report.html` (Self-contained Audit Report)

### 3. Independently Verify Release Offline (`castle-verify`)
Downstream consumers or air-gapped deployment gates can verify authenticity:
```bash
castle-verify \
  --cert ./.castle/release-certificate.json \
  --key ./.castle/MyProject-public.pem \
  --report ./.castle/compliance-report.html \
  --commit "1234567890abcdef1234567890abcdef12345678"

# Output: [CERTIFICATE VALID] Evaluation EVAL-... authorized for release on "PaymentService" (Exit Code 0)
```

---

## 5. Canonical POSIX Exit Codes

| Exit Code | Gate Decision State | Meaning |
|:---:|---|---|
| **`0`** | `PASSED` / `VALID` | **Release Authorized / Cryptographically Authenticated.** |
| **`1`** | `BLOCKED` / `INVALID` | **Release Vetoed / Verification Failure (Tampering / Gate Breaker).** |
| **`2`** | `REQUIRES_REMEDIATION` / `EVIDENCE_PENDING` | **Release Held (Score Deficit / Missing Sensor Evidence).** |
| **`3`** | `CLI_ERROR` | **Configuration or Argument Error.** |

---

## 6. Standards & Framework Mappings

Castle Gate maps CQS v1.1 evaluation results to international frameworks:

* **OWASP ASVS v4.0.3** (Application Security Verification Standard)
* **MITRE CWE** (Common Weakness Enumeration)
* **NIST SSDF v1.1** (SP 800-218)
* **NOM-151-SCFI-2016** (Mexican Digital Data Conservation Standards)
* **LFPDPPP Art. 19** (Mexican Personal Data Protection Regulations)
* **CNBV CUB Art. 142** (Mexican Banking Commission Information Security Rules)

> [!NOTE]
> **Regulatory Notice**: Traceability mappings indicate structural alignment between CQS controls and external standards. A `MAPPED` status does **not** constitute formal legal certification or regulatory clearance. Official certification requires independent accredited audits.

---

## 7. Governance, Assurance Scope & Threat Model

For detailed documentation on cryptographic trust chains, governance, and assurance boundaries:
* [Assurance Scope & Evaluation Model](file:///C:/Users/panto/.gemini/antigravity/scratch/castle-engineering/docs/security/ASSURANCE_SCOPE.md)
* [CQS Versioning Process & Freeze Governance](file:///C:/Users/panto/.gemini/antigravity/scratch/castle-engineering/docs/governance/CQS-VERSIONING-PROCESS.md)
* [Official Claims & Anti-Claims Register](file:///C:/Users/panto/.gemini/antigravity/scratch/castle-engineering/CASTLE-GATE-CLAIMS-AND-ANTI-CLAIMS-v1.0.md)
* [Release Handoff & Architecture Dossier](file:///C:/Users/panto/.gemini/antigravity/scratch/castle-engineering/docs/RELEASE_HANDOFF_v1.0.0.md)
* [Threat Model & Invariant Protections](file:///C:/Users/panto/.gemini/antigravity/scratch/castle-engineering/SECURITY-THREAT-MODEL.md)
* [Vulnerability Disclosure Policy](file:///C:/Users/panto/.gemini/antigravity/scratch/castle-engineering/SECURITY.md)

---

## 8. License

Copyright © 2026 Grupo Castillo Security & Software Architecture. All rights reserved.
See [LICENSE](file:///C:/Users/panto/.gemini/antigravity/scratch/castle-engineering/LICENSE) for terms.
