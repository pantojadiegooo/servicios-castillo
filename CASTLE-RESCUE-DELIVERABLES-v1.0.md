# Castle Rescue — Remediation Deliverables Specification (v1.0.0)
**Document ID:** `DELIVERABLES-RESCUE-v1.0.0`  
**Classification:** Grupo Castillo Client Deliverables Standard  
**Methodology:** Castle Quality System (CQS v1.1 — FROZEN / SINGLE SOURCE OF TRUTH)  
**Supporting Engine:** `@grupo-castillo/castle-gate` (v1.0.0)  

---

## 1. Inventario de Entregables de Castle Rescue

```text
+---------------------------------------------------------------------------------------------------+
| 1. PULL REQUESTS DE REMEDIACIÓN DE CÓDIGO (Git Pull Requests)                                     |
|    - Ramas con código limpio, testeado y listo para merge en el repositorio del cliente.          |
|    - Cero secretos expuestos, lockfiles fijados y semántica DOM corregida.                        |
+---------------------------------------------------------------------------------------------------+
| 2. BITÁCORA TÉCNICA DE CAMBIOS (Remediation Changelog & Diff Report)                             |
|    - Detalle exhaustivo de cada línea modificada, archivo afectado y control CQS remediado.       |
+---------------------------------------------------------------------------------------------------+
| 3. COMPARATIVA DE REPORTES HTML (Pre vs. Post Remediation)                                        |
|    - Evidencia gráfica del salto de score CQS (ej. de 55.00 BLOCKED a 88.89 PASSED).              |
+---------------------------------------------------------------------------------------------------+
| 4. RELEASE CERTIFICATE OFICIAL (.castle/release-certificate.json)                                 |
|    - Certificado generado tras alcanzar Exit Code 0 (PASSED) en el Nivel objetivo acordado.       |
+---------------------------------------------------------------------------------------------------+
| 5. SESIÓN DE TRANSFERENCIA TÉCNICA (Handover Session - 45 min)                                    |
|    - Explicación al equipo interno del cliente sobre cómo mantener las correcciones aplicadas.    |
+---------------------------------------------------------------------------------------------------+
```
