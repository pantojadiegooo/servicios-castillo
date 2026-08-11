# Servicios Castillo — Plataforma Digital

Unidad de soluciones digitales de **Grupo Castillo**. Plataforma web estática construida sobre **Astro**, diseñada bajo el **Castillo Security & Quality Gate**.

- **Producción**: [https://servicios-castillo.vercel.app/](https://servicios-castillo.vercel.app/)
- **Repositorio**: [https://github.com/pantojadiegooo/servicios-castillo](https://github.com/pantojadiegooo/servicios-castillo)

---

## 🛠️ Arquitectura Técnica

* **Framework**: Astro v7.2 (Compilación estática en `dist/`)
* **Formato de Rutas**: `build.format: 'file'` (Preserva URLs nativas `.html`)
* **Estilos**: Vanilla CSS modularizado en `src/styles/` (`tokens.css`, `reset.css`, `layout.css`, `hero.css`, `components/*.css`)
* **JavaScript**: Nativo en `public/assets/js/main.js` (Menú accesible, validación client-side, lectura de query params `?paquete=` / `?necesidad=`, transmisión HTTP `fetch`)
* **Iconografía & Assets**: Favicon SVG, PNG (32px), Apple Touch Icon (180px) y Open Graph Banner (1200x630)

---

## 🚀 Comandos del Proyecto

Todos los comandos se ejecutan desde la raíz del proyecto:

| Comando | Acción |
| :--- | :--- |
| `npm run dev` | Inicia el servidor local de desarrollo en `http://localhost:4321` |
| `npm run build` | Compila el sitio estático de producción en `./dist/` (12 rutas `.html`) |
| `npm run preview` | Previsualiza localmente el sitio compilado en `dist/` |
| `npm run check` | Ejecuta la verificación de tipos e integridad de Astro (`astro check`) |

---

## 📬 Configuración del Formulario de Contacto

El formulario de `/contacto.html` transmite las solicitudes en tiempo real a cualquier proveedor (Formspree, Web3Forms, Netlify Forms, EmailJS o API propia).

### Variable de Entorno
Crea o configura la variable `PUBLIC_FORM_ENDPOINT` en tu plataforma de hosting (Vercel) o archivo `.env`:

```env
PUBLIC_FORM_ENDPOINT="https://formspree.io/f/tu-id-formspree"
```

Si la variable no se especifica, el script del cliente informará en la UI de forma accesible que el formulario requiere la URL receptora para transmitir los datos en producción.

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
