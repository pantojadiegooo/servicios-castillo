# Castle Security & Quality Gate — Master Commercial Definition (v1.0.0)
**Document ID:** `COMMERCIAL-SPEC-v1.0.0-MASTER`  
**Classification:** Grupo Castillo Commercial Architecture & Operational Blueprint  
**Methodology:** Castle Quality System (CQS v1.1 — FROZEN / SINGLE SOURCE OF TRUTH)  
**Package:** `@grupo-castillo/castle-gate` (v1.0.0)  
**Status:** Approved for Commercial Pilot  

---

## 1. Product Definition

**Castle Security & Quality Gate** es una plataforma determinista de gobernanza y autorización de releases de software para pipelines modernos y auditorías locales. Operacionaliza la metodología **CQS v1.1** para evaluar calidad estructural, seguridad higiénica, accesibilidad y mantenibilidad, traduciendo dicha evaluación en una **decisión binaria de release** (`PASSED` vs. `BLOCKED` / `REQUIRES_REMEDIATION`) respaldada por un **Release Certificate** inmutable con sellado criptográfico SHA-256.

---

## 2. CQS vs. Castle Gate (Distinción Conceptual)

* **CQS (Castle Quality System v1.1):** Es la **metodología matemática y taxonómica**. Define los 65 controles atómicos, los 7 dominios de calidad/seguridad, las fórmulas de normalización sobre 100.00 puntos y las invariantes de cálculo. Es estática, congelada e independiente de cualquier herramienta particular.
* **Castle Gate:** Es el **software ejecutable y plataforma de gobernanza**. Implementa los Castle Native Probes para inspección estática local, ejecuta el motor de scoring CQS, evalúa las políticas de Gate C1→C6, gestiona los vetos obligatorios (*Gate Breakers*) y emite los reportes HTML y certificados criptográficos.

---

## 3. Matriz de Capacidades Reales (Capability Matrix)

| Capacidad Técnica / Funcional | Estado | Justificación y Límites |
|---|:---:|---|
| **Evaluación CQS v1.1 (65 controles / 7 dominios)** | `[VERIFIED]` | Evaluador matemático determinista con hashes congelados. |
| **Gobernanza de Gate C1→C6 con Gate Breakers** | `[VERIFIED]` | Políticas ratificadas; veto inmediato ante infracciones críticas. |
| **Escaneo de Secretos y Credenciales Estáticas** | `[VERIFIED]` | Detección de claves AWS, Stripe, GitHub PAT y llaves privadas. |
| **Detección de Enlaces HTTP Inseguros** | `[VERIFIED]` | Verificación de transporte cifrado en código fuente. |
| **Auditoría Semántica y Accesibilidad DOM Básica** | `[VERIFIED]` | Verificación de tags semánticos (`nav`, `main`, `h1`), `alt` en imágenes y viewport. |
| **Auditoría de Mantenibilidad y Lockfiles** | `[VERIFIED]` | Verificación de consistencia en `package.json` y lockfiles fijados. |
| **Generación de Reportes HTML Autónomos** | `[VERIFIED]` | Reporte interactivo local sin dependencias CDN ni llamadas de red. |
| **Emisión y Verificación de Release Certificates** | `[VERIFIED]` | Digest SHA-256 canónico verificado mediante `verify-cert`. |
| **Integración CI/CD (GitHub Actions / GitLab CI)** | `[VERIFIED]` | Exit Codes POSIX ($0 = \text{PASS}, 1 = \text{BLOCK}, 2 = \text{REMED}, 3 = \text{ERR}$). |
| **Operación 100% Offline / Air-Gapped** | `[VERIFIED]` | `dependencies: {}` y cero llamadas de red en el núcleo. |
| **Ingesta de Evidencia Externa (Lighthouse JSON Adapter)**| `[SUPPORTED]`| Adapter modular en `castle-gate/evidence/adapters/`. |
| **Pre-procesador de Comentarios en Native Probes** | `[ROADMAP]` | [CAPABILITY GAP] En v1.0, cadenas comentadas son evaluadas por regex estático. |
| **Firma Digital Asimétrica Ed25519** | `[ROADMAP]` | [CAPABILITY GAP] En v1.0 se utiliza digest canónico SHA-256 local. |
| **Cloud Verification Registry Centralizado** | `[ROADMAP]` | [CAPABILITY GAP] Planeado para versión v1.2. |
| **Compilación AST y Análisis Interprocedural Profundo** | `[NOT_SUPPORTED]` | No sustituye a SonarQube; opera a nivel de gobernanza estática. |
| **Base de Datos Global de CVEs en Tiempo Real** | `[NOT_SUPPORTED]` | No sustituye a Snyk; no mantiene feeds dinámicos de vulnerabilidades. |

