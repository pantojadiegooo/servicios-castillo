# Sistema Operativo Comercial y de Entrega — Grupo Castillo
## Índice Maestro de Gobernanza, Contratos, Procesos y Handoff

**Versión:** 1.0.0  
**Fecha:** Agosto 2026  
**Responsable:** Dirección General & Dirección de Ingeniería — Grupo Castillo  

---

### 1. PROPÓSITO DEL SISTEMA OPERATIVO

Este compendio documental estandariza el ciclo de vida comercial, contractual, técnico y operativo de todos los proyectos desarrollados por **Grupo Castillo**, garantizando que cada cliente reciba:
- **Claridad Absoluta:** Alcance delimitado sin ambigüedades ni costos ocultos.
- **Soberanía Digital:** 100% de titularidad exclusiva sobre su código, infraestructura y datos.
- **Rigor Técnico:** Validación formal mediante el protocolo *Castle Gate (CQS v1.1)*.
- **Traspaso Seguro:** Protocolo estandarizado de entrega de accesos y credenciales.
- **Respaldo Post-Entrega:** Garantía operativa de 30 días y modelos claros de continuidad.

---

### 2. MAPA DE DOCUMENTOS DEL SISTEMA

```
docs/business/
├── CONTRACT_TEMPLATE.md              # Contrato Marco de Prestación de Servicios (MSA)
├── SOW_TEMPLATE.md                   # Plantilla de Declaración de Trabajo (SOW) por paquete/servicio
├── DEFINITION_OF_DONE.md             # Matriz de Criterio de Finalización Técnica (DoD)
├── DELIVERY_CHECKLIST.md             # Lista de verificación paso a paso para la entrega
├── HANDOFF_PROCESS.md                # Protocolo de transferencia técnica de repositorios y hosting
├── OWNERSHIP_POLICY.md               # Política de titularidad: 100% cliente vs tooling proveedor
├── ACCESS_HANDOFF.md                 # Guía de transferencia segura de credenciales (cero WhatsApp)
├── CASTLE_GATE_DELIVERY.md           # Procedimiento de integración de CQS v1.1 en entregables
├── CHECKUP_REPORT_SAMPLE.md          # Formato de muestra para el servicio Castle Checkup ($8,900 MXN)
├── RELEASE_VALIDATION_TEMPLATE.md    # Plantilla de metadatos de validación (público vs privado)
├── CLIENT_CHANGE_POLICY.md           # Política de gestión de cambios de alcance y cotizaciones
├── CANCELLATION_POLICY.md            # Política de terminación anticipada y entregables parciales
├── WARRANTY_POLICY.md                # Cobertura de garantía de 30 días contra bugs (bug vs cambio)
├── SUPPORT_POLICY.md                 # Pólizas de mantenimiento (Castle Care) y respuesta de emergencia
├── CASTLE_WEB_INTERNAL_CASE.md       # Ficha técnica interna de Castle Web como referencia Diamond
└── DELIVERY_PACKAGE_STRUCTURE.md     # Estructura estándar de carpetas para el paquete final
```

---

### 3. CICLO DE VIDA OPERATIVO DE UN PROYECTO

```
┌────────────────────────────────────────────────────────────────────────┐
│  1. ACUERDO COMERCIAL                                                  │
│     • Selección de Paquete (Iron a Diamond) o Servicio Especializado   │
│     • Firma de Contrato Marco (CONTRACT_TEMPLATE) y SOW_TEMPLATE       │
│     • Anticipo del 50% para reserva de capacidad e inicio de ingeniería│
├────────────────────────────────────────────────────────────────────────┤
│  2. CONSTRUCCIÓN Y GESTIÓN DE CAMBIOS                                  │
│     • Desarrollo modular por hitos según cronograma pactado            │
│     • Gestión de ajustes mediante CLIENT_CHANGE_POLICY                 │
├────────────────────────────────────────────────────────────────────────┤
│  3. CONTROL DE CALIDAD Y CERTIFICACIÓN                                 │
│     • Validación contra DEFINITION_OF_DONE                             │
│     • Ejecución del runner Castle Gate (CASTLE_GATE_DELIVERY / C4-C6)  │
│     • Generación de certificado criptográfico y reporte HTML           │
├────────────────────────────────────────────────────────────────────────┤
│  4. CIERRE Y HANDOFF AL CLIENTE                                        │
│     • Ejecución de DELIVERY_CHECKLIST                                  │
│     • Liquidación del 50% restante                                     │
│     • Transferencia de repo, hosting y DNS (HANDOFF_PROCESS)           │
│     • Entrega segura de accesos (ACCESS_HANDOFF)                       │
│     • Firma de titularidad exclusiva (OWNERSHIP_POLICY)                │
├────────────────────────────────────────────────────────────────────────┤
│  5. GARANTÍA Y SOPORTE CONTINUO                                        │
│     • Activación de 30 días de garantía contra bugs (WARRANTY_POLICY)  │
│     • Onboarding opcional a póliza mensual (SUPPORT_POLICY / Care)     │
└────────────────────────────────────────────────────────────────────────┘
```
