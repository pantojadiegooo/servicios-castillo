# Castle Checkup — Service Boundaries & Ecosystem Taxonomy (v1.0.0)
**Document ID:** `BOUNDARIES-SERVICES-v1.0.0`  
**Classification:** Grupo Castillo Ecosystem Service Demarcation  
**Methodology:** Castle Quality System (CQS v1.1 — FROZEN / SINGLE SOURCE OF TRUTH)  

---

## 1. Mapa de Demarcación del Ecosistema de Servicios

Para evitar solapamientos comerciales y operacionales, cada servicio del catálogo de Grupo Castillo responde a un momento específico en el ciclo de vida del cliente:

```text
+-----------------------+-----------------------+-------------------------------------------------------------------------------+
| SERVICIO              | MOMENTO DE COMPRA     | PREGUNTA CENTRAL QUE RESUELVE                                                 |
+-----------------------+-----------------------+-------------------------------------------------------------------------------+
| **Castle Checkup**    | Punto de entrada      | *"¿Cuál es el estado técnico actual de mi repositorio y qué debo corregir?"*  |
+-----------------------+-----------------------+-------------------------------------------------------------------------------+
| **Castle Gate**       | Operación continua    | *"¿Cómo automatizo la decisión de autorizar o bloquear releases en mi CI/CD?"*|
+-----------------------+-----------------------+-------------------------------------------------------------------------------+
| **Castle Audit**      | Evaluación profunda   | *"Necesito una auditoría técnica y arquitectónica exhaustiva con expertos."*  |
+-----------------------+-----------------------+-------------------------------------------------------------------------------+
| **Castle Rescue**     | Bloqueo / Dificultad  | *"Mi release está bloqueado por el Gate y necesito que me ayuden a corregirlo."*|
+-----------------------+-----------------------+-------------------------------------------------------------------------------+
| **Castle Emergency**  | Crisis / Incidente    | *"Tengo una fuga crítica de secretos o fallo mayor y requiero intervención ya."*|
+-----------------------+-----------------------+-------------------------------------------------------------------------------+
| **Castle Care**       | Retención / Soporte   | *"Quiero que Grupo Castillo supervise mensualmente la gobernanza de mis apps."*|
+-----------------------+-----------------------+-------------------------------------------------------------------------------+
```

---

## 2. Fronteras Específicas de Castle Checkup frente al Ecosistema

1. **Checkup vs. Castle Gate:**  
   Checkup es un **servicio de diagnóstico puntual (foto estática)**; Castle Gate es el **producto de software automatizado para pipelines (control continuo)**.
2. **Checkup vs. Castle Audit:**  
   Checkup se enfoca en **higiene técnica y diagnóstico rápido de Gate Readiness (2-3 días)**; Castle Audit es una **auditoría profunda multicapa con análisis arquitectónico detallado (1-2 semanas)**.
3. **Checkup vs. Castle Rescue:**  
   Checkup **identifica y prioriza los problemas** sin modificar código; Castle Rescue **ejecuta la ingeniería de remediación directa** en el repositorio del cliente.
4. **Checkup vs. Castle Care:**  
   Checkup es una **evaluación única de entrada**; Castle Care es una **suscripción mensual de acompañamiento y soporte técnico continuo**.
