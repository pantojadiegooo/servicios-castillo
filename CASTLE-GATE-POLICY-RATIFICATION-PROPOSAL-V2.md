# Castle Security & Quality Gate (C1→C6) — Policy Ratification Proposal (V2 Audited)
**Document ID:** `PROPOSAL-GATE-POL-2026-02-AUDITED`  
**Classification:** Formal Engineering Audit & Traceability Standard  
**Governance State:** `PROPOSED / REQUIRES HUMAN RATIFICATION`  
**Underlying Engine:** `CQS v1.1 (FROZEN / SINGLE SOURCE OF TRUTH)`  
**Authors:** Senior Systems Architecture & QA Governance Team  

---

## 1. Executive Summary & Audited Governance Principles

This document establishes the **audited traceability and governance justification** for ratifying the nine open policy parameters (`HR-GATE-01` through `HR-GATE-09`) within the **Castle Security & Quality Gate (C1→C6)** framework.

### Invariant Architectural Boundary:
* **`CQS v1.1`** $\implies$ **WHAT IS MEASURED:** Fixed normative standard defining 65 atomic controls across 7 domains with 100.00 nominal weight.
* **`CQS ENGINE`** $\implies$ **HOW IT IS COMPUTED:** Double-precision scoring calculation, strict Lab/Field decoupling, and zero heuristic bias.
* **`CASTLE GATE`** $\implies$ **HOW THE RESULT CONTROLS DELIVERY:** Policy-driven release decision engine applying tier-specific thresholds and vetoes.
* **`GATE POLICY`** $\implies$ **GOVERNANCE REQUIREMENTS:** Specific conditions, evidence modalities, and approval requirements for levels C1 to C6.

> [!IMPORTANT]
> **Audit Finding & V2 Evolution:**  
> This V2 proposal incorporates the findings of the Phase 4.1 Technical Audit:
> 1. Complete literal enumeration of all required controls per tier (C1: 12, C2: 21, C3: 33, C4: 60, C5: 65, C6: 65).
> 2. Introduction of the **`APPROVAL_AUTHORITY_CLASS`** abstraction, decoupling governance requirements from arbitrary corporate organizational charts.
> 3. Formal distinction between **`POST_VERIFICATION_REQUIRED`** (Gate evaluation rule) and external telemetry collection infrastructure.
> 4. Formalization of the **`UNEXECUTED ≠ N/A ≠ PASS ≠ FAIL`** deterministic lifecycle.

---

## 2. Complete Level-by-Level Traceability Matrix

---

### 2.1. Level C1 — FOUNDATION

* **LEVEL:** `C1`
* **OBJECTIVE_RISK:** `LOW_OPERATIONAL_RISK`  
  *Brochure sites, static landing pages, local micro-businesses. No financial transactions, no database storage of PII, low dynamic attack surface.*
* **MINIMUM_CQS_SCORE:** `70.0`
* **REQUIRED_DOMAINS:** `['PER', 'SEC', 'ACC', 'SEO', 'UX', 'REL']` *(MNT is informational/optional).*
* **REQUIRED_CONTROLS (12 Controls):**
  1. `PER-01.1` (LCP Lab Measurement)
  2. `PER-02.1` (INP Lab Measurement)
  3. `SEC-01.1` (TLS Certificate Validation)
  4. `SEC-01.2` (HTTP→HTTPS Strict Redirection)
  5. `SEC-02.1` (Content-Security-Policy Base)
  6. `SEC-02.2` (Strict-Transport-Security HSTS)
  7. `SEC-04.1` (SQL Injection Prevention)
  8. `ACC-01.1` (HTML5 Semantic Landmarks)
  9. `ACC-03.1` (WCAG 2.1 AA Text Color Contrast)
  10. `SEO-01.1` (Robots.txt Directives)
  11. `UX-01.1` (Viewport Fluidity & Zero Horizontal Overflow)
  12. `REL-01.1` (Health Checks / HTTP 200 Availability)
