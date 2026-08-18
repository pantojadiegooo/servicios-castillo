# Castle Quality Score (CQS v1.1) — Methodology & Mathematical Specification

**Specification Version:** 1.1.0  
**Classification:** Engineering Evaluation Methodology  
**Status:** Candidate (C1–C6 Draft)  

---

## 1. Mathematical Architecture & Aggregation Hierarchy

The Castle Quality Score (CQS) aggregates engineering quality metrics across a strict 4-level hierarchy:

```
[Atomic Controls: c_i] ──> [Subcriteria: Sub_j] ──> [7 Official Domains: Dom_k] ──> [Global CQS: CQS_raw]
```

---

## 2. Mathematical Scoring Formulas

### 2.1. Atomic Control Evaluation ($c_i$)
Each atomic control $c_i$ is evaluated into a discrete status and an associated numerical score $s(c_i)$:
* **`PASS`**: $s(c_i) = 1.0$ (Full compliance with normative/technical requirement).
* **`PARTIAL`**: $0.0 < s(c_i) < 1.0$ (Partial compliance; documented in audit evidence).
* **`FAIL`**: $s(c_i) = 0.0$ (Non-compliance or defect detected).
* **`NOT_APPLICABLE` (`N/A`)**: Excluded from calculation; weight is eliminated from the divisor.

### 2.2. Subcriterion Scoring ($Sub_j$)
Let $C_j$ be the set of atomic controls under subcriterion $Sub_j$, each with nominal weight $w(c_i)$.

1. **Applicable Subcriterion Weight ($W_{j}^{app}$):**
   $$W_{j}^{app} = \sum_{c_i \in C_j, \, status(c_i) \neq \text{N/A}} w(c_i)$$

2. **Subcriterion Normalized Score ($S_j$):**
   $$S_j = \begin{cases} 
   \dfrac{\sum_{c_i \in C_j, \, status(c_i) \neq \text{N/A}} s(c_i) \cdot w(c_i)}{W_{j}^{app}} & \text{if } W_{j}^{app} > 0 \\ 
   \text{N/A} & \text{if } W_{j}^{app} = 0 
   \end{cases}$$

> **Subcriterion Pruning Rule:** If $W_j^{app} = 0$ (all atomic controls in $Sub_j$ are `N/A`), the entire subcriterion is marked `N/A` and its nominal weight $W_j$ is pruned from the parent domain.

### 2.3. Domain Scoring ($Dom_k$)
Let $S_k$ be the set of subcriteria under domain $Dom_k$, each with nominal subcriterion weight $W_j$.

1. **Applicable Domain Weight ($W_k^{app}$):**
   $$W_k^{app} = \sum_{Sub_j \in S_k, \, S_j \neq \text{N/A}} W_j$$

2. **Domain Normalized Score ($S_{dom, k}$):**
   $$S_{dom, k} = \begin{cases} 
   \dfrac{\sum_{Sub_j \in S_k, \, S_j \neq \text{N/A}} S_j \cdot W_j}{W_k^{app}} & \text{if } W_k^{app} > 0 \\ 
   \text{N/A} & \text{if } W_k^{app} = 0 
   \end{cases}$$

### 2.4. Global CQS Score ($CQS_{raw}$)
Let $\mathcal{D}$ be the set of all 7 official domains (`PER`, `SEC`, `ACC`, `SEO`, `UX`, `REL`, `MNT`), with nominal domain weights $W_{dom, k}$ ($\sum_{k=1}^7 W_{dom, k} = 100.0$).

1. **Total Applicable Weight ($W_{total}^{app}$):**
   $$W_{total}^{app} = \sum_{Dom_k \in \mathcal{D}, \, S_{dom, k} \neq \text{N/A}} W_{dom, k}$$

2. **Raw Score Calculation ($CQS_{raw}$):**
   $$CQS_{raw} = \left( \frac{\sum_{Dom_k \in \mathcal{D}, \, S_{dom, k} \neq \text{N/A}} S_{dom, k} \cdot W_{dom, k}}{W_{total}^{app}} \right) \times 100.0$$

