/**
 * Pruebas de las rutas contra la instancia real de WordPress.
 *
 * El resto de pruebas sustituyen `cmsFetch` por un doble, lo que verifica el
 * mapeo pero no la URL. Una ruta mal escrita devuelve un 404 o una lista vacía
 * y ningún doble lo detecta: por eso estas pruebas hablan con el CMS de verdad.
 *
 * Se omiten si no hay WordPress levantado, para que `npm test` siga funcionando
 * sin el CMS. Con el CMS arriba, son la prueba de que la arquitectura headless
 * está conectada de verdad.
 *
 * Levantar el CMS:
 *   php tools/install-wordpress.php
 *   php tools/setup-wordpress.php
 *   npm run cms:dev
 */
import { describe, expect, it, beforeAll } from 'vitest';
import { wordpressProvider } from '../src/lib/cms/providers/wordpress';
import { env } from '../src/config/env';

/**
 * Comprueba si el CMS responde de verdad.
 *
 * Con que la URL esté en el `.env` no basta: si el servidor no está levantado,
 * estas pruebas fallan con `ECONNREFUSED`, un error que no dice nada del
 * proyecto. Con este sondeo, sin CMS Running se omiten y `npm test` sigue
 * pasando.
 */
async function cmsResponde(): Promise<boolean> {
  if (env.CMS_PROVIDER !== 'wordpress' || !env.CMS_API_URL) return false;

  const control = new AbortController();
  const espera = setTimeout(() => control.abort(), 3000);

  try {
    const respuesta = await fetch(`${(env.CMS_API_URL as string).replace(/\/$/, '')}`, {
      headers: { Accept: 'application/json' },
      signal: control.signal,
    });

    return respuesta.status === 200;
  } catch {
    return false;
  } finally {
    clearTimeout(espera);
  }
}

const LIVE = await cmsResponde();

async function get(path: string, search = '') {
  const base = (env.CMS_API_URL ?? '').replace(/\/$/, '');

  const response = await fetch(`${base}/${path}${search}`, {
    headers: { Accept: 'application/json' },
  });

  return { status: response.status, body: await response.json() };
}

describe.skipIf(!LIVE)('WordPress real', () => {
  beforeAll(() => {
    if (!LIVE) return;

    // Con el sondeo ya hecho, si llegamos aquí el CMS estaba arriba al empezar.
    // Se comprueba de nuevo para que el fallo, si lo hay, sea al guardar y no
    // a mitad de una batería de pruebas.
    expect(env.CMS_API_URL).toBeTruthy();
  });

  it('responde en la raíz de la API', async () => {
    const { status } = await get('');

    expect(status).toBe(200);
  });

  it('expone los post types del contrato', async () => {
    for (const route of ['project', 'solution', 'installer', 'posts', 'pages']) {
      const { status, body } = await get(route);

      expect(status, `la ruta /${route} debe existir`).toBe(200);
      expect(Array.isArray(body), `/${route} debe devolver un array`).toBe(true);
    }
  });

  it('no expone /post en singular, que es el error clásico', async () => {
    const { status } = await get('post');

    expect(status).toBe(404);
  });

  it('devuelve los campos del contrato bajo la clave acf', async () => {
    const { body } = await get('project');

    expect(body.length).toBeGreaterThan(0);

    const [project] = body as { acf?: Record<string, unknown> }[];

    expect(project.acf).toBeTypeOf('object');

    for (const field of [
      'department',
      'municipality',
      'latitude',
      'longitude',
      'install_type',
      'capacity_wp',
      'year',
      'project_status',
      'featured',
      'seo_title',
      'seo_description',
      'social_image',
    ]) {
      expect(project.acf, `falta el campo ${field}`).toHaveProperty(field);
    }
  });

  it('convierte los campos de la API en los tipos del dominio', async () => {
    const { body } = await get('project');

    const [project] = body as { acf?: Record<string, unknown> }[];

    // featured es booleano, no la cadena "1".
    expect(typeof project.acf?.featured).toBe('boolean');
    // year es número cuando existe.
    expect(project.acf?.year === null || typeof project.acf?.year).not.toBe('string');
  });

  it('devuelve las listas como arrays, no como cadenas', async () => {
    const { body } = await get('solution');

    expect(body.length).toBeGreaterThan(0);

    const [solution] = body as { acf?: Record<string, unknown> }[];

    expect(Array.isArray(solution.acf?.applications)).toBe(true);
  });

  it('el proveedor lee contenido real sin transforming mal los tipos', async () => {
    const projects = await wordpressProvider.listProjects();

    expect(projects.length).toBeGreaterThan(0);

    const [project] = projects;

    expect(project.slug).toBeTruthy();
    expect(project.title).toBeTruthy();
    // Ningún campo inventado: lo que no llega, es null.
    expect(project.latitude === null || typeof project.latitude).not.toBe('string');
  });

  it('filtra proyectos por departamento usando la API real', async () => {
    const all = await wordpressProvider.listProjects();
    const department = all.find((project) => project.department)?.department;

    if (!department) {
      throw new Error('el contenido de demostración necesita al menos un departamento');
    }

    const filtered = await wordpressProvider.listProjects({ department });

    expect(filtered.length).toBeGreaterThan(0);

    for (const project of filtered) {
      expect(project.department).toBe(department);
    }
  });

  it('encuentra un proyecto por su slug', async () => {
    const [first] = await wordpressProvider.listProjects();

    const found = await wordpressProvider.getProject(first.slug);

    expect(found?.id).toBe(first.id);
  });

  it('lee noticias por la ruta /posts', async () => {
    const news = await wordpressProvider.listNews();

    expect(news.length).toBeGreaterThan(0);
    expect(news[0].publishedAt).toBeTruthy();
  });

  it('encuentra una noticia por su slug', async () => {
    const [first] = await wordpressProvider.listNews();

    const found = await wordpressProvider.getNewsPost(first.slug);

    expect(found?.id).toBe(first.id);
  });

  it('lee la página de configuración y devuelve contactos vacíos, no inventados', async () => {
    const settings = await wordpressProvider.getSettings();

    // El contenido de demostración no trae datos de contacto reales.
    expect(settings.email).toBe('');
    expect(settings.phone).toBeNull();
  });

  it('los datos de demostración están marcados como demo', async () => {
    const projects = await wordpressProvider.listProjects();

    for (const project of projects) {
      expect(project.title).toMatch(/\[DEMO\]/);
    }
  });
});
