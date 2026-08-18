# Castle Security & Quality Gate — Trust Boundary & Security Guarantee Analysis
**Document ID:** `SEC-BOUND-2026-01`  
**Classification:** Security Architecture & Trust Model  

---

## 1. Explicit System Guarantees

### A. Mathematical & Methodological Guarantees
* **Strict Scoring Determinism:** Given the same evidence payload, CQS computes identical numeric scores to 15 decimal places using IEEE 754 double precision arithmetic.
* **Normative Asset Invariance:** The 65 atomic controls, 7 domains, and 100.00 nominal weight are verified against the frozen CQS manifest. Any unauthorized addition or alteration causes immediate evaluation failure.
* **Gate Breaker Absolute Veto:** Triggered Gate Breakers (`GB-01` to `GB-05`) veto release authorization inconditionally. No score, waiver, or role can override an active Gate Breaker.

### B. Data Integrity & Verification Guarantees
* **Release Certificate Tamper-Proofing:** `release-certificate.json` includes a canonical SHA-256 digest over governance metadata, scores, commit SHA, and audit references. Altering any field invalidates the certificate.
* **Audit Trail Completeness:** The emitted audit record provides a complete forensic link: $\text{Evidence} \to \text{Control} \to \text{Domain} \to \text{Score} \to \text{Gate Decision}$.

---

## 2. Explicit System Limitations (What Castle Gate CANNOT Guarantee)

1. **Host & Runner Integrity:** If an attacker has root access to the CI/CD runner, they can intercept environment variables, forge files on disk, or bypass the CLI command invocation.
2. **Infrastructure Branch Protection:** Castle Gate emits standard POSIX exit codes ($0, 1, 2$). The repository hosting platform (GitHub / GitLab) must enforce branch protection rules ("Require status checks to pass before merging"). Castle Gate cannot force GitHub to block a merge if the repo administrator disables status checks.
3. **Asymmetric PKI Human Identity:** The current implementation validates approval authority roles structurally (e.g. `AUTH_CLASS_3_TRIAD_SIGN_OFF`). It does **not** yet perform hardware cryptographic token (YubiKey / X.509 / GPG) validation.
4. **Active Scanning / Telemetry Generation:** Castle Gate is a **release governance consumer**, not an active scanner. It validates evidence produced by tools like Lighthouse, OWASP ZAP, and test runners, but does not host its own browser farm or penetration testing daemon.
