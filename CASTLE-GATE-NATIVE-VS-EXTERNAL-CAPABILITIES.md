# Castle Security & Quality Gate — Native vs External Capabilities Strategy
**Document ID:** `STRAT-CAP-NATIVE-EXT-2026-01`  
**Classification:** Build vs Integrate Architecture Strategy  
**Strategic Principle:** Build the proprietary governance moat; integrate commodity analyzers via clean adapter contracts.  

---

## 1. The Build vs Integrate Decision Framework

Grupo Castillo must focus engineering resources where it holds a true structural advantage (**the release governance moat, deterministic scoring, and policy verification**) while refusing to waste years reinventing mature commodity analyzers:

```text
+---------------------------------------------------------------------------------------------------+
| 1. CORE PROPRIETARY MOAT (WE BUILD & OWN 100%)                                                   |
| • CQS v1.1 Unified Quality Standard & Taxonomy (65 Controls across 7 Domains)                    |
| • Deterministic Multi-Domain Scoring Model (IEEE 754 arithmetic with N/A divisor pruning)         |
| • Ratified C1..C6 Gate Policies & Gate Breakers (GB-01..05)                                      |
| • Evidence Package Hashing & Provenance System                                                    |
| • Verifiable Release Certificate Issuance & Public Verification Ledger                           |
| • Lightweight Native Zero-Dependency Probes (Secrets, DOM Semantics, Maintainability, Headers)   |
+---------------------------------------------------------------------------------------------------+
                                                 |
                                                 | Standard Ingestion Contracts
                                                 v
+---------------------------------------------------------------------------------------------------+
| 2. COMMODITY SENSORS / SPECIALIZED ADAPTERS (WE INTEGRATE AS OPTIONAL PLUGINS)                   |
| • Complex AST Taint Analysis & Deep SAST          -> (e.g. Semgrep / CodeQL / SonarQube JSON)     |
| • Open Source Dependency CVE Vulnerability DB     -> (e.g. OSV / GitHub Dependabot / Snyk JSON)   |
| • Full Browser Synthetic Emulation (Lab Telemetry)-> (e.g. Google Lighthouse JSON)               |
| • Active DAST Penetration Testing                 -> (e.g. OWASP ZAP XML/JSON)                    |
| • Real User Monitoring (RUM / Field Telemetry)    -> (e.g. Google CrUX API / Cloudflare RUM)     |
+---------------------------------------------------------------------------------------------------+
```

---

## 2. Granular Capability Breakdown

### A. Capabilities We MUST Build Internally (*Castle Native*)

| Native Capability | Target Controls | Why We Build It Ourselves |
|---|:---:|---|
| **1. Fast Secrets & Credential Scanner** | `SEC-05.1`, `GB-01` | Instant local feedback ($< 5\text{ ms}$) without requiring external cloud API keys or SaaS logins. |
| **2. Dangerous Web Patterns Scanner** | `SEC-04.1` | Direct static detection of `eval()`, `document.write()`, and unsanitized `innerHTML`. |
| **3. Transport & Security Headers Probe** | `SEC-01.2`, `SEC-02.1` | Immediate verification of HTTPS links and CSP/HSTS configuration. |
| **4. HTML5 DOM Semantics & Accessibility Probe** | `ACC-01.1`, `ACC-03.1`, `UX-01.1`, `SEO-02.1` | Validates landmarks, heading trees, alt text, viewport, and SEO metadata in pure Node.js ($< 10\text{ ms}$). |
| **5. Code Structure & Lockfile Hygiene Probe** | `MNT-01.1`, `MNT-02.1`, `PER-04.2` | Detects monolithic files ($> 800$ LOC), deep nesting ($> 5$), missing lockfiles, and missing image dimensions. |
| **6. Release Certification & Audit Engine** | Governance | The cryptographic core that signs release authorizations and tracks remediation ledgers. |

### B. Capabilities We Deliberately DO NOT Build Internally (*Integrate via Adapters*)

| Specialized Capability | Existing Industry Standard | Why We Do NOT Reinvent It |
|---|:---:|---|
| **1. Multi-File Interprocedural Taint SAST** | Semgrep / SonarQube / CodeQL | Requires millions of dollars in compiler/AST graph engine development with high maintenance overhead. |
| **2. Global CVE Vulnerability Database** | Google OSV / Snyk Intel / NVD | Requires dedicated threat intelligence teams continuously tracking 200,000+ software vulnerabilities. |
| **3. Headless Chrome Browser Lab** | Google Lighthouse / Puppeteer | Google maintains the Chromium engine and Core Web Vitals lab scoring; running Chrome headless is heavy. |
| **4. Active Dynamic Application Scanner (DAST)** | OWASP ZAP / Burp Suite | Requires stateful HTTP spidering, SQL injection fuzzers, and network traffic proxies. |
| **5. Real User Monitoring (RUM / CrUX)** | Chrome User Experience Report / Cloudflare | Requires billions of live user telemetry data points across global ISPs and browsers. |

---

## 3. The Unified Evidence Model

Both **Native Probes** and **External Adapters** output the identical normalized evidence structure:

```json
{
  "control_id": "SEC-01.1",
  "status": "PASS",
  "evidence_type": "lab_telemetry",
  "details": "Verified via Castle SecurityProbe (or SonarQube/Lighthouse Adapter)",
  "provenance": {
    "source_adapter": "CastleSecurityProbe | LighthouseAdapter | SonarAdapter",
    "version": "1.0.0",
    "timestamp": "2026-08-13T19:24:00Z",
    "execution_duration_ms": 12,
    "payload_sha256": "41f02d27c41ecef1..."
  }
}
```

* **Outcome:** CQS v1.1 evaluates evidence with complete agnosticism. It does not care whether evidence was gathered by a lightweight native probe or a massive corporate scanner, preserving 100% architectural independence.
