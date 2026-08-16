# Protocolo y Especificación Técnica de la Marca de Validación
## Castle Security & Quality Gate — CQS v1.1

**Versión del documento:** 1.0.0  
**Fecha de emisión:** Agosto 2026  
**Autor:** Dirección de Ingeniería & Gobernanza Digital — Grupo Castillo  
**Estado:** Documento de Especificación Técnica & Borrador Contractual  

---

### 1. Definición y Principio Fundamental

La **Marca de Validación Castle Gate** es un distintivo técnico emitido exclusivamente como **evidencia determinista** de que una versión específica de software (*release*) fue evaluada y autorizada conforme a los controles del marco **CQS v1.1 (Castle Quality Standard)** mediante el motor *Castle Security & Quality Gate*.

```
┌────────────────────────────────────────────────────────────────────────┐
│  PRODUCTO = Propiedad 100% exclusiva del cliente                      │
│  PROCESO  = Evaluación determinista de pipeline (Castle Gate)          │
│  SELLO    = Evidencia verificable de que el proceso fue ejecutado      │
└────────────────────────────────────────────────────────────────────────┘
```

#### 1.1 Declaraciones Fundamentales de Alcance
1. **Titularidad del Software:** La incorporación de la marca de validación **NO transfiere, cede ni reclama propiedad intelectual o comercial** sobre el código fuente, diseño, bases de datos, dominio, infraestructura o cuentas del cliente. El producto continúa perteneciendo 100% al cliente.
2. **Naturaleza del Control:** La marca certifica que en el instante de la evaluación local en runner (CI/CD o pre-release), el código fuente auditado cumplió con los umbrales nominales de la política contratada (C1 a C6) con `Exit Code 0` y cero secretos expuestos.
3. **No Invulnerabilidad:** La marca **NO constituye una garantía de invulnerabilidad absoluta** ni sustituye las buenas prácticas operativas de infraestructura en caliente.
4. **Distinción con Certificaciones Externas:** La marca identifica un control técnico determinista de calidad de ingeniería; **NO es una certificación regulatoria de terceros** (e.g. ISO/IEC 27001, SOC 2 Type II o autorizaciones gubernamentales).

---

### 2. Regla Absoluta de Veracidad y Cero Falsificación

* **Condición de Existencia:** La marca SOLO puede ser asignada a releases donde exista un registro de ejecución comprobable del motor *Castle Gate*.
* **Prohibición de Emisión Arbitraria:** Ningún proyecto puede portar la marca únicamente por haber sido desarrollado por Grupo Castillo o por conveniencia comercial; debe existir el artefacto criptográfico (`compliance-report.json` / SHA-256) generado por el motor.
* **Tolerancia Cero:** Queda estrictamente prohibido alterar estados `FAIL` o simular ejecuciones en proyectos que no hayan superado el pipeline nominal.

---

### 3. Taxonomía del Identificador de Validación

Cada validación se asocia a un registro estructurado con el siguiente formato unívoco:

$$\text{Identificador} = \mathbf{CG\text{-}YYYY\text{-}XXXXXX}$$

* **`CG`**: Prefijo fijo de *Castle Gate*.
* **`YYYY`**: Año de emisión del release (ej. `2026`).
* **`XXXXXX`**: Código alfanumérico secuencial o hash truncado del release.

#### 3.1 Estructura de Metadatos del Registro (Sin Datos Sensibles)
El registro técnico contiene exclusivamente información segura para verificación pública:

```json
{
  "validation_id": "CG-2026-0001",
  "protocol": "CQS_v1.1",
  "policy_level": "C3_PROFESSIONAL",
  "target_release_sha": "54e0a5aa1fb579acf1137e0b29dbc1973b5ab724",
  "evaluation_timestamp_utc": "2026-08-16T10:00:00Z",
  "exit_code": 0,
  "status": "PASS",
  "secrets_detected": 0,
  "nominal_score": 92.50,
  "ownership": "CLIENT_EXCLUSIVE"
}
```

