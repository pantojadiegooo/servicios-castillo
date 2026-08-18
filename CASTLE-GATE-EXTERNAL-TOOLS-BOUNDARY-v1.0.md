# Castle Security & Quality Gate — External Tools & Ecosystem Boundaries (v1.0.0)
**Document ID:** `BOUNDARY-EXT-TOOLS-v1.0.0`  
**Classification:** Technical Scope & Architecture Boundary  
**Methodology:** Castle Quality System (CQS v1.1 — FROZEN / SINGLE SOURCE OF TRUTH)  
**Package:** `@grupo-castillo/castle-gate` (v1.0.0)  

---

## 1. Declaración Estratégica sobre Herramientas Externas

**SonarQube, Snyk, Semgrep, ESLint, OWASP ZAP y Lighthouse NO forman parte del núcleo de Castle Gate v1.0.0**, ni Castle Gate pretende reemplazarlas como analizadores especializados.

La relación arquitectónica correcta es de **complementariedad**:

```text
HERRAMIENTAS ESPECIALIZADAS (SAST, SCA, Linters, DAST)
                          │
                          ▼
            EVIDENCIA TÉCNICA ADICIONAL
                          │
                          ▼
       CASTLE SECURITY & QUALITY GATE (v1.0.0)
                          │
                          ▼
            POLÍTICA DE RELEASE (C1→C6)
                          │
                 ┌────────┴────────┐
                 ▼                 ▼
              PASSED            BLOCKED
```

---

## 2. Comparativa Funcional y Límites Técnicos

```text
+-------------------+---------------------------------------+---------------------------------------+
| HERRAMIENTA       | LO QUE HACE LA HERRAMIENTA EXTERNA    | LO QUE HACE (O NO HACE) CASTLE GATE   |
+-------------------+---------------------------------------+---------------------------------------+
| **SonarQube**     | Análisis profundo de flujo de datos,  | Castle Gate valida higiene estructural|
|                   | cálculo de complejidad ciclomática    | y secretos estáticos. NO ejecuta      |
|                   | compleja y detección de bugs AST.     | compilación AST interprocedural.      |
+-------------------+---------------------------------------+---------------------------------------+
| **Snyk**          | Mantiene una base de datos global     | Castle Gate valida presencia y fijación|
|                   | de CVEs y dependencias vulnerables.   | de lockfiles. NO consulta feeds de CVE|
|                   |                                       | en tiempo real en v1.0.0 (offline).   |
+-------------------+---------------------------------------+---------------------------------------+
| **Semgrep**       | Motor de reglas semánticas ligeras    | Castle Gate ejecuta Native Probes     |
|                   | y búsqueda de patrones de código.     | optimizados para los 65 controles CQS.|
+-------------------+---------------------------------------+---------------------------------------+
| **Lighthouse**    | Auditoría de rendimiento, PWA y SEO   | Castle Gate provee un adaptador       |
|                   | en navegadores Chromium.              | (`lighthouse-adapter.js`) para ingesta|
|                   |                                       | de reportes JSON existentes.          |
+-------------------+---------------------------------------+---------------------------------------+
```

---

## 3. Estado Real de Integración en v1.0.0 vs. Futuras Versiones

* **En v1.0.0 (Actual):**
  * Castle Gate opera con **Castle Native Probes** independientes sin dependencias runtime.
  * Existe un adaptador modular verificado para reportes JSON de Google Lighthouse (`lighthouse-adapter.js`).
  * **SonarQube, Snyk y Semgrep NO están integrados en el runtime de v1.0.0.**
* **En Versiones Futuras (Roadmap v1.2+):**
  * Se podrán construir adaptadores de evidencia (*Evidence Adapters*) opcionales para normalizar salidas de SonarQube o Snyk dentro del `EvidencePackage` CQS.

---

## 4. Conclusión de Posicionamiento

Castle Gate **no intenta sustituir el análisis de código de terceros**; proporciona la **capa unificada de gobernanza y decisión de release** que las organizaciones necesitan para establecer si un producto está listo para producción bajo un estándar determinista propio.
