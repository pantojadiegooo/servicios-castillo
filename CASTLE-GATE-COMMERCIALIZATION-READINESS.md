# Castle Security & Quality Gate — Commercialization Readiness & Productization Strategy
**Document ID:** `STRAT-COMM-MKT-2026-01`  
**Classification:** Product Strategy, Commercial Packaging & Go-To-Market Architecture  
**Target Market:** Micro-Businesses, Mid-Market Software Teams, Enterprise Delivery Pipelines  

---

## 1. Product Tiers & Packaging Model

To democratize enterprise-grade release governance for micro-businesses while offering high-margin compliance infrastructure for corporate clients, Castle Gate adopts a **Three-Tier Commercial Architecture**:

```text
+---------------------------------------------------------------------------------------------------+
| 1. CASTLE GATE COMMUNITY / MICRO (Democratization Tier — Low Cost / Free)                         |
| • Target: Micro-businesses, local community platforms (e.g. iglesia_cristiana), indie developers. |
| • Packaging: Standalone CLI (`npx @grupo-castillo/castle-gate scan`).                             |
| • Policy Levels: C1 (Foundation) & C2 (Standard).                                                 |
| • Features: Zero-dependency local scans, CQS scoring, local HTML audit reports, standard exit code|
+---------------------------------------------------------------------------------------------------+
                                                 |
                                                 v
+---------------------------------------------------------------------------------------------------+
| 2. CASTLE GATE PRO / SMB (Professional DevSecOps Tier — Subscription SaaS)                        |
| • Target: Software agencies, mid-market SaaS startups, growth-stage platforms.                    |
| • Packaging: GitHub Action / GitLab CI Template + CLI.                                            |
| • Policy Levels: C1, C2, C3 (Rigorous), C4 (Advanced).                                            |
| • Features: Append-only remediation ledgers, multi-branch tracking, Slack/Teams alert webhooks.  |
+---------------------------------------------------------------------------------------------------+
                                                 |
                                                 v
+---------------------------------------------------------------------------------------------------+
| 3. CASTLE GATE ENTERPRISE (Mission-Critical Release Attestation Tier — Annual Contract)           |
| • Target: Financial institutions, healthcare, corporate platforms with SOC 2 / ISO 27001 needs.   |
| • Packaging: Centralized Cloud Governance Hub + Air-Gapped CLI Runners + KMS Signing.             |
| • Policy Levels: C1 through C6 (Ultimate).                                                        |
| • Features: Asymmetric Ed25519 PKI release signing, multi-tenant compliance portfolio dashboard,  |
|   public verification registry (`verify.grupocastillo.com`), external auditor portal.            |
+---------------------------------------------------------------------------------------------------+
```

---

## 2. Packaging & Delivery Technology

1. **Standalone NPM Package:** Published as `@grupo-castillo/castle-gate` for instant invocation:
   ```bash
   npx @grupo-castillo/castle-gate scan --dir ./app --level C2
   ```
2. **Official GitHub Action:** Drop-in zero-config CI/CD step:
   ```yaml
   - name: Castle Security & Quality Gate
     uses: grupo-castillo/castle-gate-action@v1
     with:
       level: 'C2'
       fail-on-block: true
   ```
3. **Single Executable Binaries (Air-Gapped / High-Security):** Compiled using Node.js Single Executable Application (SEA) for Linux (`x86_64`, `arm64`), Windows (`.exe`), and macOS (`universal`) with zero external runtime requirements.

---

## 3. Privacy & Intellectual Property Safeguards

Paying clients and corporate security teams demand strict guarantees regarding source code privacy:
* **Zero Source Code Exfiltration:** Castle Gate executes all AST and pattern analysis locally within the client's own execution runner.
* **Telemetry Anonymization:** Only SHA-256 digests, numerical CQS scores, and release certificate metadata are synchronized with the central cloud ledger (if cloud synchronization is enabled).
* **Air-Gapped Mode:** Enterprise clients can run Castle Gate in 100% offline environments without any outbound network calls.

---

## 4. Go-To-Market Roadmap (Phase 9 Implementation Objectives)

```text
+-------------------------+      +-------------------------+      +-------------------------+
|     MILESTONE 9.1       |      |     MILESTONE 9.2       |      |     MILESTONE 9.3       |
| PACKAGING & CLI POLISH  | ───► | ASYMMETRIC SIGNING (PKI)| ───► | CENTRAL LEDGER CLOUD    |
|                         |      |                         |      |                         |
| • Standalone NPM package|      | • Ed25519 Cert Signing  |      | • Multi-Tenant API      |
| • GitHub Action release |      | • KMS Key Management    |      | • Web Compliance Portal |
| • Rich terminal UI      |      | • Public Cert Verifier  |      | • Live Trust Badges     |
+-------------------------+      +-------------------------+      +-------------------------+
```
