# Castle Security & Quality Gate (C1→C6) — Policy Ratification Proposal
**Document ID:** `PROPOSAL-GATE-POL-2026-01`  
**Classification:** Formal Engineering Proposal  
**Governance State:** `PROPOSED / REQUIRES HUMAN RATIFICATION`  
**Underlying Engine:** `CQS v1.1 (FROZEN / SINGLE SOURCE OF TRUTH)`  
**Authors:** Senior Systems Architecture & QA Governance Team  

---

## 1. Executive Summary & Philosophy

The purpose of this document is to establish a **technically rigorous, economically viable, and defensible proposal** for ratifying the nine open governance parameters (`HR-GATE-01` through `HR-GATE-09`) within the **Castle Security & Quality Gate (C1→C6)** framework.

### Governing Invariant:
$$\text{CQS v1.1 (What is measured)} \longrightarrow \text{CQS Engine (How it is computed)} \longrightarrow \text{Castle Gate (How results control delivery)} \longrightarrow \text{Gate Policy (What must be satisfied)}$$

The progression from **C1** to **C6** does not represent arbitrary linear increments; it mirrors the real-world escalation of:
1. **Operational Criticality & Business Blast Radius**
2. **Threat Landscape & Attack Surface**
3. **Evidence Modality Requirements (Lab $\to$ Runtime $\to$ Real-User Field Telemetry)**
4. **Tolerance to Incomplete / Unexecuted Controls**
5. **Remediation Urgency & Window Tightness**
6. **Sign-off Responsibility & Organizational Accountability**

> [!IMPORTANT]
> **Status Notice:** This document constitutes a formal engineering proposal. No values contained herein are automatically enforced until formal human ratification by the Grupo Castillo Architecture Board.

---

## 2. Level-by-Level Proposed Policy Specifications

---

### 2.1. Level C1 — FOUNDATION

* **Intended Scope:** Simple digital presence, brochure sites, local micro-businesses, informational landing pages.
* **Risk Profile:** `LOW_OPERATIONAL_RISK` (No transactions, no sensitive data stored, limited dynamic attack surface).
* **Proposed Minimum CQS Score (`HR-GATE-01`):** **`70.0`**
* **Required Controls (`HR-GATE-02`):** 12 Baseline Controls
  * `PER-01.1` (Lab LCP), `PER-02.1` (Lab CLS)
  * `SEC-01.1` (Valid SSL/TLS), `SEC-01.2` (HTTPS Enforcement), `SEC-02.1` (HSTS), `SEC-02.2` (Basic Security Headers), `SEC-04.1` (Basic Injection Protection)
  * `ACC-01.1` (Heading Semantic Hierarchy), `ACC-03.1` (Color Contrast AA)
  * `SEO-01.1` (Indexability Meta)
  * `UX-01.1` (Viewport Responsiveness)
  * `REL-01.1` (Base Availability / HTTP 200)
* **Required Domains (`HR-GATE-03`):** `['PER', 'SEC', 'ACC', 'SEO', 'UX', 'REL']` (MNT is informational).
* **Required Evidence Types (`HR-GATE-04`):** `['lab', 'code_audit']` (No field telemetry required).
* **Allow UNEXECUTED Controls (`HR-GATE-05`):** **`true`** (Allows omission of non-applicable advanced telemetry controls).
* **Allow Conditional Approval (`HR-GATE-06`):** **`true`** (With recorded technical debt note).
* **Approval Roles Required (`HR-GATE-07`):** `['Technical Lead']`
* **Remediation Window (`HR-GATE-08`):** **`168 hours (7 days)`**
* **Post-Verification Required (`HR-GATE-09`):** **`false`**
* **Mandatory Gate Breakers:** `[GB-01, GB-02, GB-03, GB-04, GB-05]` (Non-negotiable).

**Technical Rationale:** Small businesses and simple static sites need foundational protection against basic vulnerabilities (plain HTTP, missing SSL, broken contrast, unreadable mobile viewports) without the financial and operational overhead of real-user field telemetry or advanced CI/CD dependency scans.

---

### 2.2. Level C2 — STANDARD

* **Intended Scope:** Standard commercial portals, corporate brand sites, dynamic content blogs, lead-generation hubs.
* **Risk Profile:** `STANDARD_COMMERCIAL_RISK` (Brand reputation risk, standard CMS surfaces, dynamic content delivery).
* **Proposed Minimum CQS Score (`HR-GATE-01`):** **`78.0`**
* **Required Controls (`HR-GATE-02`):** 21 Core Commercial Controls
  * All C1 controls + `PER-04.1` (Asset Optimization), `SEC-02.3` (X-Content-Type-Options), `SEC-02.4` (X-Frame-Options), `ACC-02.1` (Keyboard Navigation), `SEO-02.1` (Canonical/Dynamic Meta), `SEO-03.1` (Heading Hierarchy), `UX-02.1` (Tap Target Sizing), `REL-02.1` (404 Error Handling), `MNT-01.1` (Code Hygiene).
