# Castle Gate — Declaración de Alcance de Assurance y Modelo de Evaluación

**Versión del Documento:** 1.0.0  
**Fecha de Emisión:** Agosto 2026  
**Estado:** DOCUMENTO TÉCNICO INTERNO RATIFICADO  
**Clasificación:** Gobernanza y Modelo de Confianza  

---

## 1. Naturaleza de las Evaluaciones Realizadas

Las evaluaciones de seguridad, calidad y aseguramiento de software ejecutadas en el marco del desarrollo y validación de **Castle Gate** y el sistema **CQS v1.1** corresponden a:

- **Pruebas Adversariales Automatizadas:** Suites diseñadas específicamente para intentar vulnerar, forjar, alterar, degradar y evadir los controles y mecanismos criptográficos del motor.
- **Evaluación Algorítmica y Determinística:** Verificación exhaustiva de invariantes matemáticos, canonicidad RFC 8785, firmas Ed25519, árboles de Merkle y reglas de compuerta (*Gate Breakers*).
- **Proceso Asistido por Inteligencia Artificial:** Diseño y ejecución de suites de verificación implementadas con asistencia de modelos de lenguaje e ingeniería de prompts de alta precisión.
- **Análisis de Código Fuente Estático:** Inspección directa del árbol sintáctico abstracto (AST), dependencias (SCA), secretos en historial de Git y semántica estructural.

### Declaración Explícita de no-certificación Externa:
Las evaluaciones internas **NO CONSTITUYEN NI DEBEN INTERPRETARSE COMO**:
1. Un **Penetration Test (Pentest) humano independiente** realizado por investigadores de seguridad externos.
2. Una **Auditoría Externa Certificada** por firmas de cumplimiento (ej. ISO/IEC 27001, SOC 2 Type II, PCI-DSS QSA, CREST o FedRAMP).
3. Una **Certificación Formal de Seguridad** de terceros.
4. Una **Attestation Criptográfica o Legal** emitida por una entidad externa independiente.
5. Una **Evaluación de Seguridad Física o de Infraestructura en Producción**.

---

## 2. Alcance Evaluado

El alcance técnico de las verificaciones ejecutadas cubre:

1. **Metodología CQS v1.1 (Congelada):**
   - 65 controles normativos en 7 dominios (`PER`, `SEC`, `ACC`, `SEO`, `UX`, `REL`, `MNT`).
   - 26 subcriterios normativos y 100.00 puntos de peso nominal.
   - Algoritmo de scoring canónico e invariantes matemáticos.
2. **Motor Castle Gate Engine:**
   - Probes nativos: `SecurityProbe`, `DomSemanticsProbe`, `MaintainabilityProbe`, `AstProbe`, `GitHistoryProbe`.
   - Adaptadores de evidencia: `NpmAuditAdapter`, `OsvAdapter`, `SemgrepAdapter`, `AxeAdapter`, `LighthouseAdapter`.
3. **Capa Criptográfica y Cadena de Confianza:**
   - Canonicidad JSON (RFC 8785 JCS).
   - Firmas asimétricas digitales Ed25519 y sobres DSSE in-toto.
   - Evidence Ledger con encadenamiento de hashes de Merkle.
   - Manifiestos de Revocación de Claves con alcance temporal.
   - Almacén de Trust Anchors independientes y desacoplados del sitio.
   - Cifrado autenticado AES-256-GCM para backup y disaster recovery de claves privadas.
4. **Gobierno de Waivers y Políticas:**
   - Policy-as-Code con referencia inmutable por hash SHA-256.
   - Waivers con expiración TTL forzada y Trust Ring de roles de aprobación.

---

## 3. Metodología y Suites de Regresión Ejecutadas

Las pruebas se ejecutan de manera 100% reproducible y local (offline) mediante scripts Node.js:

