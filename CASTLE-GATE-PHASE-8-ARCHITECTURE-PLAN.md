# Castle Security & Quality Gate — Phase 8 Architecture Plan & Responsibilities Blueprint
**Document ID:** `PLAN-GATE-PHASE-8-2026-01`  
**Classification:** Technical Architecture & Design Blueprint (Pre-Implementation)  
**Governing Authority:** Technical Direction & Architecture Council of Grupo Castillo  
**Methodological Baseline:** `CQS v1.1 (FROZEN / SINGLE SOURCE OF TRUTH)`  
**Policy Baseline:** `1.0.0-ratified`  
**Target Maturity Classification:** `C. OPERATIONAL INTERNAL PLATFORM` (Transitioning to `D. PRODUCTIZABLE TECHNOLOGY`)  

---

## 1. Executive Summary & Purpose

Phase 7 demonstrated through 35 adversarial attack vectors that Castle Security & Quality Gate is mathematically sound, deterministic, and resilient against tampering, with 34/35 attacks defended and 1 minor in-memory mutability vulnerability identified (`ATTACK-17`).

Phase 8 defines the **architectural blueprint for Castle's native technical code analysis capabilities (*Castle Native Probes*)** and the permanent remediation of `ATTACK-17`.

### Strategic Principles for Phase 8:
1. **Autonomous Operation (Zero Third-Party Dependency):** Castle Gate operates 100% independently without requiring external SaaS platforms (e.g. SonarQube, Snyk).
2. **Strict Separation of Concerns:**
   $$\text{SOURCE CODE} \xrightarrow{\text{Castle Native Probes}} \text{EVIDENCE PACKAGE} \xrightarrow{\text{CQS v1.1 Engine}} \text{CQS SCORE} \xrightarrow{\text{Ratified Policy}} \text{GATE DECISION} \xrightarrow{\text{Release Authorizer}} \text{RELEASE CERTIFICATE}$$
3. **Analyzers Are Pure Evidence Producers:** Analyzers inspect source files and emit atomic findings mapped to CQS control IDs (`PASS`, `FAIL`, `N/A`, `UNEXECUTED`). **Analyzers never calculate scores or define thresholds.**
4. **CQS v1.1 Invariant:** The directory `cqs/`, 65 controls, 7 domains, 100.00 nominal weight, and Gate Breakers remain 100% frozen and untouched.

---

## 2. Section A: Remediation Plan for ATTACK-17 (In-Memory Mutability Fix)

### Root Cause Analysis (`ATTACK-17`):
In `castle-gate/remediation/remediation-tracker.js`, the method `getHistory()` returned:
```javascript
// Vulnerable implementation:
return {
  session_id: this.session_id,
  // ...
  cycles: [...this.cycles] // Shallow copy: child objects remain mutable by reference
};
```
Because the spread operator only clones the top-level array, an external caller on the same Node.js process could execute `history.cycles[0].cqs_score = 99.0` and directly mutate the internal session state stored in `this.cycles[0]`.

### Technical Remediation in Phase 8:
Refactor `RemediationSession.prototype.getHistory()` to perform full deep cloning:
```javascript
// Remediation: Deep cloning + Object.freeze()
getHistory() {
  const clonedCycles = JSON.parse(JSON.stringify(this.cycles));
  return Object.freeze({
    session_id: this.session_id,
    target_system: this.target_system ? JSON.parse(JSON.stringify(this.target_system)) : null,
    gate_level: this.gate_level,
    created_at: this.created_at,
    total_cycles: this.cycles.length,
    is_closed: this.is_closed,
    cycles: clonedCycles
  });
}
```

### Adversarial Verification Test:
Create a dedicated adversarial test verifying that modifying any property of `getHistory().cycles[0]` or adding properties to the returned object does not alter the internal session state or subsequent calls to `getHistory()`.

---

## 3. Section B: Updated Threat Model (Post-Remediation)

With `ATTACK-17` resolved, all 35 adversarial vectors are defended:
* **Integrity & Calculation:** 100% mathematically deterministic (IEEE 754 double precision).
* **Certificate Security:** SHA-256 canonical digest protects all fields against tampering.
* **Gate Breakers:** Inviolable veto prior to score/waiver checks.
* **State Machine:** Closed remediation sessions reject new cycle appends.

### Residual Infrastructure Assumptions (Clearly Documented):
1. **CI/CD Status Checks:** Castle Gate returns POSIX Exit Codes ($0, 1, 2$). The repository hosting platform (GitHub / GitLab) must enforce branch protection requiring status checks to pass before merging.
2. **Host Machine Isolation:** The CI runner environment is assumed not to be root-compromised during the build execution.

---

## 4. Section C: Architecture of Castle Native Analysis Probes

Rather than cloning third-party tools, Castle builds **domain-specific, lightweight, zero-dependency inspection probes** tailored precisely to the 65 CQS atomic controls:

