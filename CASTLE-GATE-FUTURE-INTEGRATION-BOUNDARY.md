# Castle Security & Quality Gate — Future Integration Boundary Architecture
**Document ID:** `ARCH-INT-BOUND-2026-01`  
**Classification:** Adapter Pattern & External System Isolation Specification  
**Governing Rule:** External tools are optional evidence producers; they are never architectural dependencies.  

---

## 1. The Core Isolation Principle

Castle Gate must remain **100% operational in a completely offline, zero-dependency environment**. Any integration with third-party tools (such as SonarQube, Snyk, or OWASP ZAP) must exist exclusively in the **outer adapter layer** (`castle-gate/evidence/adapters/`):

```text
+---------------------------------------------------------------------------------------------------+
| CASTLE GATE CORE ENGINE (ZERO EXTERNAL DEPENDENCIES / IMMUTABLE)                                 |
|                                                                                                   |
|  +--------------------+     +--------------------+     +-------------------+                      |
|  |  CQS v1.1 ENGINE   | <-> |  GATE DECISION ENG | <-> | RELEASE AUTHORIZER|                      |
|  |  (Frozen Scoring)  |     |  (Policy C1..C6)   |     | (Certificates)    |                      |
|  +---------^----------+     +--------------------+     +-------------------+                      |
|            |                                                                                      |
|  +---------+----------+                                                                           |
|  |  EVIDENCE PACKAGE  | <=== (Immutable JSON Ingestion Contract)                                  |
|  +---------^----------+                                                                           |
+------------|--------------------------------------------------------------------------------------+
             |
+------------|--------------------------------------------------------------------------------------+
| ADAPTER LAYER (EXTENSIBLE / FAULT-ISOLATED / OPTIONAL)                                            |
|                                                                                                   |
|  +--------------------------+  +--------------------------+  +---------------------------------+  |
|  | CASTLE NATIVE PROBES     |  | LIGHTHOUSE ADAPTER       |  | FUTURE SONARQUBE ADAPTER        |  |
|  | (Built-in Node.js Probes)|  | (Google LH JSON Parser)  |  | (External SAST JSON Ingestion)  |  |
|  +--------------------------+  +--------------------------+  +---------------------------------+  |
|                                                                                                   |
|  +--------------------------+  +--------------------------+  +---------------------------------+  |
|  | FUTURE OWASP ZAP ADAPTER |  | FUTURE CRUX/RUM ADAPTER  |  | FUTURE SNYK/DEPENDABOT ADAPTER  |  |
|  | (DAST XML/JSON Ingestion)|  | (CrUX API Field Telemetry|  | (CVE Vulnerability JSON Ingest) |  |
|  +--------------------------+  +--------------------------+  +---------------------------------+  |
+---------------------------------------------------------------------------------------------------+
```

---

## 2. The 5 Inviolable Containment Rules

1. **Rule 1 (Zero-Import Core):** The core decision engine (`engine/`), policy resolver (`policy/`), scoring model (`cqs/`), and authorizer (`engine/release-authorizer.js`) must never import an external tool SDK or library.
2. **Rule 2 (Fault Isolation & Graceful Degradation):** If an external adapter fails (e.g. SonarQube server is down, network timeout, invalid JSON), the affected controls must be marked as `UNEXECUTED` with a logged warning. The Gate execution must **never throw an unhandled crash**.
3. **Rule 3 (No Gate Overrides):** An external tool cannot override a CQS Gate Breaker (`GB-01` to `GB-05`) or dictate a passing score. The Gate Decision Engine alone determines release readiness based on the ratified C1..C6 policy.
4. **Rule 4 (Agnostic Control Mapping):** External reports must be mapped strictly to existing, official CQS v1.1 control IDs (`SEC-03.1`, `MNT-01.1`, etc.). External tools are strictly prohibited from creating ad-hoc control IDs.
5. **Rule 5 (Local First):** Running `castle-gate scan` without arguments must always execute Castle Native Probes locally without requiring an internet connection or external servers.

---

## 3. Reference Architecture: Future SonarQube Evidence Adapter

When Grupo Castillo establishes future enterprise integrations with corporate clients utilizing SonarQube, the integration will follow this exact decoupled design:

```typescript
/**
 * Conceptual Architecture for Future SonarQube Adapter (Phase 9+)
 * 
 * Ingests SonarQube analysis export JSON and translates it into CQS control evidence.
 * Operates purely as a file-based parser without importing SonarQube binaries.
 */
class SonarQubeAdapter extends BaseEvidenceAdapter {
  constructor() {
    super('SonarQubeAdapter', '1.0.0');
  }

  /**
   * Translates SonarQube Quality Gate payload into CQS Evidence
   * @param {Object} sonarReport JSON report from SonarQube API
   * @returns {Object} Normalized raw evidence object
   */
  translateToCqsEvidence(sonarReport) {
    const controls = {};

    // 1. Map SonarQube Security Vulnerabilities -> CQS SEC-03.1 / SEC-04.1
    if (sonarReport.projectStatus && sonarReport.projectStatus.conditions) {
      const vulnCondition = sonarReport.projectStatus.conditions.find(c => c.metricKey === 'new_vulnerabilities');
      if (vulnCondition) {
        controls['SEC-04.1'] = {
          status: vulnCondition.status === 'OK' ? 'PASS' : 'FAIL',
          details: `SonarQube Vulnerability Gate: ${vulnCondition.actualValue} new vulnerabilities detected.`
        };
      }

      // 2. Map SonarQube Duplications / Maintainability -> CQS MNT-01.1
      const dupCondition = sonarReport.projectStatus.conditions.find(c => c.metricKey === 'duplicated_lines_density');
      if (dupCondition) {
        controls['MNT-01.1'] = {
          status: parseFloat(dupCondition.actualValue) <= 3.0 ? 'PASS' : 'FAIL',
          details: `SonarQube Duplication: ${dupCondition.actualValue}% duplicated lines.`
        };
      }
    }

    return controls;
  }
}
```

* **Outcome:** The SonarQube adapter acts as a simple file parser. If the client does not use SonarQube, Castle Gate functions identically using its own Native Probes without any missing dependency errors.
