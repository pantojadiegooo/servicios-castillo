# Castle Gate & CQS v1.1 — Official Release Handoff & Architecture Dossier

**Release Package Version:** `@grupo-castillo/castle-gate@1.0.0`  
**CQS Methodology Specification:** `1.1.0`  
**CQS Status:** `RATIFIED_FROZEN`  
**Release Decision:** `RELEASE-READY-WITH-DOCUMENTED-RISKS`  
**Date:** Agosto 2026  
**Classification:** Handoff Técnico, Normativo y de Gobernanza de Ingeniería  

---

## 1. Resumen Ejecutivo del Release

El sistema **Castle Gate** y la metodología **Castle Quality System (CQS v1.1)** han completado satisfactoriamente el ciclo completo de desarrollo, integración de analizadores, hardening criptográfico, pruebas adversariales de compuerta y auditorías de consistencia pre-release.

Este paquete representa el estado final **congelado (frozen)** del software y de la especificación técnica.

---

## 2. Metodología CQS v1.1 (Normativa Congelada)

La metodología CQS v1.1 constituye la única fuente de verdad normativa para la evaluación y autorización de releases:

| Dimensión | Valor Normativo | Estado |
|---|:---:|:---:|
| **Total de Controles** | **65** | Congelado |
| **Total de Dominios** | **7** (`PER`, `SEC`, `ACC`, `SEO`, `UX`, `REL`, `MNT`) | Congelado |
| **Peso Nominal Total** | **100.00** | Congelado |
| **Subcriterios Normativos** | **26** (24 aprobados explícitos, 41 derivados, 0 nuevas propuestas) | Congelado |
| **Versión de Especificación** | **1.1.0** | Congelado |
| **Estado Normativo** | **`RATIFIED_FROZEN`** | Congelado |

- **Artefactos Normativos:**
  - Especificación formal: [`cqs/specification/specification.json`](../cqs/specification/specification.json)
  - Invariantes matemáticos: [`cqs/governance/invariants.json`](../cqs/governance/invariants.json)
  - Proceso de evolución futura: [`docs/governance/CQS-VERSIONING-PROCESS.md`](./governance/CQS-VERSIONING-PROCESS.md)

---

## 3. Cadena de Confianza Criptográfica y Trust Anchors

La arquitectura de confianza de Castle Gate garantiza verificabilidad offline e inmutabilidad:

1. **Canonicidad de Datos:** Normalización estricta bajo **RFC 8785 JSON Canonicalization Scheme (JCS)** sobre todos los payloads de evidencia, políticas, waivers y certificados.
2. **Firmas Digitales Asimétricas:** Criptografía de curva elíptica **Ed25519** para autenticación de autoría.
3. **Independent Trust Anchor:** Desacoplado del sistema evaluado y distribuido canónicamente en [`castle-gate/trust-anchors.json`](../castle-gate/trust-anchors.json), protegiendo contra ataques de compromiso de sitio y sustitución de claves.
4. **Ciclo de Vida de Revocación de Claves:** Manifiestos de revocación firmados con alcance temporal (`issued_at` vs `revoked_at`) y soporte para preservación de validez histórica o revocación retroactiva.
5. **Respaldo Seguro y Recuperación de Desastres:** Cifrado autenticado **AES-256-GCM** derivado mediante **PBKDF2-HMAC-SHA512** (100,000 iteraciones) con exclusión estricta en `.gitignore`.
6. **Verificador Independiente:** Herramienta CLI offline [`castle-gate/verifier/castle-verify.js`](../castle-gate/verifier/castle-verify.js).

---

## 4. Cadena de Suministro (Supply Chain) y Self-Dogfooding

- **Inventario de Dependencias:**
  - *Producción / Runtime:* `acorn` (^8.18.0) — Zero-dependency core para análisis sintáctico.
  - *Dev / Herramientas:* `@babel/parser`, `ajv`, `ajv-formats`, `axe-core`, `jsdom`.
- **SBOM Multiformato:**
  - *CycloneDX v1.5:* 49 componentes mapeados con PURLs y hashes SHA-512.
  - *SPDX v2.3:* 50 paquetes reconciliados.
- **Auditoría de Vulnerabilidades:**
  - 49 dependencias escaneadas mediante OSV / `npm audit` $\rightarrow$ **0 vulnerabilidades detectadas**.
- **Certificado de Self-Dogfooding:**
  - Target: `castle-gate-engine` (`./castle-gate`, 151 archivos).
  - CQS Score: **72.73 / 100.00** (`CONDITIONAL_APPROVAL`, Compuerta C1 Foundation **PASSED**, Exit Code 0).
  - Certificado emitido: [`.castle-self-dogfooding/release-certificate.json`](../.castle-self-dogfooding/release-certificate.json) vinculado al commit real y verificado criptográficamente.

