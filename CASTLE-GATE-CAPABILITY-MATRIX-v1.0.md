# Castle Security & Quality Gate — Real Capability Matrix (v1.0.0)
**Document ID:** `CAPABILITY-MATRIX-v1.0.0-COMMERCIAL`  
**Execution Date:** `2026-08-13`  
**Classification Guide:**
- `[VERIFIED]`: Funcionalidad nativa probada empíricamente en tests y clean-room.
- `[SUPPORTED]`: Soportada por el producto bajo configuración o entrada de evidencia específica.
- `[SERVICE]`: Proporcionada por Grupo Castillo como servicio profesional de consultoría/auditoría humana.
- `[ROADMAP]`: Planeada para versiones futuras (v1.1+); NO debe venderse como disponible hoy.
- `[NOT_SUPPORTED]`: Fuera de alcance del producto.

---

## 1. Matriz de Capacidades Técnicas del Software

| Capacidad | Clasificación | Estado Técnico & Justificación |
|---|:---:|---|
| **Evaluación CQS v1.1 congelada (65 controles, 7 dominios)** | `[VERIFIED]` | Evaluador determinista de score formal y pesos nominales (100.00 pts). |
| **Gobernanza de Gate C1→C6 (Políticas ratificadas)** | `[VERIFIED]` | Decisiones PASSED / BLOCKED / REQUIRES_REMEDIATION con umbrales configurados. |
| **Gate Breakers de Veto Crítico (GB-01 a GB-04)** | `[VERIFIED]` | Bloqueo inmediato ante credenciales hardcodeadas o enlaces HTTP inseguros. |
| **Detección de Credenciales y Secretos Estáticos** | `[VERIFIED]` | SecurityProbe escanea claves AWS, Stripe, GitHub PAT, llaves privadas RSA. |
| **Detección de Enlaces HTTP Inseguros** | `[VERIFIED]` | SecurityProbe detecta URLs no cifradas en archivos de código fuente. |
| **Auditoría Semántica y Accesibilidad DOM** | `[VERIFIED]` | DomSemanticsProbe valida tags `nav`, `main`, `h1`, `alt` en imágenes y viewport. |
| **Auditoría de Mantenibilidad y Archivos Lockfile** | `[VERIFIED]` | MaintainabilityProbe valida presencia y coherencia de package.json y lockfiles. |
| **Generación de Reportes HTML Autónomos** | `[VERIFIED]` | `compliance-report.html` embebido y navegable sin requerir conexión a internet. |
| **Emisión de Release Certificates Sellados** | `[VERIFIED]` | `release-certificate.json` con digest SHA-256 inmutable del paquete de evidencia. |
| **Verificación Criptográfica de Certificados** | `[VERIFIED]` | Comando `castle-gate verify-cert` rechaza instantáneamente certificados alterados. |
| **Integración CI/CD (GitHub Actions / GitLab CI)** | `[VERIFIED]` | Códigos de salida POSIX estándar ($0, 1, 2, 3$) y `action.yml` oficial. |
| **Operación 100% Offline / Air-Gapped** | `[VERIFIED]` | Cero dependencias runtime (`dependencies: {}`) y cero llamadas de red. |
| **Ingesta de Evidencia Externa (Lighthouse JSON Adapter)** | `[SUPPORTED]` | Adapter oficial en `castle-gate/evidence/adapters/lighthouse-adapter.js`. |
| **Evaluación de Nivel C3, C4, C5, C6** | `[SUPPORTED]` | Motor evalúa niveles, pero requiere evidencia multicapa completa para obtener `PASSED`. |
| **Pre-procesador para ignorar secretos comentados** | `[ROADMAP]` | [CAPABILITY GAP] En v1.0, cadenas comentadas son evaluadas por regex estático. |
| **Firma Digital Asimétrica Ed25519 en Certificados** | `[ROADMAP]` | [CAPABILITY GAP] En v1.0, el certificado utiliza sellado digest SHA-256 local. |
| **Cloud Verification Registry Centralizado** | `[ROADMAP]` | [CAPABILITY GAP] Planeado para v1.2 como servicio SaaS opcional. |
| **Análisis de Flujo de Datos Interprocedural Profundo (SAST)** | `[NOT_SUPPORTED]` | No sustituye a SonarQube; Castle Gate opera como gobernanza y no como compilador AST profundo. |
| **Base de Datos Global de CVEs en Tiempo Real (SCA)** | `[NOT_SUPPORTED]` | No sustituye a Snyk/Dependabot; Castle Gate valida presencia de lockfiles, no feeds de CVEs. |
| **Análisis Dinámico de Vulnerabilidades en Tiempo Real (DAST)**| `[NOT_SUPPORTED]` | Fuera del alcance del motor estático offline. |

---

## 2. Matriz de Servicios Profesionales de Grupo Castillo

| Servicio Profesional | Clasificación | Entregable y Naturaleza |
|---|:---:|---|
| **Castle Checkup** | `[SERVICE]` | Diagnóstico inicial rápido de un repositorio con informe CQS y recomendaciones de nivel. |
| **Castle Audit** | `[SERVICE]` | Auditoría técnica profunda combinando Castle Gate con revisión humana especializada de arquitectura. |
| **Castle Rescue** | `[SERVICE]` | Asistencia técnica y remediación de código para llevar un proyecto bloqueado (`Exit Code 1/2`) a `PASSED`. |
| **Castle Emergency** | `[SERVICE]` | Intervención prioritaria ante incidentes de release bloqueado o fuga de credenciales. |
| **Castle Care** | `[SERVICE]` | Acompañamiento mensual continuo para gobernanza de releases en pipelines de clientes. |
| **Certificación Regulatoria Formal (SOC 2, ISO 27001)** | `[NOT_SUPPORTED]` | Grupo Castillo NO es un organismo auditor de SOC 2/ISO; Castle Gate es gobernanza técnica interna. |
