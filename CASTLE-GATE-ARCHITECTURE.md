# Castle Security & Quality Gate (C1→C6) — Architectural Specification
**Document Version:** `1.0.0-candidate`  
**Classification:** Core Governance & Delivery Architecture Standard  
**Underlying Engine:** `CQS v1.1 Engine (FROZEN / SINGLE SOURCE OF TRUTH)`  
**Maintainer:** Castle Engineering Architecture Board

---

## 1. Executive Summary & Purpose

The **Castle Security & Quality Gate** constitutes the governance, delivery-control, and release decision layer of the Castle engineering ecosystem. It bridges the gap between raw quantitative technical quality assessment and release authorization:

$$\text{CQS v1.1 (Normative)} \longrightarrow \text{CQS Engine (Evaluation)} \longrightarrow \text{Gate Policy (Thresholds)} \longrightarrow \text{Gate Decision (C1}\dots\text{C6)}$$

### Core Separation of Concerns:
* **`CQS v1.1` = WHAT IS MEASURED:** The frozen standard defining the 65 atomic controls across 7 domains, nominal weights (100.00), and evidence types.
* **`CQS ENGINE` = HOW IT IS COMPUTED:** The deterministic evaluation and mathematical scoring engine calculating double-precision CQS scores without bias or heuristics.
* **`CASTLE GATE` = HOW THE RESULT IS USED TO CONTROL DELIVERY:** The policy-driven decision engine that determines whether a target system meets the required tier (C1 through C6) for deployment, flagging blockers, enforcing vetoes, and recording immutable audit trails.

---

## 2. High-Level Architecture

```text
                                  CASTLE SECURITY & QUALITY GATE
                                                │
                       ┌────────────────────────┴────────────────────────┐
                       │                                                 │
                  Gate Policy                                       Gate Level
            (Default or Override)                                     C1 → C6
                       │                                                 │
                       └────────────────────────┬────────────────────────┘
                                                │
                                      GATE DECISION ENGINE
                                                │
                         ┌──────────────────────┴──────────────────────┐
                         │                                             │
                  CQS EVALUATION                               EVIDENCE PACKAGE
                 (Consumed Output)                           (Intake & Provenance)
                         │                                             │
             ┌───────────┴───────────┐                         ┌───────┴───────┐
             │       CQS ENGINE      │                         │  Snapshots &  │
             │ (Scoring & Validator) │                         │  Audit Trail  │
             └───────────┬───────────┘                         └───────────────┘
                         │
                 CQS v1.1 STANDARD
              (FROZEN / SINGLE SOURCE)
```

---

## 3. The C1 → C6 Gate Level Taxonomy

The Castle Gate establishes a 6-tier progression of delivery rigor. Rather than hardcoding fragmented subsets of controls, each level is defined as a configurable **Gate Policy**:

```text
┌──────┐
│  C6  │ ULTIMATE       Peak quality tier; zero tolerance for defects or unverified items.
├──────┤
│  C5  │ CRITICAL       Mission-critical; multi-layered fault isolation & strict security posture.
├──────┤
│  C4  │ ADVANCED       High-exigency SaaS/enterprise; deep automated runtime & resilience validation.
├──────┤
│  C3  │ PROFESSIONAL   Business-critical; high conversion, transactional data, strict performance.
├──────┤
│  C2  │ STANDARD       Commercial standard websites, dynamic portals, Core Web Vitals compliance.
├──────┤
│  C1  │ FOUNDATION     Baseline hygiene & release safety for simple digital presence.
└──────┘
```

> [!NOTE]
> **Governance Invariant:** Specific numerical thresholds, control subsets, and required approval roles for C1 through C6 remain explicitly designated as `"UNSPECIFIED"` (`REQUIRES GOVERNANCE DECISION`). The architecture provides full extensibility to bind ratified thresholds without modifying the underlying engine.

---

## 4. Architectural Components

### 4.1. Gate Policy Model & Policy Resolver (`castle-gate/policy/`)
* **`gate-levels.json`:** Formal definition of level metadata, tier ranks, and target profiles.
* **`default-policies.json`:** Configurable policy templates for levels C1 to C6.
* **`policy-resolver.js`:** Pure resolver mapping level codes (`C1`..`C6`) to their active policy rules, allowing deterministic custom configuration overrides without modifying default baselines.

### 4.2. Evidence Package Manager (`castle-gate/evidence/`)
* Packages all raw evaluation telemetry, gate evidence, and provenance metadata (`project_id`, `environment`, `collected_by`, `source_repo`, `commit_sha`).
* Computes SHA-256 payload checksums and maintains immutable snapshot records (`package_id`).

### 4.3. Gate Decision Engine (`castle-gate/engine/`)
* Consumes the `CQS Evaluation Result` from the underlying CQS Engine without duplicating scoring formulas.
* Evaluates Gate Breakers (`GB-01` to `GB-05`): Any active breaker immediately triggers a **`BLOCKED`** state.
* Evaluates CQS score against `minimum_cqs_score` if specified by policy. If unspecified, maps through CQS release verdict (`PASS_RELEASE` $\implies$ `PASSED`).
* Evaluates unexecuted controls against policy tolerance.

### 4.4. State Model (`castle-gate/engine/gate-states.js`)
Operational release states are strictly separated from CQS normative statuses (`PASS`, `FAIL`, `N/A`, `UNEXECUTED`):
* `NOT_STARTED`
* `IN_PROGRESS`
* `EVIDENCE_PENDING`
* `EVALUATION_PENDING`
* `BLOCKED`
* `CONDITIONAL`
* `PASSED`
* `REQUIRES_REMEDIATION`
* `VERIFICATION_PENDING`
* `CLOSED`

### 4.5. Remediation Tracker (`castle-gate/remediation/`)
* Manages the lifecycle: $\text{Evaluation} \to \text{Blocker/Failure} \to \text{Remediation} \to \text{Re-evaluation} \to \text{Verification} \to \text{Decision}$.
* Maintains an append-only, immutable historical log of cycles (`RemediationSession`). Never overwrites previous cycle records.

### 4.6. Audit Trail & Full Traceability (`castle-gate/audit/`)
* Generates an immutable `GateAuditRecord` linking:
  $$\text{Evidence Package} \longrightarrow \text{Control} \longrightarrow \text{Subcriterion} \longrightarrow \text{Domain} \longrightarrow \text{CQS Score} \longrightarrow \text{Gate Decision}$$
* Tracks explicit multidimensional versioning: `cqs_specification_version`, `cqs_engine_version`, `gate_version`, `gate_policy_version`, `evaluation_id`, `evidence_package_id`.

---

## 5. Architectural Invariants

1. **CQS v1.1 Immutability:** The `cqs/` directory is frozen and serves as an immutable dependency. The Gate never modifies CQS definitions, weights, or scoring models.
2. **Zero Scoring Duplication:** All numerical scores originate solely from `cqs.evaluateCqs()`.
3. **Deterministic Decisions:** Idéntico payload de evidencia + misma política = decisión idéntica byte a byte.
4. **Binary Veto Isolation:** Gate Breakers veto deployment independently of numerical CQS score.
5. **No Assumed Thresholds:** Where policy parameters are not yet ratified by governance, they are recorded as `"UNSPECIFIED"` without generating arbitrary auto-penalties.
