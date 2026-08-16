# Lista de Verificación de Entrega a Clientes (Delivery Checklist)
## Procedimiento Operativo Estándar — Grupo Castillo

**Identificador de Procedimiento:** GC-SOP-DELIVERY-01  
**Responsable:** Ingeniero de Entrega & Gobernanza  

---

### FASE 1: PRE-ENTREGA E INFRAESTRUCTURA

- [ ] **1.1 Dominio y DNS:**
  - [ ] Dominio registrado a nombre exclusivo del cliente.
  - [ ] Registros DNS (A, CNAME, TXT, MX) configurados y apuntando a los servidores autorizados.
  - [ ] Certificado SSL/TLS emitido y verificado con redirección automática HTTPS forzada.
- [ ] **1.2 Cuentas y Hosting:**
  - [ ] Entorno de producción aprovisionado en la cuenta del cliente (Vercel / Cloudflare / AWS).
  - [ ] Variables de entorno seguras inyectadas en el dashboard del hosting (nunca en el código versionado).
- [ ] **1.3 Integraciones de Terceros:**
  - [ ] Claves de API de producción configuradas (ej. SendGrid, Formspree, Resend, Stripe, Google Analytics).
  - [ ] Pruebas de envío y recepción de correos desde formularios completadas con éxito.

---

### FASE 2: ASEGURAMIENTO DE CALIDAD (QA)

- [ ] **2.1 Validación Automatizada de Enlaces:**
  - [ ] Ejecución de script de enlaces (`audit_links.cjs`): 0 enlaces rotos (`HTTP 404 / 500`).
  - [ ] Redirecciones 301/308 verificadas para URLs legadas o migradas.
- [ ] **2.2 Pruebas de Accesibilidad (A11y):**
  - [ ] Script de accesibilidad ejecutado: 0 faltas de landmarks semánticos, headings o atributos `alt`.
  - [ ] Navegación por teclado probada en formularios y modales.
- [ ] **2.3 Pruebas de Formulario y Captura:**
  - [ ] Envío exitoso de lead de prueba.
  - [ ] Validación de estados: envío normal, error de red, error de validación y confirmación en pantalla.
  - [ ] Verificación de trampa antispam (*honey-pot*).
- [ ] **2.4 Responsividad y Compatibilidad Multi-Navegador:**
  - [ ] Renderizado verificado en Google Chrome, Apple Safari, Mozilla Firefox y Microsoft Edge.
  - [ ] Verificación en dispositivos móviles iOS y Android.

---

### FASE 3: AUDITORÍA DE SEGURIDAD Y CASTLE GATE (CQS v1.1)

- [ ] **3.1 Escaneo de Seguridad y Dependencias:**
  - [ ] `npm audit` ejecutado: 0 vulnerabilidades críticas o altas detectadas.
  - [ ] Escaneo de secretos en código fuente ejecutado con 0 hallazgos.
- [ ] **3.2 Evaluación Formal con Castle Gate:**
  - [ ] Comando ejecutado: `node bin/castle-gate.js scan --dir . --level [C1-C6]`
  - [ ] Resultado: **PASSED (Exit Code 0)**.
  - [ ] Generación de artefactos en `.castle/`:
    - [ ] `release-certificate.json`
    - [ ] `compliance-report.html`
    - [ ] `compliance-report.json`
- [ ] **3.3 Verificación Criptográfica del Certificado:**
  - [ ] Comando ejecutado: `node bin/castle-gate.js verify-cert --cert .castle/release-certificate.json`
  - [ ] Firma `signature_digest_sha256` comprobada matemáticamente.
- [ ] **3.4 Etiquetado de Release Git:**
  - [ ] Commit final congelado y tag de versión creado (ej. `git tag -a v1.0.0 -m "Release v1.0.0 - CQS PASS"`).

---

### FASE 4: HANDOFF Y TRANSFERENCIA DE ACTIVOS AL CLIENTE

- [ ] **4.1 Transferencia de Repositorio Git:**
  - [ ] Repositorio privado transferido a la organización GitHub / GitLab del cliente (o permisos de Administrador otorgados).
  - [ ] Eliminación de llaves SSH temporales del proveedor.
- [ ] **4.2 Transferencia de Hosting y Dominio:**
  - [ ] Transferencia de propiedad del proyecto en Vercel/Cloudflare al equipo del cliente.
  - [ ] Transferencia o confirmación de control del panel DNS del registrador de dominios.
- [ ] **4.3 Entrega del Paquete de Documentación:**
  - [ ] Entrega del archivo `README.md` del proyecto con instrucciones de compilación local y despliegue.
  - [ ] Entrega de la carpeta `.castle/` con certificados y reportes de calidad.
  - [ ] Entrega de la [Ownership Policy](file:///docs/business/OWNERSHIP_POLICY.md) y Acta de Entrega firmada.
- [ ] **4.4 Transferencia Segura de Credenciales:**
  - [ ] Transferencia de contraseñas y llaves mediante gestor seguro de contraseñas (ej. 1Password / Bitwarden) o canal cifrado efímero.
  - [ ] Solicitud al cliente de rotar contraseñas maestras tras la recepción.

---

### FASE 5: CIERRE COMERCIAL Y ACTIVACIÓN DE GARANTÍA

- [ ] **5.1 Emisión y Liquidación de Factura Final:**
  - [ ] Factura fiscal (CFDI) emitida por el 50% de finiquito o saldo restante.
  - [ ] Comprobante de pago recibido y conciliado.
- [ ] **5.2 Firma de Conformidad:**
  - [ ] Acta de Entrega y Aceptación Final firmada por el representante del cliente.
- [ ] **5.3 Activación de Garantía Operativa (30 Días):**
  - [ ] Registro de fecha de inicio del periodo de garantía técnica de 30 días naturales.
  - [ ] Compartición del canal oficial de reporte de incidencias (correo o portal de soporte).
- [ ] **5.4 Oferta de Continuidad (Castle Care):**
  - [ ] Presentación de la póliza de gobernanza continua para proyectos que requieran monitoreo activo posterior a los 30 días de garantía.

---

### REGISTRO DE CIERRE DE CHECKLIST

```
Proyecto:               ____________________________________________________
Cliente:                ____________________________________________________
Fecha de Cierre:        ____________________
Validation ID emitido:  CG-2026-____________________________________________
Release Commit SHA:     ____________________________________________________
Ingeniero Responsable:  ____________________________________________________
Firma del Responsable:  ____________________________________________________
```