```text
castle-engineering/
├── cqs/                                  [FROZEN / UNTOUCHED]
├── castle-gate/
│   ├── index.js                          [Main API]
│   ├── engine/                           [Decision & Release Authorizer]
│   ├── policy/                           [Ratified Matrix 1.0.0-ratified]
│   ├── evidence/                         [Evidence Package Manager]
│   ├── analyzers/                        [NEW: Castle Native Probes]
│   │   ├── base-analyzer.js              [Abstract Probe Base Class]
│   │   ├── security-probe.js             [Secrets, eval(), XSS, Headers, Insecure URLs]
│   │   ├── dom-semantics-probe.js        [HTML5 Landmarks, Alt text, Meta, Headings]
│   │   ├── maintainability-probe.js      [File Size, Nesting, Lockfile, Dead Assets]
│   │   └── analyzer-orchestrator.js      [Executes all active probes in parallel]
│   ├── remediation/                      [Remediation Ledger with ATTACK-17 fix]
│   ├── audit/                            [Immutable Audit Generator]
│   └── cli/                              [CLI with `castle-gate scan` / `evaluate`]
└── tests/
```

### Overview of Castle Native Probes:

#### 1. `SecurityProbe` (`analyzers/security-probe.js`)
* **Signals Detected:**
  - **Hardcoded Secrets (`SEC-05.1`):** Regex scanning for API keys (Stripe, AWS, GitHub tokens, private keys, `.env` exposure).
  - **Dangerous JavaScript Patterns (`SEC-04.1`):** Detects usage of `eval()`, `document.write()`, unsanitized `innerHTML`, `javascript:` protocol in `href`/`src`.
  - **Insecure Transport (`GB-01` & `SEC-01.2`):** Detects unencrypted `http://` links in production endpoints, missing HTTPS redirection declarations.
  - **Security Headers Configuration (`SEC-02.1`..`SEC-02.4`):** Verifies presence of CSP, HSTS, X-Frame-Options, X-Content-Type-Options in server configuration or HTML headers.

#### 2. `DomSemanticsProbe` (`analyzers/dom-semantics-probe.js`)
* **Signals Detected:**
  - **Semantic Landmarks (`ACC-01.1` & `ACC-01.2`):** Validates HTML5 structural tags (`<main>`, `<header>`, `<nav>`, `<footer>`) and strict heading hierarchy ($H_1 \to H_2 \to H_3$ with no skipped levels).
  - **Accessibility Attributes (`ACC-03.1` & `ACC-04.1`):** Missing `alt` on `<img>`, missing `lang` on `<html>`, empty `<button>` / `<a>` text labels.
  - **Mobile & Search Ergonomics (`UX-01.1`, `SEO-02.1`, `SEO-02.2`):** Presence and validity of `<meta name="viewport">`, `<title>`, `<meta name="description">`, `<link rel="canonical">`.

#### 3. `MaintainabilityProbe` (`analyzers/maintainability-probe.js`)
* **Signals Detected:**
  - **Code Monoliths & Complexity (`MNT-01.1`):** Identifies source files exceeding 800 lines of code or nesting depth $> 5$ levels.
  - **Dependency & Lockfile Hygiene (`MNT-02.1`):** Validates existence of `package-lock.json`, flags wildcard dependencies (`*`, `^99.0`), checks for outdated manifests.
  - **Asset Hygiene (`PER-04.1` & `PER-04.2`):** Verifies explicit `width`/`height` on images and presence of modern image formats (WebP/AVIF).

---

## 5. Section D: Interface Contracts (`Probes → Evidence Package → CQS`)

### 1. Probe Interface Contract:
Every probe extends `BaseAnalyzer` and implements `analyze(targetDir, options)`:

```typescript
interface ProbeResult {
  probe_name: string;
  probe_version: string;
  scanned_files_count: number;
  execution_duration_ms: number;
  payload_sha256: string;
  controls: {
    [controlId: string]: {
      status: 'PASS' | 'FAIL' | 'N/A' | 'UNEXECUTED';
      details: string;
      findings?: Array<{
        file: string;
        line?: number;
        rule: string;
        snippet?: string;
        severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
      }>;
    };
  };
  gate_breakers?: {
    [breakerId: string]: {
      triggered: boolean;
      details: string;
    };
  };
}
```

### 2. Integration Flow:
1. `analyzer-orchestrator.js` executes `SecurityProbe`, `DomSemanticsProbe`, and `MaintainabilityProbe` concurrently over the source directory.
2. Results are merged into a unified raw evidence object.
3. `gate.createEvidencePackage()` hashes the payload with SHA-256 and records provenance.
4. `cqs.evaluateCqs()` computes the score using the frozen CQS model.
5. `gate.evaluateGateDecision()` resolves the ratified policy and issues the release decision.

---

## 6. Section E: What We WILL Build in Phase 8 (In-Scope)

