# Castle Emergency — Rapid Intervention Operating Model (v1.0.0)
**Document ID:** `OPERATING-MODEL-EMERGENCY-v1.0.0`  
**Classification:** Standard Operating Procedure (SOP) for Urgent Technical Interventions  
**Methodology:** Castle Quality System (CQS v1.1 — FROZEN / SINGLE SOURCE OF TRUTH)  
**Supporting Engine:** `@grupo-castillo/castle-gate` (v1.0.0)  

---

## 1. Flujo de Intervención Rápida

```text
1. EMERGENCY TRIGGER ──> 2. CONTAINMENT & PURGE ──> 3. RAPID SPRINT ──> 4. HOT RE-SCAN ──> 5. POST-MORTEM
```

---

## 2. Definición de Pasos Operativos

1. **Emergency Trigger & Dispatch:** El cliente activa el servicio de emergencia vía canal de alta prioridad. Se asigna un Ingeniero Líder en menos de 2 horas.
2. **Containment & Secret Purging:** Si hay credenciales comprometidas, se asiste al cliente para invalidar la clave en el proveedor (AWS/Stripe) y purgar el historial Git si es necesario.
3. **Rapid Sprint:** Modificación urgente de variables de entorno, configuración de CI/CD y parches de código necesarios.
4. **Hot Re-Scan:** Ejecución del motor Castle Gate localmente para confirmar que el Gate Breaker se ha desactivado y que la política autoriza el paso (`PASSED`).
5. **Post-Mortem & Hardening:** Emisión del reporte de incidente con causas raíz y recomendaciones para evitar recurrencias (sugiriendo la adopción de *Castle Care*).
