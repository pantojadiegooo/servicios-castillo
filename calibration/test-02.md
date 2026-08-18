# Calibration Test 02 — Transactional Dynamic Web Application Baseline

**Calibration Scenario:** Test-02  
**Specification Version:** 1.1.0-candidate  
**Target Archetype:** Full-Stack Transactional Web Application  
**Architecture Type:** `single-region-dynamic`  
**Status:** Provisional Calibration Data  

---

## 1. Scenario Description & Scope

This calibration scenario models a dynamic e-commerce / SaaS application with user accounts, PostgreSQL persistence, session management, and server-side payment workflows. Field telemetry (CrUX/RUM) is active. Single-region architecture. Evaluated under the **7 official domains (24 subcriteria)**.

---

## 2. Evaluation Findings & Scoring

### 2.1. Performance Domain (`PER` — Nominal Weight: 20.0)
* `PER-01` (LCP): `PASS` (4.0 / 4.0 — Lab 1.8s, Field 2.1s)
* `PER-02` (INP): `PARTIAL` (3.0 / 4.0 — Lab 2.0/2.0, Field partial 1.0/2.0 due to 220ms mobile 75th pctl)
* `PER-03` (CLS): `PASS` (4.0 / 4.0 — Lab 0.02, Field 0.04)
* `PER-04` (Asset Optimization): `PASS` (4.0 / 4.0)
* `PER-05` (Caching-Minification): `PARTIAL` (3.0 / 4.0 — Static caching 2.0/2.0, API route caching partial 1.0/2.0)

**PER Aggregation:**
* Applicable Weight $W_{PER}^{app} = 20.0$.
* Points Earned: $4.0 + 3.0 + 4.0 + 4.0 + 3.0 = 18.00$.
* $S_{PER} = \frac{18.00}{20.0} = 0.900000$ (90.00%).

---

### 2.2. Security Domain (`SEC` — Nominal Weight: 20.0)
* `SEC-01` (SSL/TLS): `PASS` (4.0 / 4.0)
* `SEC-02` (Security Headers): `PARTIAL` (3.6 / 4.0 — CSP contains unsafe-inline nonce exception 0.4/0.8, other headers 3.2/3.2)
* `SEC-03` (Endpoint-Abuse Protection): `PASS` (4.0 / 4.0)
* `SEC-04` (OWASP Mitigation): `PASS` (4.0 / 4.0 — Prisma ORM parameterized queries, Argon2id, cookie flags)
* `SEC-05` (Information Disclosure): `PARTIAL` (3.0 / 4.0 — Secrets clean 2.0/2.0, 1 moderate dev-dependency CVE pending patch 1.0/2.0)

**SEC Aggregation:**
* Applicable Weight $W_{SEC}^{app} = 20.0$.
* Points Earned: $4.0 + 3.6 + 4.0 + 4.0 + 3.0 = 18.60$.
* $S_{SEC} = \frac{18.60}{20.0} = 0.930000$ (93.00%).

---

### 2.3. Accessibility Domain (`ACC` — Nominal Weight: 15.0)
* `ACC-01` (Semantic Hierarchy): `PASS` (3.75 / 3.75)
* `ACC-02` (Keyboard-Focus): `PASS` (3.75 / 3.75)
* `ACC-03` (Contrast): `PASS` (3.75 / 3.75 — WCAG 2.1 AA normative contrast met)
* `ACC-04` (Interactive-ARIA): `PARTIAL` (2.8125 / 3.75 — Checkout modal close button missing `aria-label`)

**ACC Aggregation:**
* Applicable Weight $W_{ACC}^{app} = 15.0$.
* Points Earned: $3.75 + 3.75 + 3.75 + 2.8125 = 14.0625$.
* $S_{ACC} = \frac{14.0625}{15.0} = 0.937500$ (93.75%).

---

### 2.4. Technical SEO (`SEO` — Nominal Weight: 15.0)
* All subcriteria `SEO-01` to `SEO-04`: `PASS` (15.0 / 15.0).
* Applicable Weight $W_{SEO}^{app} = 15.0$, $S_{SEO} = 1.000000$ (100.0%).

---

### 2.5. User Experience (`UX` — Nominal Weight: 15.0)
* All subcriteria `UX-01` to `UX-04`: `PASS` (15.0 / 15.0 — Castle UX 48×48px standard met).
* Applicable Weight $W_{UX}^{app} = 15.0$, $S_{UX} = 1.000000$ (100.0%).

---

### 2.6. Reliability (`REL` — Nominal Weight: 10.0)
* `REL-01` (Availability): `PASS` (2.5 / 2.5 active; `REL-01.2` failover marked `N/A` for single-region)
* `REL-02` (Error Handling): `PASS` (5.0 / 5.0 — Custom 404 and 500 handling)

**REL Aggregation:**
* Excluded: `REL-01.2` (2.5 weight excluded).
* Applicable Weight $W_{REL}^{app} = 2.5 + 5.0 = 7.5$.
* Points Earned: 7.5 / 7.5 $\implies S_{REL} = 1.000000$ (100.0%).

---

### 2.7. Maintainability (`MNT` — Nominal Weight: 5.0)
* All subcriteria `MNT-01` and `MNT-02`: `PASS` (5.0 / 5.0).
* Applicable Weight $W_{MNT}^{app} = 5.0$, $S_{MNT} = 1.000000$ (100.0%).

---

## 3. Global Score Aggregation & Risk

* **Total Nominal Weight:** 100.0
* **Total Applicable Weight ($W_{total}^{app}$):** $20.0 + 20.0 + 15.0 + 15.0 + 15.0 + 7.5 + 5.0 = 97.5$
* **Total Excluded Weight:** $2.5$
* **Weighted Applicable Score Sum:**
  $$\sum (S_k \times W_k^{app}) = 18.00 + 18.60 + 14.0625 + 15.00 + 15.00 + 7.50 + 5.00 = 93.1625$$
* **Calculated CQS Raw:**
  $$CQS_{raw} = \frac{93.1625}{97.5} \times 100 = 95.551282...$$
* **CQS Display:** **95.55**
* **Gate-Breakers Status:** `CLEARED` (Candidate)
* **Risk Evaluation:**
  * Finding 1 (CSP nonce): $L=2, I=2, E=4 \implies Risk = \frac{16}{125} \times 100 = 12.8$ (`LOW`)
  * Finding 2 (Mobile INP 220ms): $L=3, I=2, E=4 \implies Risk = \frac{24}{125} \times 100 = 19.2$ (`LOW`)
  * Finding 3 (Modal aria-label): $L=2, I=2, E=3 \implies Risk = \frac{12}{125} \times 100 = 9.6$ (`LOW`)
  * System Risk Index ($RI$) = $(0.6 \times 19.2) + (0.4 \times 13.867) = 17.07$ (`LOW`).
* **Final Verdict:** **`PASS_RELEASE`**
