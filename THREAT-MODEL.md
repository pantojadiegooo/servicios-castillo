# CASTLE GATE — THREAT MODEL & ASSURANCE SECURITY ARCHITECTURE
**Document Reference**: `THREAT-MODEL.md`  
**Classification**: Public Security Architecture & Threat Specification  
**Version**: 1.0.0 (Ratified Post-Audit 2)  
**Target System**: Castle Gate Software Assurance Infrastructure & CQS v1.1  

---

## 1. Executive Overview & Scope

Castle Gate es una infraestructura de gobernanza y aseguramiento criptográfico de releases de software (*Software Assurance Infrastructure*). Su propósito es transformar la evaluación de calidad higiénica, seguridad estática y cumplimiento normativo de un repositorio en una **decisión matemática determinista y una prueba criptográfica inalterable**.

Este modelo de amenazas formaliza:
1. Los perfiles de adversarios asumidos en el diseño.
2. Los activos críticos que el sistema protege.
3. Las invariantes de seguridad verificables demostradas empíricamente.
4. Los límites y vectores expresamente fuera de alcance (*Out-of-Scope*).

---

## 2. Adversarios Asumidos

El diseño de seguridad de Castle Gate modela cuatro clases de adversarios:

| ID Adversario | Perfil del Adversario | Capacidades y Vectores de Ataque |
| :--- | :--- | :--- |
| **ADV-01** | **Repositorio Evaluado Hostil** | El repositorio objetivo contiene código malicioso o configuraciones diseñadas para atacar al motor de Castle Gate: path traversal en rutas de archivos, symlinks hacia rutas del sistema fuera del workspace, bombas de profundidad de directorios, payloads ReDoS para colapsar CPU, archivos gigantescos (>1GB) para provocar OOM, y caracteres Unicode invisibles/RTL. |
| **ADV-02** | **Adversario con Certificado pero sin Clave Privada** | Atacante con acceso a un Release Certificate emitido que intenta falsificar el veredicto (`BLOCKED` -> `PASSED`), inflar la puntuación CQS, limpiar Gate Breakers, cambiar el nivel de política (`C2` -> `C6`), recalcular hashes no canónicos o remover la firma digital asimétrica (*Signature Stripping*). |
| **ADV-03** | **Atacante con Control Parcial del Runner CI/CD** | Adversario que manipula parámetros de línea de comandos en el runner, intenta reinyectar evidencias válidas de un commit anterior sobre un commit no auditado (*Commit Replay Attack*), o modifica reportes HTML, SARIF o SBOM vinculados. |
| **ADV-04** | **Insider con Acceso al Repositorio de Castle Gate** | Colaborador o insider que busca debilitar silenciosamente controles normativos en CQS, relajar pesos de dominios o introducir bypasses en los probes de análisis. |

---

## 3. Activos Críticos Protegidos

| ID Activo | Activo a Proteger | Mecanismos de Protección |
| :--- | :--- | :--- |
| **AST-01** | **Clave Privada Ed25519 de Firma** | Almacenada fuera del repositorio de código auditado; jamás se incluye en reportes, logs ni artefactos públicos. Compatible con PKCS#8 y PEM. |
| **AST-02** | **Integridad del Veredicto de Gate** | Decisión determinista inmutable: un commit que contiene Gate Breakers activos o no alcanza el umbral de política pactado NUNCA produce un veredicto `PASSED` ni un código de salida 0. |
| **AST-03** | **Integridad de la Cadena Merkle de Evidencia** | Vinculación criptográfica continua entre evaluaciones sucesivas (`E1 -> E2 -> E3`) garantizando que ningún registro histórico sea alterado o reordenado sin invalidar el ledger. |
| **AST-04** | **Confidencialidad de Secretos Detectados** | Las credenciales detectadas (claves AWS, tokens Stripe, PATs GitHub, claves privadas) son enmascaradas y jamás se vuelcan en texto plano en la salida pública o logs de CI/CD. |

---

## 4. Invariantes de Seguridad Explícitas (Demostradas en AUDIT 2)

Las siguientes invariantes han sido formal y empíricamente verificadas mediante el arnés de destrucción adversarial (49/49 ataques defendidos):

### INV-01: Verificación de Firma Asimétrica Obligatoria (Fail-Closed)
> **Definición**: Cuando `castle-verify` es ejecutado con una clave pública (`--key`), el artefacto DEBE contener una firma Ed25519 válida. Si la firma es omitida o eliminada (*Signature Stripping*), el verificador declara `INVALID (Exit 1)`.
> **Evidencia AUDIT 2**: Vector `CRYPTO-15` (Remediación `SEC-AUD2-01`).

### INV-02: Canonicalización Estricta RFC 8785 (JCS) sin Fallback
> **Definición**: El cálculo del digest criptográfico del payload se realiza exclusivamente bajo RFC 8785 (JCS). Cualquier intento de serializar con `JSON.stringify()` no canónico o con ordenación arbitraria de claves es rechazado como `INVALID (Exit 1)`.
> **Evidencia AUDIT 2**: Vectores `CRYPTO-22`, `CRYPTO-22B`, `JCS-01`, `JCS-02`, `JCS-03` (Remediación `SEC-AUD2-02`).

### INV-03: No-Repudio y Vinculación Criptográfica Total
> **Definición**: La alteración de un solo bit en `evaluation_id`, `target_system.commit_sha`, `cqs_display_score`, `gate_level`, `gate_breakers` o `policy_hash` invalida simultáneamente el digest canónico y la firma digital Ed25519.
> **Evidencia AUDIT 2**: Vectores `CRYPTO-01` a `CRYPTO-14`, `REPLAY-01`, `REPLAY-02`.

