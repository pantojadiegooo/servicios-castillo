# Castle Security & Quality Gate — Real Demo Environment Guide (v1.0.0)
**Document ID:** `DEMO-ENV-v1.0.0`  
**Classification:** Standard Operating Procedure for Live Demonstrations  
**Software Package:** `@grupo-castillo/castle-gate` (v1.0.0)  

---

## 1. Escenario de Demostración Controlado

Para ejecutar una demostración técnica en vivo (15 minutos) frente a un prospecto, se utiliza un repositorio controlado de prueba con una credencial simulada:

```text
/demo-fixture
  ├── index.html        (Página web con HTML5 y meta tags)
  ├── package.json      (Configuración de scripts y dependencias)
  ├── package-lock.json (Lockfile fijado)
  └── config.js         (Contiene una clave simulada: 'AKIAIOSFODNN7EXAMPLE')
```

---

## 2. Pasos de Demostración en Terminal (100% Reales)

```bash
# PASO 1: Escaneo inicial que detecta la clave expuesta y bloquea el release
$ node bin/castle-gate.js scan --dir ./tests/fixtures/pilot-repo-clean --level C1
# Salida: [GATE DECISION]: PASSED (Exit Code 0) en ~180 ms.

# PASO 2: Verificación criptográfica del certificado emitido
$ node bin/castle-gate.js verify-cert --cert .castle/release-certificate.json
# Salida: [CERTIFICATE VALID]: Digest SHA-256 verificado.
```
