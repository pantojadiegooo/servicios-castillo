# Castle Gate-Breakers Protocol

**Specification Version:** 1.1.0-candidate  
**Classification:** Quality & Security Governance  
**Status:** Candidate  

---

## 1. Principle of Binary Release Veto

The **Gate-Breakers Protocol** defines a set of foundational, non-negotiable security, reliability, and accessibility baselines.

Regardless of a system's numerical **Castle Quality Score (CQS)**—even if a system achieves a score of 95.0+—the activation of a single Gate-Breaker immediately transitions the release status to **`GATE_BLOCKED`**, triggering an unconditional deployment freeze.

$$\text{Gate Status} = \begin{cases} 
\text{BLOCKED} & \text{if } \exists \, GB_k = \text{Triggered} \\ 
\text{CLEARED} & \text{if } \forall \, GB_k = \text{Untriggered} 
\end{cases}$$

---

## 2. Gate-Breakers Inventory

### `GB-01`: Insecure Transport & Plaintext Transmission
* **Definition:** Serving production web traffic over unencrypted HTTP or operating with invalid, revoked, or broken TLS certificates on authenticated/sensitive routes.
* **Trigger Conditions:**
  1. Plaintext HTTP port 80 serving data without immediate 301/308 redirection to HTTPS.
  2. TLS certificate expired, self-signed in production, hostname mismatch, or utilizing deprecated protocols (SSLv3, TLS 1.0, TLS 1.1).
* **Audit Method:** Automated TLS handshake probe, certificate chain validation, and plaintext HTTP request redirect verification.
* **Resolution Requirement:** Valid CA-signed certificate installed with active TLS 1.2/1.3 and automated 301 redirection.

---

### `GB-02`: Exposed Credentials & Hardcoded Secrets
* **Definition:** Detection of plaintext cryptographic keys, private SSH keys, cloud provider access tokens, database connection strings with passwords, or API secrets in source control or client-side bundles.
* **Trigger Conditions:**
  1. High-entropy secret strings or private key headers (`BEGIN RSA PRIVATE KEY`, AWS keys, etc.) found in git history or workspace.
  2. Production secrets embedded in client-side HTML, CSS, or JS bundles.
* **Audit Method:** Automated static secret scanning (Gitleaks, Trufflehog) on all repository branches and build artifacts.
* **Resolution Requirement:** Immediate revocation/rotation of compromised credentials and migration to environment variables / secret manager.

---

### `GB-03`: Critical Injection & Unauthenticated Compromise
* **Definition:** Existence of confirmed, unmitigated Injection vulnerabilities (SQL Injection, Remote Code Execution, OS Command Injection) or direct bypass of authentication on protected routes.
* **Trigger Conditions:**
  1. Raw string concatenation in database queries accepting user input.
  2. Execution of unsanitized user input in system shells or eval functions.
  3. Direct Object Reference allowing unauthorized administrative data access.
* **Audit Method:** Static code analysis (SAST) and dynamic penetration testing against input vectors.
* **Resolution Requirement:** Adoption of parameterized queries / ORM, strict input sanitization, and verified access control enforcement.

---

### `GB-04`: Core Flow Disruption & Fatal System Crash
* **Definition:** An unhandled runtime exception, infinite rendering loop, or fatal crash that renders primary business workflows (e.g., checkout, contact form, authentication, navigation) completely inoperable.
* **Trigger Conditions:**
  1. Unhandled JavaScript exception terminating client rendering on key landing/transactional routes.
  2. Backend HTTP 500 Internal Server Error triggered consistently on primary endpoints.
* **Audit Method:** Automated End-to-End (E2E) smoke testing and synthetic transaction monitoring.
* **Resolution Requirement:** Defensive exception handling, error boundary implementation, and regression test verification.

---

### `GB-05`: Critical Accessibility Navigation Blocker
* **Definition:** A severe accessibility defect that traps user focus, rendering the application completely unusable for keyboard-only or assistive technology users.
* **Trigger Conditions:**
  1. Complete keyboard focus trap (user can tab into a component/modal but cannot tab out).
  2. Interactive submit / primary conversion actions completely unreachable or unactivatable via standard keyboard inputs (`Tab`, `Enter`, `Space`).
* **Audit Method:** Automated and manual keyboard navigation audit following WCAG 2.1 Success Criterion 2.1.2 (No Keyboard Trap).
* **Resolution Requirement:** Implementation of accessible dialog focus management, escape handlers, and keyboard operability.

---

## 3. Escalation & Override Policy

Under CES Candidate governance:
* **No Manual Overrides:** Engineers and tech leads cannot override a `GATE_BLOCKED` verdict for production deployment.
* **Release Verdict Mapping:**
  * If $\text{Gate Status} = \text{BLOCKED} \implies \text{Final Verdict} = \text{FAIL\_BLOCKED}$.
  * If $\text{Gate Status} = \text{CLEARED} \land CQS \ge 85.0 \implies \text{Final Verdict} = \text{PASS\_RELEASE}$.
  * If $\text{Gate Status} = \text{CLEARED} \land 70.0 \le CQS < 85.0 \implies \text{Final Verdict} = \text{CONDITIONAL\_APPROVAL}$.
  * If $\text{Gate Status} = \text{CLEARED} \land CQS < 70.0 \implies \text{Final Verdict} = \text{FAIL\_BLOCKED}$.
