# Protocolo de Gestión y Transferencia Segura de Accesos (Access Handoff)
## Guía de Seguridad y Privilegios Mínimos — Grupo Castillo

**Identificador:** GC-SEC-SOP-02  
**Objetivo:** Transferir credenciales y accesos de infraestructura sin exponer contraseñas ni comprometer la seguridad de las partes.

---

### 1. REGLAS DE ORO DE SEGURIDAD

```
┌────────────────────────────────────────────────────────────────────────┐
│  REGLAS INQUEBRANTABLES DE GESTIÓN DE ACCESOS:                         │
│  1. NUNCA solicitar ni enviar contraseñas por WhatsApp, SMS o correo. │
│  2. PREFERIR delegación de roles de usuario sobre contraseñas maestras.│
│  3. USAR enlaces efímeros cifrados de un solo uso (1Password / Send).  │
│  4. ACTIVAR autenticación multifactor (MFA/2FA) en toda cuenta.        │
│  5. REVOCAR accesos temporales inmediatamente tras concluir el handoff.│
└────────────────────────────────────────────────────────────────────────┘
```

---

### 2. MÉTODOS DE TRANSFERENCIA POR PLATAFORMA

#### 2.1 Repositorios Git (GitHub / GitLab)
- **Mecanismo Recomendado:** *Repository Ownership Transfer* o Invitación como Administrador.
- **Procedimiento:**
  1. El Cliente proporciona el nombre de su usuario u organización oficial en GitHub.
  2. Grupo Castillo inicia la transferencia desde `Settings -> General -> Danger Zone -> Transfer ownership`.
  3. El Cliente recibe un correo de confirmación y acepta la transferencia en su panel.
  4. El repositorio pasa a residir en la cuenta del Cliente con control total e irrevocable.

#### 2.2 Plataforma de Despliegue y Alojamiento (Vercel)
- **Mecanismo Recomendado:** *Project Transfer* entre cuentas.
- **Procedimiento:**
  1. El Cliente crea o proporciona su equipo (*Team*) en Vercel.
  2. En el panel del proyecto en Vercel, Grupo Castillo selecciona `Settings -> General -> Transfer Project`.
  3. Se especifica el identificador del equipo destino.
  4. Los dominios y variables de entorno de producción se traspasan intactos sin caída del servicio.

#### 2.3 Administrador de Dominio y DNS (Cloudflare / Registrador)
- **Mecanismo Recomendado:** Acceso Delegado de Miembro de Cuenta (*Account Member Delegation*).
- **Procedimiento:**
  1. El Cliente ingresa a su panel de registrador o Cloudflare.
  2. Invita al correo técnico de Grupo Castillo como colaborador con permisos restringidos exclusivamente a la zona DNS del dominio del proyecto.
  3. Una vez configurados los registros requeridos (`A`, `CNAME`, `TXT`, `MX`), el Cliente revoca la invitación desde su panel.

#### 2.4 Servicios de Correo Transaccional y Formularios (Resend / SendGrid)
- **Mecanismo Recomendado:** Creación de cuenta propia por parte del Cliente y provisión de API Key con permisos restringidos (*Mail Send Only*).
- **Procedimiento:**
  1. El Cliente genera la API Key en su cuenta oficial.
  2. Comparte la llave mediante un enlace cifrado seguro de un solo uso (ej. Bitwarden Send con expiración a 24 horas y límite de 1 apertura).
  3. La clave se inyecta directamente como variable de entorno secreta en el panel de Vercel.

---

### 3. PROTOCOLO DE ROTACIÓN POST-ENTREGA

Inmediatamente después de la firma del acta de recepción, el Cliente debe completar el siguiente checklist:
- [ ] Cambiar la contraseña maestra de las cuentas asociadas.
- [ ] Confirmar que la autenticación de dos factores (2FA) por aplicación autenticadora (Google Authenticator, 1Password, Authy) esté activa.
- [ ] Eliminar los usuarios colaboradores temporales de Grupo Castillo en los paneles de hosting y dominio (a menos que se mantenga una póliza *Castle Care* activa).
- [ ] Guardar una copia segura de las variables de entorno en el gestor de contraseñas de la empresa.