### INV-04: Fail-Closed en Señales Externas y SCA (DOM-02)
> **Definición**: Ante pérdidas de red, timeouts 504 o respuestas JSON malformadas de herramientas externas (npm audit, OSV.dev), el motor asigna `INCONCLUSIVE` o `UNEXECUTED`, NUNCA fabrica un `PASS`.
> **Evidencia AUDIT 2**: Vectores `FAILCLOSE-01`, `FAILCLOSE-02`, `FAILCLOSE-03`.

### INV-05: Confinamiento en Sandbox de Sistema de Archivos
> **Definición**: Toda resolución de archivos valida que el path canónico (`fs.realpathSync`) resida estrictamente dentro de la raíz del workspace. Path traversals (`../`) y symlinks dirigidos al exterior son bloqueados con `safe: false`.
> **Evidencia AUDIT 2**: Vector `FS-01`.

### INV-06: Límites de Recursos y Resiliencia ante DoS
> **Definición**: La profundidad de directorios se trunca a 20 niveles (`FS-02`), el tamaño de archivo individual está topado en 10MB por defecto, la evaluación completa posee un timeout global de 60s, y las líneas analizadas por expresiones regulares se truncan a 20,000 caracteres para neutralizar ReDoS (`REDOS-01`).
> **Evidencia AUDIT 2**: Vectores `FS-02`, `REDOS-01`.

### INV-07: Persistencia de Secretos en el Historial de Git
> **Definición**: Credenciales comprometidas en commits históricos y posteriormente desvinculadas (`git rm`) en el commit actual son detectadas en el diff de commits y activan el Gate Breaker `GB-02` vetando el release.
> **Evidencia AUDIT 2**: Vector `GIT-01`.

### INV-08: Análisis Estructural AST (Anti-Falsos Positivos)
> **Definición**: El análisis de construcciones peligrosas en JavaScript (`eval`, `debugger`) utiliza el árbol sintáctico real (Acorn AST). Palabras clave dentro de cadenas literales o comentarios son ignoradas.
> **Evidencia AUDIT 2**: Vector `AST-01`.

### INV-09: Metodología CQS v1.1 Congelada (Single Source of Truth)
> **Definición**: La base de reglas CQS v1.1 contiene exactamente 65 controles atómicos, 7 dominios y 100.00 puntos nominales sin adición ni supresión no autorizada.
> **Evidencia AUDIT 2**: Vector `CQS-01`.

### INV-10: Determinismo Cross-OS y Cross-Timezone (Empíricamente Comprobado)
> **Definición**: La evaluación de un mismo commit produce resultados, puntuaciones CQS y evidencia criptográfica idéntica bit a bit independientemente de la zona horaria del host (`UTC`, `America/New_York`, `Asia/Tokyo`, `Europe/London`, `America/Mexico_City`, `Australia/Sydney`) y de los saltos de línea del sistema operativo (UNIX `\n` vs Windows `\r\n` sin autocrlf).
> **Evidencia Empírica**:
> - Evaluación multi-zona horaria (6 TZ): Digest canónico CQS idéntico (`7fe6fd448ab02bb3bd8ed8f75a6af90c6698ad66593b6c53ce4dd582015e6cad`).
> - Evaluación cross-OS (Linux LF vs Windows CRLF nativo sin autocrlf, ejecución 18/08/2026):
>   * Raw Evidence Package SHA-256: `07de538b77c4d696a346adebdbaa65d257e822c228fe1358d5f6beb7c4532635` (100% idéntico).
>   * Canonical Certificate Payload Digest: `e713a366ed55b1c4637b96dd5a29c1669757a99609d0138609a5b915273539e4` (100% idéntico).

---

## 5. Fuera de Alcance Declarado (Out-of-Scope)

Para garantizar la honestidad y precisión técnica de la postura de seguridad, se declaran explícitamente los escenarios fuera del alcance del software:

1. **OOS-01 — Compromiso de la Clave Privada fuera del Software**:
   Si la clave privada Ed25519 es sustraída de la infraestructura del cliente mediante un ataque externo al servidor o variable de entorno de CI/CD, el verificador criptográfico no puede distinguir entre una firma autorizada y una firma forjada con la misma clave legítima. (Mitigación: Integración con HSM/KMS y rotación de claves planificada).
2. **OOS-02 — Ataques Físicos o Privilegiados al Host / Runner**:
   Ataques donde un adversario con privilegios de `root`, `SYSTEM` o hipervisor manipula directamente la memoria RAM del proceso Node.js durante la ejecución.
3. **OOS-03 — Compromiso del Runtime de Node.js o el Kernel del SO**:
   Modificaciones maliciosas en el intérprete binario de Node.js o en la librería OpenSSL subyacente.
4. **OOS-04 — Certificación Legal o Estatutaria**:
   Castle Gate es una herramienta de aseguramiento y gobernanza técnica determinista. No reemplaza auditorías formales de acreditación jurídica estatutaria (como un reporte formal SOC 2 Type II o ISO/IEC 27001 emitido por auditores colegiados).
5. **OOS-05 — Análisis Dinámico de Malware (DAST en Sandbox Interactivo)**:
   Castle Gate efectúa análisis estático, AST, SCA higiénico y verificación de evidencias; no ejecuta código sospechoso en máquinas virtuales interactivas para análisis de comportamiento en tiempo de ejecución.

---

## 6. Política de Divulgación de Vulnerabilidades

Castle Gate implementa el estándar RFC 9116 en `.well-known/security.txt`. Para reportar hallazgos de seguridad, consulte el archivo `security.txt` o escriba directamente a:
- **Email**: `security@grupocastillo.tech` / `engineering@grupocastillo.com`
