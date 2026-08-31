// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  // Dominio oficial de producción
  site: 'https://grupocastillo.lat',

  // build.format: 'file' genera páginas estáticas optimizadas para Vercel cleanUrls
  build: {
    format: 'file',
  },
});
