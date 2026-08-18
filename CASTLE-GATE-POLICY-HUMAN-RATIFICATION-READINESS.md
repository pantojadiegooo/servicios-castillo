# Castle Security & Quality Gate (C1→C6) — Human Ratification Readiness Dossier
**Document ID:** `DOSSIER-GATE-RATIF-2026-01`  
**Classification:** Pre-Ratification Formal Audit & Readiness Standard  
**Underlying Methodology:** `CQS v1.1 (FROZEN / SINGLE SOURCE OF TRUTH)`  
**Audit Evaluation:** `READY_FOR_HUMAN_RATIFICATION`  
**Target Policy Artifact:** `CASTLE-GATE-POLICY-MATRIX-PROPOSED-V2.json`  
**Authors:** Senior Systems Architecture & QA Governance Team  

---

## 1. Executive Decision

```text
================================================================================
          AUDIT VERDICT: READY_FOR_HUMAN_RATIFICATION
          RATIFICATION STATUS: PENDING HUMAN AUTHORITY SIGN-OFF
================================================================================
```

The Castle Security & Quality Gate policy ratification dossier has undergone exhaustive multi-phase technical audit and validation. The proposed policy matrix (V2 Audited) is **architecturally decoupled from scoring, mathematically monotonic, deterministically evaluated, and free from synthetic or invented constraints**.

The repository is fully prepared for the **Grupo Castillo Architecture Board** to formally ratify the parameters `HR-GATE-01` through `HR-GATE-09`.

---

## 2. Categorized Audit Findings

### 2.1. CONFIRMED (Verified Facts)
1. **Architectural Separation:** `CQS v1.1` defines *what is measured*; `CQS Engine` calculates *how it is computed*; `Castle Gate` executes *release decisions*. The Gate does not re-compute scores, modify weights, or redefine subcriteria.
2. **Registry Containment:** 100% of the controls required across C1 to C6 ($12, 21, 33, 60, 65, 65$) exist literally in the CQS 65-control registry (`controls.json`).
3. **Domain Containment:** 100% of the domains required across C1 to C6 exist literally in the CQS 7-domain registry (`domains.json`).
4. **Gate Breaker Invariance:** `GB-01` through `GB-05` are enforced unconditionally across all 6 levels. No score, waiver, or conditional approval can bypass an active Gate Breaker.
5. **Double Precision Determinism:** Scoring and policy evaluations are 100% deterministic given identical evidence inputs.

### 2.2. REQUIRES HUMAN DECISION (Governance Ratification Items)
1. **Threshold Calibration:** Ratification of the monotonic scale $[70.0, 78.0, 85.0, 90.0, 95.0, 98.0]$.
2. **C1 Domain Scoping:** Formal approval of excluding `MNT` (Maintainability) from Level C1.
3. **C4 Specialized Sub-controls:** Ratification of omitting the 5 specialized sub-controls (`PER-04.3`, `PER-04.4`, `SEC-05.3`, `ACC-04.3`, `SEO-04.3`) from the mandatory blocking list of C4 for pure non-social B2B platforms.
4. **Remediation SLA Windows:** Formal sign-off on remediation windows $[168\text{h}, 120\text{h}, 72\text{h}, 48\text{h}, 24\text{h}, 12\text{h}]$.

### 2.3. IMPLEMENTATION GAPS (Explicit Software Boundaries)
1. **Authority Identity / IAM:** `approval_authority_class` and `approval_roles_required` are governance metadata tags. The Gate Engine does not provide built-in cryptographic SSO, biometric authentication, or RBAC directories; authorization must be verified by the executing delivery pipeline.
2. **Telemetry Ingestion:** `post_verification_required` instructs the Gate to verify post-release evidence packages; the Gate itself does not host an active APM, CrUX daemon, or RUM collector.

### 2.4. METHODOLOGICAL RISKS (Documented & Mitigated)
1. **Risk of Early Waiver Abuse (C1..C3):** Mitigated by making conditional approval strictly impossible on levels C4, C5, and C6, and by barring waivers from overriding Gate Breakers.
2. **Risk of Untested Real-User Performance in Staging:** Mitigated by mandating Field telemetry (`PER-01.2`, `PER-02.2`, `PER-03.2`) and automated CI tests from C4 upwards.

---

## 3. Human Ratification Register (`HR-GATE-01` to `HR-GATE-09`)

```text
================================================================================
                 GOVERNANCE DECISION REGISTER STATUS
================================================================================
```

