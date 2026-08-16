# Declaración de Trabajo (Statement of Work - SOW)
## Anexo Operativo al Contrato Marco GC-MSA-2026-[XXXX]

> **AVISO LEGAL OBLIGATORIO:**  
> *Plantilla operativa de especificación de alcance y entregables técnicos sujeta a formalización contractual entre las partes.*

---

### SOW IDENTIFIER: GC-SOW-2026-[XXXX]

**Fecha de Emisión:** [Día] de [Mes] de 202[X]  
**Proyecto:** [Nombre del Proyecto / Aplicación]  
**Cliente:** [Nombre del Cliente]  
**Líder Técnico Asignado:** [Ingeniero Líder Grupo Castillo]  

---

### 1. SERVICIO O PAQUETE CONTRATADO

Marcar la modalidad aplicable:

- [ ] **Paquete Build:**
  - [ ] Castle Iron (1 Página • Landing Arquitectónica • $14,900 MXN)
  - [ ] Castle Bronze (3-5 Páginas • Presencia Corporativa • $24,900 MXN)
  - [ ] Castle Silver (6-10 Páginas • Arquitectura Multisección • $39,900 MXN)
  - [ ] Castle Gold (11-18 Páginas • Plataforma Corporativa Completa • $59,900 MXN)
  - [ ] Castle Platinum (19-28 Páginas • Infraestructura & Alta Escala • $89,900 MXN)
  - [ ] Castle Diamond (Custom Scope • Arquitectura Insignia a Medida • Desde $140,000 MXN)
- [ ] **Servicio Profesional Especializado:**
  - [ ] Castle Checkup (Diagnóstico Técnico Profundo • $8,900 MXN)
  - [ ] Castle Audit (Auditoría Integral de Calidad, Rendimiento y Seguridad • $28,000 MXN)
  - [ ] Castle Rescue (Intervención de Rescate y Estabilización • $48,000 MXN)
  - [ ] Castle Emergency (Respuesta Crítica en Caliente • $18,500 MXN)
  - [ ] Castle Care (Póliza de Gobernanza y Mantenimiento Mensual • Desde $6,500 MXN/mes)

---

### 2. DESCRIPCIÓN DETALLADA DEL ALCANCE

#### 2.1 Páginas y Rutas a Construir
| Ruta / Identificador | Nombre de Página | Propósito Principal | Complejidad / Componentes |
| :--- | :--- | :--- | :--- |
| `/` (`/index.html`) | Inicio / Home | Presentación principal, propuesta de valor y Hero visual | Alta (Canvas / Interactivo) |
| `/[ruta-1]` | [Nombre 1] | [Descripción] | Media |
| `/[ruta-2]` | [Nombre 2] | [Descripción] | Estándar |
| `/contacto` | Contacto / Cotización | Captura de leads con validación técnica y spam honey-pot | Media |
| `/aviso-de-privacidad` | Aviso de Privacidad | Cumplimiento legal y protección de datos | Estándar |

#### 2.2 Requisitos Técnicos y Arquitectura
- **Stack Base:** Astro SSG / HTML5 Semántico / CSS Vanilla estructurado (BEM) / TypeScript / JavaScript en memoria.
- **Rendimiento:** Carga estática ultrarrápida, presupuesto de assets controlado (< 300KB JS cliente inicial).
- **Accesibilidad:** Cumplimiento WCAG 2.1 AA (landmarks semánticos, headings únicos, navegación por teclado, contraste verificado $\ge 4.5:1$).
- **Seguridad:** Cabeceras HTTP estrictas (`CSP`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`), 0 secretos expuestos en repositorio.
- **Despliegue:** Configuración en infraestructura del cliente (Vercel / Cloudflare Pages / AWS S3+CloudFront).

---

### 3. ENTREGABLES CONCRETOS (*DELIVERABLES*)

Al cierre del proyecto, el Cliente recibirá:
1. **Repositorio Git Privado Transferido:** Código fuente completo, limpio y documentado con historial de commits.
2. **Despliegue en Producción Funcional:** Sitio web publicado y configurado en el dominio y hosting del Cliente con certificado SSL activo.
3. **Paquete de Evidencia Castle Gate (CQS v1.1):**
   - `release-certificate.json` (Certificado criptográfico firmado).
   - `compliance-report.html` (Reporte visual de cumplimiento de 7 dominios).
   - `compliance-report.json` (Reporte de auditoría estructurado).
4. **Documento de Entrega y Titularidad:** Acta formal de entrega con declaración de 100% de titularidad exclusiva del Cliente.
5. **Credenciales y Accesos:** Guía de administración y claves transferidas por canal cifrado seguro.

---

### 4. EXCLUSIONES EXPLÍCITAS (*OUT OF SCOPE*)

Para evitar ambigüedades, lo siguiente **NO** forma parte de este SOW a menos que se agregue como adenda cotizada:
- Redacción de copy comercial desde cero (el cliente provee o valida textos base).
- Fotografía profesional de producto en locación o producción de video comercial.
- Costo de licencias de terceros, suscripciones de software (ej. CRM, SendGrid, Shopify, Vercel Pro).
- Creación de pasarelas de pago no especificadas expresamente.
- Modificaciones estructurales o de diseño posteriores a la aprobación del hito de diseño.

---

### 5. CRONOGRAMA DE HITOS Y REVISIONES

| Hito | Descripción del Entregable | Plazo Estimado | Revisiones Incluidas |
| :---: | :--- | :---: | :---: |
| **H1** | Arquitectura de información, wireframe y tokens de diseño | Semana 1 | 2 rondas de ajuste |
| **H2** | Maquetación interactiva y componentes en entorno staging | Semana 2-3 | 2 rondas de ajuste |
| **H3** | Integración de contenidos definitivos, formularios y SEO | Semana 4 | 1 ronda de validación |
| **H4** | Auditoría Castle Gate, despliegue a producción y Handoff final | Semana 4-5 | Aceptación final |

---

### 6. PRECIO Y CALENDARIO DE PAGOS

- **Monto Total del Proyecto:** $[Monto] MXN + IVA  
- **Forma de Pago:**
  - **50% ($[Anticipo] MXN + IVA):** A la firma del presente SOW para reserva de capacidad e inicio de trabajos.
  - **50% ($[Finiquito] MXN + IVA):** A la entrega del Release validado con Castle Gate antes de la transferencia final de DNS y repositorio.

---

### FIRMAS DE APROBACIÓN DEL SOW

```
Por GRUPO CASTILLO:                       Por EL CLIENTE:



____________________________________      ____________________________________
Nombre: [Líder Técnico]                   Nombre: [Representante Autorizado]
Fecha: [Fecha]                            Fecha: [Fecha]
```