* **Required Domains (`HR-GATE-03`):** `['PER', 'SEC', 'ACC', 'SEO', 'UX', 'REL', 'MNT']` (All 7 domains active).
* **Required Evidence Types (`HR-GATE-04`):** `['lab', 'code_audit', 'infrastructure']`
* **Allow UNEXECUTED Controls (`HR-GATE-05`):** **`true`** (Permits unexecuted field telemetry prior to public traffic launch).
* **Allow Conditional Approval (`HR-GATE-06`):** **`true`** (Requires documented remediation plan).
* **Approval Roles Required (`HR-GATE-07`):** `['QA Lead', 'Technical Lead']`
* **Remediation Window (`HR-GATE-08`):** **`120 hours (5 days)`**
* **Post-Verification Required (`HR-GATE-09`):** **`false`**
* **Mandatory Gate Breakers:** `[GB-01, GB-02, GB-03, GB-04, GB-05]`

**Technical Rationale:** Commercial corporate sites require comprehensive SEO crawlability, click-jacking protection (`X-Frame-Options`), responsive tap targets, and clean asset optimization to prevent bounce rates and preserve search rankings.

---

### 2.3. Level C3 — PROFESSIONAL

* **Intended Scope:** E-commerce storefronts, high-conversion marketing funnels, transactional customer portals.
* **Risk Profile:** `MODERATE_TRANSACTIONAL_RISK` (Direct revenue impact, payment gateways, user data capture).
* **Proposed Minimum CQS Score (`HR-GATE-01`):** **`85.0`**
* **Required Controls (`HR-GATE-02`):** 33 Transactional & Accessibility Controls
  * All C2 controls + `PER-03.1` (Lab INP), `PER-05.1` (Caching/Minification), `SEC-03.1` (Endpoint Abuse & Rate Limiting), `SEC-04.2` (CSRF Mitigation), `SEC-05.1` (Info Disclosure Prevention), `ACC-01.2`, `ACC-04.1` (Full ARIA semantics), `SEO-04.1` (Schema Structured Data), `UX-03.1` (Critical Flow Non-blocking), `UX-04.1` (Form Error State Validation), `REL-01.2` (Uptime SLI Verification), `MNT-02.1` (Dependency Hygiene).
* **Required Domains (`HR-GATE-03`):** `['PER', 'SEC', 'ACC', 'SEO', 'UX', 'REL', 'MNT']`
* **Required Evidence Types (`HR-GATE-04`):** `['lab', 'code_audit', 'infrastructure', 'runtime']`
* **Allow UNEXECUTED Controls (`HR-GATE-05`):** **`false`** (All applicable controls must be evaluated).
* **Allow Conditional Approval (`HR-GATE-06`):** **`true`** (Strict sign-off required).
* **Approval Roles Required (`HR-GATE-07`):** `['QA Lead', 'Security Lead', 'Lead Architect']`
* **Remediation Window (`HR-GATE-08`):** **`72 hours (3 days)`**
* **Post-Verification Required (`HR-GATE-09`):** **`true`** (48-hour post-launch telemetry check).
* **Mandatory Gate Breakers:** `[GB-01, GB-02, GB-03, GB-04, GB-05]`

**Technical Rationale:** If a checkout flow breaks, form validation fails, or an endpoint is vulnerable to credential stuffing, the business loses revenue immediately. C3 enforces runtime validation, interactive accessibility, structured e-commerce schema, and post-release verification.

---

### 2.4. Level C4 — ADVANCED

* **Intended Scope:** Enterprise SaaS platforms, multi-tenant cloud applications, data-intensive B2B portals.
* **Risk Profile:** `HIGH_ENTERPRISE_RISK` (SLA obligations, confidential tenant data, high concurrency, API integrations).
* **Proposed Minimum CQS Score (`HR-GATE-01`):** **`90.0`**
* **Required Controls (`HR-GATE-02`):** Comprehensive 60+ Atomic Controls
  * All Lab + Field Core Web Vitals (`PER-01.1/2`, `PER-02.1/2`, `PER-03.1/2`, `PER-04.1/2`, `PER-05.1/2`).
  * Complete Security Suite (`SEC-01` through `SEC-05` exhaustive).
  * WCAG 2.1 AA Full Accessibility (`ACC-01` through `ACC-04`).
  * Full UX Resilience & Error Boundaries (`UX-01` through `UX-04`).
  * Strict Reliability & Multi-Dependency Hygiene (`REL-01/02`, `MNT-01/02`).
