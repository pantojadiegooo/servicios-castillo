# Castle Engineering Record (CER) — Evaluation Template

**Record ID:** `CER-YYYYMMDD-XXXX`  
**Specification Version:** `1.1.0-candidate`  
**Evaluation Status:** `[Candidate / Official Audit]`  
**Date of Evaluation:** `YYYY-MM-DD`  
**Auditor:** `[Auditor Name / Role / Team]`  

---

## 1. System Metadata & Target Environment

| Attribute | Value / Specification |
|---|---|
| **System Name** | `[Project Name]` |
| **System Version** | `[Git commit / SemVer release]` |
| **Target Environment** | `[production / staging / development]` |
| **Architecture Type** | `[static-brochure / single-region-dynamic / distributed-or-multi-region / microservices-enterprise]` |
| **Target URL** | `[https://...]` |
| **Repository URL** | `[https://github.com/... or local path]` |

---

## 2. Executive Summary & Verdict (7 Official Domains)

| Metric | Nominal / Target | Evaluated Value | Status |
|---|---|---|---|
| **Castle Quality Score (CQS)** | $\ge 85.00$ | **`XX.XX`** / 100.00 | `[PASS / CONDITIONAL / FAIL]` |
| **Total Applicable Weight ($W_{total}^{app}$)** | 100.0 | **`XX.X`** | — |
| **Total Excluded Weight ($W_{total}^{ex}$)** | 0.0 | **`XX.X`** | — |
| **Gate-Breakers Status** | Must be CLEARED | **`[CLEARED / BLOCKED]`** | `[OK / VETO]` |
| **Aggregate Risk Index ($RI$)** | $< 25.0$ (LOW) | **`XX.XX`** | `[LOW / MODERATE / HIGH / CRITICAL]` |
| **FINAL RELEASE VERDICT** | — | **`[PASS_RELEASE / CONDITIONAL_APPROVAL / FAIL_BLOCKED]`** | — |

---

## 3. Gate-Breakers Verification (Binary Veto Protocol — Candidate)

| Gate Code | Gate Description | Verification Method | Triggered? | Audit Evidence / Notes |
|---|---|---|---|---|
| **`GB-01`** | Insecure Transport / Broken TLS | Automated TLS & HTTP 301 check | `[YES / NO]` | `...` |
| **`GB-02`** | Exposed Secrets / Hardcoded Keys | Git secret scan (Gitleaks) | `[YES / NO]` | `...` |
| **`GB-03`** | Critical Injection / Admin Bypass | Static & Dynamic SAST probe | `[YES / NO]` | `...` |
| **`GB-04`** | Core Flow Disruption / Fatal Crash | Automated E2E smoke tests | `[YES / NO]` | `...` |
| **`GB-05`** | Critical A11y Keyboard Trap | Manual keyboard navigation audit | `[YES / NO]` | `...` |

---

## 4. 7-Domain Atomic Control Audit Log (24 Subcriteria / 65 Controls)

### 4.1. Performance (`PER` — Nominal Weight: 20.0)

| Control Code | Control Name | Weight | Status | Score (0-1) | Points Earned | Evidence / Observation |
|---|---|:---:|---|---|---|---|
| `PER-01.1` | LCP Lab Measurement ($\le 2.5s$) | 2.0 | `[PASS/FAIL]` | `...` | `...` | Simulated LCP: `X.Xs` |
| `PER-01.2` | LCP Field Telemetry (CrUX/RUM) | 2.0 | `[PASS/FAIL/NA]` | `...` | `...` | CrUX 75th pctl: `X.Xs` |
| `PER-02.1` | INP Lab Measurement ($\le 200ms$) | 2.0 | `[PASS/FAIL]` | `...` | `...` | Simulated latency: `XXms` |
| `PER-02.2` | INP Field Telemetry ($\le 200ms$) | 2.0 | `[PASS/FAIL/NA]` | `...` | `...` | CrUX 75th pctl: `XXms` |
| `PER-03.1` | CLS Lab Measurement ($\le 0.1$) | 2.0 | `[PASS/FAIL]` | `...` | `...` | Simulated CLS: `0.0X` |
| `PER-03.2` | CLS Field Telemetry ($\le 0.1$) | 2.0 | `[PASS/FAIL/NA]` | `...` | `...` | CrUX 75th pctl: `0.0X` |
| `PER-04.1` | Next-Gen Image Formats (AVIF/WebP)| 1.0 | `[PASS/FAIL]` | `...` | `...` | Modern formats used |
| `PER-04.2` | Responsive Image Sizing & Dims | 1.0 | `[PASS/FAIL]` | `...` | `...` | Explicit width/height & srcset |
| `PER-04.3` | Text Compression (Brotli/Gzip) | 1.0 | `[PASS/FAIL]` | `...` | `...` | Compression active |
| `PER-04.4` | Modern Protocols (HTTP/2 / HTTP/3)| 1.0 | `[PASS/FAIL]` | `...` | `...` | Multiplexed transport |
| `PER-05.1` | Caching & CDN Edge Strategy | 2.0 | `[PASS/FAIL]` | `...` | `...` | Immutable static caching |
| `PER-05.2` | Code Minification & Bundle Hygiene| 2.0 | `[PASS/FAIL]` | `...` | `...` | Minified bundles |
| **PER Subtotal** | **Applicable Weight: XX.X** | **20.0** | — | — | **`XX.XX`** | **Domain Score: `XX.XX%`** |

