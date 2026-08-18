# Castle Security & Quality Gate — Pilot Acceptance Criteria (v1.0.0)
**Document ID:** `CRITERIA-ACCEPTANCE-PILOT-v1.0.0`  
**Classification:** Objective Quality & Pilot Evaluation Standards  
**Methodology:** Castle Quality System (CQS v1.1 — FROZEN / SINGLE SOURCE OF TRUTH)  
**Product Package:** `@grupo-castillo/castle-gate` (v1.0.0)  

---

## 1. Principio de Evaluación Objetiva

Para eliminar la subjetividad en la conclusión de un piloto comercial, **el resultado final debe clasificarse de forma obligatoria en una de las siguientes cinco categorías formales**, basándose estrictamente en hechos técnicos y evidencias reproducibles.

---

## 2. Matriz de Clasificación de Resultados del Piloto

```text
+---------------------------+---------------------------------------------------------------------------------------------------+
| CATEGORÍA DE RESULTADO    | CRITERIOS TÉCNICOS Y OPERACIONALES OBLIGATORIOS                                                   |
+---------------------------+---------------------------------------------------------------------------------------------------+
| **1. PASS**               | 1. Scan baseline ejecutado exitosamente sin fallos de CLI.                                        |
| *(Piloto Exitoso)*        | 2. Hallazgos analizados y comprendidos por el equipo técnico del cliente.                         |
|                           | 3. Remediaciones aplicadas y validadas con un segundo scan.                                       |
|                           | 4. Decisión final del Gate: `PASSED` (Exit Code 0).                                               |
|                           | 5. Release Certificate emitido y validado exitosamente con `verify-cert` (Exit Code 0).            |
|                           | 6. Integración en CI/CD (GitHub Actions o GitLab CI) demostrada en ejecución real.               |
+---------------------------+---------------------------------------------------------------------------------------------------+
| **2. PARTIAL SUCCESS**    | 1. Scan baseline ejecutado y reporte HTML entregado.                                              |
| *(Éxito Parcial)*         | 2. El cliente comprendió el valor de los hallazgos y el score CQS.                                |
|                           | 3. No se completó la remediación total dentro del plazo del piloto por limitaciones de tiempo.    |
|                           | 4. No se emitió certificado final, pero el cliente aprueba el valor técnico de la herramienta.   |
+---------------------------+---------------------------------------------------------------------------------------------------+
| **3. FAILED**             | 1. El cliente no pudo ejecutar el software por incompatibilidad no resuelta de entorno.          |
| *(Piloto Fallido)*        | 2. El software generó errores no recuperables de ejecución en un entorno soportado (Node.js 18+). |
|                           | 3. La herramienta no aportó visibilidad técnica sobre el repositorio evaluado.                    |
+---------------------------+---------------------------------------------------------------------------------------------------+
| **4. BLOCKED BY CLIENT**  | 1. El cliente no proporcionó el repositorio o el acceso técnico acordado.                         |
| *(Bloqueado por Cliente)* | 2. El equipo del cliente no dispuso de tiempo para revisar hallazgos ni ejecutar remediación.     |
|                           | 3. El piloto se pausó indefinidamente por prioridades internas ajenas a Grupo Castillo.          |
+---------------------------+---------------------------------------------------------------------------------------------------+
| **5. TECHNICAL**          | 1. Se identificó un defecto de software en el motor CLI (Bug P0/P1) que impidió la evaluación.    |
| **ESCALATION**            | 2. El caso se escala al equipo de ingeniería de producto de Grupo Castillo bajo registro formal.  |
| *(Escalamiento Técnico)*  | 3. Se programa sesión técnica de remediación del bug antes de reanudar el piloto.                 |
+---------------------------+---------------------------------------------------------------------------------------------------+
```

---

## 3. Condiciones No Negociables para Emitir un `PASS`

* **Bajo ninguna circunstancia se declarará `PASS` si existe un Gate Breaker activo (`GB-01` a `GB-04`)** o si el score no cumple el umbral de la política acordada.
* **Bajo ninguna circunstancia se emitirá un Release Certificate manualmente** eludiendo el motor automatizado.
