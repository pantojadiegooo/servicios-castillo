# Castle Security & Quality Gate (C1→C6) — Human Policy Ratification Decision
**Document ID:** `DECISION-GATE-RATIF-2026-01`  
**Classification:** Sovereign Engineering Governance Standard  
**Ratification Status:** `APPROVED / RATIFIED`  
**Ratification Authority:** Grupo Castillo Technical Leadership & Architecture Board  
**Effective Policy Version:** `1.0.0-ratified` (`CASTLE-GATE-POLICY-MATRIX-RATIFIED.json`)  
**Underlying Methodology:** `CQS v1.1 (FROZEN / SINGLE SOURCE OF TRUTH)`  
**Ratification Timestamp:** `2026-08-13T18:41:21-06:00`  

---

## 1. Formal Act of Human Ratification

```text
================================================================================
                    CASTLE SECURITY & QUALITY GATE C1→C6
                       HUMAN RATIFICATION = APPROVED
================================================================================
```

By explicit authority and technical direction of **Grupo Castillo**, the proposed policy matrix (V2 Audited) is hereby **FORMALLY RATIFIED AND ACTIVATED** as the official delivery release governance policy of Grupo Castillo.

### Principles of Decision:
1. **Uncompromising Technical Rigor:** Defensible before CTOs, CISOs, Chief Architects, and Enterprise Security Auditors.
2. **Deterministic Release Governance:** Release decisions are derived mathematically from evidence and policy rules, with zero subjective heuristic bias.
3. **Strict Separation of Concerns:**
   $$\text{CQS v1.1 (What is measured)} \longrightarrow \text{CQS Engine (How it is computed)} \longrightarrow \text{Castle Gate (How results control delivery)} \longrightarrow \text{Gate Policy (What must be satisfied)}$$
4. **Non-Negotiable Baseline Safety:** Gate Breakers (`GB-01` to `GB-05`) remain active across all levels C1 through C6. No score, waiver, or role can override an active Gate Breaker.
5. **No Claims Exceeding Software Reality:** Castle Gate validates evidence packages; it does not claim to be an external compliance audit (SOC2/ISO) nor an APM/RUM collector.

---

## 2. Ratified Policy Parameters (`HR-GATE-01` to `HR-GATE-09`)

```text
+---------------+-------------------------------+---------------------------------------------------------------------------------------------------------------+
| Parameter ID  | Parameter Name                | Ratified Value / Rule                                                                                         |
+---------------+-------------------------------+---------------------------------------------------------------------------------------------------------------+
| HR-GATE-01    | minimum_cqs_score             | C1: 70.0 | C2: 78.0 | C3: 85.0 | C4: 90.0 | C5: 95.0 | C6: 98.0                                             |
| HR-GATE-02    | required_controls             | C1: 12   | C2: 21   | C3: 33   | C4: 60   | C5: 65   | C6: 65 (Literally enumerated control IDs)              |
| HR-GATE-03    | required_domains              | C1: 6 Domains (MNT excluded) | C2..C6: 7 Domains (All official CQS domains mandatory)                        |
| HR-GATE-04    | required_evidence_types       | C1: [lab, audit] | C2: [+infra] | C3: [+runtime] | C4..C6: [+field, +automated_test]                            |
| HR-GATE-05    | allow_unexecuted_controls     | C1: true | C2: true | C3: false | C4: false | C5: false | C6: false (EVIDENCE_PENDING on C3..C6)            |
| HR-GATE-06    | allow_conditional_approval    | C1: true | C2: true | C3: true | C4: false | C5: false | C6: false (Zero waivers on C4..C6)                 |
| HR-GATE-07    | approval_roles_required       | AUTH_CLASS_1_PEER_LEAD through AUTH_CLASS_6_GOVERNANCE_BOARD                                                  |
| HR-GATE-08    | remediation_window_hours      | C1: 168h (7d) | C2: 120h (5d) | C3: 72h (3d) | C4: 48h (2d) | C5: 24h (1d) | C6: 12h (immediate)         |
| HR-GATE-09    | post_verification_required    | C1: false | C2: false | C3: true | C4: true | C5: true | C6: true (48h post-release telemetry check)       |
+---------------+-------------------------------+---------------------------------------------------------------------------------------------------------------+
```

