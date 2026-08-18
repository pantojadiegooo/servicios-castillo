# Castle GTM — End-to-End Customer Journey Specification (v1.0.0)
**Document ID:** `GTM-JOURNEY-v1.0.0`  
**Classification:** Grupo Castillo Sales Process & Customer Journey SOP  
**Methodology:** Castle Quality System (CQS v1.1 — FROZEN / SINGLE SOURCE OF TRUTH)  

---

## 1. Mapa del Recorrido Comercial y Operativo

```text
PROSPECT ──> DISCOVERY ──> QUALIFICATION ──> TECH DISCOVERY ──> OFFER ──> PILOT/CHECKUP
                                                                               │
EXPANSION <── CARE <── GATE CI/CD <── REMEDIATION / PASS <── FINDINGS <────────┘
```

---

## 2. Definición Detallada de Cada Etapa del Journey

```text
+-----------------------+---------------+-----------------------+-----------------------+-----------------------+-----------------------+
| ETAPA                 | RESPONSABLE   | INFORMACIÓN REQUERIDA | DECISIÓN / ACCIÓN     | SALIDA                | SIGUIENTE ETAPA       |
+-----------------------+---------------+-----------------------+-----------------------+-----------------------+-----------------------+
| **1. Prospect**       | SDR / Outbound| Nombre empresa, rol   | Identificar encaje    | Lead registrado en CRM| ──> 2. Discovery Call |
|                       | Grupo Castillo| de contacto, stack web| inicial con ICP.      | con datos base.       |                       |
+-----------------------+---------------+-----------------------+-----------------------+-----------------------+-----------------------+
| **2. Discovery**      | Account Exec  | Dolores de calidad,   | Validar dolor real    | Ficha de calificación | ──> 3. Qualification  |
|                       | (15-30 min)   | frecuencia de release | y timing de compra.   | inicial completa.     |                       |
+-----------------------+---------------+-----------------------+-----------------------+-----------------------+-----------------------+
| **3. Qualification**  | Ventas & Lead | Presupuesto, autoridad| Clasificar el lead:   | Dictamen: HOT / WARM /| ──> 4. Tech Discovery |
|                       | Técnico       | y entorno tecnológico | HOT, WARM o DISQUAL.  | COLD / DISQUALIFIED.  |     (si califica)     |
+-----------------------+---------------+-----------------------+-----------------------+-----------------------+-----------------------+
| **4. Tech Discovery** | Consultor     | Repositorio, CI/CD,   | Evaluar viabilidad de | Propuesta técnica de  | ──> 5. Commercial     |
|                       | Senior (45m)  | paquetes, dependencias| análisis y nivel Gate.| servicio recomendada. |        Offer          |
+-----------------------+---------------+-----------------------+-----------------------+-----------------------+-----------------------+
| **5. Offer**          | Account Exec  | Alcance técnico acord.| Presentar cotización  | Propuesta formal      | ──> 6. Pilot/Checkup  |
|                       | Grupo Castillo| y requerimientos.     | Checkup / Piloto C1/C2| enviada al cliente.   |        Kick-off       |
+-----------------------+---------------+-----------------------+-----------------------+-----------------------+-----------------------+
| **6. Pilot/Checkup**  | Consultor &   | Código fuente (Node)  | Ejecutar scan inicial | Reporte HTML +        | ──> 7. Remediation /  |
|                       | DevOps Cliente| y acceso a repo.      | $ castle-gate scan    | Evidence Package JSON.|        Rescue         |
+-----------------------+---------------+-----------------------+-----------------------+-----------------------+-----------------------+
| **7. Remediation**    | Cliente /     | Hallazgos y bloqueos  | Corregir secretos y   | Código limpio listo   | ──> 8. Gate Pass &    |
|                       | Castle Rescue | identificados en HTML | deficiencias DOM/locks| para segundo scan.    |        Certificate    |
+-----------------------+---------------+-----------------------+-----------------------+-----------------------+-----------------------+
| **8. Gate Pass & Cert** Consultor     | Código remediado      | Re-scan determinista  | Release Certificate   | ──> 9. Continuous CI  |
|                       | Grupo Castillo|                       | Exit Code 0 (PASSED). | sellado con SHA-256.  |        & Care         |
+-----------------------+---------------+-----------------------+-----------------------+-----------------------+-----------------------+
| **9. Continuous Care**| Customer      | Repositorios activos  | Auditoría mensual de  | Monthly Digest +      | ──> 10. Multi-Repo    |
|                       | Success Lead  | en producción.        | certificados y drift. | Acompañamiento recurr.|         Expansion     |
+-----------------------+---------------+-----------------------+-----------------------+-----------------------+-----------------------+
| **10. Expansion**     | Account Exec  | Nuevos proyectos      | Escalar a otros repos | Upgrade de suscripción| Ciclo continuo        |
|                       | Grupo Castillo| o microservicios.     | o elevar a Nivel C3/C4| o contrato enterprise.| de gobernanza         |
+-----------------------+---------------+-----------------------+-----------------------+-----------------------+-----------------------+
```
