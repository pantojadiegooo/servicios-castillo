# Castle Emergency — Severity Model & Response Framework (v1.0.0)
**Document ID:** `SEVERITY-EMERGENCY-v1.0.0`  
**Classification:** Grupo Castillo Incident Severity & SLA Classification  
**Methodology:** Castle Quality System (CQS v1.1 — FROZEN / SINGLE SOURCE OF TRUTH)  

---

## 1. Niveles de Severidad y Clasificación de Incidentes

```text
+-----------------------+---------------------------------------------------+-----------------------------------+-----------------------+
| NIVEL DE SEVERIDAD    | DEFINICIÓN Y CONDICIONES TÉCNICAS                 | OBJETIVO DE RESPUESTA INICIAL     | TIEMPO OBJETIVO DE    |
|                       |                                                   | `[SUJETO A RATIFICACIÓN]`         | RESOLUCIÓN ESTIMADA   |
+-----------------------+---------------------------------------------------+-----------------------------------+-----------------------+
| **SEV-1 (CRITICAL)**  | • Fuga activa de secretos de producción (AWS,     | **< 2 horas**                     | **< 8 horas**         |
|                       |   Stripe, GitHub PAT) en repositorio público.     | (Contacto y triaje inmediato)     | (Purga y contención)  |
|                       | • Release a producción bloqueado en día crítico.  |                                   |                       |
+-----------------------+---------------------------------------------------+-----------------------------------+-----------------------+
| **SEV-2 (HIGH)**      | • Pipeline de CI/CD totalmente roto por error     | **< 4 horas**                     | **< 24 horas**        |
|                       |   de configuración de Gate en todas las ramas.    | (Asignación de ingeniero)         | (Restablecimiento CI) |
|                       | • Falla recurrente de probes en entorno soportado.|                                   |                       |
+-----------------------+---------------------------------------------------+-----------------------------------+-----------------------+
| **SEV-3 (MEDIUM)**    | • Inconsistencias de dependencias complejas       | **< 8 horas hábiles**             | **< 48 horas hábiles**|
|                       |   que impiden el paso a Nivel C2 antes de evento. | (Sesión técnica programada)       | (Remediación guiada)  |
+-----------------------+---------------------------------------------------+-----------------------------------+-----------------------+
```
