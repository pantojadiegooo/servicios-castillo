# Castle GTM — Lead Qualification & Scoring Framework (v1.0.0)
**Document ID:** `GTM-QUALIFICATION-v1.0.0`  
**Classification:** Grupo Castillo Sales Qualification Methodology  
**Methodology:** Castle Quality System (CQS v1.1 — FROZEN / SINGLE SOURCE OF TRUTH)  

---

## 1. Sistema de Calificación por Puntuación (Lead Scoring)

Cada prospecto es evaluado sobre una escala de **100 puntos** distribuida en 10 criterios objetivos (máximo 10 puntos por criterio):

```text
+----+----------------------------------------------+-----------------------+-----------------------+
| #  | CRITERIO DE CALIFICACIÓN                     | CONDICIÓN MÁXIMA (10) | CONDICIÓN BAJA (0-3)  |
+----+----------------------------------------------+-----------------------+-----------------------+
| 1  | **Pila Tecnológica Soportada**               | Node.js / JS / TS /   | Lenguajes no web      |
|    |                                              | HTML5 en producción.  | (C++, Ensamblador).   |
+----+----------------------------------------------+-----------------------+-----------------------+
| 2  | **Frecuencia de Releases / CI/CD**           | Despliegues semanales | Despliegues anuales   |
|    |                                              | o diarios con CI/CD.  | o manuales por FTP.   |
+----+----------------------------------------------+-----------------------+-----------------------+
| 3  | **Urgencia del Dolor / Timing**              | Fecha límite < 30 días| Sin fecha ni urgencia |
|    |                                              | o entrega inminente.  | identificada.         |
+----+----------------------------------------------+-----------------------+-----------------------+
| 4  | **Autoridad del Contacto**                   | Hablando con CTO, VP  | Desarrollador junior  |
|    |                                              | o Fundador / Decisor. | sin poder de decisión.|
+----+----------------------------------------------+-----------------------+-----------------------+
| 5  | **Presupuesto Disponible**                   | Presupuesto asignado  | Sin fondos ni interés |
|    |                                              | para herramientas/QA. | en pagar servicios.   |
+----+----------------------------------------------+-----------------------+-----------------------+
| 6  | **Disposición para Piloto / Checkup**        | Acepta evaluar repo   | No quiere compartir   |
|    |                                              | en los próximos 7 días| repositorio ni datos. |
+----+----------------------------------------------+-----------------------+-----------------------+
| 7  | **Historial de Incidentes o Fugas**          | Clave expuesta o bugs | Sin problemas claros  |
|    |                                              | reportados por cliente| ni conciencia de deuda|
+----+----------------------------------------------+-----------------------+-----------------------+
| 8  | **Presión de Entrega a Terceros / M&A**      | Exigencia contractual | Proyecto personal sin |
|    |                                              | de calidad o due dil. | clientes ni contratos.|
+----+----------------------------------------------+-----------------------+-----------------------+
| 9  | **Tamaño y Madurez del Equipo Dev**          | 3 a 25 desarrolladores| 1 persona sin proceso |
|    |                                              | en expansión activa.  | estructurado.         |
+----+----------------------------------------------+-----------------------+-----------------------+
| 10 | **Alineación con Claims de Castle**          | Busca higiene, release| Busca certificación   |
|    |                                              | gate y gobernanza CI. | legal externa SOC 2.  |
+----+----------------------------------------------+-----------------------+-----------------------+
```

---

## 2. Matriz de Clasificación y Acción Comercial

```text
+---------------------------+-------------------+---------------------------------------------------------------+
| CATEGORÍA DEL LEAD        | RANGO DE SCORE    | ACCIÓN COMERCIAL INMEDIATA                                    |
+---------------------------+-------------------+---------------------------------------------------------------+
| **HOT LEAD**              | **80 a 100 pts**  | Agendar Technical Discovery en < 24h. Enviar propuesta Checkup.|
| **WARM LEAD**             | **50 a 79 pts**   | Enviar One-Pager y caso de uso. Seguimiento en 48 horas.      |
| **COLD LEAD**             | **25 a 49 pts**   | Nutrición con contenido técnico y re-contacto en 30 días.     |
| **DISQUALIFIED**          | **< 25 pts**      | Cerrar oportunidad respetuosamente (no encaja con el ICP).    |
+---------------------------+-------------------+---------------------------------------------------------------+
```