* **REQUIRED_EVIDENCE:** `['lab', 'code_audit']`
* **UNEXECUTED_POLICY:** `true` *(Permits unexecuted field telemetry or advanced runtime tests).*
* **CONDITIONAL_APPROVAL_POLICY:** `true` *(Allowed with documented technical debt note).*
* **APPROVAL_AUTHORITY:** `['Technical Lead']` (`AUTH_CLASS_1_PEER_LEAD`)
* **REMEDIATION_WINDOW:** `168 hours (7 days)`
* **POST_VERIFICATION:** `false`
* **GATE_BREAKERS:** `[GB-01, GB-02, GB-03, GB-04, GB-05]` *(Mandatory release vetoes).*
* **RATIONALE:** Guarantees foundational transport security, baseline mobile usability, and WCAG contrast without requiring multi-thousand dollar field telemetry overhead.
* **KNOWN_LIMITATIONS:** Does not verify real-user field telemetry (`PER-01.2`, `PER-02.2`) or complex modularity standards (`MNT`).

---

### 2.2. Level C2 — STANDARD

* **LEVEL:** `C2`
* **OBJECTIVE_RISK:** `STANDARD_COMMERCIAL_RISK`  
  *Corporate marketing portals, commercial brand websites, content hubs. Public brand reputation at stake; dynamic CMS.*
* **MINIMUM_CQS_SCORE:** `78.0`
* **REQUIRED_DOMAINS:** `['PER', 'SEC', 'ACC', 'SEO', 'UX', 'REL', 'MNT']` *(All 7 domains active).*
* **REQUIRED_CONTROLS (21 Controls):**
  * All 12 C1 controls PLUS:
  13. `PER-04.1` (Next-Gen Image Formats)
  14. `SEC-02.3` (X-Frame-Options / Clickjacking Protection)
  15. `SEC-02.4` (X-Content-Type-Options / MIME Sniffing)
  16. `ACC-02.1` (Keyboard Operability & Tab Order)
  17. `SEO-02.1` (Unique Page Titles)
  18. `SEO-03.1` (SEO Heading Tree Architecture)
  19. `UX-02.1` (Castle UX Target Size Standard - Min 44x44px)
  20. `REL-02.1` (Custom 404 Not Found Handling)
  21. `MNT-01.1` (Separation of Concerns & Architecture Hygiene)
* **REQUIRED_EVIDENCE:** `['lab', 'code_audit', 'infrastructure']`
* **UNEXECUTED_POLICY:** `true` *(Field telemetry may remain unexecuted prior to public traffic).*
* **CONDITIONAL_APPROVAL_POLICY:** `true` *(Requires structured remediation roadmap).*
* **APPROVAL_AUTHORITY:** `['QA Lead', 'Technical Lead']` (`AUTH_CLASS_2_MULTI_DISCIPLINE`)
* **REMEDIATION_WINDOW:** `120 hours (5 days)`
* **POST_VERIFICATION:** `false`
* **GATE_BREAKERS:** `[GB-01, GB-02, GB-03, GB-04, GB-05]`
* **RATIONALE:** Protects brand integrity through complete search crawlability, click-jacking defense, mobile touch ergonomics, and graceful 404 error boundaries.
* **KNOWN_LIMITATIONS:** Pre-launch sites lack historical field telemetry datasets.

---

### 2.3. Level C3 — PROFESSIONAL

* **LEVEL:** `C3`
* **OBJECTIVE_RISK:** `MODERATE_TRANSACTIONAL_RISK`  
  *E-commerce storefronts, customer self-service portals, lead-generation funnels. Direct revenue impact and transactional data capture.*
* **MINIMUM_CQS_SCORE:** `85.0`
* **REQUIRED_DOMAINS:** `['PER', 'SEC', 'ACC', 'SEO', 'UX', 'REL', 'MNT']`
* **REQUIRED_CONTROLS (33 Controls):**
  * All 21 C2 controls PLUS:
  22. `PER-03.1` (CLS Lab Measurement)
  23. `PER-05.1` (Cache-Control & Edge CDN Strategy)
  24. `SEC-03.1` (API / Route Rate Limiting)
  25. `SEC-04.2` (Cross-Site Scripting (XSS) Prevention)
  26. `SEC-05.1` (Zero Exposed Secrets in Code/Repo)
  27. `ACC-01.2` (Heading Hierarchy & Single `<h1>`)
  28. `ACC-04.1` (Image Alternative Text)
  29. `SEO-02.2` (Compelling Meta Descriptions)
  30. `SEO-04.1` (JSON-LD Structured Data Schema)
  31. `UX-03.1` (Conversion & Primary Flow Completion)
  32. `UX-04.1` (Inline Validation & Recovery Prompts)
  33. `REL-01.2` (Failover & Process Auto-Restart Verification)
