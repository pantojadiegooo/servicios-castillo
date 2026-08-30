# GUÍA OFICIAL DE DESPLIEGUE EN PRODUCCIÓN
## Grupo Castillo — Sistema Comercial y Expediente Digital (v1.1)

---

## 1. Arquitectura del Sistema

El sistema opera bajo una arquitectura desacoplada de alto rendimiento y bajo costo:

* **Frontend Público y Portal:** Alojado en **Vercel Edge Network** (`www.grupocastillo.lat`), generado como sitio estático Astro (`dist/`).
* **API Comercial y Expediente:** Alojado en **VPS Linux Persistente** (`api.grupocastillo.lat`) con **Node.js 24 LTS**, gestionado por **systemd** y expuesto vía **Nginx Reverse Proxy** con TLS 1.3.
* **Persistencia Relacional y Bóveda:** Base de datos nativa SQLite (`.castle/commercial.sqlite` en modo WAL) y almacenamiento local de documentos (`.castle/vault/<projectId>/`) sobre disco NVMe persistente.

```text
                                DNS (Cloudflare / Namecheap)
                                              │
                     ┌────────────────────────┴────────────────────────┐
                     ▼                                                 ▼
             www.grupocastillo.lat                             api.grupocastillo.lat
                     │                                                 │
            Vercel Edge Network                                Nginx Reverse Proxy
                     │                                                 │ (Rate Limit + SSL)
          Astro SSG (Público + UI)                                     ▼
         - /index.html                                          Node.js 24 Runtime
         - /cotizacion.html                                     (bin/commercial-api.js)
         - /portal.html                                                │
         - /admin.html                                     ┌───────────┴───────────┐
         - /ingenieria.html                                ▼                       ▼
                                                .castle/commercial.sqlite   .castle/vault/
```

---

## 2. Requisitos Previos del Servidor

* **Sistema Operativo:** Ubuntu 24.04 LTS (o Debian 12).
* **Especificaciones Mínimas:** 1 vCPU, 2 GB RAM, 25 GB SSD/NVMe (ej. Hetzner CX22, DigitalOcean Basic Droplet o Linode).
* **Dominio Configurado:**
  - Registro `A` para `api.grupocastillo.lat` $\rightarrow$ IP elástica del VPS.
  - Registro `CNAME` para `www.grupocastillo.lat` $\rightarrow$ `cname.vercel-dns.com`.

---

## 3. Procedimiento de Instalación y Aprovisionamiento Paso a Paso

### Paso 1: Clonar Repositorio y Ejecutar Bootstrap
Conectarse vía SSH como usuario con privilegios `sudo`:

```bash
git clone https://github.com/pantojadiegooo/servicios-castillo.git /var/www/servicios-castillo
cd /var/www/servicios-castillo
sudo bash infra/scripts/setup-vps.sh
```

### Paso 2: Configurar Variables de Entorno
Copiar la plantilla y configurar los valores seguros:

```bash
sudo cp infra/env/production.env.example /etc/castillo/commercial.env
sudo chmod 600 /etc/castillo/commercial.env
sudo chown root:root /etc/castillo/commercial.env
sudo nano /etc/castillo/commercial.env
```

### Paso 3: Configurar y Activar el Servicio Systemd
```bash
sudo cp infra/systemd/castillo-api.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable castillo-api
sudo systemctl start castillo-api
sudo systemctl status castillo-api
```

### Paso 4: Obtener Certificado SSL / TLS con Let's Encrypt
```bash
sudo certbot certonly --nginx -d api.grupocastillo.lat
```

### Paso 5: Configurar y Habilitar Nginx
```bash
sudo cp infra/nginx/api.grupocastillo.lat.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/api.grupocastillo.lat.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Paso 6: Verificación de Salud
```bash
bash infra/scripts/healthcheck.sh https://api.grupocastillo.lat/api/health
```

---

## 4. Política y Automatización de Respaldos (SQLite WAL)

El script [`infra/scripts/backup-sqlite.sh`](file:///C:/Users/panto/Downloads/servicios-castillo/infra/scripts/backup-sqlite.sh) se ejecuta automáticamente cada 6 horas vía cron:

1. **Snapshot Atómico:** Ejecuta `sqlite3 .castle/commercial.sqlite ".backup ..."` garantizando consistencia transaccional sin detener el servicio.
2. **Integridad:** Valida `PRAGMA integrity_check;`.
3. **Compresión y Hashing:** Comprime con `gzip -9` y genera digest `SHA-256`.
4. **Empaquetado de Bóveda:** Respalda el directorio `.castle/vault/`.
5. **Retención Local:** Conserva los respaldos de los últimos 7 días.

---

## 5. Procedimiento de Restauración y Disaster Recovery

Para restaurar el sistema ante cualquier contingencia:

```bash
sudo bash /var/www/servicios-castillo/infra/scripts/restore-sqlite.sh /var/backups/castillo/20260819_120000
```

---

## 6. Procedimiento de Actualización Continua (Deploy)

Para desplegar nuevas versiones de la API en producción:

```bash
cd /var/www/servicios-castillo
git pull origin main
sudo systemctl restart castillo-api
bash infra/scripts/healthcheck.sh http://127.0.0.1:4321/api/health
```

---

## 7. Monitoreo Mínimo Viable (SLO)

1. **Monitor de Disponibilidad (UptimeRobot / BetterStack):**
   - URL: `https://api.grupocastillo.lat/api/health`
   - Intervalo: 1 minuto.
   - Condición de Éxito: HTTP 200 y JSON `"status":"healthy"`.
2. **Alertas de Almacenamiento:** Monitorear que el espacio en disco en el VPS se mantenga por debajo del 80% de utilización.