| Reference ID | Parameter Name | Proposed Value / Scale | Technical Status | Recommendation | Human Decision Required |
|---|---|---|---|:---:|---|
| **`HR-GATE-01`** | `minimum_cqs_score` | `[70.0, 78.0, 85.0, 90.0, 95.0, 98.0]` | `AUDITED_CONFORMANT` | **`ACCEPT`** | Confirm numerical thresholds match tier risk appetite. |
| **`HR-GATE-02`** | `required_controls` | `[12, 21, 33, 60, 65, 65]` controls | `AUDITED_CONFORMANT` | **`ACCEPT`** | Ratify specific control ID subsets. |
| **`HR-GATE-03`** | `required_domains` | `C1: 6 doms`, `C2..C6: 7 doms` | `AUDITED_CONFORMANT` | **`ACCEPT`** | Ratify exclusion of `MNT` in C1. |
| **`HR-GATE-04`** | `required_evidence_types` | `Lab/Audit (C1/C2)` $\to$ `Field/Runtime (C3..C6)` | `AUDITED_CONFORMANT` | **`ACCEPT`** | Ratify field telemetry mandate from C4 upwards. |
| **`HR-GATE-05`** | `allow_unexecuted_controls` | `C1/C2: true`, `C3..C6: false` | `AUDITED_CONFORMANT` | **`ACCEPT`** | Confirm strict blocking on missing evidence for C3..C6. |
| **`HR-GATE-06`** | `allow_conditional_approval`| `C1..C3: true`, `C4..C6: false` | `AUDITED_CONFORMANT` | **`ACCEPT`** | Ratify zero waiver policy for enterprise tiers. |
| **`HR-GATE-07`** | `approval_roles_required` | `AUTH_CLASS_1` $\to$ `AUTH_CLASS_6` | `AUDITED_CONFORMANT` | **`ACCEPT`** | Ratify authority escalation hierarchy. |
| **`HR-GATE-08`** | `remediation_window_hours` | `[168h, 120h, 72h, 48h, 24h, 12h]` | `AUDITED_CONFORMANT` | **`ACCEPT`** | Confirm alignment with organizational SLA policies. |
| **`HR-GATE-09`** | `post_verification_required`| `C1/C2: false`, `C3..C6: true` | `AUDITED_CONFORMANT` | **`ACCEPT`** | Ratify mandatory post-release verification checks. |

---

## 4. Final Proposed C1→C6 Policy Matrix

```text
+-------+-------------------+-------------+---------------+-------------------+----------------------+--------------------+-------------------+
| Level | Name              | Min Score   | Req. Domains  | Req. Controls     | Allowed UNEXECUTED   | Allowed CONDITIONAL| Remediation Window|
+-------+-------------------+-------------+---------------+-------------------+----------------------+--------------------+-------------------+
| C1    | FOUNDATION        | 70.0        | 6 (excl. MNT) | 12 Controls       | YES (true)           | YES (true)         | 168h (7 days)     |
| C2    | STANDARD          | 78.0        | 7 Domains     | 21 Controls       | YES (true)           | YES (true)         | 120h (5 days)     |
| C3    | PROFESSIONAL      | 85.0        | 7 Domains     | 33 Controls       | NO (false)           | YES (strict triad) | 72h (3 days)      |
| C4    | ADVANCED          | 90.0        | 7 Domains     | 60 Controls       | NO (false)           | NO (false)         | 48h (2 days)      |
| C5    | CRITICAL          | 95.0        | 7 Domains     | 65 / 65 Controls  | NO (false)           | NO (false)         | 24h (1 day)       |
| C6    | ULTIMATE          | 98.0        | 7 Domains     | 65 / 65 Controls  | NO (false)           | NO (false)         | 12h (immediate)   |
+-------+-------------------+-------------+---------------+-------------------+----------------------+--------------------+-------------------+
```

---

## 5. Known Limitations & Software Boundaries

1. **Gate Decision Engine is Deterministic & Stateless:** It processes an evaluation payload and produces a release verdict. Temporal tracking of remediation expiration is logged via `remediation-tracker.js` append-only sessions, but must be scheduled by an external orchestrator (CI/CD pipeline or cron job).
2. **Lab vs Field Telemetry Independence:** The CQS Engine handles $N/A$ on Field metrics without distorting the score divisor. The Gate relies on this mathematical isolation.
3. **No External Marketing Assumptions:** The Gate is an internal release governance mechanism; it does not constitute an external ISO/IEC certification by itself.

---

## 6. Core Integrity Verification

* **CQS Methodology Version:** `1.1.0 (FROZEN)`
* **Total Atomic Controls:** `65`
* **Total Official Domains:** `7`
* **Total Nominal Weight:** `100.00`
* **Origin Breakdown:** `24 EXPLICITLY_APPROVED`, `41 DERIVED_FROM_APPROVED_CRITERION`, `0 NEW_PROPOSAL`.
* **Byte-Identical Hashing:** Directory `cqs/` SHA-256 hashes verified 100% identical.
* **`TEST 04` Status:** Strictly `Pending / UNEXECUTED`.
* **`PARTIAL` Status:** Strictly `OPEN METHODOLOGICAL DECISION (Inactive)`.

---

## 7. Automated Test Suite Results

```text
================================================================================
                   AUTOMATED TEST SUITE EXECUTION SUMMARY
================================================================================
Total Tests Executed: 91
Total Passed:         91
Total Failed:         0
Total Skipped:        0

Suite Breakdown:
- cqs-integrity-test.js:                  15/15 PASS (100%)
- gate-architecture-test.js:              13/13 PASS (100%)
- policy-infrastructure-test.js:           15/15 PASS (100%)
- policy-matrix-test.js:                   15/15 PASS (100%)
- policy-ratification-proposal-test.js:    15/15 PASS (100%)
- policy-ratification-traceability-test.js: 18/18 PASS (100%)
================================================================================
```

---

## 8. Git & Working Tree Status

```text
NO COMMIT PERFORMED
NO PUSH PERFORMED
NO PRODUCTION CODE MODIFIED
```
* The production repository `iglesia_cristiana` remains untouched.
* Baseline policy file `default-policies.json` remains strictly with `UNSPECIFIED` values.
* Ratification proposals are isolated in `CASTLE-GATE-POLICY-MATRIX-PROPOSED-V2.json` and `CASTLE-GATE-POLICY-HUMAN-RATIFICATION-REGISTER.json`.
