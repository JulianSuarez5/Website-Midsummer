// @ts-check
import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

/**
 * Configuración de Astro.
 *
 * La URL pública se toma de SITE_URL para que el dominio viva en un solo lugar
 * y se pueda cambiar sin tocar este archivo. Se lee con `loadEnv` de Vite y no
 * con `process.env` porque el archivo `.env` solo existe una vez que Vite lo
 * carga; con `process.env` el valor del `.env` se ignoraría en silencio.
 */
const { SITE_URL = 'https://midsummersolar.co' } = loadEnv(
  process.env.NODE_ENV ?? 'development',
  process.cwd(),
  '',
);

export default defineConfig({
  site: SITE_URL,

  integrations: [react(), sitemap()],

  /**
   * Astro 7 usa reglas de espacio de JSX por defecto, que borran el espacio
   * entre elementos inline. En un sitio con mucho texto generado desde CMS eso
   * produce textos pegados ("energíasostenibles"). Forzamos el comportamiento
   * consciente de HTML para evitar esa clase de bug.
   * Ver docs/architecture.md > "Decisiones de plataforma".
   */
  compressHTML: true,

  build: {
    // Código inline pequeño y el bundle JS se separan del HTML crítico.
    inlineStylesheets: 'auto',
  },

  vite: {
    plugins: [tailwindcss()],
    build: {
      // Detecta dependencias introducidas por error en el bundle del cliente.
      assetsInlineLimit: 0,
    },
  },
});
