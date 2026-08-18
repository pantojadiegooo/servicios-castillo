# Castle Security & Quality Gate — Phase 9 Strategic Architecture Blueprint
**Document ID:** `ARCH-STRAT-PHASE-9-2026-01`  
**Classification:** Strategic Product Architecture & Technology Evolution  
**Governing Standard:** `CQS v1.1 (FROZEN / SINGLE SOURCE OF TRUTH)`  
**Policy Baseline:** `1.0.0-ratified`  
**Strategic Horizon:** Transition from `C. OPERATIONAL INTERNAL PLATFORM` to `D. PRODUCTIZABLE TECHNOLOGY` / `E. COMMERCIALLY DEFENSIBLE PRODUCT`  

---

## 1. The Core Strategic Question

> *"¿Qué necesita realmente Castle Gate para convertirse en una tecnología propietaria de Grupo Castillo que podamos empaquetar, vender y operar con clientes, sin destruir la simplicidad, independencia y trazabilidad que hemos construido?"*

### The Core Answer:
Castle Gate must **not** attempt to become a general-purpose SAST, an APM monitor, or a bloated all-in-one developer portal. Doing so would destroy its primary value: **deterministic mathematical release governance, zero-dependency execution, and unbending release control.**

Instead, Castle Gate must evolve as a **Two-Tier Release Governance Platform**:
1. **Tier 1 — The Local Air-Gapped Engine (CLI / CI/CD Runner):**
   - 100% self-contained, offline-capable, sub-second execution ($< 25\text{ ms}$).
   - Executes Castle Native Probes, builds Evidence Packages, runs CQS v1.1, applies C1..C6 policies, and emits standard POSIX exit codes.
2. **Tier 2 — The Centralized Governance Ledger & Verification Service (Cloud/Enterprise):**
   - Manages organization accounts, multi-project compliance dashboards, policy distribution, and append-only cryptographic certificate verification.
   - Allows clients and external auditors to verify release certificates against a tamper-proof registry without accessing client source code.

---

## 2. Target Architectural Topology (Phase 9 & Beyond)

```text
+---------------------------------------------------------------------------------------------------+
| CLIENT INFRASTRUCTURE (Air-Gapped / Private CI/CD / Local Dev)                                   |
|                                                                                                   |
|  +------------------+       +-------------------------+       +--------------------------------+  |
|  |   SOURCE CODE    | ----> |  CASTLE NATIVE PROBES   | ----> |      EVIDENCE PACKAGE          |  |
|  | (Git Repository) |       | (Sec, Dom, Mnt Probes)  |       | (Controls + Gate Evidence)     |  |
|  +------------------+       +-------------------------+       +---------------+----------------+  |
|                                                                               |                   |
|                                                                               v                   |
|  +------------------+       +-------------------------+       +---------------+----------------+  |
|  | RELEASE ARTIFACT | <---- |   CASTLE GATE ENGINE    | <---- |     CQS v1.1 ENGINE (FROZEN)   |  |
|  | (Certificate/Aud)|       | (Policy Resolver C1..C6)|       | (Mathematical Double Precision)|  |
|  +--------+---------+       +-------------------------+       +--------------------------------+  |
+-----------|---------------------------------------------------------------------------------------+
            |
            | (Optional TLS Telemetry Sync / Certificate Attestation)
            v
+---------------------------------------------------------------------------------------------------+
| GRUPO CASTILLO CENTRAL GOVERNANCE CLOUD (SaaS / Private Tenant)                                    |
|                                                                                                   |
|  +--------------------------+  +--------------------------+  +---------------------------------+  |
|  | MULTI-TENANT DASHBOARD   |  | POLICY MANAGEMENT HUB    |  | PUBLIC VERIFICATION REGISTRY    |  |
|  | • Cross-Project Scores   |  | • Ratified Matrix Sync   |  | • SHA-256 / Ed25519 Cert Check  |  |
|  | • Portfolio Risk Trends  |  | • Custom SLA Exceptions  |  | • Real-Time Client Trust Badges |  |
|  | • Remediation SLA Alarms |  | • Compliance Export      |  | • Auditor Verification Ledger   |  |
|  +--------------------------+  +--------------------------+  +---------------------------------+  |
+---------------------------------------------------------------------------------------------------+
```

---

## 3. Strict Layer Invariance (The Delivery Pipeline Contract)

The architectural contract established in Phase 8 remains strictly non-negotiable:

$$\text{SOURCE CODE} \xrightarrow{\text{Probes Nativos}} \text{EVIDENCE} \xrightarrow{\text{CQS v1.1}} \text{SCORE} \xrightarrow{\text{POLICY C1..C6}} \text{GATE DECISION} \xrightarrow{\text{AUTHORIZER}} \text{RELEASE CERTIFICATE}$$

### Formal Invariants:
1. **Probes are strictly passive sensors:** They never compute scores, adjust weights, or make release decisions.
2. **CQS is strictly mathematical:** It evaluates discrete statuses (`PASS`, `FAIL`, `N/A`, `UNEXECUTED`) against 65 atomic weights. It has zero knowledge of filesystem paths, regex rules, or git branches.
3. **Policy is strictly regulatory:** It defines thresholds, mandatory controls, and SLA windows per level (C1..C6).
4. **Gate is strictly authoritative:** It translates CQS results and policy requirements into a binary delivery decision ($0 = \text{PASS}, 1 = \text{BLOCK}, 2 = \text{REMEDIATION}$).

---

## 4. What Stays Local vs What Goes to Cloud

| Dimension / Capability | Local Execution (CLI / Runner) | Centralized Service (Cloud / SaaS) | Strategic Rationale |
|---|:---:|:---:|---|
| **Source Code Parsing** | **100% Local** | **NEVER** | Zero code leakage; guarantees client intellectual property privacy. |
| **Probe Execution** | **100% Local** | **NEVER** | Eliminates remote upload latency and network bandwidth bottlenecks. |
| **CQS Scoring Calculation** | **100% Local** | Optional Re-Verification | Ensures offline CI/CD pipelines can authorize builds instantly. |
| **Gate Decision & Exit Code** | **100% Local** | Synchronized | Developer feedback loop must be sub-second ($< 25\text{ ms}$). |
| **Certificate Verification** | **Local CLI** | **Public Web Portal** | Internal scripts verify locally; external clients/auditors verify via Web API. |
| **Policy Distribution** | Local JSON Cache | **Central Hub** | Enterprises manage organization-wide policy updates from a single control plane. |
| **Multi-Project Remediation** | Single-Repo Ledger | **Portfolio SLA Tracker** | CTOs and CISOs need holistic visibility across 50+ repositories. |

---

## 5. Security & Cryptographic Roadmap (From SHA-256 to Asymmetric PKI)

* **Current State (Phase 8):** Release certificates are sealed with canonical SHA-256 digests over build metadata and scores. This provides **tamper-evidence** (modifying any byte invalidates the hash), but does not prove *who* signed it without trusting the execution environment.
* **Target State (Commercial Tier):**
  - Integrate asymmetric digital signing (**Ed25519 / RSA-PSS**).
  - Centralized Key Management (**AWS KMS / GCP Cloud KMS / HashiCorp Vault**).
  - Certificates include an asymmetric signature block:
    $$\text{Signature} = \operatorname{Sign}_{\text{Castillo-CA}}(\text{Certificate Digest})$$
  - Anyone (auditor, client, regulator) can verify the authenticity of a release certificate using Grupo Castillo's public key without accessing the repository.
