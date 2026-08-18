# Castle Security & Quality Gate — Official Product Definition (v1.0.0)
**Document ID:** `PRODUCT-DEF-v1.0.0-COMMERCIAL`  
**Classification:** Grupo Castillo Commercial & Engineering Strategy  
**Methodology:** Castle Quality System (CQS v1.1 — FROZEN / SINGLE SOURCE OF TRUTH)  
**Software Package:** `@grupo-castillo/castle-gate` (v1.0.0)  

---

## 1. ¿Qué es Castle Security & Quality Gate?

**Castle Security & Quality Gate** es un motor determinista de evaluación técnica y gobernanza de entregas de software (*Release Governance Engine*). 

Permite a los equipos de desarrollo y organizaciones medir la calidad y seguridad técnica de sus productos digitales mediante la metodología propietaria **Castle Quality System (CQS v1.1)** y transformar dicha evaluación en una **decisión binaria y auditable de release** (`PASSED` vs. `BLOCKED` / `REQUIRES_REMEDIATION`) integrada directamente en su pipeline de CI/CD o ejecutada localmente.

---

## 2. ¿Qué problema resuelve?

1. **La brecha entre "el código compila y pasa tests unitarios" y "el software es apto para producción":**  
   Los pipelines tradicionales verifican que la funcionalidad específica programada no falle, pero pasan por alto higiene básica de seguridad (credenciales expuestas, enlaces no cifrados, ausencia de políticas de encabezados), accesibilidad semántica y mantenibilidad estructural.
2. **Falta de gobernanza determinista en releases:**  
   Las decisiones de entrega suelen ser subjetivas o dispersas entre múltiples herramientas desconectadas. Castle Gate centraliza la política de release bajo una matriz formal de niveles C1 a C6 con reglas de veto (*Gate Breakers*) no eludibles.
3. **Ausencia de trazabilidad y evidencia de entrega:**  
   Castle Gate genera automáticamente un paquete de evidencia sellado criptográficamente y un **Release Certificate** inmutable que acredita qué versión, qué commit y qué política fue evaluada antes del despliegue.

---

## 3. ¿Quién lo necesita? (Perfil del Cliente)

* **Empresas de Desarrollo y Startups:** Que necesitan asegurar estándares consistentes de calidad y seguridad antes de entregar software a clientes o pasar a producción.
* **Equipos de Ingeniería y DevOps:** Que buscan una puerta de control automatizada, sin dependencias externas complejas ni envío de código a la nube de terceros.
* **Organizaciones que Entregan Software a Terceros:** Que requieren emitir certificados de entrega técnicos y auditables para sus clientes o departamentos de auditoría interna.

---

## 4. ¿Qué recibe el cliente?

1. **El Motor CLI `@grupo-castillo/castle-gate`:** Un ejecutable sin dependencias runtime externas (`dependencies: {}`), capaz de operar 100% offline y en entornos air-gapped.
2. **Castle Native Probes:** Sensores estáticos locales para análisis de seguridad higiénica, semántica HTML/DOM e integridad de empaquetado.
3. **Motor de Decisión C1→C6:** Evaluador de políticas ratificadas con control de Gate Breakers.
4. **Reporte HTML Interactivo:** Archivo `.castle/compliance-report.html` autónomo, visual y sin dependencias de red.
5. **Release Certificate:** Archivo `.castle/release-certificate.json` sellado mediante digest SHA-256 canónico, verificable mediante `castle-gate verify-cert`.
6. **Acción GitHub Actions / Script GitLab CI:** Integración lista para el pipeline de integración continua.

---

## 5. ¿Cómo funciona el flujo de trabajo?

$$\text{CÓDIGO LOCAL} \xrightarrow{\text{Native Probes}} \text{EVIDENCE PACKAGE} \xrightarrow{\text{CQS v1.1}} \text{CQS SCORE} \xrightarrow{\text{POLICY C1..C6}} \text{GATE DECISION} \xrightarrow{\text{AUTHORIZER}} \begin{cases} \text{PASSED (0) } \implies \text{Certificado} \\ \text{BLOCKED (1) } \implies \text{Veto} \\ \text{REMEDIATION (2) } \implies \text{Espera} \end{cases}$$

