# Castle Security & Quality Gate — Technical Datasheet (v1.0.0)
**Package:** `@grupo-castillo/castle-gate` (v1.0.0)  
**Standard:** Castle Quality System (CQS v1.1 — Frozen)  
**Classification:** Technical Architecture & Specifications  

---

## 1. Ficha Técnica del Producto

* **Runtime:** Node.js `>= 18.0.0` (LTS soportado).
* **Dependencias Externas de Runtime:** **`dependencies: {}` (Cero dependencias externas).**
* **Conectividad:** **100% Offline / Air-Gapped.** No realiza llamadas de red ni telemetría.
* **Tiempo de Ejecución:** Escaneo y evaluación en memoria en **$< 500\text{ ms}$** para repositorios estándar.
* **Arquitectura de Sensores (Castle Native Probes):**
  * `SecurityProbe`: Escaneo de patrones de claves privadas, tokens AWS/Stripe/GitHub y enlaces HTTP.
  * `DomSemanticsProbe`: Verificación de estructura semántica HTML5, viewport y accesibilidad básica.
  * `MaintainabilityProbe`: Consistencia de dependencias, scripts de package.json y fijación de lockfiles.

---

## 2. Códigos de Salida Canónicos (Exit Codes)

```text
+-----------+-----------------------+---------------------------------------------------------------+
| EXIT CODE | ESTADO EN TERMINAL    | COMPORTAMIENTO EN EL PIPELINE DE CI/CD                        |
+-----------+-----------------------+---------------------------------------------------------------+
| **`0`**   | **`PASSED`**          | **Release Autorizado.** Emisión de Release Certificate JSON.  |
| **`1`**   | **`BLOCKED`**         | **Release Vetado (HALT).** Gate Breaker activo (secreto/HTTP).|
| **`2`**   | **`REQUIRES_REMED.`** | **Release Retenido.** Score CQS por debajo del umbral del Nivel.|
| **`3`**   | **`CLI_ERROR`**       | **Error de Sintaxis.** Argumento inválido o ruta inexistente. |
+-----------+-----------------------+---------------------------------------------------------------+
```

---

## 3. Integración Rápida en GitHub Actions

```yaml
- name: "Castle Gate Security & Quality Check"
  run: npx @grupo-castillo/castle-gate scan --dir . --level C1 --output-dir .castle
```
