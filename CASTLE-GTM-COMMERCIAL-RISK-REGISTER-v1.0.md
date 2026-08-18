# Castle GTM — Commercial Risk Register & Mitigation Strategy (v1.0.0)
**Document ID:** `GTM-RISK-REGISTER-v1.0.0`  
**Classification:** Grupo Castillo Governance & Commercial Risk Management  
**Methodology:** Castle Quality System (CQS v1.1 — FROZEN / SINGLE SOURCE OF TRUTH)  

---

## 1. Matriz de Riesgos Comerciales y Estrategia de Mitigación

```text
+----+------------------------------+---------------+---------------+---------------------------------------------------------------+
| #  | RIESGO COMERCIAL IDENTIFICADO| PROBABILIDAD  | IMPACTO       | ESTRATEGIA DE MITIGACIÓN OBLIGATORIA                          |
+----+------------------------------+---------------+---------------+---------------------------------------------------------------+
| 1  | **Falta de Marca y**         | **ALTA**      | **MEDIO**     | Ofrecer Castle Checkup de bajo costo ($350) con garantía de   |
|    | **Casos de Éxito Iniciales** |               |               | 100% de crédito hacia la suscripción anual de Castle Gate.    |
+----+------------------------------+---------------+---------------+---------------------------------------------------------------+
| 2  | **Confusión con**            | **ALTA**      | **ALTO**      | Aplicar estrictamente el Sales Playbook y la Matriz de        |
|    | **Certificaciones SOC2/ISO** |               |               | Anti-Claims: Reiterar que el certificado es de release interno|
+----+------------------------------+---------------+---------------+---------------------------------------------------------------+
| 3  | **Sobreventa Comercial /**   | **MEDIA**     | **CRÍTICO**   | Prohibir prometer análisis fuera del stack web/Node.js.       |
|    | **Promesas Incumplibles**    |               |               | Apegarse exclusivamente a los 65 controles CQS v1.1 frozen.   |
+----+------------------------------+---------------+---------------+---------------------------------------------------------------+
| 4  | **Objeciones de Presupuesto**| **MEDIA**     | **MEDIO**     | Demostrar el ROI inmediato: Evitar 1 fuga de clave en AWS     |
|    | **en Startups Tempranas**    |               |               | ahorra miles de dólares en incidentes y horas de ingeniería.  |
+----+------------------------------+---------------+---------------+---------------------------------------------------------------+
| 5  | **Capacidad Operativa**      | **MEDIA**     | **ALTO**      | Limitar la captación inicial a un máximo de 3 pilotos         |
|    | **Limitada del Equipo**      |               |               | simultáneos para garantizar calidad y CSAT >= 4.5.            |
+----+------------------------------+---------------+---------------+---------------------------------------------------------------+
| 6  | **Falsos Positivos de**      | **BAJA**      | **MEDIO**     | El motor utiliza heurísticas refinadas y probadas contra      |
|    | **Secretos en Comentarios**  |               |               | 45 ataques adversariales sin generar falsas alarmas comunes.  |
+----+------------------------------+---------------+---------------+---------------------------------------------------------------+
```
