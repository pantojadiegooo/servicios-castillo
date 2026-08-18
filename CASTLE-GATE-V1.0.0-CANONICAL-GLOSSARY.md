# Castle Security & Quality Gate — Canonical Glossary (v1.0.0)
**Document ID:** `GLOSSARY-CANONICAL-v1.0.0`  
**Classification:** Official Lexicon & Terminology Standards  
**Methodology:** Castle Quality System (CQS v1.1 — FROZEN / SINGLE SOURCE OF TRUTH)  
**Software Package:** `@grupo-castillo/castle-gate` (v1.0.0)  

---

## 1. Términos Fundamentales de Arquitectura

* **CQS (Castle Quality System):**  
  Metodología matemática y taxonómica propietaria de Grupo Castillo para la evaluación de calidad y seguridad técnica de productos digitales. Estructura 65 controles atómicos en 7 dominios con una escala normalizada de 100.00 puntos.
* **Castle Gate:**  
  Plataforma de software y motor ejecutable (`@grupo-castillo/castle-gate`) que operacionaliza CQS v1.1, recolecta evidencias, aplica políticas de release y emite decisiones de despliegue.
* **Gate Level (Nivel de Puerta):**  
  Umbral de exigencia y rigor de gobernanza configurado para una evaluación. La progresión oficial va desde **C1 (Foundation)** hasta **C6 (Ultimate)**.

---

## 2. Niveles de Madurez de Política (C1 a C6)

* **C1 — Foundation:** Nivel básico de higiene técnica. Exige ausencia de credenciales expuestas (`GB-01`), transporte HTTPS y score CQS $\ge 60.00$.
* **C2 — Standard:** Nivel comercial estándar. Exige políticas de C1 más consistencia de lockfiles, estructura semántica HTML y score CQS $\ge 78.00$.
* **C3 — Professional:** Nivel profesional para plataformas activas. Exige cobertura técnica extendida, rendimiento y score CQS $\ge 85.00$.
* **C4 — Advanced:** Nivel avanzado para transacciones críticas. Exige evaluación multicapa, cero controles omitidos en dominios clave y score CQS $\ge 90.00$.
* **C5 — Enterprise:** Nivel empresarial para entornos regulados. Exige resiliencia, sanitización exhaustiva y score CQS $\ge 95.00$.
* **C6 — Ultimate:** Nivel máximo de excelencia. Exige la ejecución y aprobación del 100% de los 65 controles CQS sin omisiones (Score $= 100.00$).

---

## 3. Componentes de Gobernanza y Decisión

* **Gate Breaker:**  
  Regla de veto mandatoria no eludible (ej. `GB-01` ante fuga de credenciales o texto claro). Su activación bloquea inmediatamente el release sin importar el puntaje CQS obtenido.
* **Evidence (Evidencia):**  
  Conjunto de datos estructurados recolectados mediante inspección estática o adaptadores externos que acreditan el estado de cumplimiento de cada control CQS.
* **Assessment (Evaluación):**  
  Proceso algorítmico de verificación de evidencias contra los 65 controles y cálculo de puntuación.
* **Score (Puntuación CQS):**  
  Valor numérico continuo entre `0.00` y `100.00` resultante de la evaluación matemática de los controles ponderados.
* **Policy (Política de Gate):**  
  Conjunto de reglas ratificadas que define los umbrales mínimos de puntuación, los Gate Breakers activos y las tolerancias para un nivel específico.
* **Release Decision (Decisión de Release):**  
  Dictamen final generado por el motor de gobernanza que determina si el software está autorizado para su entrega.
* **Release Certificate (Certificado de Release):**  
  Documento JSON inmutable (`release-certificate.json`) sellado con un digest criptográfico SHA-256 que acredita formalmente la autorización de una versión específica.
* **Remediation (Remediación):**  
  Proceso de corrección de código y eliminación de deficiencias técnicas detectadas para alcanzar el cumplimiento de la política.

---

## 4. Estados Canónicos y Códigos de Salida POSIX

* **`PASSED` (Exit Code `0`):**  
  El proyecto cumplió satisfactoriamente la política de Gate y no tiene Gate Breakers activos. **Release Autorizado; el pipeline CI/CD continúa.**
* **`BLOCKED` (Exit Code `1`):**  
  Se detectó una violación crítica (Gate Breaker) o falla de seguridad fatal. **Release Vetado; el pipeline CI/CD se detiene inmediatamente (HALT).**
* **`REQUIRES_REMEDIATION` (Exit Code `2`):**  
  El puntaje CQS es insuficiente para el nivel solicitado o falta evidencia requerida. **Release Retenido; el pipeline espera corrección.**
* **`CLI_ERROR` (Exit Code `3`):**  
  Falla en la invocación del comando, ruta inexistente o error en el archivo de configuración. **Pipeline detenido por error de configuración.**
