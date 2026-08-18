# Castle Security & Quality Gate — Customer Runbook (v1.0.0)
**Document ID:** `RUNBOOK-CUSTOMER-v1.0.0`  
**Classification:** Official External Operator & Developer Guide  
**Software Package:** `@grupo-castillo/castle-gate` (v1.0.0)  
**Methodology:** Castle Quality System (CQS v1.1 — FROZEN / SINGLE SOURCE OF TRUTH)  

---

## 1. Introducción

Bienvenido a **Castle Security & Quality Gate**, la herramienta de gobernanza y autorización determinista de entregas de software de Grupo Castillo.

### ¿Qué es Castle Gate?
Es un motor de evaluación técnica y decisión de release que opera directamente en su entorno local o pipeline de integración continua (CI/CD). Analiza su código fuente mediante **Castle Native Probes**, evalúa los hallazgos contra la metodología **CQS v1.1** y genera una decisión auditable:
* **`PASSED` (0):** Release autorizado. Cumple los estándares de calidad y seguridad de la política seleccionada. Se emite un **Release Certificate** sellado criptográficamente.
* **`BLOCKED` (1):** Release vetado. Se detectó una falla crítica no negociable (*Gate Breaker*), como una credencial expuesta.
* **`REQUIRES_REMEDIATION` (2):** Release retenido. El puntaje técnico es insuficiente o falta evidencia requerida.

### Lo que NO es Castle Gate (Límites Oficiales):
* **NO es una certificación externa** (no es SOC 2, ISO 27001 ni PCI-DSS).
* **NO garantiza seguridad absoluta** ni ausencia universal de vulnerabilidades.
* **NO sustituye a analizadores profundos de compilación AST (como SonarQube)** ni bases de datos dinámicas de CVEs (como Snyk).

---

## 2. Requisitos Previos

* **Entorno de Ejecución:** Node.js `>= 18.0.0` (LTS recomendado).
* **Sistemas Operativos Soportados:** Linux / POSIX, macOS, Windows 10/11.
* **Permisos:** Acceso de lectura al directorio del código fuente a evaluar y permisos de escritura en el directorio de salida (por defecto `./.castle`).
* **Conectividad:** **Ninguna.** Castle Gate opera **100% offline** y no realiza llamadas a internet.

---

## 3. Instalación e Invocación

Puede utilizar Castle Gate mediante cualquiera de las siguientes tres modalidades:

### Opción A: Ejecución directa sin instalación (Recomendada para CI/CD)
```bash
npx @grupo-castillo/castle-gate version
npx @grupo-castillo/castle-gate scan --dir . --level C1
```

### Opción B: Instalación local como dependencia de desarrollo
```bash
npm install --save-dev @grupo-castillo/castle-gate
npx castle-gate scan --dir . --level C1
```

### Opción C: Instalación global
```bash
npm install -g @grupo-castillo/castle-gate
castle-gate scan --dir . --level C1
```

---

## 4. Ejecución del Primer Scan

Para evaluar su proyecto bajo el nivel base de higiene (**C1 — Foundation**):

```bash
npx @grupo-castillo/castle-gate scan --dir ./src --level C1 --output-dir ./.castle
```

### ¿Qué analiza el comando?
1. **Seguridad Estática (SecurityProbe):** Busca claves privadas, tokens de API (AWS, Stripe, GitHub PAT), enlaces HTTP inseguros y cabeceras de seguridad.
2. **Semántica y Accesibilidad DOM (DomSemanticsProbe):** Verifica estructura HTML5 (`nav`, `main`, `h1`), meta viewport y atributos `alt` en imágenes.
3. **Mantenibilidad (MaintainabilityProbe):** Verifica consistencia en `package.json` y fijación de dependencias en lockfiles.

### Salidas Generadas (en `./.castle/`):
* `compliance-report.html`: Reporte visual interactivo autónomo (ábralo con cualquier navegador).
* `evidence-package.json`: Paquete de evidencia estructurada en formato canónico CQS v1.1.
* `release-certificate.json`: Certificado emitido **únicamente si la decisión fue `PASSED`**.

---

## 5. Cómo Interpretar el Resultado y Códigos de Salida

| Estado en Terminal | Exit Code | Significado | Acción del Desarrollador / CI/CD |
|:---:|:---:|---|---|
| **`PASSED`** | **`0`** | Cumplió el puntaje de la política y 0 Gate Breakers. | **Release Autorizado.** Proceder al despliegue. |
| **`BLOCKED`** | **`1`** | Veto crítico activo (ej. clave expuesta). | **Pipeline Detenido (HALT).** Corregir el hallazgo crítico de inmediato. |
| **`REQUIRES_REMEDIATION`** | **`2`** | Score insuficiente para el nivel solicitado. | **Release Retenido.** Revisar reporte HTML y corregir deficiencias. |
| **`CLI_ERROR`** | **`3`** | Argumento inválido o directorio inexistente. | Verificar sintaxis del comando. |

---

## 6. Ciclo de Remediación (Ejemplo: Credencial Expuesta)