* **Required Domains (`HR-GATE-03`):** `['PER', 'SEC', 'ACC', 'SEO', 'UX', 'REL', 'MNT']`
* **Required Evidence Types (`HR-GATE-04`):** `['lab', 'field', 'runtime', 'code_audit', 'infrastructure', 'automated_test']`
* **Allow UNEXECUTED Controls (`HR-GATE-05`):** **`false`** (Zero unexecuted controls permitted).
* **Allow Conditional Approval (`HR-GATE-06`):** **`false`** (No conditional waivers allowed).
* **Approval Roles Required (`HR-GATE-07`):** `['Principal Architect', 'Security Lead', 'DevOps / SRE Lead']`
* **Remediation Window (`HR-GATE-08`):** **`48 hours (2 days)`**
* **Post-Verification Required (`HR-GATE-09`):** **`true`** (Automated production synthetic + field telemetry).
* **Mandatory Gate Breakers:** `[GB-01, GB-02, GB-03, GB-04, GB-05]`

**Technical Rationale:** Enterprise SaaS platforms cannot afford performance degradation on real user devices (Field telemetry mandatory) nor unhandled error states in production. Multi-tenancy demands strict isolation, security headers, rate limiting, and zero waiver releases.

---

### 2.5. Level C5 — CRITICAL

* **Intended Scope:** Financial transaction cores, healthcare/confidential PII processing hubs, mission-critical infrastructure.
* **Risk Profile:** `CRITICAL_OPERATIONAL_RISK` (Direct financial loss, regulatory compliance exposure, severe data breach impact).
* **Proposed Minimum CQS Score (`HR-GATE-01`):** **`95.0`**
* **Required Controls (`HR-GATE-02`):** Exact 65/65 Controls Evaluated (Zero non-applicable exemptions on core safety).
* **Required Domains (`HR-GATE-03`):** `['PER', 'SEC', 'ACC', 'SEO', 'UX', 'REL', 'MNT']`
* **Required Evidence Types (`HR-GATE-04`):** `['lab', 'field', 'runtime', 'code_audit', 'infrastructure', 'automated_test']`
* **Allow UNEXECUTED Controls (`HR-GATE-05`):** **`false`**
* **Allow Conditional Approval (`HR-GATE-06`):** **`false`**
* **Approval Roles Required (`HR-GATE-07`):** `['CISO / VP Security', 'Principal Architect', 'Head of Engineering']`
* **Remediation Window (`HR-GATE-08`):** **`24 hours (1 day)`**
* **Post-Verification Required (`HR-GATE-09`):** **`true`** (Real-time telemetry + failover readiness check).
* **Mandatory Gate Breakers:** `[GB-01, GB-02, GB-03, GB-04, GB-05]`

**Technical Rationale:** For financial and critical systems, security and uptime are existential. C5 requires executive security sign-off (CISO), exhaustive evaluation of all 65 controls with score $\ge 95.0$, zero waivers, and immediate 24-hour remediation of any detected defect.

---

### 2.6. Level C6 — ULTIMATE

* **Intended Scope:** Flagship enterprise distributed architectures, sovereign platforms, highest security & quality tier.
* **Risk Profile:** `MAXIMUM_GOVERNANCE_RISK` (Zero defect tolerance, maximum engineering scrutiny).
* **Proposed Minimum CQS Score (`HR-GATE-01`):** **`98.0`**
* **Required Controls (`HR-GATE-02`):** Exact 65/65 Controls with near-perfect execution across all domains.
* **Required Domains (`HR-GATE-03`):** `['PER', 'SEC', 'ACC', 'SEO', 'UX', 'REL', 'MNT']`
* **Required Evidence Types (`HR-GATE-04`):** `['lab', 'field', 'runtime', 'code_audit', 'infrastructure', 'automated_test']`
* **Allow UNEXECUTED Controls (`HR-GATE-05`):** **`false`**
* **Allow Conditional Approval (`HR-GATE-06`):** **`false`**
* **Approval Roles Required (`HR-GATE-07`):** `['Executive Technical Board', 'CISO', 'Principal Architect', 'Director of QA']`
* **Remediation Window (`HR-GATE-08`):** **`12 hours`** (Immediate critical remediation).
* **Post-Verification Required (`HR-GATE-09`):** **`true`** (Continuous automated monitoring + automated rollback triggers).
* **Mandatory Gate Breakers:** `[GB-01, GB-02, GB-03, GB-04, GB-05]`