---

## 3. Official Ratified Policy Matrix (C1 to C6)

| Level | Name | Objective Risk Profile | Min Score | Req. Domains | Req. Controls Count | Evidence Types | UNEXECUTED Allowed | CONDITIONAL Allowed | Authority Class | Remediation Window | Post-Verif. | Mandatory Gate Breakers |
|---|---|---|:---:|:---:|:---:|---|:---:|:---:|---|:---:|:---:|:---:|
| **C1** | FOUNDATION | `LOW_OPERATIONAL_RISK` | **`70.0`** | 6 (excl. MNT) | 12 Controls | `lab`, `code_audit` | `true` | `true` | `AUTH_CLASS_1_PEER_LEAD` | 168h (7d) | `false` | `GB-01..05` |
| **C2** | STANDARD | `STANDARD_COMMERCIAL_RISK` | **`78.0`** | 7 Domains | 21 Controls | `lab`, `audit`, `infra` | `true` | `true` | `AUTH_CLASS_2_MULTI_DISCIPLINE` | 120h (5d) | `false` | `GB-01..05` |
| **C3** | PROFESSIONAL | `MODERATE_TRANSACTIONAL_RISK` | **`85.0`** | 7 Domains | 33 Controls | `lab`, `audit`, `infra`, `runtime` | `false` | `true` | `AUTH_CLASS_3_TRIAD_SIGN_OFF` | 72h (3d) | `true` | `GB-01..05` |
| **C4** | ADVANCED | `HIGH_ENTERPRISE_RISK` | **`90.0`** | 7 Domains | 60 Controls | `lab`, `field`, `runtime`, `test` | `false` | `false` | `AUTH_CLASS_4_STAFF_TRIAD` | 48h (2d) | `true` | `GB-01..05` |
| **C5** | CRITICAL | `CRITICAL_OPERATIONAL_RISK` | **`95.0`** | 7 Domains | 65 / 65 Controls | `lab`, `field`, `runtime`, `test` | `false` | `false` | `AUTH_CLASS_5_EXECUTIVE_SECURITY` | 24h (1d) | `true` | `GB-01..05` |
| **C6** | ULTIMATE | `MAXIMUM_GOVERNANCE_RISK` | **`98.0`** | 7 Domains | 65 / 65 Controls | `lab`, `field`, `runtime`, `test` | `false` | `false` | `AUTH_CLASS_6_GOVERNANCE_BOARD` | 12h | `true` | `GB-01..05` |

---

## 4. Invariant Core Methodology Verification

```text
================================================================================
                     CQS v1.1 METHODOLOGY INVARIANTS
================================================================================
Methodology Version:     1.1.0-candidate (FROZEN / SINGLE SOURCE OF TRUTH)
Atomic Controls:         65 / 65 Verified (24 EXPLICITLY_APPROVED, 41 DERIVED, 0 NEW_PROPOSAL)
Official Domains:        7 / 7 Verified (PER, SEC, ACC, SEO, UX, REL, MNT)
Nominal Weight Sum:      100.00 Verified
TEST 04 Status:          Pending / UNEXECUTED (Strictly preserved)
PARTIAL Status:          OPEN METHODOLOGICAL DECISION (Inactive in Engine)
Directory Integrity:     cqs/ SHA-256 Hashes Byte-Identical
================================================================================
```

---

## 5. Traceability & Lineage Chain

1. **`cqs-v1.1-specification.md`**: Frozen foundational measurement methodology.
2. **`CASTLE-GATE-ARCHITECTURE.md`**: Gate engine, evidence intake, and audit trail design.
3. **`CASTLE-GATE-POLICY-MATRIX.md`**: Initial 16-field policy schema with `UNSPECIFIED` baseline templates.
4. **`CASTLE-GATE-POLICY-RATIFICATION-PROPOSAL-V2.md`**: Audited technical proposal.
5. **`DECISION-GATE-RATIF-2026-01` (This Document)**: Formal sovereign ratification act.
6. **`CASTLE-GATE-POLICY-MATRIX-RATIFIED.json`**: Effective runtime policy artifact for production delivery pipelines.
