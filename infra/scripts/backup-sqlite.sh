#!/usr/bin/env bash

# ==============================================================================
# GRUPO CASTILLO — SCRIPT DE RESPALDO ATÓMICO DE BASE DE DATOS Y BÓVEDA (v1.1)
# ==============================================================================
# Ejecuta un snapshot atómico en caliente de SQLite consolidando el WAL sin
# bloquear lecturas, empaqueta la bóveda documental y calcula digests SHA-256.

set -euo pipefail

# Configuración
PROJECT_DIR="${PROJECT_DIR:-/var/www/servicios-castillo}"
DB_FILE="${PROJECT_DIR}/.castle/commercial.sqlite"
VAULT_DIR="${PROJECT_DIR}/.castle/vault"
BACKUP_ROOT="${BACKUP_ROOT:-/var/backups/castillo}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="${BACKUP_ROOT}/${TIMESTAMP}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"

echo "=== [GRUPO CASTILLO] Iniciando Respaldo Atómico: ${TIMESTAMP} ==="

# 1. Verificar existencia de herramientas y archivos
if ! command -v sqlite3 &> /dev/null; then
    echo "ERROR: sqlite3 CLI no está instalado en el sistema." >&2
    exit 1
fi

if [ ! -f "${DB_FILE}" ]; then
    echo "ERROR: El archivo de base de datos no existe en ${DB_FILE}" >&2
    exit 1
fi

mkdir -p "${BACKUP_DIR}"

# 2. Respaldo Atómico de SQLite (Consolidación de WAL en caliente)
SQLITE_BACKUP_FILE="${BACKUP_DIR}/commercial_${TIMESTAMP}.sqlite"
echo "-> Ejecutando snapshot atómico de SQLite..."
sqlite3 "${DB_FILE}" ".backup '${SQLITE_BACKUP_FILE}'"

# 3. Verificación de Integridad de la Base de Datos Respaldada
echo "-> Verificando integridad de la copia..."
INTEGRITY_CHECK=$(sqlite3 "${SQLITE_BACKUP_FILE}" "PRAGMA integrity_check;")
if [ "${INTEGRITY_CHECK}" != "ok" ]; then
    echo "ERROR CRÍTICO: La integridad del respaldo falló: ${INTEGRITY_CHECK}" >&2
    rm -rf "${BACKUP_DIR}"
    exit 2
fi

# 4. Compresión y Digest Criptográfico de la Base de Datos
echo "-> Comprimiendo base de datos..."
gzip -9 "${SQLITE_BACKUP_FILE}"
sha256sum "${SQLITE_BACKUP_FILE}.gz" > "${BACKUP_DIR}/commercial_${TIMESTAMP}.sqlite.gz.sha256"

# 5. Respaldo de la Bóveda Documental
if [ -d "${VAULT_DIR}" ] && [ "$(ls -A "${VAULT_DIR}")" ]; then
    echo "-> Empaquetando bóveda documental..."
    tar -czf "${BACKUP_DIR}/vault_${TIMESTAMP}.tar.gz" -C "${PROJECT_DIR}/.castle" vault/
    sha256sum "${BACKUP_DIR}/vault_${TIMESTAMP}.tar.gz" > "${BACKUP_DIR}/vault_${TIMESTAMP}.tar.gz.sha256"
else
    echo "-> Bóveda documental vacía o no inicializada. Omitiendo tarball."
fi

# 6. Registro de Metadatos del Respaldo
cat <<EOF > "${BACKUP_DIR}/metadata.json"
{
  "timestamp": "${TIMESTAMP}",
  "dbFile": "commercial_${TIMESTAMP}.sqlite.gz",
  "vaultFile": "vault_${TIMESTAMP}.tar.gz",
  "integrity": "OK",
  "nodeEngine": "$(node -v 2>/dev/null || echo 'N/A')",
  "gitCommit": "$(cd "${PROJECT_DIR}" && git rev-parse HEAD 2>/dev/null || echo 'UNKNOWN')"
}
EOF

# 7. Aplicar Política de Retención Local
echo "-> Purgando respaldos locales con antigüedad superior a ${RETENTION_DAYS} días..."
find "${BACKUP_ROOT}" -maxdepth 1 -type d -name "20*" -mtime "+${RETENTION_DAYS}" -exec rm -rf {} +

echo "=== [GRUPO CASTILLO] Respaldo completado exitosamente en ${BACKUP_DIR} ==="