1. **Fix `ATTACK-17`:** Deep cloning in `RemediationSession.getHistory()`.
2. **`BaseAnalyzer` Abstract Class:** Standardized lifecycle, error handling, timing, and SHA-256 hashing.
3. **`SecurityProbe`:** Zero-dependency static regex & AST scanner for secrets, unsafe DOM methods, plaintext URLs, and missing headers.
4. **`DomSemanticsProbe`:** Static HTML scanner for semantic landmarks, heading trees, alt text, viewport, and SEO tags.
5. **`MaintainabilityProbe`:** Monolith detector, nesting depth checker, and `package-lock.json` dependency integrity validator.
6. **`AnalyzerOrchestrator`:** Unified scanner that aggregates probe findings into a ready-to-ingest Evidence Package.
7. **CLI Integration:** Adding `castle-gate scan --dir ./project --level C2` to automatically run probes $\to$ evaluate gate $\to$ output decision in one step.

---

## 7. Section F: What We Will DELIBERATELY Leave Out (Out-of-Scope)

1. **Complex Interprocedural Taint Engines:** No full-program abstract interpretation or cross-file control-flow graph solvers (which introduce massive performance overhead and false positive noise).
2. **SaaS Multi-Tenant Cloud Web UI:** No cloud dashboard, OAuth logins, or external web servers.
3. **Automated Code Patching:** Probes report findings and exact line locations; they do **not** automatically rewrite developer code.
4. **Heavy Third-Party AST Dependencies:** No massive external binary tools (e.g. clang, rustc bindings); all probes remain 100% lightweight Node.js native logic.

---

## 8. Section G: Future Third-Party Integrations (Optional Adapters in Phase 9+)

In future phases, external enterprise tools can be connected strictly as **optional evidence adapters**, without ever becoming core dependencies:
* **Lighthouse Adapter (Already integrated):** Ingests lab performance/accessibility JSON.
* **OWASP ZAP Adapter (Future):** Ingests active DAST penetration test XML/JSON.
* **CrUX API Adapter (Future):** Ingests 75th percentile real-user field telemetry for C4..C6.
* **SonarQube Adapter (Future, optional):** Ingests SonarQube JSON reports if a corporate client already uses it.

---

## 9. Section H: Strict Rules to Prevent Third-Party Vendor Lock-In

1. **Rule 1 (Zero-Dependency Core):** The core Gate, CQS Engine, and Native Probes must run with zero runtime npm dependencies beyond Node.js built-ins (`fs`, `path`, `crypto`).
2. **Rule 2 (Air-Gapped Operation):** The scanner must execute in completely offline, air-gapped CI/CD environments without reaching out to external networks.
3. **Rule 3 (Plugin Fault-Isolation):** If an adapter or external probe fails or produces invalid JSON, the orchestrator flags the affected control as `UNEXECUTED` with a descriptive error without crashing the Gate execution.
4. **Rule 4 (Zero Telemetry Leakage):** Source code and audit artifacts remain 100% on the customer's infrastructure; no data is phoned home.

---

## 10. Section I: New Adversarial Test Suite for Phase 8

In Phase 8, a comprehensive test suite `tests/phase-8-analyzer-test.js` will verify:
1. `TEST-P8-01` (`ATTACK-17-REMEDIATED`): Proves `getHistory()` deep-cloning prevents in-memory mutation of cycles.
2. `TEST-P8-02`: `SecurityProbe` accurately catches AWS keys, Stripe secrets, and private keys.
3. `TEST-P8-03`: `SecurityProbe` detects `eval()`, `document.write()`, and unescaped `innerHTML`.
4. `TEST-P8-04`: `SecurityProbe` triggers `GB-01` on plaintext `http://` in production login routes.
5. `TEST-P8-05`: `DomSemanticsProbe` detects broken heading hierarchy ($H_1 \to H_3$ jump) and missing `alt` attributes.
6. `TEST-P8-06`: `MaintainabilityProbe` flags monolithic files ($> 800$ lines) and missing `package-lock.json`.
7. `TEST-P8-07`: `AnalyzerOrchestrator` runs all probes and produces a valid CQS-compliant Evidence Package.
8. `TEST-P8-08`: End-to-end `castle-gate scan` CLI command executes, runs CQS, and outputs standard exit codes.
9. `TEST-P8-09`: Analyzer evasion test (obfuscated regex, unusual whitespace) does not crash the probe.
10. `TEST-P8-10`: Execution speed benchmark: Probes scan a 50-file repository in $< 500\text{ms}$.
11. `TEST-P8-11`: CQS v1.1 immutability verified (65 controls, 100.00 nominal weight, byte-identical hashes).

---

## 11. Section J: Objective Completion Criteria for Phase 8

Phase 8 will be declared complete when:
- [ ] `ATTACK-17` is verified fixed and defended.
- [ ] All 3 native probes (`SecurityProbe`, `DomSemanticsProbe`, `MaintainabilityProbe`) and orchestrator are implemented in `castle-gate/analyzers/`.
- [ ] The CLI supports `castle-gate scan` to evaluate a real directory from scratch.
- [ ] All new Phase 8 tests PASS (100%).
- [ ] All 139 existing base tests continue to PASS (100%).
- [ ] `cqs/` SHA-256 hashes are verified 100% byte-identical.
- [ ] 0 git commits, 0 git push, 0 modifications in production directories.
