# Castle GTM — 15-Minute Live Demo Script & Playbook (v1.0.0)
**Document ID:** `GTM-DEMO-SCRIPT-v1.0.0`  
**Classification:** Grupo Castillo Sales Enablement & Product Demonstration  
**Methodology:** Castle Quality System (CQS v1.1 — FROZEN / SINGLE SOURCE OF TRUTH)  
**Core Engine:** `@grupo-castillo/castle-gate` (v1.0.0)  

---

## 1. Cronograma de la Demostración (15 Minutos)

```text
[00:00 - 02:00] INTRODUCCIÓN: El problema de desplegar secretos y código roto a producción.
[02:00 - 04:00] BASELINE SCAN: Ejecutar `castle-gate scan --dir . --level C1` en terminal.
[04:00 - 07:00] REPORTE HTML & BLOQUEO: Mostrar cómo el motor detectó un Gate Breaker y retornó Exit Code 1.
[07:00 - 10:00] REMEDIACIÓN EN VIVO: Eliminar la clave expuesta y migrar a process.env.
[10:00 - 12:00] RE-SCAN & PASSED: Re-ejecutar scan -> Exit Code 0 (PASSED) en < 300 ms.
[12:00 - 14:00] RELEASE CERTIFICATE & VERIFY: Abrir release-certificate.json y correr verify-cert.
[14:00 - 15:00] CIERRE Y PROPUESTA: Presentar cómo se integra en su GitHub Actions hoy mismo.
```

---

## 2. Guion Paso a Paso para el Consultor

```bash
# PASO 1: Demostrar escaneo en repositorio con clave expuesta
$ npx @grupo-castillo/castle-gate scan --dir ./demo-app --level C1
# Salida esperada en terminal:
# [GATE DECISION]: BLOCKED (Exit Code 1)
# [GATE BREAKER ACTIVE]: 1 critical secret detected (AWS Key).

# PASO 2: Abrir reporte visual autónomo
$ open .castle/compliance-report.html

# PASO 3: Mostrar corrección higiénica y re-escanear
$ npx @grupo-castillo/castle-gate scan --dir ./demo-app --level C1
# Salida esperada en terminal:
# [GATE DECISION]: PASSED (Exit Code 0)
# [SCORE]: 88.89 / 100.00
# [RELEASE CERTIFICATE ISSUED]: .castle/release-certificate.json

# PASO 4: Demostrar verificación criptográfica inmutable
$ npx @grupo-castillo/castle-gate verify-cert --cert .castle/release-certificate.json
# Salida esperada:
# [CERTIFICATE VALID]: SHA-256 Digest matches EvidencePackage.
```
