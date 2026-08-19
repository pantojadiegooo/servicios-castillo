# Castle Security & Quality Gate — Policy Matrix & Exception Register
**Document Version:** `1.0.1`  
**Classification:** Normative Policy Matrix Standard  
**Underlying Engine:** `CQS v1.1 Engine (FROZEN / SINGLE SOURCE OF TRUTH)`  
**Authority Reference:** Castle Engineering Architecture Board  
**Governance State:** `PENDING GOVERNANCE RATIFICATION`

---

## 1. Executive Summary & Separation of Responsibilities

The **Castle Security & Quality Gate** governs software release and delivery authorization across 6 tiered levels (C1 through C6). It builds strictly upon the frozen CQS v1.1 standard:

* **`CQS v1.1`** $\implies$ **WHAT IS MEASURED** (65 atomic controls, 7 official domains, 100.00 nominal weight).
* **`CQS ENGINE`** $\implies$ **HOW IT IS COMPUTED** (Deterministic scoring, Lab/Field isolation, double-precision aggregation).
* **`CASTLE GATE`** $\implies$ **HOW THE RESULT IS USED** (Release authorization, binary deployment vetoes, audit trails, remediation).
* **`GATE POLICY`** $\implies$ **WHAT CONDITIONS MUST BE SATISFIED** (Tier-specific requirements for C1 through C6).

> [!IMPORTANT]
> **Normative Invariant:** All numerical thresholds, control subsets, domain subsets, evidence requirements, and approval hierarchies not yet formally ratified by the Grupo Castillo Architecture Board are explicitly registered as **`UNSPECIFIED`** (`REQUIRES GOVERNANCE DECISION`). The software engine enforces policy validation and structure without inventing arbitrary values.

---

## 2. The C1 → C6 Level Taxonomy

```text
┌──────┐
│  C6  │ ULTIMATE       Flagship core enterprise; zero defect tolerance, maximum audit rigor.
├──────┤
│  C5  │ CRITICAL       Mission-critical / financial systems; multi-layered isolation & failover readiness.
├──────┤
│  C4  │ ADVANCED       Enterprise SaaS / multi-tenant; deep runtime evidence & strict security boundaries.
├──────┤
│  C3  │ PROFESSIONAL   High-conversion / e-commerce; transactional data protection & strict CWV performance.
├──────┤
│  C2  │ STANDARD       Standard commercial websites; Core Web Vitals, SEO integrity & security headers.
├──────┤
│  C1  │ FOUNDATION     Baseline hygiene & release safety for simple brochure sites / low-risk assets.
└──────┘
```

---

## 3. Normative Policy Matrix (C1 → C6)

| Parameter | C1 (FOUNDATION) | C2 (STANDARD) | C3 (PROFESSIONAL) | C4 (ADVANCED) | C5 (CRITICAL) | C6 (ULTIMATE) |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **`intended_scope`** | Static / Low-Risk Sites | Commercial Websites | Transactional / E-Commerce | Enterprise SaaS | Mission-Critical Platforms | Flagship Core Tier |
| **`risk_profile`** | `LOW_OPERATIONAL_RISK` | `STANDARD_COMMERCIAL_RISK` | `MODERATE_TRANSACTIONAL_RISK` | `HIGH_ENTERPRISE_RISK` | `CRITICAL_OPERATIONAL_RISK` | `MAXIMUM_GOVERNANCE_RISK` |
| **`policy_version`** | `1.0.0-draft` | `1.0.0-draft` | `1.0.0-draft` | `1.0.0-draft` | `1.0.0-draft` | `1.0.0-draft` |
| **`minimum_cqs_score`** | `UNSPECIFIED` | `UNSPECIFIED` | `UNSPECIFIED` | `UNSPECIFIED` | `UNSPECIFIED` | `UNSPECIFIED` |
| **`required_controls`** | `UNSPECIFIED` | `UNSPECIFIED` | `UNSPECIFIED` | `UNSPECIFIED` | `UNSPECIFIED` | `UNSPECIFIED` |
| **`required_domains`** | `UNSPECIFIED` | `UNSPECIFIED` | `UNSPECIFIED` | `UNSPECIFIED` | `UNSPECIFIED` | `UNSPECIFIED` |
| **`required_evidence_types`** | `UNSPECIFIED` | `UNSPECIFIED` | `UNSPECIFIED` | `UNSPECIFIED` | `UNSPECIFIED` | `UNSPECIFIED` |
| **`mandatory_gate_breakers`** | `[GB-01..GB-05]` | `[GB-01..GB-05]` | `[GB-01..GB-05]` | `[GB-01..GB-05]` | `[GB-01..GB-05]` | `[GB-01..GB-05]` |
| **`allow_unexecuted_controls`** | `UNSPECIFIED` | `UNSPECIFIED` | `UNSPECIFIED` | `UNSPECIFIED` | `UNSPECIFIED` | `UNSPECIFIED` |
| **`allow_conditional_approval`** | `UNSPECIFIED` | `UNSPECIFIED` | `UNSPECIFIED` | `UNSPECIFIED` | `UNSPECIFIED` | `UNSPECIFIED` |
| **`approval_roles_required`** | `UNSPECIFIED` | `UNSPECIFIED` | `UNSPECIFIED` | `UNSPECIFIED` | `UNSPECIFIED` | `UNSPECIFIED` |
| **`remediation_window_hours`** | `UNSPECIFIED` | `UNSPECIFIED` | `UNSPECIFIED` | `UNSPECIFIED` | `UNSPECIFIED` | `UNSPECIFIED` |
| **`post_verification_required`** | `UNSPECIFIED` | `UNSPECIFIED` | `UNSPECIFIED` | `UNSPECIFIED` | `UNSPECIFIED` | `UNSPECIFIED` |
| **`governance_status`** | `PROPOSED_POLICY_TEMPLATE` | `PROPOSED_POLICY_TEMPLATE` | `PROPOSED_POLICY_TEMPLATE` | `PROPOSED_POLICY_TEMPLATE` | `PROPOSED_POLICY_TEMPLATE` | `PROPOSED_POLICY_TEMPLATE` |
| **`decision_reference`** | `REQUIRES GOVERNANCE DECISION` | `REQUIRES GOVERNANCE DECISION` | `REQUIRES GOVERNANCE DECISION` | `REQUIRES GOVERNANCE DECISION` | `REQUIRES GOVERNANCE DECISION` | `REQUIRES GOVERNANCE DECISION` |