| Suite | Identificador | Alcance de Verificación |
|---|---|---|
| **CQS Integrity** | `cqs-integrity-test.js` | Validación de los 65 controles y 100.00 puntos de peso nominal. |
| **CQS Ratification** | `cqs-ratification-audit.js` | Estado `RATIFIED_FROZEN` y concordancia canónica de invariantes. |
| **Adversarial Harness** | `audit-2-harness.js` | 49 pruebas de ataque adversarial (tampering, digest spoofing, waiver bypass, etc.). |
| **Productization Suite** | `productization-suite-test.js` | Probes AST, SARIF v2.1.0, CycloneDX v1.5, Axe y configuración. |
| **Approver Trust Ring** | `approver-trust-ring-test.js` | Jerarquía de roles (Developer, QA Lead, Tech Lead, Security Officer, CISO). |
| **Cross-Process Ledger** | `cross-process-ledger-test.js` | Persistencia de la cadena de evidencia a través de procesos OS independientes. |
| **Policy-as-Code** | `policy-as-code-test.js` | Inmutabilidad de políticas mediante digest SHA-256 canónico. |
| **Waivers Lifecycle** | `waivers-lifecycle-test.js` | Emisión, firma, expiración automática (TTL) y fail-closed de waivers. |
| **Evidence Supersession** | `evidence-supersession-test.js` | Encadenamiento Merkle entre evaluaciones sucesivas. |
| **Frontend Security** | `terminal-demo-security-test.js` | Cero sinks inseguros (`innerHTML`) y sanitización estricta anti-XSS. |
| **Dogfooding Certificate** | `dogfooding-cryptographic-audit.js` | Certificado emitido con Git Commit SHA real y firma Ed25519 validada. |
| **Trust Hardening** | `cryptographic-trust-hardening-test.js` | Revocación, backup AES-256-GCM y trust anchors desacoplados. |
| **Trust Anchor Distribution** | `trust-anchor-external-distribution-test.js` | Distribución fuera de banda y defensa contra sustitución de claves en sitios comprometidos. |

---

## 4. Significado de "Auditoría" dentro de Castle Gate

Dentro del ecosistema de Castle Gate, el término **"Auditoría"** (ej. `audit-trail.json`, `AUD-GATE-*.json`, `audit-2-harness.js`) se refiere exclusivamente a:

> **Una verificación algorítmica automatizada, determinística y trazable en el tiempo de que un artefacto de software cumple con las reglas formales de una política de compuerta predefinida.**

No denota ni pretende denotar una auditoría financiera, legal, contable ni una certificación emitida por auditores humanos colegiados.

---

## 5. Limitaciones Técnicas Declaradas

1. **Entorno Dinámico de Ejecución:** El análisis estático de Castle Gate no inspecciona vulnerabilidades exclusivas del runtime dinámico (ej. condiciones de carrera de memoria en kernels, ataques de canal lateral a nivel hardware, o ataques de denegación de servicio distribuido).
2. **Ingeniería Social y Factores Humanos:** Ningún control criptográfico de Castle Gate previene el robo de credenciales mediante phishing o coerción física a los operadores de claves privadas fuera del sistema.
3. **Dependencia de la Corrección de Scanners Subyacentes:** Si un scanner de terceros (ej. base de datos OSV, reglas Semgrep) presenta omisiones en su base de datos de firmas, el adaptador reflejará la información entregada por el scanner.

---

## 6. Requisitos para una Evaluación Humana Independiente

Para alcanzar un nivel de assurance de grado "Certificación Externa", la organización deberá contratar formalmente:
1. Una firma de ciberseguridad independiente con acreditaciones reconocidas (ej. CREST, CHECK, ISO/IEC 27001).
2. Un ejercicio de Penetration Testing de caja gris/negra sobre los servicios y repositorios en vivo.
3. Una auditoría de código manual por parte de analistas de seguridad especializados.
4. La emisión de un Reporte de Auditoría firmado por los auditores humanos responsables.

---

## 7. Directrices de Comunicación Pública y Expresión en Documentación Futura

Cualquier material técnico, documental o de release debe respetar las siguientes normas:
- **Prohibido el uso de términos absolutos:** No utilizar expresiones como *"100% seguro"*, *"completamente invulnerable"* o *"cero riesgos garantizado"*.
- **Prohibida la atribución de certificaciones no existentes:** No sugerir que el sistema cuenta con certificaciones ISO, SOC 2 o avales de terceros que no hayan sido formalmente contratados y emitidos.
- **Transparencia en el modelo de evaluación:** Indicar con claridad que los certificados de release acreditan el cumplimiento de la compuerta automatizada CQS bajo las reglas de política configuradas.
