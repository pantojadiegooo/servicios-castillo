# Castle Checkup — Official Diagnostic Methodology (v1.0.0)
**Document ID:** `METHODOLOGY-CHECKUP-v1.0.0`  
**Classification:** Standard Diagnostic Operating Procedure (SOP)  
**Methodology:** Castle Quality System (CQS v1.1 — FROZEN / SINGLE SOURCE OF TRUTH)  
**Supporting Engine:** `@grupo-castillo/castle-gate` (v1.0.0)  

---

## 1. Etapas Metodológicas de Castle Checkup

```text
DISCOVERY ──> EVIDENCE COLLECTION ──> TECHNICAL ASSESSMENT ──> CQS ANALYSIS
                                                                    │
RECOMMENDATION <── EXECUTIVE REVIEW <── RISK PRIORITIZATION <── FINDINGS
```

---

## 2. Definición Operativa de las 8 Etapas

```text
+---------------------------+---------------+-----------------------------------------------------------------------------------+
| ETAPA                     | TIPO          | DESCRIPCIÓN Y EVIDENCIAS PROCESADAS                                               |
+---------------------------+---------------+-----------------------------------------------------------------------------------+
| **1. Discovery**          | Manual        | Entrevista inicial (30 min) con el líder técnico para entender la arquitectura,   |
|                           |               | dependencias, contexto de negocio y objetivos del proyecto.                       |
+---------------------------+---------------+-----------------------------------------------------------------------------------+
| **2. Evidence**           | Automatizado  | Invocación del motor Castle Gate para escaneo estático:                           |
| **Collection**            | (Native)      | $ castle-gate scan --dir ./repo --level C1 --output-dir ./.castle                 |
|                           |               | Genera `.castle/evidence-package.json` con los datos de probes nativos.           |
+---------------------------+---------------+-----------------------------------------------------------------------------------+
| **3. Technical**          | Automatizado  | Evaluación algorítmica de los 65 controles CQS v1.1 en 7 dominios:                |
| **Assessment**            | & CQS Engine  | Seguridad higiénica, accesibilidad DOM, estructura de dependencias y lockfiles.   |
+---------------------------+---------------+-----------------------------------------------------------------------------------+
| **4. Architectural**      | `[MANUAL      | Revisión visual experta por consultor de Grupo Castillo de la estructura de       |
| **Review**                |  ASSESSMENT]` | carpetas, modularización y patrones de arquitectura no cubiertos por regex.       |
+---------------------------+---------------+-----------------------------------------------------------------------------------+
| **5. Findings**           | Automatizado  | Extracción y clasificación de hallazgos en 3 niveles de severidad:                |
|                           | & Manual      | • CRITICAL (Gate Breakers como claves expuestas o HTTP no cifrado).               |
|                           |               | • HIGH / MEDIUM (Deficiencias semánticas, viewport faltante, dependencias).      |
|                           |               | • LOW / INFO (Oportunidades de optimización y buenas prácticas).                  |
+---------------------------+---------------+-----------------------------------------------------------------------------------+
| **6. Risk**               | Juicio        | Ponderación del impacto de los hallazgos en el negocio del cliente:               |
| **Prioritization**        | Profesional   | Identificación de "Quick Wins" (correcciones inmediatas de < 1 hora) y "Core Fixes"|
+---------------------------+---------------+-----------------------------------------------------------------------------------+
| **7. Executive**          | Sesión        | Presentación de resultados (1 hora) al CTO / equipo técnico del cliente:          |
| **Review**                | Consultoría   | Explicación del CQS Score, demostración del reporte HTML y resolución de dudas.   |
+---------------------------+---------------+-----------------------------------------------------------------------------------+
| **8. Recommendation**     | Consultoría   | Entrega de hoja de ruta y sugerencia de nivel de Gate adecuado (ej. Nivel C1/C2)  |
|                           | Estratégica   | o servicio de apoyo para remediación (Castle Rescue / Castle Care).               |
+---------------------------+---------------+-----------------------------------------------------------------------------------+
```

---

## 3. Criterios de Evaluación Manual (`[MANUAL ASSESSMENT]`)

Cuando un Checkup incluye revisión de arquitectura o patrones que exceden la inspección estática de los Native Probes:
* **Responsable:** Ingeniero Consultor Senior de Grupo Castillo.
* **Evidencia Requerida:** Inspección visual de esquemas de datos, configuración de variables de entorno y estructura de módulos.
* **Regla de Integridad:** Los hallazgos manuales se presentan en una sección separada del reporte y **nunca alteran el score matemático emitido por el motor CQS v1.1**.