---

## 4. Policy Decision Register (Open Governance Items)

The following structured register catalogues all policy parameters requiring formal human ratification before production enforcement:

| Decision ID | Parameter Target | Affected Levels | Current Value | Status | Required Human Governance Action |
|---|---|:---:|:---:|:---:|---|
| **`HR-GATE-01`** | `minimum_cqs_score` | C1 → C6 | `UNSPECIFIED` | **`OPEN`** | Define numerical score thresholds ($0.0 \le \text{Score} \le 100.0$) for each level C1 through C6. |
| **`HR-GATE-02`** | `required_controls` | C1 → C6 | `UNSPECIFIED` | **`OPEN`** | Ratify whether specific sub-levels require mandatory subsets of the 65 CQS atomic controls. |
| **`HR-GATE-03`** | `required_domains` | C1 → C6 | `UNSPECIFIED` | **`OPEN`** | Ratify whether all 7 domains (`PER`, `SEC`, `ACC`, `SEO`, `UX`, `REL`, `MNT`) are mandatory across all tiers or if lower tiers allow domain scoping. |
| **`HR-GATE-04`** | `required_evidence_types` | C1 → C6 | `UNSPECIFIED` | **`OPEN`** | Define which evidence modalities (`lab`, `field`, `runtime`, `code_audit`, `infrastructure`) are mandatory per tier. |
| **`HR-GATE-05`** | `allow_unexecuted_controls` | C1 → C6 | `UNSPECIFIED` | **`OPEN`** | Ratify policy stance on whether lower tiers permit deployment when certain low-impact controls are `UNEXECUTED`. |
| **`HR-GATE-06`** | `allow_conditional_approval` | C1 → C6 | `UNSPECIFIED` | **`OPEN`** | Establish formal criteria under which conditional releases are authorized with tracked engineering remediation debt. |
| **`HR-GATE-07`** | `approval_roles_required` | C1 → C6 | `UNSPECIFIED` | **`OPEN`** | Define human sign-off matrix (e.g. QA Lead, Security Architect, CISO, Release Manager) required per level. |
| **`HR-GATE-08`** | `remediation_window_hours` | C1 → C6 | `UNSPECIFIED` | **`OPEN`** | Define maximum allowable time window for remediation of conditional blockers before release invalidation. |
| **`HR-GATE-09`** | `post_verification_required` | C1 → C6 | `UNSPECIFIED` | **`OPEN`** | Determine whether post-deployment runtime telemetry verification in production is mandatory for C4, C5, and C6. |

---

## 5. Architectural & Governance Safeguards

1. **Non-Invention Rule:** The engine never converts `"UNSPECIFIED"` into arbitrary numeric defaults (e.g., $C1=70$, $C2=80$). Unspecified parameters yield passthrough evaluations without synthetic penalties.
2. **Registry Integrity:** `policy-validator.js` guarantees that if a custom policy specifies controls or domains, they must exist in the 65-control / 7-domain CQS Registry. Unknown IDs are rejected with validation errors.
3. **Gate Breaker Invariant:** `GB-01` through `GB-05` remain active and non-negotiable release vetoes across all 6 levels.
4. **Override Immutability:** Project-level overrides produce cloned policy instances and never mutate the baseline templates or CQS normative files.