**Technical Rationale:** C6 represents the theoretical and practical pinnacle of software delivery engineering in the Castle ecosystem. A minimum score of 98.0 demands virtually defect-free software across all 7 domains, backed by executive board sign-off.

---

## 3. Comparative Policy Progression Matrix

| Governance Dimension | C1 (FOUNDATION) | C2 (STANDARD) | C3 (PROFESSIONAL) | C4 (ADVANCED) | C5 (CRITICAL) | C6 (ULTIMATE) |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **Target Risk Profile** | Low / Static | Standard Commercial | Transactional Funnel | Enterprise SaaS | Financial / Mission-Critical | Flagship Sovereign |
| **Minimum CQS Score** | **`70.0`** | **`78.0`** | **`85.0`** | **`90.0`** | **`95.0`** | **`98.0`** |
| **Mandatory Domains** | 6 Domains (excl. MNT) | All 7 Domains | All 7 Domains | All 7 Domains | All 7 Domains | All 7 Domains |
| **Mandatory Controls Count** | 12 Baseline | 21 Commercial | 33 Transactional | 60+ Exhaustive | 65 / 65 Controls | 65 / 65 Controls |
| **Evidence Modalities** | Lab, Code Audit | Lab, Audit, Infra | Lab, Audit, Infra, Runtime | Lab, Field, Runtime, Tests | Lab, Field, Runtime, Tests | Lab, Field, Runtime, Tests |
| **Allow UNEXECUTED** | `true` | `true` | `false` | `false` | `false` | `false` |
| **Allow CONDITIONAL** | `true` | `true` | `true` | `false` | `false` | `false` |
| **Approval Authority** | Tech Lead | QA Lead + Tech Lead | QA + Security + Architect | Principal Arch + Sec + SRE | CISO + Arch + Head of Eng | Exec Board + CISO + QA Dir |
| **Remediation Window** | 168 hrs (7 d) | 120 hrs (5 d) | 72 hrs (3 d) | 48 hrs (2 d) | 24 hrs (1 d) | 12 hrs |
| **Post-Verification** | `false` | `false` | `true` (48h) | `true` (prod telemetry) | `true` (real-time failover) | `true` (continuous circuit) |
| **Gate Breakers** | `GB-01`..`GB-05` | `GB-01`..`GB-05` | `GB-01`..`GB-05` | `GB-01`..`GB-05` | `GB-01`..`GB-05` | `GB-01`..`GB-05` |

---

## 4. Formal Resolution Proposal for Open Governance Items

```text
================================================================================
                    POLICY DECISION RESOLUTION PROPOSAL
================================================================================
```

* **`HR-GATE-01` (Score Thresholds):** Adopt progression $[70.0, 78.0, 85.0, 90.0, 95.0, 98.0]$.
* **`HR-GATE-02` (Required Controls):** Scope subsets progressively from 12 baseline hygiene controls (C1) to all 65 atomic controls (C5/C6).
* **`HR-GATE-03` (Required Domains):** Mandate 6 domains for C1 and all 7 domains for C2 through C6.
* **`HR-GATE-04` (Evidence Modalities):** Require synthetic lab evidence for C1/C2; enforce real-user field telemetry and runtime monitoring from C3/C4 upwards.
* **`HR-GATE-05` (UNEXECUTED Tolerance):** Tolerate unexecuted non-critical items for C1/C2; strictly prohibit unexecuted components for C3, C4, C5, and C6.
* **`HR-GATE-06` (Conditional Approval):** Allow conditional release waivers with logged technical debt for C1, C2, and C3; strictly prohibit waivers for C4, C5, and C6.
* **`HR-GATE-07` (Approval Roles):** Scale sign-off authority from single Tech Lead (C1) up to full Executive Board & CISO (C6).
* **`HR-GATE-08` (Remediation Window):** Scale remediation window from 168h (C1) down to 12h (C6).
* **`HR-GATE-09` (Post-Verification):** Enforce mandatory post-deployment telemetry audits for C3, C4, C5, and C6.

---

## 5. Defense for Enterprise Audits (CTO / CISO Perspective)

When defending this policy matrix in an enterprise audit:
1. **Zero Subjectivity:** Decisions are derived from double-precision calculations and explicit registry checks, eliminating arbitrary "gut feeling" approvals.
2. **Defensible Proportionality:** A local brochure site is not forced to bear the multi-thousand dollar telemetry overhead of a fintech core, but both are guaranteed immune to catastrophic Gate Breakers (`GB-01` to `GB-05`).
3. **Audit Immutability:** Every evaluation produces a cryptographically hashed evidence package and immutable audit trail, providing complete legal and technical compliance proof.
