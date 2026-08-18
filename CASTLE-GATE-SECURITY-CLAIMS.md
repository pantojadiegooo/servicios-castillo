# Castle Security & Quality Gate — Official Security & Technical Claims
**Document ID:** `CLAIMS-SEC-GOV-2026-01`  
**Classification:** Transparent Technical Boundary & Security Claims Standard  
**Governing Rule:** Absolute Technical Honesty — Zero Marketing Exaggeration  

---

## 1. Technical Guarantees (What the System Mathematically & Cryptographically Guarantees)

```text
[TECHNICAL GUARANTEE]
1. Determinism: Given identical source files and configuration, Castle Gate produces the exact same Evidence Package, CQS score, Gate Decision, and SHA-256 digest every single time.
2. Invariance of CQS v1.1: The scoring engine evaluates 65 controls across 7 domains with 100.00 nominal weight using strict IEEE 754 arithmetic without arbitrary heuristic score adjustments.
3. Air-Gapped / Privacy: The standalone package executes 100% locally in-memory with zero network calls, zero telemetry, and zero source code exfiltration.
4. Tamper Evidence: Any post-generation alteration to a release-certificate.json invalidates its cryptographic integrity check in `castle-gate verify-cert`.
5. Release Veto: An active Gate Breaker (GB-01 to GB-05) mathematically guarantees an exit code 1 (BLOCKED) and prevents the issuance of an authorization certificate.
```

---

## 2. Current Capabilities (What the Software Actually Does Today)

```text
[CURRENT CAPABILITY]
1. Fast Static Probing: Scans HTML, CSS, and JS files for plaintext credentials, dangerous DOM/eval patterns, plaintext HTTP links, HTML5 landmark structure, heading sequence jumps, image alt text, viewport meta, monolithic files (>800 LOC), and lockfile hygiene in <60 ms.
2. Multi-Level Policy Enforcement: Resolves ratified policies C1 through C6, enforcing minimum thresholds, domain floors, and mandatory control lists.
3. Standalone Artifact Generation: Emits release-certificate.json, audit-trail.json, and a zero-dependency interactive compliance-report.html.
4. Universal CI/CD Integration: Operates seamlessly in GitHub Actions, GitLab CI, and Jenkins via standard POSIX exit codes (0, 1, 2, 3).
```

---

## 3. Technical Limitations (Known Boundaries of the Current Architecture)

```text
[LIMITATION]
1. Regex vs AST Taint Analysis: SecurityProbe uses high-speed regex and token matching. It flags literal eval() and secrets, but cannot trace dynamic runtime string assembly (e.g. window['ev'+'al']("...")) across multiple modules.
2. Code Comments: Comments containing literal 'eval()' may trigger findings unless stripped by pre-processors.
3. Local PKI vs Cloud KMS: Integrity is guaranteed via canonical SHA-256 digests. Asymmetric public-key digital signing (Ed25519) and cloud verification registries are planned for future cloud tiers.
```

---

## 4. What is Explicitly NOT Guaranteed (Anti-Claims)

```text
[NOT GUARANTEED]
1. We DO NOT claim Castle Gate is a complete replacement for deep compiler SAST engines (like SonarQube, Semgrep, or CodeQL).
2. We DO NOT claim Castle Gate maintains an active global CVE database (like Snyk or Dependabot).
3. We DO NOT claim formal SOC 2, ISO 27001, or FedRAMP certification of customer software; Castle Gate provides deterministic delivery governance tooling to assist compliance.
```
