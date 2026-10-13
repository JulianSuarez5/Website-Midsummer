import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  // Vitest no carga el `.env` por su cuenta, a diferencia de Astro. Sin esto,
  // las pruebas que hablan con el CMS real se saltarían siempre, porque
  // `CMS_PROVIDER` quedaría en su valor por defecto.
  const fileEnv = loadEnv(mode, process.cwd(), '');

  return {
    test: {
      // El sitio se genera en Node, no en el navegador: las pruebas del CMS, del
      // SEO y del mapa son de lógica pura. Solo los componentes React necesitarían
      // `environment: 'jsdom'`, y ese entorno no está instalado a propósito.
      environment: 'node',
      include: ['tests/**/*.test.ts'],
      reporters: 'default',
      env: {
        SITE_URL: fileEnv.SITE_URL,
        CMS_PROVIDER: fileEnv.CMS_PROVIDER,
        CMS_API_URL: fileEnv.CMS_API_URL,
        CMS_STRICT: fileEnv.CMS_STRICT,
        CMS_AUTH_USER: fileEnv.CMS_AUTH_USER,
        CMS_AUTH_APP_PASSWORD: fileEnv.CMS_AUTH_APP_PASSWORD,
      },
    },
  };
});
