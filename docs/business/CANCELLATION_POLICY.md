# Política de Cancelación y Terminación Anticipada (Cancellation Policy)
## Procedimiento de Cierre Ordenado y Liquidación de Entregables Parciales

> **AVISO LEGAL OBLIGATORIO:**  
> *Plantilla operativa de referencia comercial sujeta a revisión y formalización legal.*

---

### 1. PRINCIPIO DE RESPETO Y CIERRE ORDENADO

En caso de que el Cliente o Grupo Castillo decidan dar por terminada la relación comercial antes de la entrega final de un SOW, el proceso se conducirá con **estricto apego a la transparencia, entrega de los avances realizados y liquidación proporcional del trabajo ejecutado**.

---

### 2. CANCELACIÓN POR PARTE DEL CLIENTE

El Cliente podrá cancelar el proyecto en cualquier momento mediante notificación formal por escrito sujeta a las siguientes condiciones:

1. **Anticipo Inicial (50%):**  
   El monto abonado como anticipo cubre la reserva de capacidad de ingeniería, análisis de requerimientos, diseño de arquitectura de información y estructuración inicial del proyecto, por lo que **no es reembolsable**.
2. **Entregables Parciales al Cliente:**  
   En caso de cancelación anticipada, Grupo Castillo entregará al Cliente:
   - Todo el código fuente, componentes y assets desarrollados hasta la fecha efectiva de cancelación.
   - El control total del dominio web y cuentas de hosting aprovisionadas.
3. **Cancelación en Etapas Avanzadas (Posterior al Hito 2):**  
   Si el proyecto se cancela cuando el desarrollo ha superado el 70% de su ejecución, se conciliará el saldo pendiente en proporción estricta al porcentaje de avance entregado antes del cierre del repositorio.

---

### 3. PROTOCOLO DE PROYECTO HIELO Y PAUSA POR INACTIVIDAD

Si la continuidad del proyecto se detiene por falta de respuesta, aprobación o información necesaria por parte del Cliente, se activará el siguiente protocolo escalonado:

1. **Día 1 al 7:** Seguimiento ordinario por los canales técnicos y administrativos asignados.
2. **Día 8 sin respuesta:** Emisión automática de la **Alerta 1 de Falta de Insumos**.
3. **Seguimiento Preventivo:** Emisión de hasta **3 alertas formales consecutivas**.
4. **Congelamiento Administrativo (`PROJECT_FROZEN`):** Tras completar las 3 alertas sin respuesta, la Administración de Grupo Castillo podrá cambiar oficialmente el estado a `PROJECT_FROZEN`.
   - Durante el congelamiento, el cronograma y el contador de tiempo estimado se detienen de inmediato.
   - Se libera la asignación operativa del ingeniero responsable y no se garantiza la fecha de entrega original.
   - El expediente digital y el histórico de avances se conservan intactos.
5. **Reanudación (`REACTIVATION_PENDING`):** Cuando el Cliente retome contacto:
   - Administración evalúa la disponibilidad del equipo y aprueba la reanudación formal.
   - Podrán actualizarse costos reales de servicios de terceros si hubiesen variado.
   - Podrá aplicarse una tarifa de reactivación/prioridad únicamente si estuviera contemplada en la cotización o política aplicable.

---

### 4. CANCELACIÓN POR PARTE DEL PROVEEDOR

Grupo Castillo podrá suspender o cancelar un proyecto de manera justificada bajo las siguientes causas:
1. **Inactividad Prolongada del Cliente:** Falta de respuesta persistente superior a treinta (30) días naturales tras la entrada en `PROJECT_FROZEN`.
2. **Contenidos Prohibidos:** Detección de contenidos ilegales, fraudulentos, engañosos o que infrinjan derechos de autor de terceros en el material suministrado por el Cliente.
3. **Incumplimiento de Pagos:** Retraso superior a quince (15) días naturales en la liquidación de hitos pactados.

---

### 4. PROCEDIMIENTO DE LIQUIDACIÓN Y DEVOLUCIÓN DE ACTIVOS

Tras la notificación de terminación:
- Las partes dispondrán de cinco (5) días hábiles para conciliar entregables y saldos.
- Grupo Castillo transferirá el repositorio y accesos de hosting con los avances existentes conforme a la [Ownership Policy](file:///docs/business/OWNERSHIP_POLICY.md).
- Se emitirá el finiquito correspondiente liberando a ambas partes de obligaciones futuras.
