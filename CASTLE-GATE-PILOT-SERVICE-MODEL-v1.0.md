# Castle Security & Quality Gate — Pilot Service Model Specification (v1.0.0)
**Document ID:** `SERVICE-MODEL-PILOT-v1.0.0`  
**Classification:** Grupo Castillo Commercial Operations & Service Blueprint  
**Methodology:** Castle Quality System (CQS v1.1 — FROZEN / SINGLE SOURCE OF TRUTH)  
**Product Package:** `@grupo-castillo/castle-gate` (v1.0.0)  

---

## 1. Definición Formal del Servicio Piloto

El **Piloto Comercial de Castle Gate** es un servicio profesional de consultoría técnica y adopción de tecnología de duración acotada, donde Grupo Castillo implementa, configura y acompaña al cliente en la evaluación y gobernanza de entregas de software sobre repositorios reales utilizando el motor **`@grupo-castillo/castle-gate` (v1.0.0)** bajo la metodología **CQS v1.1**.

---

## 2. ¿Qué compra y qué recibe el cliente?

* **Qué compra el cliente:**  
  Un servicio de evaluación inicial, diagnóstico higiénico y acompañamiento para la adopción de una política determinista de release (Nivel C1 o C2).
* **Qué recibe el cliente:**  
  1. Licencia de uso del paquete `@grupo-castillo/castle-gate` (v1.0.0) para el repositorio piloto.
  2. Reporte de diagnóstico baseline interactivo (`.castle/compliance-report.html`).
  3. Sesión técnica de interpretación de hallazgos y guía de remediación.
  4. Configuración de la acción de CI/CD (GitHub Actions o GitLab CI).
  5. Emisión y verificación del **Release Certificate** (`.castle/release-certificate.json`).
  6. Documento formal de cierre: *Pilot Closure Report*.

---

## 3. Asignación de Roles y Responsabilidades

```text
+---------------------------------------------------+---------------------------------------------------+
| RESPONSABILIDADES DE GRUPO CASTILLO               | RESPONSABILIDADES DEL CLIENTE                     |
+---------------------------------------------------+---------------------------------------------------+
| • Entregar el paquete distribuible y documentación.| • Designar un líder técnico / DevOps de contacto. |
| • Conducir la sesión de instalación y baseline.   | • Proporcionar acceso de lectura al repositorio.  |
| • Explicar los hallazgos y el score CQS v1.1.     | • Ejecutar las remediaciones de código requeridas.|
| • Asistir en la configuración de CI/CD.           | • Disponer de un entorno Node.js >= 18.0.0.       |
| • Validar y sellar el Release Certificate final.  | • Evaluar la experiencia y completar el feedback. |
| • Emitir el informe de cierre del piloto.         | • Decidir la adopción comercial posterior.        |
+---------------------------------------------------+---------------------------------------------------+
```

---

## 4. Alcance y Límites del Piloto

### Dentro de Alcance:
* Evaluación de **1 repositorio de código fuente** (JavaScript, TypeScript, HTML5, Node.js).
* Aplicación de política de Gate **Nivel C1 (Foundation)** o **Nivel C2 (Standard)**.
* Hasta 3 ciclos completos de escaneo (Baseline $\to$ Re-scan post-remediación $\to$ Validación final).
* Duración recomendada: **1 a 2 semanas calendario** (máximo 10 días hábiles).

### Fuera de Alcance:
* Reescritura completa de la arquitectura del cliente por parte de Grupo Castillo.
* Auditorías de infraestructura cloud, redes perimetrales o servidores físicos.
* Pruebas de penetración (pentesting) manuales o dinámicas en vivo (DAST).
* Emisión de certificaciones formales de terceros (SOC 2, ISO 27001, PCI-DSS).

---

## 5. Gestión de Decisiones y Estados de Release

* **Ante Estado `BLOCKED` (Exit Code 1):**  
  Se suspende la autorización de release. Grupo Castillo señala el Gate Breaker activo (ej. clave AWS expuesta `GB-01`), el cliente elimina la credencial del código fuente y se ejecuta un re-scan inmediato.
* **Ante Estado `REQUIRES_REMEDIATION` (Exit Code 2):**  
  El score CQS no alcanza el umbral de la política (ej. $< 78.00$ en C2). Se revisan las deficiencias semánticas o de dependencias en el reporte HTML para guiar la corrección.
* **Ante Estado `PASSED` (Exit Code 0):**  
  El motor autoriza formalmente el release, emite el `release-certificate.json` sellado con digest SHA-256 y el pipeline de CI/CD procede sin interrupciones.

---

## 6. Cierre del Piloto y Próximos Pasos

El piloto concluye formalmente con la entrega del *Pilot Closure Report*, donde se documenta la evolución del score antes y después de la remediación, el certificado emitido y la propuesta para adopción continua o upgrade a servicios avanzados (*Castle Care* o *Castle Audit*).
