# Castle Audit — Deep Investigation Methodology (v1.0.0)
**Document ID:** `METHODOLOGY-AUDIT-v1.0.0`  
**Classification:** Standard Operating Procedure (SOP) for Deep Technical Audits  
**Methodology:** Castle Quality System (CQS v1.1 — FROZEN / SINGLE SOURCE OF TRUTH)  
**Supporting Engine:** `@grupo-castillo/castle-gate` (v1.0.0)  

---

## 1. Flujo Metodológico en 6 Fases

```text
1. SCOPING ──> 2. AUTOMATED GATE ──> 3. HUMAN ARCHITECTURE ──> 4. RESILIENCE MODELING ──> 5. SYNTHESIS ──> 6. DEFENSE SESSION
```

---

## 2. Definición Detallada de las Fases

```text
+-----------------------+---------------+-----------------------------------------------------------------------------------+
| FASE                  | RESPONSABLE   | DESCRIPCIÓN Y ACTIVIDADES                                                         |
+-----------------------+---------------+-----------------------------------------------------------------------------------+
| **1. Scoping &**      | Lead Auditor  | Entrevista profunda de arquitectura (1.5 horas). Ingesta de diagramas de flujo,  |
| **Ingestion**         | Grupo Castillo| esquemas de datos y acceso controlado al repositorio de código fuente.            |
+-----------------------+---------------+-----------------------------------------------------------------------------------+
| **2. Automated Gate &**| Software      | Ejecución del motor Castle Gate v1.0.0 para análisis estático, recolección de      |
| **Evidence Gathering**| Engine        | probes nativos e ingesta de evidencias Lighthouse en `.castle/evidence-package.json`.|
+-----------------------+---------------+-----------------------------------------------------------------------------------+
| **3. Human Deep**     | Senior Tech   | `[MANUAL ASSESSMENT]` Inspección línea a línea de capas arquitectónicas críticas:|
| **Architecture**      | Architect     | Acoplamiento, modularidad, patrones de inyección, gestión de estado y persistencia|
+-----------------------+---------------+-----------------------------------------------------------------------------------+
| **4. Security &**     | Security      | Análisis de superficie de ataque: Sanitización de entradas, manejo de tokens,     |
| **Resilience Modeling**| Specialist    | transporte cifrado, control de errores global y tolerancia a fallos.              |
+-----------------------+---------------+-----------------------------------------------------------------------------------+
| **5. Synthesis & CQS**| Audit Panel   | Consolidación de hallazgos automatizados y manuales. Cálculo del CQS Score final  |
| **Score Convergence** | Grupo Castillo| y estructuración del reporte exhaustivo con priorización por impacto de negocio.  |
+-----------------------+---------------+-----------------------------------------------------------------------------------+
| **6. Executive & Tech**| Lead Auditor  | Sesión formal de entrega y defensa técnica (2 horas) con el equipo de liderazgo   |
| **Defense Session**   | & CTO Cliente | técnico del cliente para debatir conclusiones y validar el roadmap de remediación.|
+-----------------------+---------------+-----------------------------------------------------------------------------------+
```

---

## 3. Protocolo de Evaluación Manual (`[MANUAL ASSESSMENT]`)

* **Independencia Metodológica:** Los hallazgos humanos se categorizan en dimensiones arquitectónicas claras y nunca alteran el cálculo algorítmico puro de CQS v1.1.
* **Trazabilidad:** Cada observación de arquitectura incluye archivo, fragmento de código relevante, riesgo potencial y propuesta de refactorización recomendada.
