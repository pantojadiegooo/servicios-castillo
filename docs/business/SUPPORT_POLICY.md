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
│  2. ASISTENCIA TÉCNICA POR EVENTO (Ad-hoc)                             │
│     • Tarifa por hora de ingeniería: $1,200 MXN/hora (Mínimo 2 horas). │
│                                                                        │
│  3. PÓLIZA CONTINUA CASTLE CARE (Retainer Mensual - Desde $6,500 MXN)  │
│     • Monitoreo de disponibilidad (Uptime) y renovación de SSL.        │
│     • Actualización de dependencias y parches de seguridad mensuales.  │
│     • Re-certificación periódica con Castle Gate (CQS v1.1).           │
│     • Hasta 4 horas mensuales para cambios menores de contenido.       │
│                                                                        │
│  4. RESPUESTA CRÍTICA CASTLE EMERGENCY ($18,500 MXN por evento)        │
│     • Activación inmediata con SLA de atención $\le 2$ horas.          │
│     • Contención de caídas críticas, hackeos o incidentes de DNS.      │
└────────────────────────────────────────────────────────────────────────┘
```

---

### 2. MATRIZ DE TIEMPOS DE RESPUESTA (SLA)

| Nivel de Severidad | Definición del Incidente | Póliza Estándar / Garantía | Póliza Castle Care | Castle Emergency |
| :--- | :--- | :---: | :---: | :---: |
| **S1 — Crítico** | Sitio web totalmente inaccesible o formulario principal inoperable en producción. | $\le 4$ horas hábiles | $\le 2$ horas hábiles | $\le 2$ horas (24/7) |
| **S2 — Alto** | Degradación importante de rendimiento o falla en una sección secundaria. | $\le 8$ horas hábiles | $\le 4$ horas hábiles | N/A |
| **S3 — Medio / Menor** | Solicitud de cambio de contenido, ajuste visual o actualización cosmética. | $\le 24$ horas hábiles | $\le 8$ horas hábiles | N/A |

---

### 3. CANALES OFICIALES DE SOPORTE

- **Portal / Correo de Soporte:** `soporte@grupocastillo.com`
- **Línea de Emergencia (Solo clientes Castle Emergency / Care):** Canal directo dedicado vía Slack Connect o número de guardia asignado.