---

## 4. Arquitectura de Niveles Comerciales C1 a C6

```text
+-------+---------------+-----------------------+-------------------+-------------------------------+-----------------------+-------------------+
| NIVEL | NOMBRE        | OBJETIVO              | TIPO DE PROYECTO  | CONTROLES / CRITERIO GATE     | TIPO DE EVIDENCIA     | USO RECOMENDADO   |
+-------+---------------+-----------------------+-------------------+-------------------------------+-----------------------+-------------------+
| **C1**| Foundation    | Higiene base y veto   | Startups, MVPs,   | GB-01 a GB-04 activos.        | Native Probes         | Proyectos iniciales|
|       |               | de riesgos críticos   | sitios web simples| Score CQS >= 60.00            | (Static Scan)         | y repositorios CI |
+-------+---------------+-----------------------+-------------------+-------------------------------+-----------------------+-------------------+
| **C2**| Standard      | Estándar de entrega   | Apps comerciales, | C1 + Lockfiles bloqueados +   | Native Probes +       | Estándar para     |
|       |               | comercial general     | APIs y portales   | semántica web. Score >= 78.00 | Lighthouse Adapter    | releases a clientes
+-------+---------------+-----------------------+-------------------+-------------------------------+-----------------------+-------------------+
| **C3**| Professional  | Cobertura técnica     | SaaS, plataformas | C2 + Cobertura estructural    | Probes + Test Runners | Software en       |
|       |               | y rendimiento         | B2B y comercio    | extendida. Score >= 85.00     | + Métricas de Perf    | producción activa |
+-------+---------------+-----------------------+-------------------+-------------------------------+-----------------------+-------------------+
| **C4**| Advanced      | Rigor multicapa y     | Fintech, portales | C3 + Cero controles omitidos  | Probes + Ingestas     | Aplicaciones      |
|       |               | mantenibilidad        | transaccionales   | en dominios clave. >= 90.00   | externas multicapa    | críticas B2B      |
+-------+---------------+-----------------------+-------------------+-------------------------------+-----------------------+-------------------+
| **C5**| Enterprise    | Gobernanza estricta   | Banca, salud,     | C4 + Auditoría de resiliencia | Evidencia cruzada +   | Entornos regulados|
|       |               | y trazabilidad total  | infraestructura   | y sanitización. Score >= 95.00| Registro de auditoría | internamente      |
+-------+---------------+-----------------------+-------------------+-------------------------------+-----------------------+-------------------+
| **C6**| Ultimate      | Excelencia CQS total  | Software crítico  | 100% de los 65 controles CQS  | 100% Evidencia        | Benchmark de      |
|       |               | (Zero Omisiones)      | de misión cero    | ejecutados. Score = 100.00    | completa auditada     | máxima seguridad  |
+-------+---------------+-----------------------+-------------------+-------------------------------+-----------------------+-------------------+
```

---

## 5. Semántica del Release Certificate

* **Qué demuestra:** Que el repositorio en un commit y ruta específicos fue evaluado por Castle Gate v1.0.0 bajo una política formal (ej. C1 o C2) y que superó el umbral requerido sin Gate Breakers activos.
* **Integridad:** El certificado contiene un hash SHA-256 canónico del paquete de evidencia. Si el código, el score o los metadatos son alterados, `castle-gate verify-cert` rechaza el certificado inmediatamente (`Exit Code 1`).
* **Qué NO demuestra:** No es un certificado SOC 2 o ISO 27001, no garantiza la ausencia total de vulnerabilidades desconocidas y no sustituye auditorías humanas formales.

---

## 6. Perfiles de Clientes Objetivo

1. **Agencias de Software y Consultoras de Desarrollo:** Necesitan certificar ante sus clientes que el código entregado cumple con un estándar formal de calidad y seguridad antes de la firma de aceptación.
2. **Startups Tecnológicas y Empresas SaaS:** Buscan automatizar la gobernanza de despliegues en GitHub Actions/GitLab CI sin incurrir en costes de infraestructura pesada o fuga de privacidad.
3. **Equipos de DevOps y QA:** Requieren una puerta de control determinista que bloquee automáticamente compilaciones que contengan credenciales expuestas o fallas higiénicas graves.

---

## 7. Propuesta de Valor Diferenciada