3. **Display Rounding ($CQS_{display}$):**
   $$CQS_{display} = \text{round}(CQS_{raw}, 2)$$

---

## 3. Comprehensive Breakdown of the 7 Official Domains (24 Subcriteria / 65 Controls)

### 3.1. Domain: Performance (`PER`) — Nominal Weight: 20.0 (Draft)

| Code | Item / Control Name | Nominal Weight | Evaluation Standard / Notes |
|---|---|:---:|---|
| **`PER-01`** | **LCP** | **4.0** | |
| `PER-01.1` | LCP Lab Measurement | 2.0 | Simulated LCP $\le 2.5\text{s}$ (Good threshold). |
| `PER-01.2` | LCP Field Telemetry | 2.0 | CrUX/RUM 75th percentile $\le 2.5\text{s}$ (Mark `N/A` if telemetry insufficient). |
| **`PER-02`** | **INP** | **4.0** | |
| `PER-02.1` | INP Lab Measurement | 2.0 | Simulated interaction latency $\le 200\text{ms}$. |
| `PER-02.2` | INP Field Telemetry | 2.0 | CrUX/RUM 75th percentile $\le 200\text{ms}$ (Mark `N/A` if telemetry insufficient). |
| **`PER-03`** | **CLS** | **4.0** | |
| `PER-03.1` | CLS Lab Measurement | 2.0 | Simulated Cumulative Layout Shift $\le 0.1$. |
| `PER-03.2` | CLS Field Telemetry | 2.0 | CrUX/RUM 75th percentile $\le 0.1$ (Mark `N/A` if telemetry insufficient). |
| **`PER-04`** | **Asset Optimization** | **4.0** | |
| `PER-04.1` | Next-Gen Image Formats | 1.0 | Delivery of AVIF / WebP image formats. |
| `PER-04.2` | Responsive Image Dimensions | 1.0 | Explicit `width`/`height` attributes & responsive `srcset`. |
| `PER-04.3` | Text Compression | 1.0 | Brotli or Gzip active on all compressible textual resources. |
| `PER-04.4` | Modern Transport Protocols | 1.0 | Multiplexed HTTP/2 or HTTP/3 transport active. |
| **`PER-05`** | **Caching-Minification** | **4.0** | |
| `PER-05.1` | Cache-Control & Edge CDN Strategy | 2.0 | Immutable static asset caching with appropriate `max-age`. |
| `PER-05.2` | Code Minification & Bundle Hygiene | 2.0 | Minified CSS/JS bundles with zero unminified code in production. |

---

### 3.2. Domain: Security & Privacy (`SEC`) — Nominal Weight: 20.0 (Draft)

