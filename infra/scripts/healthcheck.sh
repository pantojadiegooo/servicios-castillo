#!/usr/bin/env bash

# ==============================================================================
# GRUPO CASTILLO — SCRIPT DE VERIFICACIÓN DE SALUD DE API Y BASE DE DATOS (v1.1)
# ==============================================================================

set -euo pipefail

API_URL="${1:-http://127.0.0.1:4321/health}"
TIMEOUT_SEC="${2:-5}"

echo "=== [GRUPO CASTILLO] Evaluando salud de API en ${API_URL} ==="

HTTP_RESPONSE=$(curl -s -w "\n%{http_code}" --max-time "${TIMEOUT_SEC}" "${API_URL}" || echo "000")
HTTP_BODY=$(echo "${HTTP_RESPONSE}" | sed '$d')
HTTP_STATUS=$(echo "${HTTP_RESPONSE}" | tail -n 1)

echo "HTTP Status Code: ${HTTP_STATUS}"
echo "Response Body: ${HTTP_BODY}"

if [ "${HTTP_STATUS}" -eq 200 ] && (echo "${HTTP_BODY}" | grep -q '"status":"ok"' || echo "${HTTP_BODY}" | grep -q '"status":"healthy"'); then
    echo "-> RESULTADO: [HEALTHY] La API y la base de datos están operativas."
    exit 0
else
    echo "-> RESULTADO: [UNHEALTHY] Fallo en la verificación de salud." >&2
    exit 1
fi
