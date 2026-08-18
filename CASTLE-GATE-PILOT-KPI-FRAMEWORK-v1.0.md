# Castle Security & Quality Gate — Pilot KPI & Measurement Framework (v1.0.0)
**Document ID:** `KPI-FRAMEWORK-PILOT-v1.0.0`  
**Classification:** Operational Metrics & Continuous Improvement  
**Methodology:** Castle Quality System (CQS v1.1 — FROZEN / SINGLE SOURCE OF TRUTH)  
**Product Package:** `@grupo-castillo/castle-gate` (v1.0.0)  

---

## 1. Estructura de Tres Capas de Métricas

Para evaluar el desempeño integral de cada piloto comercial, se registran métricas divididas en tres categorías:

```text
+---------------------------------------------------------------------------------------------------+
| 1. PRODUCT METRICS (Rendimiento técnico del software y probes)                                    |
| 2. SERVICE METRICS (Eficiencia del equipo de consultoría de Grupo Castillo)                      |
| 3. CUSTOMER OUTCOME METRICS (Impacto real y valor percibido por el cliente)                       |
+---------------------------------------------------------------------------------------------------+
```

---

## 2. Definición Detallada de KPIs

```text
+-----------------------+---------------------------------------+-------------------+-----------------------+
| CATEGORÍA             | NOMBRE DEL KPI                        | UNIDAD DE MEDIDA  | VALOR OBJETIVO (META) |
+-----------------------+---------------------------------------+-------------------+-----------------------+
| **PRODUCT**           | • Duración del Escaneo CLI            | Milisegundos (ms) | < 500 ms por proyecto |
| **METRICS**           | • Tasa de Error de Ejecución CLI      | Porcentaje (%)    | 0% en Node.js 18+     |
|                       | • Consumo de Memoria en Escaneo       | Megabytes (MB)    | < 50 MB RAM           |
|                       | • Falsos Positivos de Secretos        | Conteo absoluto   | 0 en código limpio    |
|                       | • Integridad de Certificados SHA-256  | Tasa de acierto   | 100% Verificados      |
+-----------------------+---------------------------------------+-------------------+-----------------------+
| **SERVICE**           | • Tiempo de Onboarding & Instalación  | Minutos           | < 15 minutos          |
| **METRICS**           | • Horas de Intervención de Consultor  | Horas totales     | < 6 horas por piloto  |
|                       | • Número de Re-Scans hasta PASSED     | Conteo de ciclos  | <= 3 ciclos           |
|                       | • Tiempo de Emisión de Reporte Cierre | Horas hábiles     | < 24 horas post-scan  |
+-----------------------+---------------------------------------+-------------------+-----------------------+
| **CUSTOMER**          | • Tiempo hasta Remediación de Secretos| Horas / Días      | < 48 horas            |
| **OUTCOME**           | • Incremento de Score CQS (Pre vs Post| Puntos CQS        | +10 a +25 puntos      |
| **METRICS**           | • Tasa de Gate Breakers Neutralizados | Porcentaje (%)    | 100% Eliminados       |
|                       | • Adopción del Workflow en CI/CD      | Booleano          | 100% Integrado en CI  |
|                       | • Calificación de Satisfacción (CSAT) | Escala 1 a 5      | >= 4.5 / 5.0          |
|                       | • Conversión a Licencia Anual         | Porcentaje (%)    | > 40% de pilotos      |
+-----------------------+---------------------------------------+-------------------+-----------------------+
```

---

## 3. Registro y Gobernanza de Datos

Los datos de métricas se registrarán en la bitácora interna del *Pilot Closure Report* de cada cliente, asegurando la confidencialidad de la información del cliente y retroalimentando las mejoras del proceso de servicio de Grupo Castillo.