---

### 4.2. Security & Privacy (`SEC` — Nominal Weight: 20.0)

| Control Code | Control Name | Weight | Status | Score (0-1) | Points Earned | Evidence / Observation |
|---|---|:---:|---|---|---|---|
| `SEC-01.1` | TLS Certificate Validation | 2.0 | `[PASS/FAIL]` | `1.0` | `2.0` | Valid TLS 1.3 cert |
| `SEC-01.2` | HTTP→HTTPS 301 Redirection | 2.0 | `[PASS/FAIL]` | `1.0` | `2.0` | Strict 301 redirect |
| `SEC-02.1` | Content-Security-Policy (CSP) | 0.8 | `[PASS/PARTIAL/FAIL]` | `...` | `...` | `...` |
| `SEC-02.2` | Strict-Transport-Security (HSTS) | 0.8 | `[PASS/FAIL]` | `...` | `...` | `...` |
| `SEC-02.3` | X-Frame-Options / frame-ancestors | 0.8 | `[PASS/FAIL]` | `...` | `...` | `...` |
| `SEC-02.4` | X-Content-Type-Options | 0.8 | `[PASS/FAIL]` | `...` | `...` | `...` |
| `SEC-02.5` | Referrer-Policy Header | 0.4 | `[PASS/FAIL]` | `...` | `...` | `...` |
| `SEC-02.6` | Permissions-Policy Header | 0.4 | `[PASS/FAIL]` | `...` | `...` | `...` |
| `SEC-03.1` | API / Route Rate Limiting | 2.0 | `[PASS/FAIL/NA]` | `...` | `...` | `...` |
| `SEC-03.2` | Bot & Abuse Mitigation | 2.0 | `[PASS/FAIL/NA]` | `...` | `...` | `...` |
| `SEC-04.1` | SQL Injection (SQLi) Prevention | 0.8 | `[PASS/FAIL/NA]` | `...` | `...` | `...` |
| `SEC-04.2` | Cross-Site Scripting (XSS) Prevention | 0.8 | `[PASS/FAIL]` | `...` | `...` | `...` |
| `SEC-04.3` | Cookie Security Flags | 0.8 | `[PASS/FAIL/NA]` | `...` | `...` | `...` |
| `SEC-04.4` | Password Hashing Standard | 0.8 | `[PASS/FAIL/NA]` | `...` | `...` | `...` |
| `SEC-04.5` | Session State Controls | 0.8 | `[PASS/FAIL/NA]` | `...` | `...` | `...` |
| `SEC-05.1` | Zero Secrets in Codebase | 2.0 | `[PASS/FAIL]` | `...` | `...` | `...` |
| `SEC-05.2` | Stack Trace & Error Leak Prevention| 1.0 | `[PASS/PARTIAL/FAIL]` | `...` | `...` | `...` |
| `SEC-05.3` | Server Fingerprint Leak Prevention | 1.0 | `[PASS/FAIL]` | `...` | `...` | `...` |
| **SEC Subtotal** | **Applicable Weight: XX.X** | **20.0** | — | — | **`XX.XX`** | **Domain Score: `XX.XX%`** |