*Nota de Privacidad y Seguridad:* El registro público **NUNCA** incluye código fuente, variables de entorno, llaves API, topología interna de servidores ni datos personales del cliente sin consentimiento explícito.

---

### 4. Textos Oficiales y Variantes del Sello

El sello utiliza una redacción sobria y técnica.

#### 4.1 Textos Permitidos
* Línea principal: `"Validado por Castle Security & Quality Gate"`
* Línea secundaria: `"CQS v1.1"` o `"CQS v1.1 • Release PASS"` o `"Release validado — Castle Gate (CQS v1.1)"`

#### 4.2 Expresiones Prohibidas
Queda terminantemente prohibido el uso de términos engañosos:
* ❌ `"100% Seguro"`
* ❌ `"Software Invulnerable"`
* ❌ `"Garantía Absoluta contra Ataques"`
* ❌ `"Certificado Oficial del Estado / Terceros"`
* ❌ `"Auditado por Grupo Castillo como Seguro para Siempre"`

---

### 5. Destino de Interacción (Función del Enlace)

El sello debe ser interactivo (`<a>`) y dirigir a la **página explicativa oficial**:
* URL canónica: `https://servicios-castillo.vercel.app/castle-gate.html#validacion`
* **Carácter estrictamente informativo:** La página destino tiene por función educar al usuario sobre los 65 controles CQS, los límites del protocolo y la verificación de releases. No funciona como embudo agresivo ni checkout forzado.

---

### 6. Criterios de Implementación y Retiro en Productos

1. **Ubicación Recomendada:**
   * Pie de página (*footer*) de la aplicación web o dashboard.
   * Documentación técnica del repositorio (`README.md`).
   * Notas de versión (*Release Notes* / *Changelog*).
   * Panel de administración interno o página `/acerca-de`.
2. **Voluntariedad:** El cliente tiene plena libertad de exhibir u omitir la marca pública en sus interfaces visuales según su criterio corporativo.
3. **Condiciones de Retiro Obligatorio:**
   * Si el código fuente del proyecto sufre modificaciones posteriores sustanciales que no hayan sido validadas por el pipeline de Castle Gate.
   * Si una ejecución posterior del motor arroja `Exit Code 1` (Gate Breaker) y no es remediada.
   * Si expira o se da por concluido el acuerdo de gobernanza continua sin validación en releases subsecuentes.

---

### 7. Borrador de Cláusula Contractual (Para Revisión Legal)

*El siguiente texto constituye una propuesta técnica no vinculante diseñada para ser incorporada a los contratos de desarrollo y licencias de software de Grupo Castillo previa revisión por el equipo jurídico del cliente y de la firma:*

> **CLÁUSULA [___] — MARCA TÉCNICA DE VALIDACIÓN (CASTLE GATE).**  
> **1. Alcance:** "GRUPO CASTILLO" podrá emitir una Marca Técnica de Validación identificada bajo el protocolo *Castle Security & Quality Gate (CQS v1.1)* al "CLIENTE" para aquellos releases de software que hayan completado satisfactoriamente los controles estáticos de seguridad, calidad de código y rendimiento evaluados por el motor en memoria de runner.  
> **2. Propiedad:** La inclusión o visualización de dicha marca no otorgará a "GRUPO CASTILLO" ningún derecho de propiedad, explotación, licencia o injerencia sobre el código fuente, activos digitales o datos del "CLIENTE", los cuales permanecerán bajo la titularidad exclusiva del "CLIENTE".  
> **3. Límites de Responsabilidad:** Las partes reconocen que la validación técnica certifica el estado del software al momento preciso de su compilación y no representa una garantía de invulnerabilidad absoluta ni exime al "CLIENTE" de mantener prácticas seguras de administración en sus servidores e infraestructura.  
> **4. Uso y Retiro:** La exhibición de la marca en las interfaces del software será potestativa para el "CLIENTE". En caso de que el software sea alterado por terceros sin validación previa mediante *Castle Gate*, el "CLIENTE" se compromete a retirar la marca del release no auditado.
