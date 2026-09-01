# Política de Garantía Técnica Post-Entrega (Warranty Policy)
## Cobertura Operativa de 30 Días — Grupo Castillo

**Versión:** 1.0.0  
**Periodo de Cobertura Estándar:** Treinta (30) días naturales a partir de la firma del Acta de Entrega.

---

### 1. ALCANCE DE LA GARANTÍA

Grupo Castillo respalda la calidad de sus entregables mediante una **Garantía Operativa de 30 días** destinada a corregir sin costo cualquier defecto atribuible al desarrollo realizado.

```
┌────────────────────────────────────────────────────────────────────────┐
│  DIFERENCIACIÓN CRUCIAL DE CONCEPTOS:                                  │
│                                                                        │
│  1. DEFECTO / BUG (Cubierto por Garantía - $0 MXN)                     │
│     • Una funcionalidad estipulada en el SOW no opera correctamente.   │
│     • Enlaces rotos, formularios con error 500, desbordes visuales.    │
│                                                                        │
│  2. CAMBIO DE ALCANCE (No Cubierto - Cotizable)                        │
│     • Modificar un diseño o flujo previamente aprobado en el hito.     │
│     • Reemplazar textos o reestructurar menús de navegación.           │
│                                                                        │
│  3. NUEVA FUNCIONALIDAD (No Cubierto - Nueva Cotización)               │
│     • Incorporar una nueva página, pasarela de pago o integración.     │
└────────────────────────────────────────────────────────────────────────┘
```

---

### 2. CONDICIONES Y EXCLUSIONES DE LA GARANTÍA

#### 2.1 Supuestos Cubiertos (Reparación Gratuita)
- Errores de sintaxis o fallas de compilación en el código fuente entregado.
- Fallos en el envío de formularios atribuibles al código o a la validación en cliente.
- Desajustes visuales comprobados en los navegadores soportados (Chrome, Safari, Firefox, Edge).
- Regresiones en controles de accesibilidad o rendimiento pactados en la [Definition of Done](file:///docs/business/DEFINITION_OF_DONE.md).

#### 2.2 Exclusiones Explícitas (Pérdida de Garantía)
La garantía quedará sin efecto o requerirá cotización independiente en los siguientes casos:
1. **Modificación por Terceros:** Si el código fuente en el repositorio ha sido editado por desarrolladores externos o personal del Cliente después de la entrega formal.
2. **Fallas en Servicios de Terceros:** Interrupciones de servicio de proveedores de nube (AWS, Vercel, Cloudflare), suspensiones de cuentas de correo (SendGrid, Resend) o cambios retrocompatibles en APIs externas ajenas al control de Grupo Castillo.
3. **Fuerza Mayor:** Ataques cibernéticos masivos (DDoS), vulnerabilidades de día cero a nivel de sistema operativo o pérdida de credenciales por descuido del Cliente.

---

### 3. TIEMPOS DE RESPUESTA Y PROCEDIMIENTO DE REPORTE

- **Canal Oficial:** Envío de correo a `contacto@grupocastillo.lat` con asunto `[GARANTÍA] Proyecto - Descripción del Bug`.
- **Tiempos de Atención:**
  - **Severidad Crítica (Sitio caído o formulario bloqueado):** Respuesta y diagnóstico en $\le 4$ horas hábiles; resolución en $\le 24$ horas.
  - **Severidad Media / Cosmética:** Respuesta en $\le 24$ horas hábiles; resolución en $\le 72$ horas.
