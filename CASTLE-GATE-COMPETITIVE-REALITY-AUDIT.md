# Castle Security & Quality Gate — Competitive Reality Audit & Technical Comparison
**Document ID:** `COMP-AUDIT-2026-01`  
**Tone:** Brutally Honest Engineering Assessment (Zero Marketing)  

---

## 1. Comparative Analysis Against Industry Solutions

| Capability / Dimension | SonarQube Quality Gate | GitHub Branch Protection | Snyk / Veracode (SAST) | SOC 2 / ISO 27001 | **Castle Security & Quality Gate (Grupo Castillo)** |
|---|---|---|---|---|---|
| **Primary Domain** | Code smells, static coverage, duplicated lines, basic SAST. | Git branch merge policies and CI status check checks. | Vulnerability scanning in dependencies & code. | Organizational process and compliance audit framework. | **Unified multidimensional release governance (Perf, Sec, Acc, SEO, UX, Rel, Mnt).** |
| **Atomic Multi-Domain Evaluation** | Limited to static code metrics. No CWV, SEO, UX, or infra checks. | None (delegates to status checks). | Security vulnerabilities only. | High-level organizational controls, not automated at commit level. | **65 atomic controls across 7 domains with strict nominal weight 100.00.** |
| **Progressive Risk Gating (C1 $\to$ C6)** | Binary Pass/Fail on static thresholds. | Binary Pass/Fail on check status. | Binary Pass/Fail on severity thresholds. | Annual audit pass/fail. | **6 formal levels (C1 Foundation $\to$ C6 Ultimate) tailored to business risk.** |
| **Absolute Release Vetoes** | Quality Gate conditions (can be overridden by project admin). | Administrator bypass option. | Threshold breaking. | N/A | **Gate Breakers (`GB-01` to `GB-05`) with absolute binary veto across all levels.** |
| **Evidence & Certificate Artifacts** | Web dashboard report. | Status check checkmark. | JSON scan report. | Auditor PDF report. | **Verifiable `release-certificate.json` bound to commit SHA and SHA-256 evidence digests.** |
| **Remediation SLA Lifecycle** | Issue backlog (no automated pipeline SLA blocking). | None. | Fix PR generation. | Annual corrective actions. | **Append-only `RemediationStore` with policy SLA windows (12h to 168h).** |

---

## 2. What Castle Gate Does That Others DO NOT

1. **Holistic Product Discipline:** Combines Core Web Vitals (LCP/CLS/INP), Web Standards (HTTPS/CSP/HSTS), Accessibility (WCAG AA), Search Optimization, UX ergonomics, and Reliability into a single deterministic numerical index (CQS).
2. **Unified Delivery Decision:** A single decision engine determines release readiness instead of forcing engineers to manually coordinate 5 disparate dashboards.
3. **Deterministic Mathematical Immutability:** Uses double-precision IEEE 754 math with $N/A$ divisor pruning without heuristic guesswork.

---

## 3. What Others Do That Castle Gate DOES NOT (Honest Gaps)

1. **Active AST / Static Code Analysis:** SonarQube and Snyk parse ASTs, find taint-analysis data flows, and analyze dependency trees directly. Castle Gate relies on evidence fed by external analyzers.
2. **Enterprise Cloud Management UI:** SonarQube and Snyk provide rich SaaS dashboards, user role management, single sign-on (SSO), and IDE plugins. Castle Gate is currently a lightweight CLI and headless CI/CD engine.
3. **Automated Fix PR Generation:** Snyk automatically creates pull requests to patch dependencies. Castle Gate reports blockers and tracks remediation cycles, but does not modify application code.
