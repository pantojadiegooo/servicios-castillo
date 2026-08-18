# Statement of Work (SOW) — Piloto Comercial Castle Gate (v1.0.0)
**Documento ID:** `SOW-PILOTO-[CLIENTE]-v1.0.0`  
**Estado:** `[REQUIERE VALIDACIÓN LEGAL FORMAL]`  

---

## 1. Objeto del Acuerdo
El presente Statement of Work define los términos y condiciones técnicas bajo los cuales **Grupo Castillo** ejecutará un **Piloto Comercial Controlado de Castle Security & Quality Gate v1.0.0** sobre el repositorio **[Nombre del Proyecto]** de **[Nombre del Cliente]**.

---

## 2. Alcance y Especificaciones Técnicas
1. **Nivel de Gate Acordado:** [Nivel C1 — Foundation / Nivel C2 — Standard].
2. **Duración:** 10 días hábiles a partir de la firma y entrega de accesos.
3. **Actividades de Grupo Castillo:**
   * Instalación y ejecución del escaneo baseline con el motor `@grupo-castillo/castle-gate` (v1.0.0).
   * Análisis conjunto de hallazgos y entrega del reporte visual `.castle/compliance-report.html`.
   * Asistencia técnica en la remediación de Gate Breakers.
   * Ejecución de re-scan determinista hasta alcanzar `Exit Code 0 (PASSED)`.
   * Emisión y validación del `release-certificate.json` sellado con SHA-256.
   * Configuración de la integración continua en GitHub Actions o GitLab CI.

---

## 3. Confidencialidad y Propiedad Intelectual
* El análisis se ejecuta 100% en local/offline en la infraestructura del cliente. Grupo Castillo no retiene código fuente ni credenciales del cliente.
* El cliente conserva la propiedad de su software. Grupo Castillo conserva los derechos exclusivos del software Castle Gate y de la metodología CQS v1.1.

---

## 4. Firmas de Conformidad
Por Grupo Castillo: __________________________  
Por el Cliente: __________________________ Fecha: [YYYY-MM-DD]
