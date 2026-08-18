# Castle Checkup — Service Tiers & Packages Specification (v1.0.0)
**Document ID:** `TIERS-CHECKUP-v1.0.0`  
**Classification:** Commercial Service Packaging & Scope Tiers  
**Methodology:** Castle Quality System (CQS v1.1 — FROZEN / SINGLE SOURCE OF TRUTH)  
**Supporting Engine:** `@grupo-castillo/castle-gate` (v1.0.0)  

---

## 1. Estructura de Tres Niveles de Servicio

Castle Checkup se ofrece en tres modalidades progresivas según el tamaño del proyecto y la profundidad de análisis requerida:

```text
+---------------------------------------------------------------------------------------------------+
| 1. CHECKUP FOUNDATION (Diagnóstico higiénico ágil para proyectos tempranos y MVPs)                |
| 2. CHECKUP STANDARD (Diagnóstico completo para aplicaciones comerciales y plataformas web B2B)    |
| 3. CHECKUP ADVANCED (Diagnóstico multicapa para microservicios y sistemas transaccionales)       |
+---------------------------------------------------------------------------------------------------+
```

---

## 2. Matriz Comparativa de Paquetes de Servicio

```text
+-----------------------+-----------------------+-----------------------+-----------------------+
| DIMENSIÓN             | CHECKUP FOUNDATION    | CHECKUP STANDARD      | CHECKUP ADVANCED      |
+-----------------------+-----------------------+-----------------------+-----------------------+
| **Alcance**           | 1 Repositorio / Web   | 1 Repositorio B2B     | Hasta 2 Repositorios /|
|                       | simple / MVP          | / App comercial       | API + Frontend        |
+-----------------------+-----------------------+-----------------------+-----------------------+
| **Profundidad**       | Higiene básica,       | Higiene + Semántica   | Higiene + Semántica + |
|                       | secretos y enlaces    | + Lockfiles + DOM     | Arquitectura multicapa|
+-----------------------+-----------------------+-----------------------+-----------------------+
| **Evidencias**        | Castle Native Probes  | Probes + Lighthouse   | Probes + Lighthouse + |
|                       | (Static Scan)         | JSON Adapter          | Manual Review experta |
+-----------------------+-----------------------+-----------------------+-----------------------+
| **Sesiones con**      | 1 Sesión de entrega   | 1 Sesión Discovery +  | 1 Discovery + 1 Review|
| **Consultor**         | (45 minutos)          | 1 Entrega (1.5 horas) | técnica + 1 Ejecutiva |
+-----------------------+-----------------------+-----------------------+-----------------------+
| **Entregables**       | • Reporte Ejecutivo   | • Reporte Completo    | • Reporte Avanzado    |
|                       | • Compliance HTML     | • Compliance HTML     | • Compliance HTML     |
|                       | • Quick Wins Plan     | • Plan de Remediación | • Roadmap Multicapa   |
+-----------------------+-----------------------+-----------------------+-----------------------+
| **Duración**          | 2 días hábiles        | 3 a 4 días hábiles    | 5 días hábiles        |
+-----------------------+-----------------------+-----------------------+-----------------------+
| **Resultado**         | CQS Score base +      | CQS Score completo +  | CQS Score integral +  |
|                       | Gate Readiness C1     | Gate Readiness C1/C2  | Gate Readiness C1→C4  |
+-----------------------+-----------------------+-----------------------+-----------------------+
| **Precio Sugerido**   | `[PROPUESTA COMERCIAL | `[PROPUESTA COMERCIAL | `[PROPUESTA COMERCIAL |
| **(LATAM)**           |   SUJETA A APROBACIÓN]|   SUJETA A APROBACIÓN]|   SUJETA A APROBACIÓN]|
|                       | Ref: $350 - $500 USD  | Ref: $750 - $1,100 USD| Ref: $1,400 - $2,000  |
+-----------------------+-----------------------+-----------------------+-----------------------+
```

---

## 3. Condiciones y Políticas de Descuento Cruzado

* **Crédito Hacia Castle Gate:** Si el cliente contrata una suscripción anual de Castle Gate dentro de los 30 días posteriores al Checkup, **el 100% del valor pagado por el Checkup se acredita como descuento** sobre la licencia anual.