---

### 4.3. Accessibility & Inclusivity (`ACC` — Nominal Weight: 15.0)

| Control Code | Control Name | Weight | Status | Score (0-1) | Points Earned | Evidence / Observation |
|---|---|:---:|---|---|---|---|
| `ACC-01.1` | HTML5 Semantic Landmarks | 1.875 | `[PASS/FAIL]` | `...` | `...` | Semantic landmark regions |
| `ACC-01.2` | Heading Tree & Single `<h1>` | 1.875 | `[PASS/FAIL]` | `...` | `...` | Unbroken heading tree |
| `ACC-02.1` | Keyboard Operability & Tab Order | 1.875 | `[PASS/FAIL]` | `...` | `...` | Full tab operability |
| `ACC-02.2` | Visible Focus Indicators | 1.875 | `[PASS/FAIL]` | `...` | `...` | High-contrast focus ring |
| `ACC-03.1` | WCAG 2.1 AA Normal Text Contrast| 1.875 | `[PASS/FAIL]` | `...` | `...` | $\ge 4.5:1$ (ISO/IEC 40500) |
| `ACC-03.2` | UI & Large Text Contrast | 1.875 | `[PASS/FAIL]` | `...` | `...` | $\ge 3:1$ UI components |
| `ACC-04.1` | Image Alternative Text | 0.9375| `[PASS/FAIL]` | `...` | `...` | Meaningful alt text |
| `ACC-04.2` | Control Accessible Names & Labels| 0.9375| `[PASS/FAIL]` | `...` | `...` | Interactive labels |
| `ACC-04.3` | ARIA Attributes & Roles | 1.875 | `[PASS/FAIL]` | `...` | `...` | Valid ARIA markup |
| **ACC Subtotal** | **Applicable Weight: XX.X** | **15.0** | — | — | **`XX.XX`** | **Domain Score: `XX.XX%`** |

---

### 4.4. Technical SEO & Discoverability (`SEO` — Nominal Weight: 15.0)

| Control Code | Control Name | Weight | Status | Score (0-1) | Points Earned | Evidence / Observation |
|---|---|:---:|---|---|---|---|
| `SEO-01.1` | Robots.txt Directives | 1.875 | `[PASS/FAIL]` | `...` | `...` | Valid robots.txt |
| `SEO-01.2` | XML Sitemap Referencing | 1.875 | `[PASS/FAIL]` | `...` | `...` | Valid sitemap.xml |
| `SEO-02.1` | Unique Page Titles (30-60 chars) | 0.9375| `[PASS/FAIL]` | `...` | `...` | Descriptive page titles |
| `SEO-02.2` | Meta Descriptions (120-160 chars)| 0.9375| `[PASS/FAIL]` | `...` | `...` | Compelling meta tags |
| `SEO-02.3` | Canonical URL Directives | 1.875 | `[PASS/FAIL]` | `...` | `...` | Canonical tags present |
| `SEO-03.1` | SEO Heading Tree Hierarchy | 1.875 | `[PASS/FAIL]` | `...` | `...` | Structured heading tags |
| `SEO-03.2` | Semantic Content Structure | 1.875 | `[PASS/FAIL]` | `...` | `...` | Clear semantic copy |
| `SEO-04.1` | JSON-LD Structured Data Schema | 1.875 | `[PASS/FAIL]` | `...` | `...` | Schema.org validation clean |
| `SEO-04.2` | Open Graph Social Metadata | 0.9375| `[PASS/FAIL]` | `...` | `...` | Open Graph metadata |
| `SEO-04.3` | Twitter Card Social Metadata | 0.9375| `[PASS/FAIL]` | `...` | `...` | Twitter Card tags |
| **SEO Subtotal** | **Applicable Weight: XX.X** | **15.0** | — | — | **`XX.XX`** | **Domain Score: `XX.XX%`** |

---

### 4.5. User Experience & Interface Quality (`UX` — Nominal Weight: 15.0)

