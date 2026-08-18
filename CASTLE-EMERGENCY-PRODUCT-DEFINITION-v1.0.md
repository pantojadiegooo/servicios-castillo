# Castle Emergency — Official Product Definition (v1.0.0)
**Document ID:** `EMERGENCY-DEF-v1.0.0`  
**Classification:** Grupo Castillo Incident Response & Rapid Intervention  
**Methodology:** Castle Quality System (CQS v1.1 — FROZEN / SINGLE SOURCE OF TRUTH)  
**Supporting Engine:** `@grupo-castillo/castle-gate` (v1.0.0)  

---

## 1. ¿Qué es Castle Emergency?

**Castle Emergency** es el **servicio de intervención técnica urgente y de alta prioridad** de Grupo Castillo. Diseñado para responder ante incidentes críticos que detienen un despliegue a producción en tiempo real o comprometen la seguridad higiénica del repositorio (ej. fuga crítica de credenciales de infraestructura o claves maestras de pago).

```text
CRISIS TÉCNICA / FUGA DE SECRETOS ──> CASTLE EMERGENCY (<4h Respuesta) ──> CONTENCIÓN & REMEDIACIÓN EXPRÉS ──> DESBLOQUEO
```

---

## 2. ¿Qué problema resuelve?

1. **Releases Críticos Paralizados:** Lanzamientos de alta visibilidad comercial detenidos horas antes del despliegue por fallas críticas de Gate.
2. **Fuga Aguda de Claves de Producción:** Detección de claves de AWS, Stripe, GitHub PAT o certificados privados en repositorios que requieren purga inmediata y rotación técnica.
3. **Fallas Mayores de Pipelines CI/CD:** Configuración rota en GitHub Actions o GitLab CI que bloquea a todo el equipo de ingeniería.

---

## 3. Límites y Exclusiones Fundamentales

* **NO es un equipo de respuesta forense a brechas de datos (DFIR):** No realizamos investigaciones judiciales ni análisis de intrusión en memoria/red.
* **NO es un SOC 24/7 de monitoreo en tiempo real:** Intervenimos sobre incidentes de código, pipelines y configuración de repositorios.
* **SLA de Respuesta:** Marcado como **`[OBJETIVO OPERACIONAL - SUJETO A RATIFICACIÓN]`** con ventana de contacto de $< 4$ horas hábiles.
