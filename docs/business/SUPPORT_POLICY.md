# Política de Soporte y Continuidad Operativa (Support Policy)
## Niveles de Servicio y Pólizas de Mantenimiento — Grupo Castillo

**Versión:** 1.0.0  
**Horario Estándar de Atención:** Lunes a Viernes de 09:00 a 18:00 hrs (Tiempo del Centro de México - CST).

---

### 1. MODELOS DE ATENCIÓN Y SOPORTE

Grupo Castillo ofrece un modelo de soporte estructurado para acompañar la evolución de cada proyecto tras su lanzamiento:

```
┌────────────────────────────────────────────────────────────────────────┐
│  NIVELES DE SOPORTE TÉCNICO:                                           │
│                                                                        │
│  1. GARANTÍA BÁSICA (30 Días - Incluida en todo proyecto)              │
│     • Corrección de defectos directos sin costo adicional.             │
│                                                                        │
│  2. ASISTENCIA TÉCNICA POR EVENTO (Ad-hoc / Rescue)                    │
│     • Intervención técnica puntual: Desde $6,900 MXN.                  │
│                                                                        │
│  3. PÓLIZA CONTINUA CASTLE CARE (Retainer Mensual - Desde $590 MXN)    │
│     • Basic ($590 MXN/mes): Uptime, SSL, dependencias, parches.        │
│     • Pro ($990 MXN/mes): Monitoreo proactivo, soporte prioritario.    │
│     • Enterprise ($2,490 MXN/mes): Gobernanza CQS, soporte multicanal. │
│                                                                        │
│  4. RESPUESTA CRÍTICA CASTLE EMERGENCY ($5,900 MXN por evento)         │
│     • Activación prioritaria con SLA de atención $\le 2$ horas (24/7). │
│     • Contención de caídas críticas, hackeos o incidentes de DNS.      │
└────────────────────────────────────────────────────────────────────────┘
```

---

### 2. MATRIZ DE TIEMPOS DE RESPUESTA (SLA) Y SEVERIDADES CONGELADAS

| Nivel de Severidad | Definición del Incidente | Póliza Estándar / Garantía | Póliza Castle Care | Castle Emergency |
| :--- | :--- | :---: | :---: | :---: |
| **S1 — Crítica** | Sitio web totalmente inaccesible o formulario/pasarela principal inoperable en producción. | $\le 4$ horas hábiles | $\le 2$ horas hábiles | $\le 2$ horas (24/7) |
| **S2 — Alta** | Degradación importante de funcionalidad o falla en secciones dinámicas sin bloqueo total. | $\le 8$ horas hábiles | $\le 4$ horas hábiles | $\le 4$ horas (24/7) |
| **S3 — Normal** | Degradación menor, fallas no bloqueantes o inconsistencias de layout secundarias. | $\le 24$ horas hábiles | $\le 8$ horas hábiles | N/A |
| **S4 — Baja** | Solicitud de cambio menor de contenido, ajuste visual cosmético o consultas técnicas. | $\le 48$ horas hábiles | $\le 12$ horas hábiles | N/A |

---

### 3. CANALES OFICIALES DE SOPORTE

- **Portal / Correo de Soporte:** `soporte@grupocastillo.com`
- **Línea de Emergencia (Solo clientes Castle Emergency / Care):** Canal directo dedicado vía Slack Connect o número de guardia asignado.
