# Protocolo de Transferencia y Entrega (Handoff Process)
## Procedimiento Operativo de Entrega de Activos de Software

**Versión:** 1.0.0  
**Objetivo:** Garantizar una transferencia de control técnica, segura, ordenada e irrevocable de todos los activos del proyecto hacia el Cliente.

---

### 1. PRINCIPIO DE SOBERANÍA TECNOLÓGICA DEL CLIENTE

Grupo Castillo opera bajo una premisa inquebrantable: **el cliente no debe quedar atrapado ni dependiente del proveedor por retención de código o credenciales**. Al finalizar el desarrollo y liquidar el proyecto, el control absoluto de la infraestructura y del código fuente se transfiere a las cuentas y titularidad del Cliente.

---

### 2. MATRIZ DE ACTIVOS A TRANSFERIR

| Tipo de Activo | Proveedor / Servicio Típico | Método de Transferencia | Responsable Post-Handoff |
| :--- | :--- | :--- | :--- |
| **Código Fuente** | Repositorio GitHub / GitLab | Transferencia de propiedad del repositorio a la organización del Cliente | Cliente |
| **Alojamiento Web** | Vercel / Cloudflare Pages / AWS | Transferencia de proyecto (*Project Transfer*) a la cuenta Vercel del Cliente | Cliente |
| **Dominio y DNS** | Cloudflare / Namecheap / GoDaddy | Delegación de registros DNS o transferencia de registrador | Cliente |
| **Formularios & Correo** | Resend / SendGrid / Formspree | Invitación como Administrador / traspaso de API Keys | Cliente |
| **Analítica y Search** | Google Search Console / Analytics | Adición del correo del Cliente como *Owner / Propietario* | Cliente |
| **Evidencia de Calidad** | Paquete `.castle/` | Entrega de archivos JSON y HTML en raíz del repositorio | Cliente |

---

### 3. PROCEDIMIENTO PASO A PASO

#### Paso 1: Congelación y Validación del Release
1. El equipo de ingeniería congela la rama `main` del proyecto.
2. Se ejecuta la suite completa de calidad y el escáner *Castle Gate* (CQS v1.1):
   ```bash
   npm run check
   npm run build
   node bin/castle-gate.js scan --dir . --level [Nivel]
   node bin/castle-gate.js verify-cert --cert .castle/release-certificate.json
   ```
3. Se verifica que el estatus sea `PASS` (Exit Code 0) y se registra el `Release Commit SHA`.

#### Paso 2: Creación de la Cuenta o Equipo del Cliente
1. Si el Cliente no cuenta con organización de GitHub o cuenta de Vercel/Cloudflare, Grupo Castillo le guía paso a paso para crearla con su correo corporativo oficial.
2. Se solicita al Cliente designar la cuenta de correo que fungirá como Administrador Principal.

#### Paso 3: Transferencia del Repositorio Git
1. Desde la configuración del repositorio en GitHub (`Settings -> General -> Danger Zone -> Transfer ownership`):
   - Se ingresa el nombre de usuario u organización del Cliente.
   - El Cliente acepta la solicitud de transferencia desde su bandeja de correo o panel de GitHub.
2. Alternativamente, se clona el árbol limpio y se realiza un `git push --mirror` al repositorio privado recién creado por el Cliente.

#### Paso 4: Transferencia del Proyecto de Despliegue (Hosting)
1. En el panel de Vercel (`Project Settings -> General -> Transfer Project`):
   - Se transfiere el proyecto directamente al equipo u organización del Cliente.
   - Se verifican las variables de entorno de producción.
2. Los dominios personalizados configurados se asocian de inmediato a la nueva cuenta sin interrupción del servicio (*zero downtime*).

#### Paso 5: Traspaso de Dominios y Configuración DNS
1. Se verifica la propagación de los registros DNS requeridos:
   - `CNAME` para subdominios (ej. `www.tudominio.com` $\rightarrow$ `cname.vercel-dns.com`).
   - `A / ALIAS` para el dominio raíz (apex).
   - Registros `TXT` para verificación de dominio y configuración SPF/DKIM para envío de correos.
2. Se confirma la emisión del certificado SSL/TLS con cifrado HTTPS forzado.

#### Paso 6: Entrega del Paquete Documental
Se asegura que el repositorio entregado contenga en su raíz:
- `README.md`: Instrucciones de arranque local (`npm install`, `npm run dev`, `npm run build`).
- `docs/`: Especificaciones técnicas de arquitectura y componentes.
- `.castle/`: Certificado de release (`release-certificate.json`) y reporte de cumplimiento (`compliance-report.html`).

#### Paso 7: Cierre Seguro de Accesos
1. El equipo de Grupo Castillo remueve sus accesos administrativos temporales de las cuentas del Cliente, dejando únicamente accesos de consulta si existe una póliza *Castle Care* activa.
2. Se emite la recomendación de rotación de credenciales maestras.

---

### 4. RECOMENDACIONES DE SEGURIDAD POST-HANDOFF PARA EL CLIENTE

Tras recibir los activos, se recomienda al Cliente ejecutar las siguientes acciones de higiene digital:
1. **Activar Autenticación Multifactor (MFA/2FA):** En todas las cuentas administrativas (GitHub, Vercel, registrador de dominio).
2. **Rotar Secretos de API:** Regenerar las llaves de servicios de terceros (SendGrid, Stripe, etc.) e inyectarlas en el panel de hosting.
3. **Respaldo Offline:** Descargar una copia local de respaldo del repositorio Git entregado.