* **REQUIRED_EVIDENCE:** `['lab', 'code_audit', 'infrastructure', 'runtime']`
* **UNEXECUTED_POLICY:** `false` *(All 33 required controls must have verified evidence; zero unexecuted permitted).*
* **CONDITIONAL_APPROVAL_POLICY:** `true` *(Requires signed waiver by Lead Architect).*
* **APPROVAL_AUTHORITY:** `['QA Lead', 'Security Lead', 'Lead Architect']` (`AUTH_CLASS_3_TRIAD_SIGN_OFF`)
* **REMEDIATION_WINDOW:** `72 hours (3 days)`
* **POST_VERIFICATION:** `true` *(Post-release verification within 48h).*
* **GATE_BREAKERS:** `[GB-01, GB-02, GB-03, GB-04, GB-05]`
* **RATIONALE:** Transactional platforms cannot afford checkout blockage, form validation failures, credential leaks, or API abuse. Enforces runtime rate limiting, JSON-LD schema, and error boundary recovery.
* **KNOWN_LIMITATIONS:** Requires automated runtime testing tooling for flow validation.

---

### 2.4. Level C4 — ADVANCED

* **LEVEL:** `C4`
* **OBJECTIVE_RISK:** `HIGH_ENTERPRISE_RISK`  
  *Enterprise SaaS applications, multi-tenant B2B portals, high-concurrency platforms. SLA commitments and confidential tenant data.*
* **MINIMUM_CQS_SCORE:** `90.0`
* **REQUIRED_DOMAINS:** `['PER', 'SEC', 'ACC', 'SEO', 'UX', 'REL', 'MNT']`
* **REQUIRED_CONTROLS (60 Controls):**
  * Comprehensive 60-control suite (All controls EXCEPT the 5 specialized sub-controls `PER-04.3`, `PER-04.4`, `SEC-05.3`, `ACC-04.3`, `SEO-04.3` which are evaluated when applicable but not hard blockers for non-social B2B portals):
  * Includes Full Lab + Field CWV (`PER-01.1/2`, `PER-02.1/2`, `PER-03.1/2`), Exhaustive Security (`SEC-01` to `SEC-05`), Full WCAG 2.1 AA Accessibility (`ACC-01` to `ACC-04`), Full UX (`UX-01` to `UX-04`), Strict Reliability & Modularity (`REL-01/02`, `MNT-01/02`).
* **REQUIRED_EVIDENCE:** `['lab', 'field', 'runtime', 'code_audit', 'infrastructure', 'automated_test']`
* **UNEXECUTED_POLICY:** `false` *(Zero unexecuted components allowed).*
* **CONDITIONAL_APPROVAL_POLICY:** `false` *(Zero release waivers allowed).*
* **APPROVAL_AUTHORITY:** `['Principal Architect', 'Security Lead', 'DevOps / SRE Lead']` (`AUTH_CLASS_4_STAFF_TRIAD`)
* **REMEDIATION_WINDOW:** `48 hours (2 days)`
* **POST_VERIFICATION:** `true` *(Automated synthetic and field telemetry verification).*
* **GATE_BREAKERS:** `[GB-01, GB-02, GB-03, GB-04, GB-05]`
* **RATIONALE:** Multi-tenant SaaS requires real-user field telemetry validation (Crux / RUM), multi-layered security headers, clean dependency hygiene, and zero conditional waivers.
* **KNOWN_LIMITATIONS:** Requires operational RUM telemetry infrastructure.

---

### 2.5. Level C5 — CRITICAL

* **LEVEL:** `C5`
* **OBJECTIVE_RISK:** `CRITICAL_OPERATIONAL_RISK`  
  *Financial transaction backends, health records, confidential PII hubs, core authentication systems. Direct regulatory, financial, and legal exposure.*
