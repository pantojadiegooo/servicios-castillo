# Castle Engineering Specification (CES)

**Document Version:** 1.1.0  
**Status:** Candidate Specification (C1–C6 Draft)  
**Classification:** Internal Engineering Standard  
**Maintainer:** Castle Engineering Architecture Board  

---

## 1. Executive Summary & Purpose

The **Castle Engineering Specification (CES)** establishes the authoritative, objective engineering quality standard for digital systems developed, evaluated, or audited within the Castle ecosystem. CES provides a unified governance framework integrating:

1. **Castle Quality Score (CQS v1.1):** A 100-point multi-domain quantitative evaluation methodology with atomic-level granularity and dynamic weight redistribution for non-applicable (`N/A`) controls across **7 official domains**.
2. **Gate-Breakers Protocol:** Non-negotiable binary release vetoes (`GB-01` to `GB-05`) that prevent deployment regardless of aggregate score. (Status: Candidate)
3. **Three-Dimensional Risk Scoring:** A quantitative risk matrix ($L \times I \times E$) assessing Likelihood, Impact, and Exposure. (Status: Candidate)
4. **Engineering Record Standard:** Systematic auditing templates and verification workflows.

---

## 2. Core Methodological Principles

1. **Objective Measurability:** Every criterion must be evaluated via observable, reproducible atomic controls.
2. **Atomic N/A Isolation:** Non-applicability is assessed strictly at the atomic control level ($c_i$). Excluded weights are removed from the subcriterion's divisor.
3. **Subcriterion Pruning:** If all atomic controls within a subcriterion are evaluated as `N/A`, the entire subcriterion is excluded from its domain.
4. **Independent Lab vs. Field Evaluation:** Synthetic laboratory measurements and real-user monitoring (RUM/Field) telemetry are treated as independent atomic controls. Field metrics default to `N/A` when statistical telemetry is insufficient.
5. **Full Internal Precision:** All internal mathematical aggregations maintain double-precision (IEEE 754 floating-point). Rounding is performed exclusively at the final presentation/reporting layer.
6. **Normative Separation:** International normative standards (e.g., WCAG 2.1 AA) maintain their exact legal and regulatory references, while enhanced internal recommendations (e.g., 48×48 px minimum touch target) are designated as Castle UX Standards under the `UX` domain.

---

## 3. Official 7-Domain Architecture & Weight Allocation

The Castle Quality Score distributes 100 base points across seven structural engineering domains:

| Domain Code | Domain Name | Target Weight | Subcriteria Breakdown | Status |
|---|---|:---:|---|:---:|
| **`PER`** | Performance | **20.0** | LCP (4.0) / CLS (4.0) / INP (4.0) / Asset Optimization (4.0) / Caching-Minification (4.0) | Draft |
| **`SEC`** | Security & Privacy | **20.0** | SSL/TLS (4.0) / Security Headers (4.0) / Endpoint-Abuse Protection (4.0) / OWASP Mitigation (4.0) / Information Disclosure (4.0) | Draft |
| **`ACC`** | Accessibility & Inclusivity | **15.0** | Semantic Hierarchy (3.75) / Keyboard-Focus (3.75) / Contrast (3.75) / Interactive-ARIA (3.75) | Draft |
| **`SEO`** | Technical SEO & Discoverability | **15.0** | Indexability (3.75) / Dynamic Meta-Canonicals (3.75) / Heading Hierarchy (3.75) / Schema Markup (3.75) | Draft |
| **`UX`** | User Experience & Interface Quality | **15.0** | Responsiveness (3.75) / Tap Targets (3.75) / Critical Flow (3.75) / Error States (3.75) | Draft |
| **`REL`** | Reliability & Architecture | **10.0** | Availability (5.0) / Error Handling (5.0) | Draft |
| **`MNT`** | Maintainability & Code Quality | **5.0** | Modularity-Code Hygiene (2.5) / Dependency Hygiene (2.5) | Draft |
| **TOTAL** | **All 7 Domains** | **100.0** | $\sum W_{dom} = 100.0$ | — |

---

## 4. Gate-Breakers (Binary Release Vetoes — Candidate)

Regardless of the calculated numerical CQS, any triggered Gate-Breaker results in an immediate **`GATE_BLOCKED`** status and a mandatory deployment veto:

* **`GB-01` (Insecure Transport / Plaintext Transmission):** Plaintext HTTP serving or TLS certificate validation failure on production/authenticated routes.
* **`GB-02` (Exposed Credentials / Hardcoded Secrets):** Plaintext secrets, private keys, or API tokens committed to codebase or exposed client-side.
* **`GB-03` (Critical Injection Vulnerability):** Confirmed unmitigated SQL Injection (SQLi), Remote Code Execution (RCE), or unauthenticated administrative bypass.
* **`GB-04` (Core Flow Disruption / Fatal Crash):** System crashing, blocking unhandled exception, or non-functional state on primary transactional paths.
* **`GB-05` (Critical Accessibility Blocker):** Total keyboard trap preventing navigation escape or complete lack of keyboard access to primary workflow.

---

## 5. Specification Governance & Calibration Status

* **CES Governance:** Candidate Specification (`1.1.0`).
* **Domain Structure (C1–C6 Draft):** Draft Status across all 7 official domains.
* **Calibration Test Scenarios (TEST 01–03):** Provisional Calibration Data.
* **Enterprise Calibration (TEST 04):** Pending / UNEXECUTED (Do not execute in this environment).

---

## 6. Document Hierarchy

```text
castle-engineering/
├── CES.md                             # Master Specification (7-domain official standard)
├── CHANGELOG.md                       # Version history and methodological errata
├── schemas/
│   └── cqs-v1.1.json                  # Formal JSON Schema definition (7 domains)
├── methodology/
│   ├── cqs.md                         # Mathematical scoring formulas & 7-domain breakdown
│   ├── risk-scoring.md                # 3D Risk evaluation matrix (L x I x E) [Candidate]
│   └── gate-breakers.md               # Binary veto definitions and escalation protocols [Candidate]
├── calibration/
│   ├── test-01.md                     # Provisional Calibration 01: Static brochure site
│   ├── test-02.md                     # Provisional Calibration 02: Transactional dynamic app
│   ├── test-03.md                     # Provisional Calibration 03: Edge-case high N/A exclusion
│   └── test-04.md                     # Enterprise Calibration 04: High-concurrency system (Pending / UNEXECUTED)
└── templates/
    └── engineering-record-template.md # Standardized audit and evaluation template (7 domains)
```