```text
1. SCAN INICIAL:
   $ npx @grupo-castillo/castle-gate scan --dir . --level C1
   -> Salida: Exit Code 1 (BLOCKED)
   -> Detalle: [GB-01] Gate Breaker Triggered: 1 critical secret found (AWS Access Key).

2. CORRECCIÓN EN CÓDIGO:
   - Elimine la clave hardcodeada en el archivo señalado por el reporte.
   - Sustitúyala por una variable de entorno: process.env.AWS_KEY.

3. RE-SCAN:
   $ npx @grupo-castillo/castle-gate scan --dir . --level C1
   -> Salida: Exit Code 0 (PASSED)
   -> Release Certificate emitido en .castle/release-certificate.json
```

---

## 7. Verificación del Release Certificate

Para comprobar que un certificado es auténtico y que ni el score ni el código han sido alterados:

```bash
npx @grupo-castillo/castle-gate verify-cert --cert ./.castle/release-certificate.json
```
* **Certificado Válido:** Retorna `Exit Code 0` y muestra `[CERTIFICATE VALID]`.
* **Certificado Alterado:** Retorna `Exit Code 1` y muestra `[CERTIFICATE INVALID] Digest mismatch`.

---

## 8. Niveles de Política C1 a C6

* **C1 (Foundation):** Score CQS $\ge 60.00$ y 0 secretos críticos. Ideal para startups y sitios iniciales.
* **C2 (Standard):** Score CQS $\ge 78.00$, C1 satisfecho, lockfiles fijados y semántica DOM. Estándar para releases comerciales.
* **C3 (Professional):** Score CQS $\ge 85.00$ y cobertura técnica extendida.
* **C4 (Advanced):** Score CQS $\ge 90.00$ y cero omisiones en dominios críticos.
* **C5 (Enterprise):** Score CQS $\ge 95.00$ para entornos regulados.
* **C6 (Ultimate):** 100% de los 65 controles CQS ejecutados y aprobados (Score $= 100.00$).

---

## 9. Integración en Pipelines CI/CD

### GitHub Actions (`.github/workflows/castle-gate.yml`)
```yaml
name: "Castle Gate Governance"
on: [push, pull_request]

jobs:
  gate-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Run Gate Scan
        run: npx @grupo-castillo/castle-gate scan --dir . --level C1 --output-dir .castle
      - name: Upload Artifacts
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: castle-report
          path: .castle/
```

### GitLab CI (`.gitlab-ci.yml`)
```yaml
castle_gate_scan:
  image: node:20-alpine
  script:
    - npx @grupo-castillo/castle-gate scan --dir . --level C1 --output-dir .castle
  artifacts:
    when: always
    paths:
      - .castle/
```

---

## 10. Operación Offline y Privacidad

Castle Gate fue diseñado para entornos de máxima privacidad. El motor no envía telemetría, fragmentos de código ni metadatos a servidores externos. Todo el análisis se ejecuta localmente en memoria.

---

## 11. Tabla de Resolución de Problemas (Troubleshooting)

```text
+-----------------------+-------------------------------+-----------------------------------+-----------------------------------------------+
| SÍNTOMA               | CAUSA PROBABLE                | ACCIÓN RECOMENDADA                | RESULTADO ESPERADO                            |
+-----------------------+-------------------------------+-----------------------------------+-----------------------------------------------+
| Exit Code 1 (BLOCKED) | Gate Breaker activo (secreto) | Revise el reporte HTML y remueva  | El siguiente scan retorna Exit Code 0 (PASS). |
|                       | o enlace HTTP inseguro.       | credenciales hardcodeadas.        |                                               |
+-----------------------+-------------------------------+-----------------------------------+-----------------------------------------------+
| Exit Code 2           | Score CQS por debajo del      | Revise deficiencias en el reporte | Score sube al umbral requerido y pasa el Gate.|
| (REQUIRES_REMEDIATION)| umbral exigido por el nivel.  | HTML y aplique mejoras de código. |                                               |
+-----------------------+-------------------------------+-----------------------------------+-----------------------------------------------+
| Exit Code 3           | Nivel no válido o directorio  | Verifique que --level sea C1..C6  | El comando inicia el análisis normalmente.    |
| (CLI_ERROR)           | inexistente.                  | y que --dir apunte a una ruta real|                                               |
+-----------------------+-------------------------------+-----------------------------------+-----------------------------------------------+
| Certificado inválido  | El archivo JSON del           | No edite manualmente el archivo   | verify-cert valida exitosamente (Exit Code 0).|
| en verify-cert        | certificado fue modificado.   | release-certificate.json.         |                                               |
+-----------------------+-------------------------------+-----------------------------------+-----------------------------------------------+
```

---

## 12. Soporte Técnico y Servicios Profesionales

* **Auto-servicio:** Consulte este runbook y el reporte HTML generado en `.castle/compliance-report.html`.
* **Servicios de Asistencia Grupo Castillo:** Si requiere apoyo en remediación de código (*Castle Rescue*), diagnóstico previo (*Castle Checkup*) o auditoría experta (*Castle Audit*), contacte a su representante asignado.
* **Canal de Soporte Oficial:** `[CANAL DE SOPORTE OFICIAL PENDIENTE]`
