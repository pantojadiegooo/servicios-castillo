# Servicios Castillo — Plataforma Digital

Unidad de soluciones digitales de **Grupo Castillo**. Plataforma web estática construida sobre **Astro**, diseñada bajo el **Castillo Security & Quality Gate**.

- **Producción**: [https://grupocastillo.lat/](https://grupocastillo.lat/)
- **Repositorio**: [https://github.com/pantojadiegooo/servicios-castillo](https://github.com/pantojadiegooo/servicios-castillo)

---

## 🛠️ Arquitectura Técnica

* **Framework**: Astro v7.2 (Compilación estática en `dist/`)
* **Formato de Rutas**: `build.format: 'file'` (Preserva URLs nativas `.html`)
* **Estilos**: Vanilla CSS modularizado en `src/styles/` (`tokens.css`, `reset.css`, `layout.css`, `hero.css`, `components/*.css`)
* **JavaScript**: Nativo en `public/assets/js/main.js` (Menú accesible y preselección dinámica de opciones por query params `?paquete=` / `?necesidad=`)
* **Iconografía & Assets**: Favicon SVG, PNG (32px), Apple Touch Icon (180px) y Open Graph Banner (1200x630)

---

## 🚀 Comandos del Proyecto

Todos los comandos se ejecutan desde la raíz del proyecto:

| Comando | Acción |
| :--- | :--- |
| `npm run dev` | Inicia el servidor local de desarrollo en `http://localhost:4321` |
| `npm run build` | Compila el sitio estático de producción en `./dist/` (13 rutas `.html` incluyendo `404.html`) |
| `npm run preview` | Previsualiza localmente el sitio compilado en `dist/` |
| `npm run check` | Ejecuta la verificación de tipos e integridad de Astro (`astro check`) |

---

## 📬 Formulario de Contacto

El formulario de `/contacto.html` transmite las solicitudes mediante envío **HTML nativo (POST directo)** a Formspree:

- **Método**: `POST`
- **Action**: `https://formspree.io/f/maewolbo`
- **Campos**: Transmite 7 parámetros mediante atributos `name` (`nombre`, `email`, `whatsapp`, `necesidad`, `presupuesto`, `plazo`, `descripcion`).
- **Resiliencia**: Funciona con y sin JavaScript activo en el cliente. No requiere scripts de intercepción `fetch` ni dependencias cliente.

---

## 🛡️ Castillo Security & Quality Gate

El proceso de desarrollo y validación comprende 9 etapas continuas:

```text
DISCOVER → DESIGN → BUILD → TEST → AUDIT → GATE → LAUNCH → VERIFY → EVOLVE
```

1. **Security**: Verificación de cabeceras, recursos HTTPS y ausencia de scripts maliciosos.
2. **Performance**: Renderizado estático ultrarrápido sin dependencias frontend pesadas.
3. **Accessibility**: Estructura semántica HTML5, navegación por teclado, contraste y soporte para `prefers-reduced-motion`.
4. **SEO**: Etiquetas canónicas, Open Graph, Twitter Cards, `robots.txt` y `sitemap.xml` vinculados al dominio de producción.

---

## 📄 Licencia

© 2026 Servicios Castillo — Una empresa de Grupo Castillo. Todos los derechos reservados.
