# Grupo Castillo — Initial 12 Clients Launch Pricing Review & Margin Control
**Document ID:** `PRICING-REVIEW-12-CLIENTS-v1.0.0`  
**Classification:** Internal Operations & Financial Governance  
**Status:** `[CONFIDENCIAL — USO INTERNO EXCLUSIVO DE DIRECCIÓN]`  
**Review Trigger:** Re-evaluación y reajuste de tarifas tras alcanzar los **primeros 12 clientes pagadores**.

---

## 1. Filosofía Comercial de Lanzamiento
La estrategia para los primeros 12 clientes es:
$$\mathbf{ACCESIBLE \longrightarrow PROFESIONAL \longrightarrow RENTABLE \longrightarrow ESCALABLE}$$

* **Moneda Principal Contractual:** Pesos Mexicanos (MXN).
* **Equivalente Informativo:** USD (~tipo de cambio de referencia de mercado).
* **Objetivo:** Adquisición rápida, generación de casos de éxito verificables, validación de horas operativas reales y acumulación de evidencia de valor sin destruir el margen unitario.

---

## 2. Matriz de Precios de Lanzamiento y Simulación de Margen

```text
+-----------------------+--------------------+-------------------+---------------+-------------------+---------------+
| LÍNEA / SERVICIO      | PRECIO LANZAMIENTO | EQUIVALENTE (USD) | TOPE HORAS    | TARIFA EFECTIVA/H | EVALUACIÓN    |
+-----------------------+--------------------+-------------------+---------------+-------------------+---------------+
| Castle Iron           | $2,800 MXN         | ~$165 USD         | 3 - 4 h       | $700 - $930 MXN/h | RENTABLE      |
| Castle Bronze         | $4,500 MXN         | ~$265 USD         | 5 - 6 h       | $750 - $900 MXN/h | RENTABLE      |
| Castle Silver         | $7,500 MXN         | ~$440 USD         | 8 - 10 h      | $750 - $935 MXN/h | RENTABLE      |
| Castle Gold (★)       | $12,500 MXN        | ~$735 USD         | 12 - 15 h     | $830 - $1,040 MXN | ALTO MARGEN   |
| Castle Platinum       | $24,500 MXN        | ~$1,440 USD       | 20 - 25 h     | $980 - $1,225 MXN | ALTO MARGEN   |
| Castle Diamond        | Desde $40,000 MXN  | ~$2,350 USD       | A cotizar     | > $1,200 MXN/h    | SOSTENIBLE    |
+-----------------------+--------------------+-------------------+---------------+-------------------+---------------+
| Castle Checkup (72h)  | $8,900 MXN         | ~$525 USD         | 4 - 6 h       | $1,480 - $2,225/h | EXCELENTE     |
| Castle Care Essential | $3,500 MXN / mes   | ~$205 USD / mes   | 2 - 3 h / mes | $1,160 - $1,750/h | RECURRENTE    |
| Castle Care Pro (★)   | $7,900 MXN / mes   | ~$465 USD / mes   | 6 - 8 h / mes | $985 - $1,315/h   | RECURRENTE    |
| Castle Care Enterprise| $17,900 MXN / mes  | ~$1,050 USD / mes | 14 - 16 h/mes | $1,115 - $1,275/h | RECURRENTE    |
+-----------------------+--------------------+-------------------+---------------+-------------------+---------------+
| Castle Gate C1        | $9,900 MXN / año   | ~$580 USD / año   | N/A (Software)| Software Margen   | > 90% MARGEN  |
| Castle Gate C2        | $16,900 MXN / año  | ~$990 USD / año   | N/A (Software)| Software Margen   | > 90% MARGEN  |
| Castle Gate C3        | $26,900 MXN / año  | ~$1,580 USD / año | N/A (Software)| Software Margen   | > 90% MARGEN  |
| Castle Gate C4 a C6   | $39,900-$74,900 MXN| ~$2,345-$4,400 USD| N/A (Software)| Software Margen   | > 90% MARGEN  |
+-----------------------+--------------------+-------------------+---------------+-------------------+---------------+
| Castle Rescue Express | $6,900 MXN         | ~$405 USD         | 4 - 5 h       | $1,380 - $1,725/h | ALTO MARGEN   |
| Castle Rescue Standard| $12,900 MXN        | ~$755 USD         | 8 - 10 h      | $1,290 - $1,610/h | ALTO MARGEN   |
| Castle Rescue Complex | Desde $24,900 MXN  | ~$1,460 USD       | > 15 h        | > $1,500 MXN/h    | ALTO MARGEN   |
| Castle Emergency      | Desde $5,900 MXN   | ~$345 USD         | 2 - 3 h       | $1,960 - $2,950/h | ALTA DEMANDA  |
| Castle Audit Standard | $19,900 MXN        | ~$1,170 USD       | 12 - 15 h     | $1,325 - $1,650/h | PROFESIONAL   |
| Castle Audit Advanced | $39,900 MXN        | ~$2,345 USD       | 20 - 25 h     | $1,595 - $1,995/h | PROFESIONAL   |
+-----------------------+--------------------+-------------------+---------------+-------------------+---------------+
```