* **MINIMUM_CQS_SCORE:** `95.0`
* **REQUIRED_DOMAINS:** `['PER', 'SEC', 'ACC', 'SEO', 'UX', 'REL', 'MNT']`
* **REQUIRED_CONTROLS (65 / 65 Controls):**
  * **All 65/65 atomic controls strictly evaluated and required.** Zero non-applicable exemptions on core safety.
* **REQUIRED_EVIDENCE:** `['lab', 'field', 'runtime', 'code_audit', 'infrastructure', 'automated_test']`
* **UNEXECUTED_POLICY:** `false`
* **CONDITIONAL_APPROVAL_POLICY:** `false`
* **APPROVAL_AUTHORITY:** `['CISO / VP Security', 'Principal Architect', 'Head of Engineering']` (`AUTH_CLASS_5_EXECUTIVE_SECURITY`)
* **REMEDIATION_WINDOW:** `24 hours (1 day)`
* **POST_VERIFICATION:** `true` *(Immediate real-time telemetry validation + automated rollback triggers).*
* **GATE_BREAKERS:** `[GB-01, GB-02, GB-03, GB-04, GB-05]`
* **RATIONALE:** Financial and critical systems require executive security sign-off, exhaustive validation of all 65 controls with score $\ge 95.0$, and immediate 24-hour remediation.
* **KNOWN_LIMITATIONS:** High operational cost of telemetry and automated failover testing.

---

### 2.6. Level C6 — ULTIMATE

* **LEVEL:** `C6`
* **OBJECTIVE_RISK:** `MAXIMUM_GOVERNANCE_RISK`  
  *Flagship enterprise distributed architectures, sovereign platforms, highest security & quality tier within Castle ecosystem.*
* **MINIMUM_CQS_SCORE:** `98.0`
* **REQUIRED_DOMAINS:** `['PER', 'SEC', 'ACC', 'SEO', 'UX', 'REL', 'MNT']`
* **REQUIRED_CONTROLS (65 / 65 Controls):**
  * **All 65/65 atomic controls evaluated with near-perfect score across every subcriterion.**
* **REQUIRED_EVIDENCE:** `['lab', 'field', 'runtime', 'code_audit', 'infrastructure', 'automated_test']`
* **UNEXECUTED_POLICY:** `false`
* **CONDITIONAL_APPROVAL_POLICY:** `false`
* **APPROVAL_AUTHORITY:** `['Executive Technical Board', 'CISO', 'Principal Architect', 'Director of QA']` (`AUTH_CLASS_6_GOVERNANCE_BOARD`)
* **REMEDIATION_WINDOW:** `12 hours` *(Immediate critical remediation).*
* **POST_VERIFICATION:** `true` *(Continuous automated observability + circuit breaker enforcement).*
* **GATE_BREAKERS:** `[GB-01, GB-02, GB-03, GB-04, GB-05]`
* **RATIONALE:** Represents the pinnacle of engineering excellence. A score of 98.0 demands virtually defect-free software across all 7 domains backed by board-level sign-off.
* **KNOWN_LIMITATIONS:** Requires dedicated SRE and SecOps monitoring teams.

---

## 3. Governance Parameter Resolution Audit (`HR-GATE-01` to `HR-GATE-09`)

### `HR-GATE-01` — Minimum CQS Score Scale
* **Proposed Progression:** `[70.0, 78.0, 85.0, 90.0, 95.0, 98.0]`
* **Status:** `PROPOSED / PENDING HUMAN RATIFICATION`
* **Technical Justification:** Strictly monotonic. A score of 70.0 guarantees that low-risk sites satisfy baseline hygiene without failing over advanced field telemetry, while 98.0 at C6 represents mathematical near-perfection.

### `HR-GATE-02` — Required Controls Subsets
* **Proposed Subsets:** `C1: 12`, `C2: 21`, `C3: 33`, `C4: 60`, `C5: 65`, `C6: 65`.
* **Status:** `PROPOSED / PENDING HUMAN RATIFICATION`
* **Technical Justification:** Controls are partitioned by threat and failure modes:
  - C1 covers transport security (`SEC-01.1/2`), baseline headers (`SEC-02.1/2`), viewport (`UX-01.1`), and contrast (`ACC-03.1`).
  - C2 adds click-jacking (`SEC-02.3`), asset optimization (`PER-04.1`), and tap targets (`UX-02.1`).
  - C3 adds rate limiting (`SEC-03.1`), XSS (`SEC-04.2`), critical flow non-blocking (`UX-03.1`), and ARIA (`ACC-04.1`).
  - C4 expands to 60 controls including Field telemetry.
  - C5 and C6 enforce all 65/65 atomic controls.

