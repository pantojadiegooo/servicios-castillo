#!/usr/bin/env bash

# ==============================================================================
# GRUPO CASTILLO — SCRIPT DE APROVISIONAMIENTO INICIAL DE VPS (v1.1)
# ==============================================================================
# Automatiza la instalación de dependencias base en Ubuntu 24.04 LTS:
# Node.js 24 LTS, Nginx, Certbot, SQLite3, Firewall UFW y usuario de servicio.

set -euo pipefail

if [ "$EUID" -ne 0 ]; then
    echo "ERROR: Este script debe ejecutarse como root o con sudo." >&2
    exit 1
fi

echo "=== [GRUPO CASTILLO] Iniciando Aprovisionamiento de VPS ==="

# 1. Actualización de Paquetes del Sistema
echo "-> Actualizando paquetes del sistema operativo..."
apt-get update && apt-get upgrade -y
apt-get install -y curl ufw nginx sqlite3 certbot python3-certbot-nginx git tar gzip

# 2. Instalación de Node.js 24 LTS (NodeSource)
echo "-> Instalando Node.js 24 LTS..."
if ! command -v node &> /dev/null || [[ "$(node -v)" != v24* ]]; then
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
    apt-get install -y nodejs
fi
echo "Node.js version: $(node -v)"
echo "NPM version: $(npm -v)"

# 3. Creación del Usuario de Servicio sin privilegios
echo "-> Configurando usuario de servicio 'castillo-api'..."
if ! id "castillo-api" &>/dev/null; then
    useradd -r -s /bin/false -d /var/www/servicios-castillo -m castillo-api
fi

# 4. Estructura de Directorios y Permisos
echo "-> Creando estructura de directorios..."
mkdir -p /var/www/servicios-castillo/.castle/vault
mkdir -p /etc/castillo
mkdir -p /var/backups/castillo

chown -R castillo-api:castillo-api /var/www/servicios-castillo/.castle
chmod 700 /var/www/servicios-castillo/.castle

# 5. Configuración del Firewall (UFW)
echo "-> Configurando Firewall UFW..."
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

# 6. Programación del Cron de Backups
echo "-> Programando respaldo automático cada 6 horas..."
CRON_JOB="0 */6 * * * /var/www/servicios-castillo/infra/scripts/backup-sqlite.sh >> /var/log/castillo-backup.log 2>&1"
(crontab -l 2>/dev/null | grep -Fv "backup-sqlite.sh" ; echo "${CRON_JOB}") | crontab -

echo "=== [GRUPO CASTILLO] Aprovisionamiento de VPS finalizado con éxito ==="
