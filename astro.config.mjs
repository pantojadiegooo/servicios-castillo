// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  // Preservar el mismo dominio del proyecto original (placeholder — actualizar al publicar)
  site: 'https://serviciosorg-castillo.example.mx',

  // build.format: 'file' → genera contacto.html en lugar de contacto/index.html
  // Esto preserva exactamente las mismas URLs que el sitio original (.html incluido)
  build: {
    format: 'file',
  },
});
