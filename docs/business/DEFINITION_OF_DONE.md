# Criterio de Finalización Técnica (Definition of Done - DoD)
## Estándar de Calidad de Ingeniería — Grupo Castillo

**Versión:** 1.1.0  
**Ámbito de Aplicación:** Todos los proyectos construidos y entregados por Grupo Castillo (Paquetes Build y Servicios Profesionales).

---

### 1. PRINCIPIO FUNDAMENTAL

Un proyecto o incremento de software desarrollado por Grupo Castillo **SOLO** se considera **TERMINADO** cuando satisface el 100% de los criterios estipulados en esta matriz y genera evidencia verificable. Ningún proyecto se entrega con errores de compilación, secretos expuestos ni enlaces rotos.

```
┌────────────────────────────────────────────────────────────────────────┐
│  REQUISITOS FUNCIONALES + CALIDAD + A11Y + SEGURIDAD + CASTLE GATE     │
│                                  │                                     │
│                                  ▼                                     │
│                [ DEFINITION OF DONE = SATISFECHA ]                     │
│                                  │                                     │
│                                  ▼                                     │
│                     RELEASE AUTORIZADO PARA HANDOFF                    │
└────────────────────────────────────────────────────────────────────────┘
```

---

### 2. MATRIZ DE CRITERIOS DE FINALIZACIÓN

#### 2.1 Dominio 1: Integridad Funcional y Navegación
- [ ] **Rutas Activas:** Todas las rutas definidas en el SOW compilan a páginas estáticas y devuelven `HTTP 200 OK`.
- [ ] **Cero Enlaces Rotos:** 100% de los hipervínculos internos (`<a>`, botones, menús, breadcrumbs, footer) dirigen a recursos existentes comprobados mediante script automatizado de auditoría de enlaces.
- [ ] **Formularios Validados:** Todos los formularios cuentan con validación en cliente de campos requeridos, validación de formato de correo, protección antispam básica (*honey-pot* o reCAPTCHA), estados de carga (`loading`), mensaje de éxito y mensaje de error accesible.
- [ ] **Diseño Responsivo Fluido:** Verificado sin desbordamientos horizontales en 4 anchos estándar:
  - Móvil: 375px / 390px
  - Tablet: 768px / 820px
  - Laptop: 1280px / 1440px
  - Pantalla ancha: 1920px

#### 2.2 Dominio 2: Calidad de Código y Compilación
- [ ] **Typecheck / Linting:** `astro check` o `tsc --noEmit` finaliza con **0 errores** y **0 warnings**.
- [ ] **Compilación SSG Limpia:** `astro build` genera la totalidad de las páginas estáticas en `dist/` en tiempo de compilación sin excepciones no controladas.
- [ ] **Higiene de Producción:** Cero llamadas activas a `debugger;` o `console.log` residuales en componentes finales.
- [ ] **Modularidad CSS:** Estilos organizados mediante tokens CSS y metodología estructurada sin reglas ad-hoc duplicadas.

#### 2.3 Dominio 3: Accesibilidad Web (WCAG 2.1 Nivel AA)
- [ ] **Landmarks Semánticos:** Todas las páginas contienen etiquetas `<header>`, `<nav>`, `<main>` y `<footer>`.
- [ ] **Jerarquía de Encabezados:** Cada página cuenta con exactamente un único encabezado principal `<h1>` seguido por una estructura jerárquica coherente (`<h2>`, `<h3>`).
- [ ] **Textos Alternativos:** 100% de las imágenes informativas incluyen atributo `alt` descriptivo; imágenes decorativas incluyen `aria-hidden="true"`.
- [ ] **Accesibilidad por Teclado:** Enlace de salto (*skip-link*) funcional al inicio del documento e indicadores de foco (`:focus-visible`) claramente perceptibles en todos los controles interactivos.
- [ ] **Contraste de Color:** Ratios de contraste de texto contra fondo verificados $\ge 4.5:1$ para texto normal y $\ge 3.0:1$ para texto grande (cumplimiento WCAG AAA $\ge 7:1$ en paleta core).
- [ ] **Preferencias de Movimiento:** Todas las animaciones complejas respetan la directiva CSS `@media (prefers-reduced-motion: reduce)`.

#### 2.4 Dominio 4: Seguridad y Protección de Secretos (Gate Breakers)
- [ ] **Cero Secretos Expuestos:** Escaneo completo del árbol con *Castle Gate DOM-01* confirmando ausencia de llaves privadas, tokens de API, credenciales AWS/GitHub/Stripe o cadenas de conexión con contraseña en texto plano.
- [ ] **Auditoría de Dependencias:** `npm audit` reporta **0 vulnerabilidades críticas** y **0 vulnerabilidades altas**.
- [ ] **Lockfile Íntegro:** Presencia y sincronización exacta de `package-lock.json` o equivalente.
- [ ] **Cabeceras de Seguridad HTTP:** Archivo `vercel.json` o configuración de servidor con cabeceras activas:
  - `Content-Security-Policy`
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`

#### 2.5 Dominio 5: Rendimiento Web y Core Web Vitals
- [ ] **Presupuesto de Bundle:** Total de JavaScript cliente inicial inferior al presupuesto acordado (< 300KB).
- [ ] **Meta Viewport:** Etiqueta `<meta name="viewport" content="width=device-width, initial-scale=1.0">` presente en todos los layouts.
- [ ] **Ciclo de Vida Seguro en Canvas:** Todo componente Canvas interactivo implementa cancelación explícita del bucle de animación con `cancelAnimationFrame`, desconexión mediante `IntersectionObserver` y límite de `devicePixelRatio <= 2` para prevenir fugas de memoria.

#### 2.6 Dominio 6: SEO, Metadatos y Gobernanza
- [ ] **Etiquetas Canónicas:** Cada página declara su URL canónica absoluta `<link rel="canonical" href="...">`.
- [ ] **Metadatos OpenGraph:** Metadatos `og:title`, `og:description`, `og:url` y `og:image` configurados unívocamente.
- [ ] **Sitemap y Robots:** Archivos `public/sitemap.xml` y `public/robots.txt` presentes y validados.
- [ ] **Página 404:** Manejador de error personalizado `404.html` funcional con enlace de retorno a la página principal.

#### 2.7 Dominio 7: Protocolo Castle Gate (CQS v1.1)
- [ ] **Ejecución del Runner:** `node bin/castle-gate.js scan --dir . --level [Nivel]` finaliza con **Exit Code 0 (PASS)**.
- [ ] **Score Nominal:** Puntuación compuesta $\ge$ al umbral de la política contratada.
- [ ] **Cero Gate Breakers:** 0 infracciones críticas activas.
- [ ] **Artefactos Emitidos:**
  - `.castle/release-certificate.json` (Firmado con SHA-256).
  - `.castle/compliance-report.html` (Reporte visual de cumplimiento).
  - `.castle/compliance-report.json` (Reporte estructurado de auditoría).

---

### 3. VERIFICACIÓN Y FIRMA TÉCNICA

El Líder de Calidad y el Ingeniero Principal firman la satisfacción de esta DoD previa a la entrega al Cliente:

```
Release Commit SHA: ____________________________________________________
Validation ID:      CG-2026-____________________________________________
Puntuación CQS:     ________ / 100.00
Fecha de Validación: ____________________
```
