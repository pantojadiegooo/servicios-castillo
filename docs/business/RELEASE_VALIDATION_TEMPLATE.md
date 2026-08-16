# Plantilla de Registro de Validación de Release (Release Validation Template)
## Estándar de Metadatos Públicos y Privados para Castle Gate

**Versión:** 1.1.0  
**Protocolo:** CQS v1.1  

---

### 1. PRINCIPIO DE PRIVACIDAD Y SEGURIDAD POR DISEÑO

Para proteger la confidencialidad de la infraestructura del Cliente y al mismo tiempo permitir la **verificabilidad pública** de los releases aprobados por Castle Gate, el sistema segmenta estrictamente los datos de cada evaluación en dos categorías:

```
┌────────────────────────────────────────────────────────────────────────┐
│  1. REGISTRO PÚBLICO DE VERIFICACIÓN (Metadatos Seguros)               │
│     • Validation ID (CG-YYYY-XXXXXX)                                   │
│     • Target Release Git SHA                                           │
│     • Protocolo (CQS v1.1) y Nivel de Política (C1 a C6)               │
│     • Estatus (PASS/FAIL) y Score Numérico Compuesto                   │
│     • Digest Criptográfico SHA-256 de Firma                            │
├────────────────────────────────────────────────────────────────────────┤
│  2. REGISTRO PRIVADO / INTERNO (Exclusivo del Cliente)                 │
│     • Rutas absolutas del sistema de archivos local                    │
│     • Nombres de servidores internos o variables de entorno            │
│     • Código fuente y líneas específicas de código                     │
│     • Datos personales o correos electrónicos                          │
└────────────────────────────────────────────────────────────────────────┘
```

---

### 2. ESQUEMA DEL REGISTRO PÚBLICO (`release-certificate.json`)

Este esquema es el único expuesto para validación pública o verificación en línea:

```json
{
  "$schema": "https://grupocastillo.com/schemas/cqs-v1.1.json",
  "validation_id": "CG-2026-68D04F",
  "protocol": "CQS_v1.1",
  "policy_level": "C4_ADVANCED",
  "target_release_sha": "e5fce57bfbe6100c190c0bf4b4ea00664e808549",
  "evaluation_timestamp_utc": "2026-08-16T20:58:51.000Z",
  "status": "PASS",
  "exit_code": 0,
  "score": 100.0,
  "secrets_detected": 0,
  "gate_breakers_active": 0,
  "domains_summary": {
    "DOM-01": { "name": "Secret & Credential Detection", "score": 100.0, "status": "PASS" },
    "DOM-02": { "name": "Dependency & Supply Chain Health", "score": 100.0, "status": "PASS" },
    "DOM-03": { "name": "Static Code Quality & Architecture", "score": 100.0, "status": "PASS" },
    "DOM-04": { "name": "Accessibility & Semantic HTML (WCAG AA)", "score": 100.0, "status": "PASS" },
    "DOM-05": { "name": "Web Performance & Core Web Vitals Hygiene", "score": 100.0, "status": "PASS" },
    "DOM-06": { "name": "Build & Production Configuration Hygiene", "score": 100.0, "status": "PASS" },
    "DOM-07": { "name": "SEO, Canonical & Governance Metadata", "score": 100.0, "status": "PASS" }
  },
  "ownership": "CLIENT_EXCLUSIVE",
  "signature_digest_sha256": "2b4d0fd4bd6a41f20059636c55a2e57cf83b24bf2ef1b881a52ff72b7859f5fa"
}
```

---

### 3. VERIFICACIÓN DE FIRMA EN LÍNEA DE COMANDOS

Cualquier auditor o desarrollador puede verificar la autenticidad del certificado localmente mediante el runner oficial:

```bash
# Verificación criptográfica local
node bin/castle-gate.js verify-cert --cert path/to/release-certificate.json
```

**Respuesta Esperada:**
```
[CERTIFICATE VALID]: SHA-256 Digest matches EvidencePackage.
  └─ Validation ID: CG-2026-68D04F
  └─ Policy Level : C4_ADVANCED
  └─ Target SHA   : e5fce57bfbe6100c190c0bf4b4ea00664e808549
  └─ SHA-256      : 2b4d0fd4bd6a41f20059636c55a2e57cf83b24bf2ef1b881a52ff72b7859f5fa
```
