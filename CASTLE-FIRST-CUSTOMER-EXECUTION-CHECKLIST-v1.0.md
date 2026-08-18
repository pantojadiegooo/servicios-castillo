# Castle Operations — First Real Customer Execution Checklist (v1.0.0)
**Document ID:** `CHECKLIST-FIRST-CUSTOMER-v1.0.0`  
**Classification:** Standard Operating Procedure for Live Customer Delivery  
**Methodology:** Castle Quality System (CQS v1.1 — FROZEN / SINGLE SOURCE OF TRUTH)  

---

## 1. Guía Paso a Paso de Ejecución del Primer Cliente Real

```text
================================================================================
           CHECKLIST DE EJECUCIÓN OPERATIVA DEL PRIMER CLIENTE REAL
================================================================================
[ ] 1. PROSPECTING:       Identificar prospecto y registrar en CRM.
[ ] 2. QUALIFICATION:     Calificar lead con Lead Scoring >= 80 pts (HOT).
[ ] 3. DISCOVERY CALL:    Realizar llamada de 30 min y confirmar stack Node.js/Web.
[ ] 4. PROPOSAL:          Enviar propuesta de Castle Checkup / Piloto C1.
[ ] 5. SOW & NDA:         Firmar acuerdo de confidencialidad y SOW acotado.
[ ] 6. PAYMENT:           Recibir confirmación del anticipo del 50%.
[ ] 7. ONBOARDING:        Entregar Customer Runbook y validar Node.js >= 18.0.0.
[ ] 8. BASELINE SCAN:     $ castle-gate scan --dir . --level C1 (Generar HTML report).
[ ] 9. FINDINGS REVIEW:   Sesión conjunta de 1h para revisar bloqueos (secretos/HTTP).
[ ] 10. REMEDIATION:      Asistir al cliente en la extracción a process.env y lockfiles.
[ ] 11. RE-SCAN:          Ejecutar segundo scan y confirmar Exit Code 0 (PASSED).
[ ] 12. CERTIFICATION:    Generar y verificar release-certificate.json con verify-cert.
[ ] 13. CI/CD WORKFLOW:   Integrar action.yml en GitHub Actions del cliente.
[ ] 14. PILOT CLOSURE:    Completar y firmar el Pilot Closure Report oficial.
[ ] 15. EXPANSION:        Presentar propuesta de suscripción anual Castle Gate / Care.
================================================================================
```