| Control Code | Control Name | Weight | Status | Score (0-1) | Points Earned | Evidence / Observation |
|---|---|:---:|---|---|---|---|
| `UX-01.1` | Viewport Fluidity (320px–4K) | 1.875 | `[PASS/FAIL]` | `...` | `...` | Zero horizontal scroll |
| `UX-01.2` | Typography Scaling & Fluidity | 1.875 | `[PASS/FAIL]` | `...` | `...` | Viewport `clamp()` typography |
| `UX-02.1` | Castle UX Target Size ($48\times48$px)| 1.875 | `[PASS/FAIL]` | `...` | `...` | Castle UX Standard |
| `UX-02.2` | Target Spacing & Clearance | 1.875 | `[PASS/FAIL]` | `...` | `...` | Adequate touch spacing |
| `UX-03.1` | Critical Flow Completion | 1.875 | `[PASS/FAIL]` | `...` | `...` | Frictionless journey |
| `UX-03.2` | Form Ergonomics & Autocomplete | 1.875 | `[PASS/FAIL]` | `...` | `...` | Field labels, autocomplete |
| `UX-04.1` | Inline Validation Feedback | 1.875 | `[PASS/FAIL]` | `...` | `...` | Immediate error prompts |
| `UX-04.2` | Accessible Error Messaging | 1.875 | `[PASS/FAIL]` | `...` | `...` | Non-color-only indicators |
| **UX Subtotal** | **Applicable Weight: XX.X** | **15.0** | — | — | **`XX.XX`** | **Domain Score: `XX.XX%`** |

---

### 4.6. Reliability & Architecture (`REL` — Nominal Weight: 10.0)

| Control Code | Control Name | Weight | Status | Score (0-1) | Points Earned | Evidence / Observation |
|---|---|:---:|---|---|---|---|
| `REL-01.1` | Health Checks & Readiness | 2.5 | `[PASS/FAIL]` | `...` | `...` | `/healthz` live |
| `REL-01.2` | Failover & Process Auto-Restart | 2.5 | `[PASS/FAIL/NA]` | `...` | `...` | N/A for single-region |
| `REL-02.1` | Custom 404 Not Found Page | 2.5 | `[PASS/FAIL]` | `...` | `...` | Navigation recovery available |
| `REL-02.2` | Custom 500 Server Error Page | 2.5 | `[PASS/FAIL]` | `...` | `...` | Zero stack trace leakage |
| **REL Subtotal** | **Applicable Weight: XX.X** | **10.0** | — | — | **`XX.XX`** | **Domain Score: `XX.XX%`** |

---

### 4.7. Maintainability & Code Quality (`MNT` — Nominal Weight: 5.0)

| Control Code | Control Name | Weight | Status | Score (0-1) | Points Earned | Evidence / Observation |
|---|---|:---:|---|---|---|---|
| `MNT-01.1` | Separation of Concerns | 1.25 | `[PASS/FAIL]` | `...` | `...` | Decoupled presentation/logic |
| `MNT-01.2` | Design Token System & Reusability | 1.25 | `[PASS/FAIL]` | `...` | `...` | Unified CSS variables |
| `MNT-02.1` | Clean Dependency Tree | 1.25 | `[PASS/FAIL]` | `...` | `...` | Zero unused packages |
| `MNT-02.2` | Dependency Vulnerability Auditing | 1.25 | `[PASS/FAIL]` | `...` | `...` | Clean SBOM vulnerability scan |
| **MNT Subtotal** | **Applicable Weight: XX.X** | **5.0** | — | — | **`XX.XX`** | **Domain Score: `XX.XX%`** |

---

## 5. 3D Risk Assessment Log ($L \times I \times E$ — Candidate)

| Finding ID | Control Ref | Description | L (1-5) | I (1-5) | E (1-5) | Finding Risk ($Risk_i$) | Remediation Target |
|---|---|---|:---:|:---:|:---:|:---:|---|
| `RSK-001` | `...` | `...` | `X` | `X` | `X` | `XX.X` | `...` |

$$\text{Aggregate Risk Index } (RI) = 0.6 \times \max(Risk_i) + 0.4 \times \text{mean}(Risk_i) = \mathbf{XX.XX} \quad \text{([Tier Name])}$$

---

## 6. Auditor Sign-off

* **Primary Auditor:** `[Name]`  
* **Signature/Approval Token:** `[Token / Date]`  
* **Audit Determination:** `[APPROVED FOR RELEASE / REVISION REQUIRED / DEPLOYMENT FROZEN]`
