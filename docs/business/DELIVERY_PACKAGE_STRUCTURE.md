# Estructura del Paquete de Entrega Final (Delivery Package Structure)
## Estándar de Organización de Repositorio y Entregables para Clientes

**Versión:** 1.0.0  
**Ámbito:** Estructura estándar de archivos entregada a cada cliente al cierre de un proyecto.

---

### 1. ÁRBOL DE DIRECTORIOS DEL ENTREGABLE

Todo repositorio o paquete final transferido al Cliente se organiza bajo la siguiente estructura estandarizada:

```
nombre-del-proyecto/
├── .castle/                                   # Paquete de Evidencia CQS v1.1
│   ├── release-certificate.json               # Certificado criptográfico firmado (SHA-256)
│   ├── compliance-report.json                 # Auditoría estructurada máquina-legible
│   └── compliance-report.html                 # Reporte visual autocontenido para auditorías
│
├── .github/
│   └── workflows/
│       └── castle-gate.yml                    # Pipeline CI/CD automatizado de calidad y release
│
├── docs/                                      # Documentación técnica y comercial
│   ├── business/
│   │   ├── SOW.md                             # Declaración de trabajo específica del proyecto
│   │   ├── DEFINITION_OF_DONE.md              # Criterio de terminación técnica verificado
│   │   ├── OWNERSHIP_POLICY.md                # Declaración de 100% titularidad del Cliente
│   │   ├── HANDOFF_PROCESS.md                 # Guía de transferencia de accesos
│   │   └── WARRANTY_POLICY.md                 # Términos de la garantía técnica de 30 días
│   └── architecture/                          # Diagramas y decisiones de diseño técnico
│
├── public/                                    # Assets estáticos directos
│   ├── favicon.svg                            # Favicon vectorial
│   ├── robots.txt                             # Directivas para rastreadores
│   └── sitemap.xml                            # Mapa de sitio XML para indexación
│
├── src/                                       # Código fuente del proyecto
│   ├── components/                            # Componentes reutilizables e interactivos
│   ├── layouts/                               # Layouts base semánticos con SEO y metadatos
│   ├── pages/                                 # Rutas y vistas de la aplicación
│   └── styles/                                # Tokens de diseño y estilos CSS modularizados
│
├── vercel.json                                # Configuración de cabeceras HTTP y redirecciones
├── package.json                               # Manifiesto de dependencias y scripts de compilación
├── package-lock.json                          # Lockfile determinista
└── README.md                                  # Guía maestra de ejecución local y despliegue
```

---

### 2. CONTENIDO MÍNIMO DEL `README.md` MAESTRO

El archivo `README.md` ubicado en la raíz del repositorio entregado debe incluir obligatoriamente:
1. **Descripción General:** Propósito del proyecto y titularidad exclusiva del Cliente.
2. **Requisitos de Entorno:** Versión de Node.js requerida (ej. `Node.js >= 22.0.0`).
3. **Comandos Rápidos:**
   ```bash
   npm install        # Instalación de dependencias
   npm run dev        # Servidor de desarrollo local
   npm run check      # Validación de tipos TypeScript / Astro
   npm run build      # Compilación para producción (SSG)
   npm run preview    # Vista previa del build estático local
   ```
4. **Despliegue:** Instrucciones para conectar el repositorio a Vercel, Cloudflare Pages o AWS.
5. **Garantía y Soporte:** Contacto oficial del equipo de soporte de Grupo Castillo durante el periodo de garantía.