| Code | Item / Control Name | Nominal Weight | Evaluation Standard / Notes |
|---|---|:---:|---|
| **`SEC-01`** | **SSL/TLS** | **4.0** | |
| `SEC-01.1` | TLS Certificate Validation | 2.0 | Valid TLS 1.2/1.3, valid certificate chain, no expiration < 30 days. |
| `SEC-01.2` | HTTP→HTTPS Strict Redirection | 2.0 | Strict 301/308 permanent redirect, no plaintext fallback. |
| **`SEC-02`** | **Security Headers** | **4.0** | |
| `SEC-02.1` | Content-Security-Policy (CSP) | 0.8 | Robust CSP without unsafe-inline scripts. |
| `SEC-02.2` | Strict-Transport-Security (HSTS) | 0.8 | `max-age >= 31536000; includeSubDomains`. |
| `SEC-02.3` | X-Frame-Options / frame-ancestors | 0.8 | `DENY` or `SAMEORIGIN` / CSP `frame-ancestors 'self'`. |
| `SEC-02.4` | X-Content-Type-Options | 0.8 | `nosniff`. |
| `SEC-02.5` | Referrer-Policy Header | 0.4 | `strict-origin-when-cross-origin` or stricter. |
| `SEC-02.6` | Permissions-Policy Header | 0.4 | Explicit feature permissions delegations (camera, geo, mic). |
| **`SEC-03`** | **Endpoint-Abuse Protection** | **4.0** | |
| `SEC-03.1` | API / Route Rate Limiting | 2.0 | HTTP 429 Too Many Requests enforcement on critical routes. |
| `SEC-03.2` | Bot & Abuse Mitigation | 2.0 | WAF protection, automated bot challenge, DDoS mitigation. |
| **`SEC-04`** | **OWASP Mitigation** | **4.0** | |
| `SEC-04.1` | SQL Injection (SQLi) Prevention | 0.8 | Parameterized queries, prepared statements, ORM safety. |
| `SEC-04.2` | Cross-Site Scripting (XSS) Prevention | 0.8 | Contextual output encoding, template sanitization. |
| `SEC-04.3` | Cookie Security Flags | 0.8 | `HttpOnly`, `Secure`, `SameSite=Lax/Strict` attributes enforced. |
| `SEC-04.4` | Password Hashing Standard | 0.8 | Argon2id or bcrypt (cost >= 12), zero plaintext passwords. |
| `SEC-04.5` | Session State & Lifecycle Controls | 0.8 | Anti-session fixation, idle timeout, server-side revocation. |
| **`SEC-05`** | **Information Disclosure** | **4.0** | |
| `SEC-05.1` | Zero Exposed Secrets in Code/Repo | 2.0 | Automated git secret scanning (zero exposed API keys/tokens). |
| `SEC-05.2` | Server Error & Stack Trace Leakage | 1.0 | Zero stack traces or debug dumps leaked in error responses. |
| `SEC-05.3` | Sensitive Header & Version Disclosure | 1.0 | Suppression of server fingerprinting headers (`Server`, `X-Powered-By`). |

---

### 3.3. Domain: Accessibility & Inclusivity (`ACC`) — Nominal Weight: 15.0 (Draft)

| Code | Item / Control Name | Nominal Weight | Evaluation Standard / Notes |
|---|---|:---:|---|
| **`ACC-01`** | **Semantic Hierarchy** | **3.75** | |
| `ACC-01.1` | HTML5 Semantic Landmarks | 1.875 | `<main>`, `<nav>`, `<header>`, `<footer>` landmarks properly structured. |
| `ACC-01.2` | Heading Hierarchy & Single `<h1>` | 1.875 | Single `<h1>`, unbroken sequential heading levels. |
| **`ACC-02`** | **Keyboard-Focus** | **3.75** | |
| `ACC-02.1` | Keyboard Operability & Tab Order | 1.875 | Logical tab order, no keyboard traps, skip navigation links (WCAG SC 2.1.1/2.1.2). |
| `ACC-02.2` | Visible Focus Indicators | 1.875 | High-contrast visible focus rings on all active elements (WCAG SC 2.4.7). |
| **`ACC-03`** | **Contrast** | **3.75** | |
| `ACC-03.1` | WCAG 2.1 AA Text Color Contrast | 1.875 | $\ge 4.5:1$ for normal text, $\ge 3:1$ for large text (Normative ref: ISO/IEC 40500). |
| `ACC-03.2` | UI Component & Non-Text Contrast | 1.875 | $\ge 3:1$ for essential graphical objects and interactive UI components. |
| **`ACC-04`** | **Interactive-ARIA** | **3.75** | |
| `ACC-04.1` | Image Alternative Text | 0.9375 | Meaningful `alt` text on non-decorative images (WCAG SC 1.1.1). |
| `ACC-04.2` | Form & Control Accessible Names | 0.9375 | Explicit accessible labels and names on all interactive form controls. |
| `ACC-04.3` | ARIA Attributes & Roles | 1.875 | Valid `aria-*` roles, states, and live region attributes (WCAG SC 4.1.2). |

---

### 3.4. Domain: Technical SEO & Discoverability (`SEO`) — Nominal Weight: 15.0 (Draft)

