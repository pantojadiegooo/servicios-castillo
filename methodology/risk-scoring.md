# Castle Risk Scoring Methodology

**Specification Version:** 1.1.0-candidate  
**Classification:** Risk Governance & Assessment  
**Status:** Candidate  

---

## 1. Overview & Objective

The **Castle Risk Scoring Methodology** provides a deterministic, three-dimensional quantitative model for evaluating technical debt, security vulnerabilities, reliability hazards, and operational risks across systems audited under the Castle Engineering Specification (CES).

Unlike traditional 2D matrices (Likelihood × Impact), CES incorporates **Exposure ($E$)** as a first-class dimension to account for architectural surface, network exposure, and blast radius.

---

## 2. The Three Evaluation Dimensions

Each identified defect or vulnerability is scored across three discrete dimensions from 1 to 5:

### 2.1. Likelihood ($L \in [1..5]$)
Probability of the risk event materializing or being exploited under normal operation:
* **1 (Rare):** Highly improbable; requires extraordinary prerequisites or obscure failure chains.
* **2 (Unlikely):** Low probability; may occur only under specific edge cases.
* **3 (Possible):** Moderate probability; expected to occur intermittently over time.
* **4 (Likely):** High probability; predictable occurrence under regular traffic or automated scanning.
* **5 (Almost Certain):** Continuous occurrence or immediate active exploitation.

### 2.2. Impact ($I \in [1..5]$)
Severity of business, operational, data integrity, or financial damage if materialized:
* **1 (Negligible):** Cosmetic anomaly; zero data loss, zero downtime, zero business impairment.
* **2 (Minor):** Minor inconvenience; localized performance degradation, non-critical feature glitch.
* **3 (Moderate):** Partial service impairment; non-sensitive data corruption, temporary workflow blockage.
* **4 (Major):** Critical subsystem outage; sensitive data leakage, significant revenue or reputation impact.
* **5 (Catastrophic):** Total system failure; widespread data breach, persistent corruption, regulatory non-compliance.

### 2.3. Exposure ($E \in [1..5]$)
Accessibility and reachability of the affected component or attack vector:
* **1 (Isolated):** Air-gapped, internal tooling, strictly authenticated administrative backend with multi-factor auth.
* **2 (Controlled):** Authenticated user space; requires valid session credentials and standard permissions.
* **3 (Limited Public):** Partially public route, rate-limited endpoint, or auxiliary external surface.
* **4 (General Public):** Unauthenticated public internet surface (e.g., landing page, public API).
* **5 (Universal Core):** Foundational public entry point, DNS, CDN root, global routing layer.

---

## 3. Mathematical Risk Calculation

### 3.1. Individual Finding Risk Score ($Risk_i$)
The raw score is calculated as the product of all three dimensions and normalized to a 0–100 scale:

$$Risk_i = \left( \frac{L \times I \times E}{5 \times 5 \times 5} \right) \times 100 = \left( \frac{L \times I \times E}{125} \right) \times 100$$

### 3.2. Risk Severity Tiers

| Tier Name | Score Range | Operational SLA / Action Required | Release Implication |
|---|---|---|---|
| **`LOW`** | $0.0 \le Risk_i < 25.0$ | Backlog maintenance; review in quarterly cycle. | Non-blocking. |
| **`MODERATE`** | $25.0 \le Risk_i < 50.0$ | Planned remediation within 30 days. | Non-blocking with signoff. |
| **`HIGH`** | $50.0 \le Risk_i < 75.0$ | Priority remediation within 7 business days. | Conditional Release veto. |
| **`CRITICAL`** | $75.0 \le Risk_i \le 100.0$ | Immediate hotfix required within 24–48 hours. | **Mandatory Release Blocker**. |

### 3.3. Aggregate System Risk Index ($RI$)
To prevent a single catastrophic vulnerability from being masked by dozens of minor items, the system-wide Risk Index ($RI$) combines peak risk with mean risk:

$$RI = \begin{cases} 
0.0 & \text{if } N = 0 \\ 
0.6 \times \max_{i=1..N}(Risk_i) + 0.4 \times \left( \dfrac{1}{N} \sum_{i=1}^N Risk_i \right) & \text{if } N > 0 
\end{cases}$$

All internal calculations preserve full double-precision floating-point arithmetic.
