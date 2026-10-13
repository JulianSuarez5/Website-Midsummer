/**
 * robots.txt generado en el build.
 *
 * Vive aquí y no en `public/` a propósito: el dominio vive en `SITE_URL` y no
 * debe duplicarse en un archivo estático que se desincroniza al cambiar de
 * dominio. El sitemap lo produce `@astrojs/sitemap` en el mismo build.
 */
import type { APIRoute } from 'astro';
import { SITE_URL } from '../config/env';

const body = `# robots.txt
# El sitio es público. Las páginas que deben quedar fuera de indexación
# declaran "noindex" en sus propios metadatos, no aquí: una regla global no
# puede conocer el propósito de cada URL.

User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap-index.xml
`;

export const GET: APIRoute = () =>
  new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