| Code | Item / Control Name | Nominal Weight | Evaluation Standard / Notes |
|---|---|:---:|---|
| **`SEO-01`** | **Indexability** | **3.75** | |
| `SEO-01.1` | Robots.txt Directives | 1.875 | Valid robots.txt allowing search engines and disallowing private paths. |
| `SEO-01.2` | XML Sitemap Generation & Reference | 1.875 | Valid, clean XML sitemap referenced in robots.txt. |
| **`SEO-02`** | **Dynamic Meta-Canonicals** | **3.75** | |
| `SEO-02.1` | Unique Page Titles | 0.9375 | Unique, descriptive page titles (30–60 characters). |
| `SEO-02.2` | Compelling Meta Descriptions | 0.9375 | Unique, actionable meta descriptions (120–160 characters). |
| `SEO-02.3` | Canonical URL Directives | 1.875 | Self-referential or canonical tags on all indexable pages. |
| **`SEO-03`** | **Heading Hierarchy** | **3.75** | |
| `SEO-03.1` | SEO Heading Tree Architecture | 1.875 | Proper `<h1>` to `<h6>` content hierarchy aligning with search intent. |
| `SEO-03.2` | Keyword Relevancy & Semantics | 1.875 | Semantic structured copy avoiding keyword stuffing. |
| **`SEO-04`** | **Schema Markup** | **3.75** | |
| `SEO-04.1` | JSON-LD Structured Data Schema | 1.875 | Schema.org validation clean (Organization, WebSite, Article). |
| `SEO-04.2` | Open Graph Social Metadata | 0.9375 | Complete `og:title`, `og:image`, `og:url`, `og:description`. |
| `SEO-04.3` | Twitter Card Social Metadata | 0.9375 | Complete `twitter:card`, `twitter:title`, `twitter:image`. |

---

### 3.5. Domain: User Experience & Interface Quality (`UX`) — Nominal Weight: 15.0 (Draft)

| Code | Item / Control Name | Nominal Weight | Evaluation Standard / Notes |
|---|---|:---:|---|
| **`UX-01`** | **Responsiveness** | **3.75** | |
| `UX-01.1` | Viewport Fluidity & Zero Overflow | 1.875 | Zero horizontal overflow across all viewports (320px to 4K). |
| `UX-01.2` | Typography Scaling & Fluid Layouts | 1.875 | Dynamic viewport typography (`clamp()`) and container fluidity. |
| **`UX-02`** | **Tap Targets** | **3.75** | |
| `UX-02.1` | Castle UX Target Size Standard | 1.875 | Minimum $48 \times 48\text{px}$ interactive touch targets. **Designation:** Castle UX Standard. |
| `UX-02.2` | Target Clearance & Touch Spacing | 1.875 | Adequate touch clearance preventing accidental adjacent taps. |
| **`UX-03`** | **Critical Flow** | **3.75** | |
| `UX-03.1` | Conversion & Primary Flow Completion | 1.875 | Frictionless execution of key transactional / contact workflows. |
| `UX-03.2` | Input Ergonomics & Autocomplete | 1.875 | Clear form field associations, autofill, keyboard type hints. |
| **`UX-04`** | **Error States** | **3.75** | |
| `UX-04.1` | Inline Validation & Recovery Prompts | 1.875 | Immediate, actionable feedback on input errors. |
| `UX-04.2` | Accessible Error Feedback & State Recovery | 1.875 | Non-color-dependent error indicators, clear recovery paths. |

---

### 3.6. Domain: Reliability & Architecture (`REL`) — Nominal Weight: 10.0 (Draft)

| Code | Item / Control Name | Nominal Weight | Evaluation Standard / Notes |
|---|---|:---:|---|
| **`REL-01`** | **Availability** | **5.0** | |
| `REL-01.1` | Health Checks & Readiness Endpoints | 2.5 | `/healthz`, `/ready` endpoints, active uptime monitoring. |
| `REL-01.2` | Failover & Process Auto-Restart | 2.5 | Applies to distributed/multi-region architectures; marked `N/A` for single-region/static. |
| **`REL-02`** | **Error Handling** | **5.0** | |
| `REL-02.1` | Custom 404 Not Found Handling | 2.5 | Branded navigation recovery options, proper HTTP 404 status. |
| `REL-02.2` | Custom 500 Internal Server Error | 2.5 | Graceful fallback UI, zero stack trace leakage, 500 status. |

