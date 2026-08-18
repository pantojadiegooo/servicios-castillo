# Castle GTM — Commercial Pilot Sales Process (v1.0.0)
**Document ID:** `GTM-PILOT-SALES-v1.0.0`  
**Classification:** Standard Operating Procedure (SOP) for Commercial Pilot Execution  
**Methodology:** Castle Quality System (CQS v1.1 — FROZEN / SINGLE SOURCE OF TRUTH)  

---

## 1. El Ciclo de Venta y Entrega del Piloto Comercial

```text
PRE-SALES ──> NDA & ACCESO ──> ONBOARDING ──> BASELINE SCAN ──> FINDINGS REVIEW ──> REMEDIATION
                                                                                          │
EXPANSION <── PILOT CLOSURE <── CI/CD AUTOMATION <── CERTIFICATION <── RE-SCAN <──────────┘
```

---

## 2. Matriz de Control Operativo del Piloto

```text
+-----------------------+---------------+-----------------------+-----------------------+-----------------------+-----------------------+
| ETAPA                 | RESPONSABLE   | DOCUMENTO / EVIDENCIA | CRITERIO DE ÉXITO     | CRITERIO DE ABANDONO  | SIGUIENTE PASO        |
+-----------------------+---------------+-----------------------+-----------------------+-----------------------+-----------------------+
| **1. Pre-Sales**      | Account Exec  | Propuesta de Piloto   | Cliente aprueba el    | Falta de interés o    | ──> 2. NDA & Acceso   |
|                       | Grupo Castillo| formal firmada.       | alcance y nivel (C1). | stack incompatible.   |                       |
+-----------------------+---------------+-----------------------+-----------------------+-----------------------+-----------------------+
| **2. NDA & Acceso**   | Operaciones   | Acuerdo de No         | NDA firmado y acceso  | Negativa de acceso al | ──> 3. Onboarding     |
|                       | Grupo Castillo| Divulgación firmado.  | de lectura concedido. | código fuente.        |                       |
+-----------------------+---------------+-----------------------+-----------------------+-----------------------+-----------------------+
| **3. Onboarding**     | Consultor     | Customer Runbook      | Paquete instalado y   | Incompatibilidad de   | ──> 4. Baseline Scan  |
|                       | Técnico       | entregado al cliente. | `version` verificado. | entorno Node.js <18.  |                       |
+-----------------------+---------------+-----------------------+-----------------------+-----------------------+-----------------------+
| **4. Baseline Scan**  | Consultor &   | Compliance Report HTML| Scan finalizado en    | Error fatal en CLI    | ──> 5. Findings Review|
|                       | DevOps Cliente| + Evidence Package.   | < 500 ms sin errores. | (escalar a ingeniería)|                       |
+-----------------------+---------------+-----------------------+-----------------------+-----------------------+-----------------------+
| **5. Findings Review**| Consultor     | Minuta técnica con    | Cliente comprende los | El cliente rechaza la | ──> 6. Remediation    |
|                       | Grupo Castillo| hallazgos priorizados.| bloqueos activos.     | validez del hallazgo. |                       |
+-----------------------+---------------+-----------------------+-----------------------+-----------------------+-----------------------+
| **6. Remediation**    | Desarrollador | Pull Request con      | Secretos eliminados y | El cliente no dedica  | ──> 7. Re-Scan        |
|                       | del Cliente   | correcciones de código| lockfiles fijados.    | tiempo a corregir.    |                       |
+-----------------------+---------------+-----------------------+-----------------------+-----------------------+-----------------------+
| **7. Re-Scan**        | Consultor     | Segundo reporte HTML  | Obtención de          | Gate Breaker persiste | ──> 8. Certification  |
|                       | Grupo Castillo| con score actualizado.| `Exit Code 0 (PASSED)`| activo (re-iterar).   |                       |
+-----------------------+---------------+-----------------------+-----------------------+-----------------------+-----------------------+
| **8. Certification**  | Release       | Release Certificate   | `verify-cert` valida  | Digest corrupto       | ──> 9. CI/CD Autom.   |
|                       | Authorizer    | sellado con SHA-256.  | integridad (Exit 0).  | (regenerar cert).     |                       |
+-----------------------+---------------+-----------------------+-----------------------+-----------------------+-----------------------+
| **9. CI/CD Autom.**   | Consultor &   | Workflow YAML en      | Pipeline ejecuta scan | Falla de permisos en  | ──> 10. Pilot Closure |
|                       | DevOps Cliente| GitHub / GitLab CI.   | y autoriza el build.  | runners de CI.        |                       |
+-----------------------+---------------+-----------------------+-----------------------+-----------------------+-----------------------+
| **10. Pilot Closure** | Gerencia      | Pilot Closure Report  | Acta firmada y CSAT   | Cliente no completa   | ──> 11. Expansion     |
|                       | Grupo Castillo| oficial completado.   | evaluado >= 4.5 / 5.  | la encuesta de cierre.|     (Care / Anual)    |
+-----------------------+---------------+-----------------------+-----------------------+-----------------------+-----------------------+
```