---

## 5. Alcance de Assurance y Delimitación de Responsabilidad

Conforme a lo ratificado en [`docs/security/ASSURANCE_SCOPE.md`](./security/ASSURANCE_SCOPE.md):

- **Naturaleza de las Pruebas:** Evaluaciones automatizadas, algorítmicas, determinísticas, adversariales y asistidas por inteligencia artificial realizadas sobre el código fuente y artefactos del repositorio.
- **Límites de Assurance:** Las evaluaciones internas **NO constituyen un pentest humano independiente, ni una auditoría externa certificada (ej. ISO 27001 / SOC 2 / CREST), ni una garantía de seguridad absoluta**.
- **Matriz de Comunicación:** Todo claim comercial debe respetar estrictamente [`CASTLE-GATE-CLAIMS-AND-ANTI-CLAIMS-v1.0.md`](../CASTLE-GATE-CLAIMS-AND-ANTI-CLAIMS-v1.0.md).

---

## 6. Evidencia de Regresión Automatizada (14/14 PASS)

Las 14 suites del arnés de pruebas ejecutadas de forma reproducible:

| # | Suite de Pruebas | Archivo de Prueba | Cobertura | Resultado |
|---|---|---|---|:---:|
| 1 | CQS Integrity | `tests/cqs-integrity-test.js` | 65 controles, pesos y jerarquía | **PASS** (15/15) |
| 2 | CQS Ratification | `tests/cqs-ratification-audit.js` | Versión 1.1.0 y estado FROZEN | **PASS** |
| 3 | Adversarial Harness | `tests/adversarial-independent/audit-2-harness.js` | 49 vectores de ataque | **PASS** (49/49) |
| 4 | Productization Suite | `tests/productization-suite-test.js` | AST, SARIF v2.1.0, CycloneDX v1.5 | **PASS** (15/15) |
| 5 | Approver Trust Ring | `tests/approver-trust-ring-test.js` | Jerarquía de roles de aprobación | **PASS** (3/3) |
| 6 | Cross-Process Ledger | `tests/cross-process-ledger-test.js` | Persistencia Merkle cross-OS | **PASS** |
| 7 | Policy-as-Code | `tests/policy-as-code-test.js` | Inmutabilidad de políticas (SHA-256) | **PASS** (4/4) |
| 8 | Waivers Lifecycle | `tests/waivers-lifecycle-test.js` | Emisión, firma y expiración TTL | **PASS** (5/5) |
| 9 | Evidence Supersession | `tests/evidence-supersession-test.js` | Encadenamiento Merkle de evidencia | **PASS** (4/4) |
| 10 | Terminal Demo Security | `tests/terminal-demo-security-test.js` | 0 DOM XSS sinks y sanitización | **PASS** |
| 11 | Dogfooding Crypto Audit | `tests/dogfooding-cryptographic-audit.js` | Certificado web firmado y verificado | **PASS** |
| 12 | Cryptographic Hardening | `tests/cryptographic-trust-hardening-test.js` | Revocación, Backup AES y Trust Chain | **PASS** |
| 13 | Trust Anchor Distribution | `tests/trust-anchor-external-distribution-test.js` | Distribución fuera de banda (5 casos) | **PASS** (5/5) |
| 14 | Self-Dogfooding Supply Chain | `tests/self-dogfooding-supply-chain-test.js` | SBOM propio y scan de vulnerabilidades | **PASS** |

---

## 7. Backlog Post-Release (Riesgos No Bloqueantes Documentados)

Los siguientes elementos quedan formalmente registrados en el backlog para futuros ciclos evolutivos:

1. **[BACKLOG-PUB-01] Refinamiento de Copy Web:**  
   - En futuras actualizaciones del sitio comercial (fuera de la ventana de congelamiento), precisar la frase `"100% Offline"` en `website/index.html` como `"100% Offline Runtime Execution"` para alineación textual redundante con las anti-claims.
2. **[BACKLOG-MNT-01] Modularización de Funciones Monolíticas:**  
   - Descomponer las funciones de gran tamaño en `castle-verify.js` y `ast-probe.js` para elevar el score del subcriterio `MNT-01.1` por encima de los límites de nodos AST en futuros mantenimientos.
3. **[BACKLOG-EXT-01] Auditoría y Pentest Humano Externo:**  
   - Cuando la organización lo requiera formalmente para certificaciones comerciales de terceros, coordinar la contratación de una firma de ciberseguridad independiente para la ejecución de un pentest humano y auditoría externa certificada.

---

## 8. Dictamen Final de Release

$$mathbf{CASTLE GATE RELEASE FROZEN — RELEASE-READY-WITH-DOCUMENTED-RISKS}$$

Todos los requisitos de calidad, seguridad higiénica, consistencia metodológica y preservación histórica han sido satisfechos al 100%.
