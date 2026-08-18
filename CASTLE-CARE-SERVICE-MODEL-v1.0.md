# Castle Care — Recurring Service Operating Model (v1.0.0)
**Document ID:** `OPERATING-MODEL-CARE-v1.0.0`  
**Classification:** Standard Operating Procedure (SOP) for Managed Governance  
**Methodology:** Castle Quality System (CQS v1.1 — FROZEN / SINGLE SOURCE OF TRUTH)  
**Supporting Engine:** `@grupo-castillo/castle-gate` (v1.0.0)  

---

## 1. Ciclo Mensual de Gobernanza Continua

```text
AUDITORÍA MENSUAL GATE ──> ANÁLISIS DE SCORE DRIFT ──> SESIÓN TÉCNICA ──> PLAN DE ACCIÓN ──> INFORME TRIMESTRAL
```

---

## 2. Actividades Recurrentes Mensuales

1. **Auditoría Mensual de Certificados:** Inspección de los `release-certificate.json` emitidos durante el mes en el CI/CD del cliente para verificar que ningún commit se haya saltado el Gate.
2. **Monitoreo de Score Drift:** Comparación del CQS Score histórico para detectar tendencias a la baja antes de que provoquen bloqueos en el pipeline.
3. **Mesa Técnica Mensual (1 hora):** Sesión con el Tech Lead del cliente para revisar buenas prácticas, nuevas dependencias y dudas de arquitectura.
4. **Plan de Transición de Nivel:** Asistencia planificada para elevar la política del proyecto (ej. pasar de C1 a C2 o de C2 a C3).