* **Determinismo Absoluto:** Reglas claras y reproducibles basadas en una matriz ratificada; cero subjetividad en el release.
* **100% Privacidad y Soberanía:** Funciona completamente offline y en entornos air-gapped; ningún fragmento de código o token sale del entorno del cliente.
* **Zero Overhead de Infraestructura:** No requiere bases de datos dedicadas, servidores Java pesados ni suscripciones cloud obligatorias.
* **Trazabilidad Criptográfica:** Genera evidencia auditable que protege tanto al equipo de desarrollo como al cliente final.

---

## 8. Posicionamiento Competitivo

Castle Gate se posiciona como una **capa de gobernanza de release (Release Governance Gate)** que complementa las herramientas existentes:
* Coexiste con **linters y test runners** al consumir su resultado como evidencia.
* Coexiste con **SAST profundo (SonarQube) y SCA (Snyk)** actuando como el árbitro final de decisión en el pipeline.
* No compite en el espacio de certificaciones regulatorias organizacionales (**SOC 2 / ISO 27001**).

---

## 9. Ecosistema de Servicios Profesionales de Grupo Castillo

```text
+---------------------+---------------------------------------------------------------------------------+
| SERVICIO            | DESCRIPCIÓN Y ALCANCE PROFESIONAL                                               |
+---------------------+---------------------------------------------------------------------------------+
| **Castle Gate**     | Producto de software / CLI para gobernanza automatizada en pipelines.           |
| **Castle Checkup**  | Diagnóstico inicial puntual de un repositorio con informe CQS y recomendaciones.|
| **Castle Audit**    | Auditoría técnica exhaustiva combinando el Gate con revisión experta humana.    |
| **Castle Rescue**   | Servicio de ingeniería y remediación para llevar proyectos bloqueados a PASS.   |
| **Castle Emergency**| Intervención inmediata ante incidentes de fuga de credenciales o release fallido.|
| **Castle Care**     | Acompañamiento continuo y soporte mensual para la gobernanza de pipelines.      |
+---------------------+---------------------------------------------------------------------------------+
```

---

## 10. Hipótesis de Modelos de Precios (Pricing)

1. **Modelo A: Por Repositorio / Pipeline Anual (Suscripción de Licencia):**  
   Cobro por repositorio activo gobernado por el CLI con scans ilimitados y soporte técnico de Grupo Castillo.
2. **Modelo B: Por Paquete de Servicio + Licencia (Castle Checkup + Gate Anual):**  
   Cobro por diagnóstico inicial (Castle Checkup) con descuento acreditable si el cliente contrata la licencia anual de Castle Gate.
3. **Modelo C: Auditoría por Release / Certificación Puntual:**  
   Cobro por evento de release para agencias que entregan proyectos cerrados a clientes finales.

---

## 11. Criterios de Éxito para Pilotos Comerciales

* **Claridad del Diagnóstico:** El cliente entiende los hallazgos y el score CQS en menos de 10 minutos leyendo el reporte HTML.
* **Accionabilidad:** El equipo de desarrollo puede corregir los bloqueos detectados sin requerir soporte constante.
* **Adopción en CI/CD:** El pipeline de integración continua del cliente incorpora el Gate y bloquea despliegues defectuosos de forma reproducible.
* **Confianza en la Autorización:** El cliente valora la emisión del Release Certificate como garantía de calidad interna.

---

## 12. Límites y Anti-Claims Oficiales

```text
================================================================================
                     LÍMITES Y ANTI-CLAIMS OFICIALES
================================================================================
1. Castle Gate proporciona gobernanza determinista de releases basada en evidencia;
   NO es un firewall en tiempo de ejecución ni un antivirus.
2. Castle Native Probes son sensores estáticos de higiene y buenas prácticas;
   NO reemplazan motores de compilación profunda interprocedural (como SonarQube).
3. Castle Gate NO mantiene una base de datos global de CVEs (como Snyk).
4. La conformidad CQS es una metodología interna de Grupo Castillo, NO una
   certificación formal externa (como SOC 2 o ISO 27001).
================================================================================
```

---

## 13. Frontera del Roadmap v1.1+ (Roadmap Boundary)

* **v1.0.0 (Actual):** Motor offline congelado, Native Probes, CQS v1.1, Reportes HTML, Certificados SHA-256 locales, Integración CI/CD.
* **v1.1.0 (Roadmap):** Pre-procesador de comentarios en Probes nativos, firma asimétrica Ed25519 para certificados.
* **v1.2.0 (Roadmap):** Cloud Verification Registry para verificación pública y descentralizada de certificados emitida como servicio SaaS opcional.
