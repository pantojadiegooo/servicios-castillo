# Castle Security & Quality Gate — Pilot Delivery Process (v1.0.0)
**Document ID:** `PROCESS-DELIVERY-PILOT-v1.0.0`  
**Classification:** Standard Operating Procedure (SOP)  
**Methodology:** Castle Quality System (CQS v1.1 — FROZEN / SINGLE SOURCE OF TRUTH)  
**Product Package:** `@grupo-castillo/castle-gate` (v1.0.0)  

---

## 1. Mapa General del Proceso de Entrega

```text
PRE-SALES ──> DISCOVERY ──> SCOPE ──> ONBOARDING ──> INSTALLATION ──> BASELINE SCAN
                                                                            │
PILOT CLOSURE <── FINAL REVIEW <── CERTIFICATE <── RELEASE DECISION <── RE-SCAN <── REMEDIATION <── FINDINGS REVIEW
```

---

## 2. Definición Detallada de Cada Etapa

```text
+-----------------------+---------------+-----------------------+-----------------------+-----------------------+-----------------------+-----------------------+
| ETAPA                 | RESPONSABLE   | ENTRADA               | ACCIÓN TÉCNICA        | SALIDA                | CRITERIO DE AVANCE    | REGISTRO GRUPO CASTILLO|
+-----------------------+---------------+-----------------------+-----------------------+-----------------------+-----------------------+-----------------------+
| **1. Pre-Sales**      | Comercial     | Lead de cliente       | Presentar propuesta   | Acuerdo de interés    | Cliente acepta        | Ficha de contacto y   |
|                       | Grupo Castillo| interesado            | técnica y valor CQS   | comercial             | evaluar piloto        | calificación inicial  |
+-----------------------+---------------+-----------------------+-----------------------+-----------------------+-----------------------+-----------------------+
| **2. Discovery**      | Consultor     | Repositorio / Pila    | Evaluar tecnología    | Diagnóstico de        | Pila soportada        | Checklist de Discovery|
|                       | Técnico       | tecnológica           | Node.js / Web         | viabilidad técnica    | (Node.js/JS/HTML5)    | archivado             |
+-----------------------+---------------+-----------------------+-----------------------+-----------------------+-----------------------+-----------------------+
| **3. Scope**          | Líder Técnico | Pila tecnológica      | Fijar repositorio y   | Documento de Alcance  | Acuerdo firmado o     | Acta de definición de |
|                       | & Cliente     | y objetivos de release| nivel (C1 o C2)       | del Piloto            | formalizado por email | alcance y nivel       |
+-----------------------+---------------+-----------------------+-----------------------+-----------------------+-----------------------+-----------------------+
| **4. Onboarding**     | Consultor     | Documento de alcance  | Entregar paquete y    | Sesión de inducción   | Cliente cuenta con    | Registro de entrega de|
|                       | Grupo Castillo|                       | Customer Runbook      | técnica agendada      | acceso al software    | paquete y manuales    |
+-----------------------+---------------+-----------------------+-----------------------+-----------------------+-----------------------+-----------------------+
| **5. Installation**   | DevOps Cliente| Paquete distribuible  | Instalar paquete o    | CLI listo para escaneo| `castle-gate version` | Captura de versión y  |
|                       | / Consultor   | `@grupo-castillo/...` | verificar con npx     | en entorno cliente    | retorna Exit Code 0   | entorno verificada    |
+-----------------------+---------------+-----------------------+-----------------------+-----------------------+-----------------------+-----------------------+
| **6. Baseline Scan**  | Consultor &   | Código fuente del     | Ejecutar:             | Reporte baseline      | Scan finaliza y emite | Copia de reporte HTML |
|                       | DevOps Cliente| repositorio acordado  | `scan --level C1/C2`  | `.castle/report.html` | evidencia estructurada| y evidence-package    |
+-----------------------+---------------+-----------------------+-----------------------+-----------------------+-----------------------+-----------------------+
| **7. Findings Review**| Consultor &   | Reporte baseline      | Analizar hallazgos,   | Plan de remediación   | Cliente comprende     | Minuta de revisión con|
|                       | Equipo Cliente| generado              | score y Gate Breakers | priorizado            | la causa del bloqueo  | puntos a corregir     |
+-----------------------+---------------+-----------------------+-----------------------+-----------------------+-----------------------+-----------------------+
| **8. Remediation**    | Desarrollador | Plan de remediación   | Corregir código,      | Código remediado en   | Correcciones listas   | Bitácora de asistencia|
|                       | del Cliente   |                       | remover secretos      | rama de trabajo       | para nuevo scan       | técnica prestada      |
+-----------------------+---------------+-----------------------+-----------------------+-----------------------+-----------------------+-----------------------+
| **9. Re-Scan**        | Consultor &   | Código remediado      | Re-ejecutar scan      | Nuevo reporte con     | Hallazgos críticos    | Segundo reporte HTML  |
|                       | DevOps Cliente|                       | con idéntico nivel    | score actualizado     | eliminados            | generado archivado    |
+-----------------------+---------------+-----------------------+-----------------------+-----------------------+-----------------------+-----------------------+
| **10. Release Decision** Líder Técnico| Resultado del re-scan | Motor emite dictamen  | Estado de Gate:       | `GateDecision ===     | Registro de decisión  |
|                       | Automático    |                       | determinista          | PASSED (Exit Code 0)  | 'PASSED'`             | en base de control    |
+-----------------------+---------------+-----------------------+-----------------------+-----------------------+-----------------------+-----------------------+
| **11. Certificate**   | Release       | Decisión PASSED       | Generar certificado:  | Archivo certificado   | `verify-cert` valida  | Digest SHA-256 del    |
|                       | Authorizer    | y evidencia limpia    | `release-cert.json`   | sellado con SHA-256   | integridad (Exit 0)   | certificado emitido   |
+-----------------------+---------------+-----------------------+-----------------------+-----------------------+-----------------------+-----------------------+
| **12. Final Review**  | Consultor &   | Certificado emitido   | Demostración final e  | Integración CI/CD     | Pipeline ejecuta scan | Workflow YAML / CI    |
|                       | Cliente       | y reporte final       | integración en CI/CD  | automatizada          | y valida el Gate      | validado en ejecución |
+-----------------------+---------------+-----------------------+-----------------------+-----------------------+-----------------------+-----------------------+
| **13. Pilot Closure** | Gerencia      | Todos los artefactos  | Entregar Pilot        | Firma de cierre y     | Acta de cierre        | Expediente completo   |
|                       | Grupo Castillo| y métricas del piloto | Closure Report        | propuesta comercial   | completada            | de piloto archivado   |
+-----------------------+---------------+-----------------------+-----------------------+-----------------------+-----------------------+-----------------------+
```

---

## 3. Criterios de Bloqueo y Contingencias Operativas

* **Si el cliente no remedia un Gate Breaker:** El proceso se detiene en la Etapa 8. **No se emite certificado** ni se fuerza el avance del pipeline.
* **Si el entorno no cuenta con Node.js 18+:** Se asiste al cliente en la actualización del runner antes de ejecutar la Etapa 5.