---

## 3. Matriz de Riesgos de Margen y Control Operativo

1. **Riesgo en Castle Iron (`$2,800 MXN`):**
   * *Diagnóstico:* Si un cliente de Iron solicita más de 1 ronda de revisión o demanda secciones adicionales, la rentabilidad cae por debajo de $500 MXN/h.
   * *Mitigación:* Alcance estrictamente acotado a One-Page con componentes estandarizados y 1 sola ronda de cambios. Solicitudes extra se cotizan bajo tabulador Bronze.
2. **Riesgo en Horas de Rescue dentro de Care Pro (`4h/mes` a `$7,900 MXN/mes`):**
   * *Diagnóstico:* Clientes que busquen convertir las 4 horas en desarrollo de features nuevas en lugar de remediación técnica y mantenimiento.
   * *Mitigación:* Cláusula explícita de que las horas Rescue cubren únicamente remediación de deuda técnica, parches, seguridad y desatoro de builds.
3. **Riesgo en Acreditación de Castle Checkup (`$8,900 MXN`):**
   * *Diagnóstico:* Malinterpretación como "Checkup gratis".
   * *Mitigación:* El 100% se acredita exclusivamente si se contrata una licencia anual de Castle Gate (C1 a C6) dentro de una ventana estricta de 30 días posteriores al dictamen.

---

## 4. Registro y Bitácora de los Primeros 12 Clientes

| # | Cliente / Empresa | Servicio Contratado | Monto Facturado (MXN) | Horas Invertidas | Margen Bruto Real | Satisfacción | Objeciones Principales |
| :-: | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **01** | *(Pendiente)* | | | | | | |
| **02** | *(Pendiente)* | | | | | | |
| **03** | *(Pendiente)* | | | | | | |
| **04** | *(Pendiente)* | | | | | | |
| **05** | *(Pendiente)* | | | | | | |
| **06** | *(Pendiente)* | | | | | | |
| **07** | *(Pendiente)* | | | | | | |
| **08** | *(Pendiente)* | | | | | | |
| **09** | *(Pendiente)* | | | | | | |
| **10** | *(Pendiente)* | | | | | | |
| **11** | *(Pendiente)* | | | | | | |
| **12** | *(Pendiente)* | | | | | | |

---

## 5. Criterios de Repricing Post-Cliente 12
Al completar el registro del cliente número 12, la Dirección de Grupo Castillo evaluará:
1. Promedio de horas reales consumidas por paquete Build.
2. Tasa de conversión de Checkup $\to$ Gate anual.
3. Retención mensual en Castle Care.
4. Incremento proyectado de tarifas entre 15% y 35% según demanda validada.
