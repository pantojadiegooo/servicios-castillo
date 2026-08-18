# Castle Security & Quality Gate — Phase 10 Productization Architecture
**Document ID:** `ARCH-PROD-PHASE-10-2026-01`  
**Classification:** Standalone Distributable Product Architecture  
**Target:** 100% Autonomous Local & CI/CD Delivery Platform (Zero Cloud Dependency Required)  
**Governing Standard:** `CQS v1.1 (FROZEN / SINGLE SOURCE OF TRUTH)`  
**Policy Baseline:** `1.0.0-ratified`  

---

## 1. Productization Mission & Philosophy

The central objective of Phase 10 is to make Castle Gate an **autonomous, enterprise-grade distributable package** that any external software engineering team or company can install, run, and enforce within their delivery pipeline without needing any server or cloud infrastructure hosted by Grupo Castillo.

```text
+---------------------------------------------------------------------------------------------------+
| THE INDEPENDENCE MANDATE (100% STANDALONE & ZERO-EXTERNAL-DEPENDENCY)                             |
|                                                                                                   |
|  1. A client installs: `npm install -D @grupo-castillo/castle-gate`                              |
|  2. A developer runs: `npx castle-gate scan --dir . --level C2`                                   |
|  3. The local engine executes Native Probes, CQS v1.1, and Policy Matrix in <25 ms.              |
|  4. The Gate outputs: Exit code (0, 1, 2, 3), audit report, and sealed release certificate.       |
|  5. CI/CD gates deployment based strictly on the exit code and certificate hash.                  |
|  6. ZERO external network requests. ZERO source code leaves the machine.                          |
+---------------------------------------------------------------------------------------------------+
```

---

## 2. Standalone Package Architecture & Execution Boundary

```text
+---------------------------------------------------------------------------------------------------+
| DISTRIBUTABLE NPM PACKAGE: @grupo-castillo/castle-gate                                            |
|                                                                                                   |
|  +---------------------------------------------------------------------------------------------+  |
|  | CLI DISPATCHER & USER INTERFACE (`bin/castle-gate.js`)                                      |  |
|  | • Command parser (scan, evaluate, verify-cert, version)                                    |  |
|  | • Configuration file resolver (`.castlegaterc.json` / `castle-gate.config.js`)             |  |
|  | • Terminal UI formatter & JSON stdout streaming                                             |  |
|  +----------------------------------------------+----------------------------------------------+  |
|                                                 |                                                 |
|                                                 v                                                 |
|  +---------------------------------------------------------------------------------------------+  |
|  | ORCHESTRATION & ANALYSIS ENGINE (`castle-gate/analyzers/`)                                  |  |
|  | • `SecurityProbe` (Secrets, dangerous DOM, plaintext HTTP, security headers)                |  |
|  | • `DomSemanticsProbe` (HTML5 landmarks, heading tree, a11y alt/lang, viewport, SEO)        |  |
|  | • `MaintainabilityProbe` (Monolith detection, nesting, lockfile hygiene, image dimensions)  |  |
|  | • `AnalyzerOrchestrator` (Concurrent executor -> Aggregated Evidence Payload)                |  |
|  +----------------------------------------------+----------------------------------------------+  |
|                                                 |                                                 |
|                                                 v                                                 |
|  +---------------------------------------------------------------------------------------------+  |
|  | CQS v1.1 MATHEMATICAL ENGINE (`cqs/` — FROZEN & UNMODIFIABLE)                                |  |
|  | • Atomic registry (65 controls across 7 domains with 100.00 nominal weight)                 |  |
|  | • Strict double-precision IEEE 754 arithmetic with N/A divisor pruning                      |  |
|  | • Gate Breakers state machine (GB-01 to GB-05)                                              |  |
|  +----------------------------------------------+----------------------------------------------+  |
|                                                 |                                                 |
|                                                 v                                                 |
|  +---------------------------------------------------------------------------------------------+  |
|  | GATE DECISION & POLICY ENGINE (`castle-gate/policy/` & `castle-gate/engine/`)                 |  |
|  | • Ratified policy matrix (`1.0.0-ratified`) resolving levels C1 through C6                  |  |
|  | • Decision engine determining PASSED, BLOCKED, or REQUIRES_REMEDIATION                       |  |
|  +----------------------------------------------+----------------------------------------------+  |
|                                                 |                                                 |
|                                                 v                                                 |
|  +---------------------------------------------------------------------------------------------+  |
|  | CERTIFICATION & AUDIT ARTIFACT GENERATOR (`castle-gate/engine/release-authorizer.js`)       |  |
|  | • Canonical SHA-256 Release Certificate (`release-certificate.json`)                         |  |
|  | • Structured Audit Trail (`audit-trail.json`)                                               |  |
|  | • Standalone HTML Compliance Report (`compliance-report.html`)                              |  |
|  +---------------------------------------------------------------------------------------------+  |
+---------------------------------------------------------------------------------------------------+
```

---

## 3. Privacy & Air-Gapped Security Guarantee

External clients (especially enterprise, fintech, and healthcare organizations) require ironclad privacy assurances:

1. **Zero External Communication:** The core CLI has zero outbound HTTP/HTTPS calls by default. It requires zero API tokens to evaluate and enforce gates.
2. **Local In-Memory AST / Stream Scanning:** Source code files are read from local disk, parsed in memory, and immediately released from garbage collection. No intermediate files or decrypted source code copies are saved outside the repository.
3. **Deterministic Output Artifacts:** All output artifacts are written directly to the user-specified directory (default: `.castle/` inside the target workspace) without touching global system folders.

---

## 4. Standalone Verification Model

A client can verify any release certificate locally using the built-in verifier:

$$\text{Certificate JSON} \xrightarrow{\text{castle-gate verify-cert}} \operatorname{SHA-256}(\text{Canonical Payload}) \stackrel{?}{=} \text{Certificate Digest}$$

* If the certificate was modified (even a single character), the verifier detects payload tampering and exits with code `1`.
* No network connectivity is required for verification.
