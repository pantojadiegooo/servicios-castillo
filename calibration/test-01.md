# Calibration Test 01 — Static Brochure Site Baseline

**Calibration Scenario:** Test-01  
**Specification Version:** 1.1.0-candidate  
**Target Archetype:** Static Brochure / Informational Website  
**Architecture Type:** `static-brochure`  
**Status:** Provisional Calibration Data  

---

## 1. Scenario Description & Scope

This calibration scenario models a high-quality static brochure website (HTML5, Vanilla CSS/JS, modern asset delivery) hosted on a global CDN edge. It contains no backend database, no user authentication, and no transactional payment processing. Evaluated under the **7 official domains (24 subcriteria)**.

---

## 2. Atomic Controls Evaluation & N/A Distribution

### Domain 1: Performance (`PER` — Nominal Weight: 20.0)
* `PER-01.1` (LCP Lab): `PASS` (2.0 / 2.0 — LCP 1.1s)
* `PER-01.2` (LCP Field): `NOT_APPLICABLE` (Insufficient CrUX telemetry sample size)
* `PER-02.1` (INP Lab): `PASS` (2.0 / 2.0 — Simulated latency 15ms)
* `PER-02.2` (INP Field): `NOT_APPLICABLE` (Insufficient CrUX telemetry)
* `PER-03.1` (CLS Lab): `PASS` (2.0 / 2.0 — CLS 0.01)
* `PER-03.2` (CLS Field): `NOT_APPLICABLE` (Insufficient CrUX telemetry)
* `PER-04.1` (Images): `PASS` (2.0 / 2.0 — AVIF/WebP + responsive srcset)
* `PER-04.2` (Compression): `PASS` (2.0 / 2.0 — Brotli enabled)
* `PER-05.1` (Caching): `PASS` (2.0 / 2.0 — Cache-Control immutable edge)
* `PER-05.2` (Minification): `PASS` (2.0 / 2.0 — Clean, minified bundles)

**PER Aggregation:**
* Field controls excluded ($2.0 + 2.0 + 2.0 = 6.0$ excluded).
* Applicable Weight: $W_{PER}^{app} = 2.0 + 2.0 + 2.0 + 4.0 + 4.0 = 14.0$.
* Points Earned: 14.0 / 14.0 $\implies S_{PER} = 1.000000$ (100.0%).

---

### Domain 2: Security & Privacy (`SEC` — Nominal Weight: 20.0)
* `SEC-01.1` (TLS Cert): `PASS` (2.0 / 2.0)
* `SEC-01.2` (HTTPS Redirect): `PASS` (2.0 / 2.0)
* `SEC-02.1` (CSP): `PASS` (0.8 / 0.8)
* `SEC-02.2` (HSTS): `PASS` (0.8 / 0.8)
* `SEC-02.3` (X-Frame-Options): `PASS` (0.8 / 0.8)
* `SEC-02.4` (X-Content-Type): `PASS` (0.8 / 0.8)
* `SEC-02.5` (Referrer/Permissions): `PASS` (0.8 / 0.8)
* `SEC-03.1` (Rate Limiting): `PASS` (2.0 / 2.0 via CDN edge)
* `SEC-03.2` (Bot Mitigation): `PASS` (2.0 / 2.0 via Cloudflare WAF)
* `SEC-04.1` (SQLi): `NOT_APPLICABLE` (No database)
* `SEC-04.2` (XSS): `PASS` (0.8 / 0.8, static content, zero unescaped DOM sinks)
* `SEC-04.3` (Cookie Flags): `NOT_APPLICABLE` (No session cookies)
* `SEC-04.4` (Password Hashing): `NOT_APPLICABLE` (No auth)
* `SEC-04.5` (Session State): `NOT_APPLICABLE` (No sessions)
* `SEC-05.1` (Zero Secrets): `PASS` (2.0 / 2.0)
* `SEC-05.2` (Info Leakage Prevention): `PASS` (2.0 / 2.0)

**SEC Aggregation:**
* `SEC-04` has 1 active control (`SEC-04.2`, weight 0.8) and 4 `N/A` controls (3.2 excluded).
* Applicable Weight: $W_{SEC}^{app} = 4.0 + 4.0 + 4.0 + 0.8 + 4.0 = 16.8$.
* Points Earned: 16.8 / 16.8 $\implies S_{SEC} = 1.000000$ (100.0%).

---

### Domain 3: Accessibility & Inclusivity (`ACC` — Nominal Weight: 15.0)
* All controls across `ACC-01`, `ACC-02`, `ACC-03`, `ACC-04`: `PASS` (Full WCAG 2.1 AA normative compliance).
* Applicable Weight: $W_{ACC}^{app} = 15.0$.
* Points Earned: 15.0 / 15.0 $\implies S_{ACC} = 1.000000$ (100.0%).

---

### Domain 4: Technical SEO & Discoverability (`SEO` — Nominal Weight: 15.0)
* All controls across `SEO-01`, `SEO-02`, `SEO-03`, `SEO-04`: `PASS`.
* Applicable Weight: $W_{SEO}^{app} = 15.0$.
* Points Earned: 15.0 / 15.0 $\implies S_{SEO} = 1.000000$ (100.0%).

---

### Domain 5: User Experience & Interface Quality (`UX` — Nominal Weight: 15.0)
* All controls across `UX-01` (Responsiveness), `UX-02` (Tap Targets 48×48px), `UX-03` (Critical Flow), `UX-04` (Error States): `PASS`.
* Applicable Weight: $W_{UX}^{app} = 15.0$.
* Points Earned: 15.0 / 15.0 $\implies S_{UX} = 1.000000$ (100.0%).

---

### Domain 6: Reliability & Architecture (`REL` — Nominal Weight: 10.0)
* `REL-01.1` (Health Checks): `PASS` (2.5 / 2.5)
* `REL-01.2` (Failover/Restart): `NOT_APPLICABLE` (Static CDN single-origin)
* `REL-02.1` (Custom 404): `PASS` (2.5 / 2.5)
* `REL-02.2` (Custom 500): `PASS` (2.5 / 2.5)

**REL Aggregation:**
* Excluded: `REL-01.2` (2.5 weight excluded).
* Applicable Weight: $W_{REL}^{app} = 2.5 + 5.0 = 7.5$.
* Points Earned: 7.5 / 7.5 $\implies S_{REL} = 1.000000$ (100.0%).

---

### Domain 7: Maintainability & Code Quality (`MNT` — Nominal Weight: 5.0)
* All controls across `MNT-01` (Modularity-Code Hygiene) and `MNT-02` (Dependency Hygiene): `PASS`.
* Applicable Weight: $W_{MNT}^{app} = 5.0$.
* Points Earned: 5.0 / 5.0 $\implies S_{MNT} = 1.000000$ (100.0%).

---

## 3. Global Score Aggregation

* **Total Nominal Weight:** 100.0
* **Total Applicable Weight ($W_{total}^{app}$):** $14.0 + 16.8 + 15.0 + 15.0 + 15.0 + 7.5 + 5.0 = 88.3$
* **Total Excluded Weight:** $11.7$
* **Calculated CQS Raw:**
  $$CQS_{raw} = \frac{88.30}{88.30} \times 100 = 100.000000$$
* **CQS Display:** **100.00**
* **Gate-Breakers Status:** `CLEARED` (Candidate)
* **Risk Index ($RI$):** 0.0 (`LOW`)
* **Final Verdict:** **`PASS_RELEASE`**
