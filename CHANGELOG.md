# CHANGELOG — Castle Engineering Specification

All notable changes to the Castle Engineering Specification (CES) and Castle Quality Score (CQS) methodology will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.1.0-candidate] - 2026-08-13

### Added
- **Official 7-Domain Architecture (24 Subcriteria / 100 Pts):**
  - `PER` (20.0): LCP (4.0) / CLS (4.0) / INP (4.0) / Asset Optimization (4.0) / Caching-Minification (4.0)
  - `SEC` (20.0): SSL/TLS (4.0) / Security Headers (4.0) / Endpoint-Abuse Protection (4.0) / OWASP Mitigation (4.0) / Information Disclosure (4.0)
  - `ACC` (15.0): Semantic Hierarchy (3.75) / Keyboard-Focus (3.75) / Contrast (3.75) / Interactive-ARIA (3.75)
  - `SEO` (15.0): Indexability (3.75) / Dynamic Meta-Canonicals (3.75) / Heading Hierarchy (3.75) / Schema Markup (3.75)
  - `UX` (15.0): Responsiveness (3.75) / Tap Targets (3.75) / Critical Flow (3.75) / Error States (3.75)
  - `REL` (10.0): Availability (5.0) / Error Handling (5.0)
  - `MNT` (5.0): Modularity-Code Hygiene (2.5) / Dependency Hygiene (2.5)
- **Atomic N/A Weight Exclusion:** Non-applicable (`N/A`) status is isolated at the individual atomic control level ($c_i$), dynamically pruning the divisor for accurate subcriterion scoring.
- **Subcriterion Pruning Rule:** If 100% of atomic controls within a given subcriterion evaluate to `N/A`, the subcriterion is completely pruned from the parent domain's applicable weight sum.
- **Laboratory vs. Field Decoupling:** Laboratory simulation and Real-User Field telemetry are treated as independent atomic controls across Core Web Vitals; Field controls default to `N/A` when telemetry is insufficient.
- **Internal Full Precision Arithmetic:** Specified that all mathematical aggregations maintain double-precision floating-point arithmetic throughout the calculation pipeline, applying rounding (2 decimal places) exclusively at the reporting presentation layer.

### Changed
- **Governance Alignment:** Standardized C1–C6 domain definitions as `Draft`, CQS/Risk/Gate specifications as `Candidate`, Test 01–03 as `Provisional Calibration Data`, and Test 04 as `Pending / UNEXECUTED`.
- **JSON Schema:** Updated `schemas/cqs-v1.1.json` to reflect the 7 official domains, 24 subcriteria, and strict schema validation rules.
