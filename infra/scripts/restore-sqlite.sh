#!/usr/bin/env bash

# ==============================================================================
# GRUPO CASTILLO — SCRIPT DE RESTAURACIÓN SEGURA DE BASE DE DATOS Y BÓVEDA (v1.1)
# ==============================================================================
# Detiene el servicio, valida el digest criptográfico del respaldo, restaura
# la base de datos y la bóveda documental, y reinicia el servicio.

set -euo pipefail

if [ "$#" -ne 1 ]; then
    echo "Uso: $0 /ruta/al/directorio_de_backup (ej. /var/backups/castillo/20260819_040000)" >&2
    exit 1
fi

BACKUP_SOURCE="$1"
PROJECT_DIR="${PROJECT_DIR:-/var/www/servicios-castillo}"
CASTLE_DIR="${PROJECT_DIR}/.castle"

if [ ! -d "${BACKUP_SOURCE}" ]; then
    echo "ERROR: El directorio de respaldo no existe: ${BACKUP_SOURCE}" >&2
    exit 1
fi

echo "=== [GRUPO CASTILLO] Iniciando Procedimiento de Restauración ==="
echo "Fuente de respaldo: ${BACKUP_SOURCE}"

# 1. Verificar Digest SHA-256 de la base de datos
echo "-> Verificando integridad criptográfica del archivo de base de datos..."
cd "${BACKUP_SOURCE}"
DB_GZ_FILE=$(ls commercial_*.sqlite.gz | head -n 1)

if [ -f "${DB_GZ_FILE}.sha256" ]; then
    sha256sum -c "${DB_GZ_FILE}.sha256"
else
    echo "ADVERTENCIA: No se encontró archivo .sha256 para ${DB_GZ_FILE}"
fi

# 2. Detener Servicio API si está corriendo bajo systemd
if command -v systemctl &> /dev/null && systemctl is-active --quiet castillo-api; then
    echo "-> Deteniendo servicio castillo-api..."
    sudo systemctl stop castillo-api
fi

# 3. Respaldo Preventivo de Emergencia del Estado Actual
EMERGENCY_DIR="${PROJECT_DIR}/.castle_emergency_$(date +%s)"
if [ -d "${CASTLE_DIR}" ]; then
    echo "-> Creando copia de seguridad de emergencia previa en ${EMERGENCY_DIR}..."
    cp -r "${CASTLE_DIR}" "${EMERGENCY_DIR}"
fi

# 4. Restaurar Base de Datos SQLite
echo "-> Descomprimiendo y restaurando base de datos..."
mkdir -p "${CASTLE_DIR}"
gunzip -c "${BACKUP_SOURCE}/${DB_GZ_FILE}" > "${CASTLE_DIR}/commercial.sqlite"

# Eliminar posibles archivos WAL/SHM legados para forzar arranque limpio
rm -f "${CASTLE_DIR}/commercial.sqlite-wal" "${CASTLE_DIR}/commercial.sqlite-shm"

# 5. Restaurar Bóveda Documental
VAULT_TAR_FILE=$(ls vault_*.tar.gz 2>/dev/null | head -n 1 || true)
if [ -n "${VAULT_TAR_FILE}" ] && [ -f "${BACKUP_SOURCE}/${VAULT_TAR_FILE}" ]; then
    echo "-> Restaurando bóveda documental..."
    tar -xzf "${BACKUP_SOURCE}/${VAULT_TAR_FILE}" -C "${CASTLE_DIR}"
fi

# 6. Ajustar Permisos de Archivos
if id "castillo-api" &>/dev/null; then
    echo "-> Asignando permisos al usuario castillo-api..."
    chown -R castillo-api:castillo-api "${CASTLE_DIR}"
    chmod 700 "${CASTLE_DIR}"
fi

# 7. Reiniciar Servicio
if command -v systemctl &> /dev/null; then
    echo "-> Reiniciando servicio castillo-api..."
    sudo systemctl start castillo-api
    sudo systemctl status castillo-api --no-pager
fi

echo "=== [GRUPO CASTILLO] Restauración completada exitosamente ==="
