# Castle Gate — Threat Model & Security Architecture

**Specification Version**: 2.0.0-assurance  
**Architecture Classification**: Deterministic Verifiable Software Assurance Infrastructure  
**Author**: Grupo Castillo Security Architecture Team  

---

## 1. Executive Summary & Purpose

Castle Gate is a deterministic software release governance engine designed to enforce verifiable quality, security, and maintainability standards across delivery pipelines. 

Unlike conventional vulnerability dashboards, Castle Gate acts as an **authoritative cryptographic gating layer**: it ingests signals from native AST/static probes and external industry analyzers, binds them to target commit provenance, applies immutable mathematical evaluation policies, and cryptographically signs tamper-proof Release Certificates using Ed25519 and DSSE in-toto attestations.

---

## 2. Attacker Profiles & Threat Vectors

| Threat Actor | Motivation | Attack Surface | Mitigation in Castle Gate |
| :--- | :--- | :--- | :--- |
| **Malicious Committer / Insider** | Attempt to bypass release gate, commit backdoor, inject secrets, or forge passing certificates. | Source tree, git history, CI configuration, certificate files. | **Ed25519 PKI Signatures + RFC 8785 Canonical Digest**: Client cannot alter score or findings without breaking asymmetric digital signature. Working tree + git history probes prevent deleted secret hiding. |
| **Compromised CI/CD Runner** | Modify scan results in memory or filesystem before publishing artifacts. | CI temporary filesystem, environment variables, exit codes. | **Immutable Bound Evidence Package**: Downstream deployment agents verify full cryptographic chain independently via `castle-verify`. Tampering 1 byte invalidates signature. |
| **Supply Chain Attacker** | Distribute vulnerable third-party dependencies or tamper with lockfiles. | `package.json`, lockfiles, external registries. | **Fail-Closed DOM-02**: Inconclusive or failing SCA network queries hold the gate. CycloneDX/SPDX SBOM generation binds exact component integrity hashes. |
| **Adversarial Repository DoS** | Crash analyzer via recursive symlinks, directory depth bombs, ReDoS, or giant 100MB files. | Source file tree during scanning. | **Security Guard Hardener**: Resolves `fs.realpathSync`, enforces 5MB file caps, depth limit (20), total file cap (5000), and ReDoS string length thresholds (20,000 chars). |

---

## 3. Trust Boundaries & Cryptographic Invariants

```
                                 TRUST BOUNDARY
┌──────────────────────────────────────┐       ┌───────────────────────────────────────┐
│        Untrusted Inputs              │       │          Castle Gate Core             │
│                                      │       │                                       │
│  - Source Files (JS/TS/HTML)         │──────>│  - Security Guard (Jailbreak / DoS)  │
│  - External Scans (npm/axe/lh)       │       │  - Native Probes (AST / Secrets / DOM)│
│  - Git Commit History                │       │  - Frozen CQS v1.1 Decision Engine   │
└──────────────────────────────────────┘       └──────────────────┬────────────────────┘
                                                                  │
                                                                  ▼
┌──────────────────────────────────────┐       ┌───────────────────────────────────────┐
│     Downstream Verifiers (Offline)   │       │     Cryptographic Output Layer        │
│                                      │       │                                       │
│  - castle-verify CLI                 │<──────│  - RFC 8785 JSON Canonicalization     │
│  - Kubernetes Admission Controllers  │       │  - Ed25519 DSSE / in-toto Attestation │
│  - Production Deployment Gates       │       │  - Signed Release Certificate JSON    │
└──────────────────────────────────────┘       └───────────────────────────────────────┘
```

### Invariant 1: Single Source of Truth
The underlying **CQS v1.1 evaluation criteria** is frozen. The governance gate never modifies domain weights, control definitions, or scoring formulas.

### Invariant 2: Fail-Closed Default (DOM-02)
If an analyzer or network-dependent sensor (e.g. `npm audit`, `OSV.dev`) times out, encounters a network error, or produces unparseable JSON, the adapter outputs `INCONCLUSIVE` (CQS status `UNEXECUTED`). At high gate levels (C2-C6), unexecuted or inconclusive critical controls trigger a release hold.

### Invariant 3: Independent Offline Verifiability
Any third party possessing:
1. `evidence.json` (or `release-certificate.json`),
2. Ancillary artifacts (`sarif.json`, `sbom-cyclonedx.json`, `compliance-report.html`),
3. The issuer's Ed25519 Public Key (`public-key.pem`),

can execute `castle-verify` in a 100% air-gapped environment to confirm authorization without connecting to any external cloud API or Grupo Castillo server.

---

## 4. Governance Waivers Architecture

Exceptions are strictly governed:
- **No ad-hoc `ignore=true` flags**.
- Every waiver must be an auditable JSON artifact specifying: `control_id`, `reason`, `scope`, `approver`, `expires_at`, `compensating_controls`, and an Ed25519 digital signature.
- Expired waivers are automatically rejected by `WaiverManager` and `castle-verify`.

---

## 5. External Standards & Regulatory Traceability

Castle Gate provides structural mappings to:
- **OWASP ASVS v4.0.3** (Application Security Verification Standard)
- **MITRE CWE** (Common Weakness Enumeration)
- **NIST SSDF v1.1** (SP 800-218)
- **NOM-151-SCFI-2016** (Mexican Data Message Conservation & Cryptographic Evidence)
- **LFPDPPP Art. 19** (Mexican Personal Data Protection)
- **CNBV CUB Art. 142** (Mexican Banking Commission Information Security)

> [!NOTE]
> **Regulatory Disclaimer**: Traceability mappings indicate structural alignment. "MAPPED" status does **not** constitute formal legal certification or regulatory clearance. Official certification requires independent accredited audits.