### `HR-GATE-03` — Required Domains
* **Proposed Structure:** C1 requires 6 domains (`PER`, `SEC`, `ACC`, `SEO`, `UX`, `REL`); C2 through C6 require all 7 domains (`MNT` included).
* **Status:** `PROPOSED / PENDING HUMAN RATIFICATION`
* **Technical Justification:** For simple static sites (C1), code modularity and multi-package dependency tree hygiene (`MNT`) are non-applicable or low-impact. From C2 onwards, maintainability is mandatory.

### `HR-GATE-04` — Evidence Modalities
* **Proposed Modalities:**
  - C1: `lab`, `code_audit`
  - C2: `lab`, `code_audit`, `infrastructure`
  - C3: `lab`, `code_audit`, `infrastructure`, `runtime`
  - C4..C6: `lab`, `field`, `runtime`, `code_audit`, `infrastructure`, `automated_test`
* **Status:** `PROPOSED / PENDING HUMAN RATIFICATION`

### `HR-GATE-05` — UNEXECUTED Control Policy
* **Proposed Rule:** `allow_unexecuted_controls = true` in C1/C2; `false` in C3..C6.
* **Status:** `PROPOSED / PENDING HUMAN RATIFICATION`
* **Technical Justification:** Early-stage brochure sites do not have field telemetry datasets. From C3 upwards, any missing evaluation blocks delivery with `EVIDENCE_PENDING`.

### `HR-GATE-06` — Conditional Approval Policy
* **Proposed Rule:** `allow_conditional_approval = true` in C1..C3; `false` in C4..C6.
* **Status:** `PROPOSED / PENDING HUMAN RATIFICATION`
* **Technical Invariant:** Conditional waivers **can NEVER override Gate Breakers (`GB-01`..`GB-05`)** and require an active remediation window.

### `HR-GATE-07` — Approval Authority Classes
* **Proposed Abstraction:**
  - `AUTH_CLASS_1_PEER_LEAD` (Tech Lead)
  - `AUTH_CLASS_2_MULTI_DISCIPLINE` (QA + Tech Lead)
  - `AUTH_CLASS_3_TRIAD_SIGN_OFF` (QA + Security + Architect)
  - `AUTH_CLASS_4_STAFF_TRIAD` (Principal Arch + Security + SRE)
  - `AUTH_CLASS_5_EXECUTIVE_SECURITY` (CISO + Arch + Head of Eng)
  - `AUTH_CLASS_6_GOVERNANCE_BOARD` (Board + CISO + QA Dir)
* **Status:** `PROPOSED / PENDING HUMAN RATIFICATION`

### `HR-GATE-08` — Remediation Windows
* **Proposed Progression:** `[168h, 120h, 72h, 48h, 24h, 12h]`
* **Status:** `PROPOSED / PENDING HUMAN RATIFICATION`
* **Technical Justification:** Window starts at evaluation timestamp; expiration blocks release clearance until remediated and verified.

### `HR-GATE-09` — Post-Verification Requirement
* **Proposed Rule:** `false` for C1/C2; `true` for C3..C6.
* **Status:** `PROPOSED / PENDING HUMAN RATIFICATION`
* **Capability Distinction:** The Gate Engine checks intake evidence of post-release verification; external observability systems generate the telemetry.

---

## 4. Defense Against CTO / CISO Audit

1. **Deterministic Separation:** The Gate does not recalculate scores; it solely applies policy rules over frozen CQS Engine outputs.
2. **Zero Subjective Waivers at Enterprise Scale:** C4, C5, and C6 prohibit conditional waivers and unexecuted controls.
3. **Cryptographic Proof of Release:** Every release decision is bound to a SHA-256 evidence package checksum and an immutable audit trail.
