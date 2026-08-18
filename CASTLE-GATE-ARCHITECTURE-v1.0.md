# Castle Security & Quality Gate — System Architecture & Formal Model (v1.0.0)
**Document ID:** `ARCH-SPEC-v1.0.0-FORMAL`  
**Classification:** Grupo Castillo Core Architectural Framework  
**Methodology:** Castle Quality System (CQS v1.1 — FROZEN / SINGLE SOURCE OF TRUTH)  
**Software Package:** `@grupo-castillo/castle-gate` (v1.0.0)  

---

## 1. Arquitectura Conceptual General

El ecosistema de gobernanza de software de Grupo Castillo se estructura formalmente en dos capas desacopladas pero perfectamente coordinadas: la **Capa de Medición (Measurement Layer)** gobernada por **CQS v1.1**, y la **Capa de Gobernanza (Governance Layer)** gobernada por **Castle Gate**.

```text
                               GRUPO CASTILLO
                                     │
                                     ▼
                         CASTLE SECURITY & QUALITY
                                  GATE
                                     │
                        ┌────────────┴────────────┐
                        ▼                         ▼
                   CQS v1.1                  Gate Policy
                Measurement Layer          Governance Layer
                        │                         │
                        ▼                         ▼
                 65 controles               C1 → C6
                 7 dominios             reglas / umbrales /
                 scoring                  Gate Breakers
                        │                         │
                        └────────────┬────────────┘
                                     ▼
                            Gate Decision
                                     │
                            ┌────────┴────────┐
                            ▼                 ▼
                         PASSED            BLOCKED
                            │
                            ▼
                   Release Certificate
```

---

## 2. Definición de Componentes y Separación de Responsabilidades

### A. Capa de Medición: CQS v1.1 (`cqs/`)
* **Propósito:** Responder objetivamente a la pregunta: *¿Cómo medimos matemáticamente la calidad y seguridad técnica de este producto digital?*
* **Estructura:** 65 controles atómicos distribuidos en 7 dominios funcionales con una escala nominal de 100.00 puntos.
* **Invarianza:** Especificación congelada (*FROZEN*). Cero mutabilidad en pesos, fórmulas de normalización o definiciones de controles.

### B. Capa de Gobernanza: Castle Gate (`castle-gate/`)
* **Propósito:** Responder a la pregunta: *¿Bajo qué política permitimos, retenemos o bloqueamos el release de esta versión a producción?*
* **Estructura:** Motor de decisión (`GateDecisionEngine`), recolectores de evidencia (`Castle Native Probes`), evaluador de vetos (*Gate Breakers*) y emisor de autorizaciones (`ReleaseAuthorizer`).
* **Operación:** Transforma la evidencia y el score CQS en una decisión binaria de ejecución en pipelines CI/CD y entornos locales.

### C. Niveles de Madurez de Política: C1 a C6
* **Propósito:** Definir umbrales progresivos de exigencia operativa.
* **Aclaración Crítica:** **C1→C6 NO son seis metodologías distintas**, sino seis niveles de rigor aplicados sobre el mismo motor de evaluación CQS v1.1.

### D. Artefacto de Integridad: Release Certificate
* **Propósito:** Generar un registro inmutable y sellado criptográficamente (`release-certificate.json`) con digest SHA-256 canónico que demuestra que un commit y directorio específicos fueron formalmente autorizados bajo una política ratificada.

---

## 3. Flujo Completo de Evaluación y Toma de Decisión

```text
+---------------------------------------------------------------------------------------------------+
| 1. INVOCACIÓN LOCAL O CI/CD                                                                       |
|    $ castle-gate scan --dir ./src --level C2                                                      |
+---------------------------------------------------------------------------------------------------+
                                  │
                                  ▼
+---------------------------------------------------------------------------------------------------+
| 2. RECOLECCIÓN DE EVIDENCIA (Castle Native Probes)                                                |
|    - SecurityProbe: Secretos hardcodeados, transporte HTTP, cabeceras de seguridad.               |
|    - DomSemanticsProbe: Estructura HTML5, accesibilidad base, meta tags.                          |
|    - MaintainabilityProbe: Consistencia de package.json y fijación de lockfiles.                 |
+---------------------------------------------------------------------------------------------------+
                                  │
                                  ▼
+---------------------------------------------------------------------------------------------------+
| 3. EVALUACIÓN Y SCORING MATEMÁTICO (CQS v1.1 Engine)                                              |
|    - Normalización de evidencias según cqs/registry/controls.json y domains.json.                 |
|    - Cálculo del CQS Raw Score y Display Score (0.00 a 100.00).                                   |
+---------------------------------------------------------------------------------------------------+
                                  │
                                  ▼
+---------------------------------------------------------------------------------------------------+
| 4. EVALUACIÓN DE POLÍTICA DE GOBERNANZA (Gate Decision Engine)                                    |
|    ¿Existen Gate Breakers activos (GB-01 a GB-04)?                                                |
|    ├── SÍ ──> Decisión: BLOCKED (Exit Code 1) -> Pipeline HALT / Certificado RETENIDO             |
|    └── NO ──> ¿El CQS Score cumple el umbral del nivel (ej. C2 >= 78.00)?                         |
|               ├── NO  ──> Decisión: REQUIRES_REMEDIATION (Exit Code 2) -> Pipeline RETENIDO       |
|               └── SÍ  ──> Decisión: PASSED (Exit Code 0) -> Pipeline CONTINÚA                      |
+---------------------------------------------------------------------------------------------------+
                                  │
                                  ▼
+---------------------------------------------------------------------------------------------------+
| 5. EMISIÓN DE ARTEFACTOS Y VERIFICACIÓN                                                           |
|    - Reporte HTML Autónomo: .castle/compliance-report.html                                        |
|    - Release Certificate:   .castle/release-certificate.json (Sellado con SHA-256)                |
|    - Verificación CLI:      castle-gate verify-cert --cert ./release-certificate.json             |
+---------------------------------------------------------------------------------------------------+
```

---

## 4. Garantía de Aislamiento y Zero-Dependencies

* **Runtime Autocontenido:** `@grupo-castillo/castle-gate` declara `dependencies: {}` en su `package.json`.
* **Privacidad Estricta (Air-Gapped):** 0 llamadas de red (`http`, `https`, `fetch`, `axios`, `dgram`, `net`, `tls`, `WebSocket`). Todo el análisis opera en memoria local.
