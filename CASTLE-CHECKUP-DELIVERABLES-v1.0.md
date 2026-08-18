# Castle Checkup — Client Deliverables Specification (v1.0.0)
**Document ID:** `DELIVERABLES-CHECKUP-v1.0.0`  
**Classification:** Scope of Deliverables & Reporting Standards  
**Methodology:** Castle Quality System (CQS v1.1 — FROZEN / SINGLE SOURCE OF TRUTH)  
**Supporting Engine:** `@grupo-castillo/castle-gate` (v1.0.0)  

---

## 1. Estructura de Tres Capas de Entregables

Los entregables de Castle Checkup se organizan formalmente distinguiendo tres fuentes de valor:

```text
+---------------------------------------------------------------------------------------------------+
| 1. AUTOMATED EVIDENCE (Evidencia técnica objetiva producida por Castle Gate v1.0.0)                |
| 2. MANUAL REVIEW (Revisión experta de arquitectura y patrones por consultores de Grupo Castillo) |
| 3. PROFESSIONAL INTERPRETATION (Plan estratégico de remediación y recomendación de Gate C1→C6)    |
+---------------------------------------------------------------------------------------------------+
```

---

## 2. Inventario Detallado de Entregables

```text
+-----------------------+---------------------------------------------------+---------------------------------------------------+
| CAPA                  | ENTREGABLE ESPECÍFICO                             | CONTENIDO Y FORMATO                               |
+-----------------------+---------------------------------------------------+---------------------------------------------------+
| **AUTOMATED**         | • Reporte Interactivo HTML                        | Archivo `.castle/compliance-report.html` autónomo |
| **EVIDENCE**          |   (Compliance Report)                             | con desglose de 65 controles CQS v1.1 y hallazgos.|
|                       | • Paquete de Evidencias CQS                       | Archivo `.castle/evidence-package.json` con datos |
|                       |   (Evidence Package)                              | estructurados y digests de auditoría.             |
|                       | • Inventario de Gate Breakers                     | Listado exacto de secretos y URLs no cifradas.    |
+-----------------------+---------------------------------------------------+---------------------------------------------------+
| **MANUAL**            | • Evaluación de Arquitectura                      | Informe de estructura de carpetas, modularización |
| **REVIEW**            |   (`[MANUAL ASSESSMENT]`)                         | y consistencia de variables de entorno.           |
|                       | • Detección de Deuda Técnica Oculta               | Identificación de patrones de acoplamiento fuerte.|
+-----------------------+---------------------------------------------------+---------------------------------------------------+
| **PROFESSIONAL**      | • Castle Checkup Report Ejecutivo                 | Documento formal en PDF/Markdown con CQS Score,   |
| **INTERPRETATION**    |                                                   | priorización de riesgos y "Quick Wins".           |
|                       | • Sesión de Devolución Estratégica                | Sesión virtual (1 hora) de explicación y Q&A.     |
|                       | • Hoja de Ruta de Remediación                     | Plan paso a paso para neutralizar bloqueos.       |
|                       | • Recomendación de Gate Readiness (C1→C6)         | Dictamen objetivo sobre el nivel adecuado.        |
+-----------------------+---------------------------------------------------+---------------------------------------------------+
```

---

## 3. Elementos Excluidos (Fuera de Alcance de Checkup)

1. **NO se incluye la emisión de un Release Certificate:** El certificado es exclusivo de una ejecución exitosa de Castle Gate (`PASSED`) en el pipeline de release; Checkup es un diagnóstico previo.
2. **NO se incluye la remediación directa de código por Grupo Castillo:** Si el cliente requiere que ingenieros de Grupo Castillo apliquen las correcciones, se escala al servicio especializado *Castle Rescue*.
3. **NO se entrega una certificación legal o regulatoria externa:** Es una evaluación técnica de madurez y buenas prácticas.
