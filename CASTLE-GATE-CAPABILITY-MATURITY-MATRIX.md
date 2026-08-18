# Castle Security & Quality Gate — Capability Maturity Matrix
**Document ID:** `MAT-CAP-PHASE-9-2026-01`  
**Classification:** Critical Capability & Commercial Readiness Audit  
**Evaluation Criteria:** Multi-Dimensional Assessment (Functionality, Security, Defensibility, Commercial Viability, Differentiation, Scalability)  

---

## 1. Capability Maturity & Commercial Assessment Matrix

```text
EVALUATION KEYS:
  [✓] Fully Satisfied / Production-Ready
  [~] Partially Satisfied / Operational Internally (Requires Productization)
  [X] Not Satisfied / Missing for External Commercial Operation
```

| Component / Capability | Funciona Técnicamente | Es Seguro | Es Defendible | Es Comercializable | Es Diferenciador | Es Escalable | Estado General |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **1. CQS v1.1 Scoring Engine** | **[✓]** | **[✓]** | **[✓]** | **[✓]** | **[✓]** | **[✓]** | **`PRODUCTION READY`** |
| **2. Ratified Policy Matrix (C1..C6)** | **[✓]** | **[✓]** | **[✓]** | **[✓]** | **[✓]** | **[✓]** | **`PRODUCTION READY`** |
| **3. Gate Breakers Standards (GB-01..05)** | **[✓]** | **[✓]** | **[✓]** | **[✓]** | **[✓]** | **[✓]** | **`PRODUCTION READY`** |
| **4. Local CLI (`evaluate` / `scan`)** | **[✓]** | **[✓]** | **[✓]** | **[~]** | **[~]** | **[✓]** | **`OPERATIONAL (CLI)`** |
| **5. Release Certificate Generator** | **[✓]** | **[~]** | **[~]** | **[~]** | **[✓]** | **[✓]** | **`NEEDS PKI HARDENING`** |
| **6. File Remediation Ledger (`RemediationStore`)** | **[✓]** | **[✓]** | **[~]** | **[~]** | **[~]** | **[~]** | **`LOCAL ONLY (NEEDS DB)`** |
| **7. Castle Native Security Probe** | **[✓]** | **[✓]** | **[~]** | **[~]** | **[~]** | **[✓]** | **`PATTERN-BASED (V1)`** |
| **8. Castle Native DOM Semantics Probe** | **[✓]** | **[✓]** | **[✓]** | **[~]** | **[✓]** | **[✓]** | **`OPERATIONAL`** |
| **9. Castle Native Maintainability Probe** | **[✓]** | **[✓]** | **[✓]** | **[~]** | **[~]** | **[✓]** | **`OPERATIONAL`** |
| **10. Multi-Tenant Web Dashboard** | **[X]** | **[X]** | **[X]** | **[X]** | **[✓]** | **[X]** | **`MISSING (PHASE 9)`** |
| **11. Asymmetric PKI Digital Signatures** | **[X]** | **[X]** | **[X]** | **[X]** | **[✓]** | **[X]** | **`MISSING (PHASE 9)`** |
| **12. Public Web Verification Portal** | **[X]** | **[X]** | **[X]** | **[X]** | **[✓]** | **[X]** | **`MISSING (PHASE 9)`** |
| **13. Automated GitHub App / GitLab Bot** | **[X]** | **[X]** | **[X]** | **[X]** | **[~]** | **[X]** | **`MISSING (PHASE 9)`** |

---

## 2. Deep Dimension Analysis

### A. What Works Technically vs What is Defendible
* **Scoring & Gate Core:** 100% mathematically sound and defended against 45 adversarial attacks. It can be defended in front of any ISO 27001 auditor, CTO, or CISO.
* **Native Probes:** They function with remarkable speed ($< 25\text{ ms}$) and zero dependencies. However, their security defense relies on **fast regex pattern matching**. To remain defendible, we must never claim "deep symbolic data-flow taint analysis". They are transparently positioned as **lightweight pre-commit and CI hygiene probes**.

### B. What is Operational vs What is Marketable
* **Current Operational State:** Developers can run `node bin.js scan --dir ./app --level C2` and integrate it into GitHub Actions via YAML templates. This is ideal for internal Grupo Castillo engineering.
* **Commercial Gaps for Paying Clients:**
  1. **Packaging:** Must be packaged as a standalone zero-install binary (`npm install -g @grupo-castillo/castle-gate` or single executable via Node SEA / pkg).
  2. **Centralized Visibility:** External CTOs will not manually inspect JSON files on build runners; they demand a web portal showing all repositories with compliance percentages.
  3. **Attestation Authority:** Release certificates need an asymmetric cryptographic signature so external auditors can verify compliance without having access to the client's source code.

---

## 3. The 4 Mandatory Gaps for External Commercialization

```text
+------------------------------------+-------------------------------------------------------------------------------+
| COMMERCIAL GAP                     | TECHNICAL REQUIREMENT                                                         |
+------------------------------------+-------------------------------------------------------------------------------+
| 1. Asymmetric Release Signing      | Ed25519 digital signature block attached to release-certificate.json.         |
| 2. Zero-Install Binary / NPM CLI   | Standalone executable package `@grupo-castillo/castle-gate` on npm registry. |
| 3. Centralized Audit Sync (Cloud)  | Lightweight HTTPS telemetry forwarder to sync audit records to private cloud. |
| 4. Public Trust Badge Registry     | Public endpoint `https://verify.grupocastillo.com/cert/{id}`.                 |
+------------------------------------+-------------------------------------------------------------------------------+
```
