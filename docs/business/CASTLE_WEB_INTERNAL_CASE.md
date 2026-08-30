# Ficha Técnica de Caso Interno: Castle Web
## Referencia de Arquitectura e Implementación Insignia (Nivel Diamond)

> **DECLARACIÓN DE TRANSPARENCIA:**  
> *Este documento formaliza a Castle Web como el caso interno de referencia y "dogfooding" de Grupo Castillo. No representa a un cliente externo ni inventa métricas comerciales ficticias; constituye la evidencia viva de nuestra propia capacidad de ejecución técnica.*

---

### 1. INFORMACIÓN GENERAL DEL PROYECTO

| Parámetro | Detalle |
| :--- | :--- |
| **Nombre del Proyecto** | **Grupo Castillo — Castle Web** |
| **Tipo de Proyecto** | Plataforma Corporativa Insignia / Proyecto Interno de Referencia |
| **Nivel de Construcción Equivalente** | **Castle Diamond Build** (Arquitectura a Medida de Máxima Escala) |
| **Repositorio** | `https://github.com/pantojadiegooo/servicios-castillo.git` |
| **URL de Producción** | `https://grupocastillo.lat` |
| **Fecha de Liberación de Release** | Agosto 2026 |

---

### 2. ARQUITECTURA Y ESPECIFICACIÓN TÉCNICA

- **Framework Central:** Astro SSG (Static Site Generation) en Node 22+.
- **Volumen de Rutas:** 23 páginas estáticas pre-renderizadas en compilación (`dist/`).
- **Sistema de Estilos:** CSS Vanilla puro modularizado mediante tokens (`tokens.css`, `base.css`, `layout.css`, componentes BEM). 0 librerías de utilidad pesadas.
- **Motor Visual e Interactividad:** 7 componentes Canvas 2D/3D con ciclo de vida seguro (`requestAnimationFrame`, `cancelAnimationFrame`, `IntersectionObserver` y control de DPI $\le 2$).
- **Accesibilidad:** WCAG 2.1 Nivel AA verificado en el 100% de las rutas (landmarks semánticos, headings únicos, navegación por teclado y contraste AAA $\ge 7:1$).
- **Seguridad:** Cabeceras HTTP estrictas (`CSP`, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`), 0 dependencias con vulnerabilidades en `npm audit` y 0 secretos en el repositorio.

---

### 3. AUDITORÍA Y CERTIFICACIÓN CON CASTLE GATE (CQS v1.1)

Castle Web fue sometido a la evaluación estricta del runner *Castle Gate* con los siguientes resultados certificados:

```
┌────────────────────────────────────────────────────────────────────────┐
│  RESULTADO DE EVALUACIÓN CQS v1.1 — CASTLE WEB                         │
│                                                                        │
│  Validation ID Emitido:     CG-2026-68D04F                             │
│  Nivel de Política:         C4 (Advanced — Umbral 90.0%)               │
│  Target Release Commit SHA: 3d61237c0ff7bc7f7fbbd52e505aa6f2eb50be3c   │
│  Puntuación Compuesta:      100.00 / 100.00                            │
│  Estatus Final:             PASSED (Exit Code 0)                       │
│  Gate Breakers Activos:     0                                          │
│  Secretos Detectados:       0                                          │
│  Firma Digest SHA-256:      2b4d0fd4bd6a41f20059636c55a2e57cf83b24... │
└────────────────────────────────────────────────────────────────────────┘
```

---

### 4. ENTREGABLES Y ARTEFACTOS VINCULADOS

- **Certificado Firmado:** [`.castle/release-certificate.json`](file:///C:/Users/panto/Downloads/servicios-castillo/.castle/release-certificate.json)
- **Reporte Visual de Cumplimiento:** [`.castle/compliance-report.html`](file:///C:/Users/panto/Downloads/servicios-castillo/.castle/compliance-report.html)
- **Reporte Estructurado de Auditoría:** [`.castle/compliance-report.json`](file:///C:/Users/panto/Downloads/servicios-castillo/.castle/compliance-report.json)
- **Workflow de Integración Continua:** [`.github/workflows/castle-gate.yml`](file:///C:/Users/panto/Downloads/servicios-castillo/.github/workflows/castle-gate.yml)