---

### 3.7. Domain: Maintainability & Code Quality (`MNT`) — Nominal Weight: 5.0 (Draft)

| Code | Item / Control Name | Nominal Weight | Evaluation Standard / Notes |
|---|---|:---:|---|
| **`MNT-01`** | **Modularity-Code Hygiene** | **2.5** | |
| `MNT-01.1` | Separation of Concerns | 1.25 | Decoupled presentation, business logic, and state management. |
| `MNT-01.2` | Design Token System & Reusability | 1.25 | Centralized CSS variables / tokens, componentized UI. |
| **`MNT-02`** | **Dependency Hygiene** | **2.5** | |
| `MNT-02.1` | Clean Dependency Tree | 1.25 | Zero unused, duplicate, or deprecated packages in manifest. |
| `MNT-02.2` | Dependency Vulnerability Auditing | 1.25 | Zero high/critical vulnerabilities in dependency tree. |

---

## 4. Verification Checksums

* **Domain Weight Sum:** $20.0 (\text{PER}) + 20.0 (\text{SEC}) + 15.0 (\text{ACC}) + 15.0 (\text{SEO}) + 15.0 (\text{UX}) + 10.0 (\text{REL}) + 5.0 (\text{MNT}) = \mathbf{100.0}$
* **Subcriteria Weight Sums:**
  * `PER`: $4.0 + 4.0 + 4.0 + 4.0 + 4.0 = 20.0$
  * `SEC`: $4.0 + 4.0 + 4.0 + 4.0 + 4.0 = 20.0$
  * `ACC`: $3.75 + 3.75 + 3.75 + 3.75 = 15.0$
  * `SEO`: $3.75 + 3.75 + 3.75 + 3.75 = 15.0$
  * `UX`: $3.75 + 3.75 + 3.75 + 3.75 = 15.0$
  * `REL`: $5.0 + 5.0 = 10.0$
  * `MNT`: $2.5 + 2.5 = 5.0$
* **Atomic Control Sums:**
  * `PER-01`: $2.0 + 2.0 = 4.0$
  * `PER-02`: $2.0 + 2.0 = 4.0$
  * `PER-03`: $2.0 + 2.0 = 4.0$
  * `PER-04`: $1.0 + 1.0 + 1.0 + 1.0 = 4.0$
  * `PER-05`: $2.0 + 2.0 = 4.0$
  * `SEC-01`: $2.0 + 2.0 = 4.0$
  * `SEC-02`: $0.8 + 0.8 + 0.8 + 0.8 + 0.4 + 0.4 = 4.0$
  * `SEC-03`: $2.0 + 2.0 = 4.0$
  * `SEC-04`: $0.8 \times 5 = 4.0$
  * `SEC-05`: $2.0 + 1.0 + 1.0 = 4.0$
  * `ACC-01`: $1.875 + 1.875 = 3.75$
  * `ACC-02`: $1.875 + 1.875 = 3.75$
  * `ACC-03`: $1.875 + 1.875 = 3.75$
  * `ACC-04`: $0.9375 + 0.9375 + 1.875 = 3.75$
  * `SEO-01`: $1.875 + 1.875 = 3.75$
  * `SEO-02`: $0.9375 + 0.9375 + 1.875 = 3.75$
  * `SEO-03`: $1.875 + 1.875 = 3.75$
  * `SEO-04`: $1.875 + 0.9375 + 0.9375 = 3.75$
  * `UX-01`: $1.875 + 1.875 = 3.75$
  * `UX-02`: $1.875 + 1.875 = 3.75$
  * `UX-03`: $1.875 + 1.875 = 3.75$
  * `UX-04`: $1.875 + 1.875 = 3.75$
  * `REL-01`: $2.5 + 2.5 = 5.0$
  * `REL-02`: $2.5 + 2.5 = 5.0$
  * `MNT-01`: $1.25 + 1.25 = 2.5$
  * `MNT-02`: $1.25 + 1.25 = 2.5$
