# Calibration Test 03 — Edge-Case High N/A Exclusion & Subcriterion Pruning

**Calibration Scenario:** Test-03  
**Specification Version:** 1.1.0-candidate  
**Target Archetype:** Single-Page Static Landing Page (Extreme N/A Edge Case)  
**Architecture Type:** `static-brochure`  
**Status:** Provisional Calibration Data  

---

## 1. Scenario Description & Scope

This calibration scenario tests the robustness of the **Atomic N/A Weight Exclusion** and **Subcriterion Full Pruning Rule** under extreme constraints across the **7 official domains (24 subcriteria)**. Target is an ephemeral campaign landing page without database, auth, sessions, or multi-region infrastructure.

---

## 2. Granular N/A and Pruning Trace

### 2.1. Performance Domain (`PER` — Nominal Weight: 20.0)
* `PER-01`: `PER-01.1` (Lab) = `PASS` (2.0), `PER-01.2` (Field) = `N/A` $\implies W_{PER-01}^{app} = 2.0, S_{PER-01} = 1.0$.
* `PER-02`: `PER-02.1` (Lab) = `PASS` (2.0), `PER-02.2` (Field) = `N/A` $\implies W_{PER-02}^{app} = 2.0, S_{PER-02} = 1.0$.
* `PER-03`: `PER-03.1` (Lab) = `PASS` (2.0), `PER-03.2` (Field) = `N/A` $\implies W_{PER-03}^{app} = 2.0, S_{PER-03} = 1.0$.
* `PER-04` (Asset Optimization): `PASS` (4.0 / 4.0) $\implies W_{PER-04}^{app} = 4.0, S_{PER-04} = 1.0$.
* `PER-05` (Caching-Minification): `PASS` (4.0 / 4.0) $\implies W_{PER-05}^{app} = 4.0, S_{PER-05} = 1.0$.
* **Domain Subtotal:** $W_{PER}^{app} = 2.0 + 2.0 + 2.0 + 4.0 + 4.0 = 14.0$. $S_{PER} = 1.000000$.

---

### 2.2. Security Domain (`SEC` — Nominal Weight: 20.0)
* `SEC-01` (SSL/TLS): All controls `PASS` $\implies W_{SEC-01}^{app} = 4.0, S_{SEC-01} = 1.0$.
* `SEC-02` (Security Headers): All controls `PASS` $\implies W_{SEC-02}^{app} = 4.0, S_{SEC-02} = 1.0$.
* `SEC-03` (Endpoint-Abuse): All controls `PASS` $\implies W_{SEC-03}^{app} = 4.0, S_{SEC-03} = 1.0$.
* `SEC-04` (OWASP Mitigation):
  * `SEC-04.1` (SQLi): `N/A`
  * `SEC-04.2` (XSS): `PASS` (0.8)
  * `SEC-04.3` (Cookie Flags): `N/A`
  * `SEC-04.4` (Password Hashing): `N/A`
  * `SEC-04.5` (Session State): `N/A`
  * **Result:** $W_{SEC-04}^{app} = 0.8$ (3.2 pruned). $S_{SEC-04} = 1.0$.
* `SEC-05` (Information Disclosure): All controls `PASS` $\implies W_{SEC-05}^{app} = 4.0, S_{SEC-05} = 1.0$.
* **Domain Subtotal:** $W_{SEC}^{app} = 4.0 + 4.0 + 4.0 + 0.8 + 4.0 = 16.8$. $S_{SEC} = 1.000000$.

---

### 2.3. Accessibility (`ACC`), SEO (`SEO`), and UX (`UX`) — Nominal Weights: 15.0 each
* All controls evaluated as `PASS` with 0 N/A exclusions.
* $W_{ACC}^{app} = 15.0$, $S_{ACC} = 1.000000$.
* $W_{SEO}^{app} = 15.0$, $S_{SEO} = 1.000000$.
* $W_{UX}^{app} = 15.0$, $S_{UX} = 1.000000$.

---

### 2.4. Reliability Domain (`REL` — Nominal Weight: 10.0)
* `REL-01` (Availability): `REL-01.1` = `PASS` (2.5), `REL-01.2` (Failover) = `N/A` $\implies W_{REL-01}^{app} = 2.5, S_{REL-01} = 1.0$.
* `REL-02` (Error Handling): All controls `PASS` $\implies W_{REL-02}^{app} = 5.0, S_{REL-02} = 1.0$.
* **Domain Subtotal:** $W_{REL}^{app} = 2.5 + 5.0 = 7.5$. $S_{REL} = 1.000000$.

---

### 2.5. Maintainability (`MNT` — Nominal Weight: 5.0)
* All controls across `MNT-01` and `MNT-02`: `PASS`.
* $W_{MNT}^{app} = 5.0$, $S_{MNT} = 1.000000$.

---

## 3. Mathematical Verification of Dynamic Weight Normalization

1. **Total Weight Reconciliation:**
   $$\begin{aligned}
   W_{nominal} &= 100.0 \\
   W_{excluded} &= 6.0 (\text{PER Field}) + 3.2 (\text{SEC-04}) + 2.5 (\text{REL-01.2}) = 11.7 \\
   W_{total}^{app} &= 100.0 - 11.7 = 88.3
   \end{aligned}$$

2. **Sum of Domain Points Earned:**
   $$\sum_{k=1}^7 (S_{dom, k} \times W_{dom, k}^{app}) = 14.0 + 16.8 + 15.0 + 15.0 + 15.0 + 7.5 + 5.0 = 88.30$$

3. **CQS Raw Score:**
   $$CQS_{raw} = \frac{88.30}{88.30} \times 100.0 = 100.000000$$

4. **Conclusion:**
   Dynamic weight exclusion accurately normalizes score across the 7 official domains without mathematical distortion.