---

## 6. Diferencia Fundamental entre CQS y Castle Gate

* **CQS (Castle Quality System v1.1):** Es la **metodología matemática y taxonómica** de evaluación. Define los 65 controles, 7 dominios, matriz de pesos (100.00 puntos nominales) y reglas de scoring formal. Es la *Single Source of Truth* metodológica.
* **Castle Gate:** Es el **software de gobernanza y producto ejecutable** que operacionaliza CQS. Recolecta evidencia mediante probes, ejecuta el motor de evaluación, aplica las políticas C1→C6, toma la decisión de release y emite o retiene certificados.

---

## 7. ¿Qué significan los Niveles C1 a C6?

La progresión C1→C6 representa niveles incrementales de rigor, alcance y requisitos de evidencia para autorizar un release:

* **C1 — Foundation:** Higiene esencial, ausencia de credenciales expuestas, transporte HTTPS, semántica base y control de errores.
* **C2 — Standard:** Estándar para aplicaciones web y APIs comerciales con verificación de empaquetado y dependencias fijadas.
* **C3 — Professional:** Incluye pruebas de rendimiento preliminares y cobertura estructural más estricta.
* **C4 — Advanced:** Evaluación multicapa con evidencia extendida de mantenibilidad y arquitectura.
* **C5 — Enterprise:** Exige evidencia cruzada de resiliencia, sanitización exhaustiva y cumplimiento normativo interno.
* **C6 — Ultimate:** Requiere ejecución y aprobación del 100% de los 65 controles CQS sin controles omitidos o sin evaluar.

---

## 8. ¿Qué significan las Decisiones y Exit Codes?

| Decisión | Exit Code | Significado Operativo | Acción en CI/CD |
|:---:|:---:|---|---|
| **`PASSED`** | **`0`** | El proyecto cumple o supera el puntaje de la política y no tiene Gate Breakers activos. | **Pipeline continúa.** Se emite Release Certificate. |
| **`BLOCKED`** | **`1`** | Se detectó una infracción crítica (Gate Breaker) o falla de seguridad fatal. | **Pipeline HALT.** Release vetado inmediatamente. |
| **`REQUIRES_REMEDIATION`** | **`2`** | El puntaje es insuficiente o falta evidencia requerida por el nivel. | **Pipeline RETENIDO.** Requiere corrección y re-escaneo. |
| **`CLI_ERROR`** | **`3`** | Parámetros inválidos, rutas inexistentes o error de configuración. | **Pipeline ERROR.** Falla por configuración. |

---

## 9. ¿Qué demuestra y qué NO demuestra el Release Certificate?

### Lo que SÍ Demuestra:
* Que el código fuente en un commit y ruta específicos fue escaneado por Castle Gate v1.0.0.
* Que se aplicó una política formal (ej. C1 o C2) ratificada.
* Que el score CQS y la evaluación de Gate Breakers autorizaron el release bajo dicha política.
* Que el contenido de la evidencia no ha sido alterado tras la emisión (verificado por SHA-256).

### Lo que NO Demuestra (Anti-Claims Oficiales):
* **NO es una certificación SOC 2, ISO 27001 o PCI-DSS.**
* **NO garantiza la ausencia absoluta de vulnerabilidades** o bugs lógicos complejos.
* **NO sustituye una auditoría de seguridad formal humana** ni un pentesting especializado.
* **NO sustituye analizadores profundos de flujo de datos interprocedural (como SonarQube)** ni bases de datos de CVEs en tiempo real (como Snyk).

---

## 10. ¿Qué NO hace Castle Gate? (Límites Técnicos Explícitos)

1. **NO es un antivirus ni un Web Application Firewall (WAF):** Opera en tiempo de construcción/integración (*build-time*), no en runtime.
2. **NO ejecuta análisis dinámico de penetración (DAST) automatizado en tiempo real.**
3. **NO recopila telemetría ni envía datos a la nube:** Es una herramienta 100% local y soberana para el cliente.
