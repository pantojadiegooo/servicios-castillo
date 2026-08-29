// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  // Dominio oficial de producción
  site: 'https://grupocastillo.lat',

  // build.format: 'file' → genera contacto.html en lugar de contacto/index.html
  // Esto preserva exactamente las mismas URLs que el sitio original (.html incluido)
  build: {
    format: 'file',
  },
});
