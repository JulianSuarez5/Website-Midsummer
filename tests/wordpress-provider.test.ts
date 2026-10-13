/**
 * Pruebas del adaptador de WordPress.
 *
 * Es la capa más frágil del proyecto: depende de la forma de la respuesta de la
 * REST API y de los nombres de los campos ACF. Si WordPress cambia una de las
 * dos cosas, estas pruebas son lo que avisa antes de que un build publique
 * páginas vacías.
 *
 * `cmsFetch` se sustituye por un doble: la prueba verifica el mapeo, no la red.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const cmsFetch = vi.fn();

vi.mock('../src/lib/cms/client', () => ({
  cmsFetch: (...args: unknown[]) => cmsFetch(...args),
}));

const { wordpressProvider } = await import('../src/lib/cms/providers/wordpress');

/** Post mínimo con la forma que devuelve la REST API. */
function wpPost(overrides: Record<string, unknown> = {}) {
  return {
    id: 10,
    slug: 'proyecto-demo',
    title: { rendered: 'Proyecto demo' },
    excerpt: { rendered: '<p>Resumen del proyecto.</p>' },
    content: { rendered: '<p>Cuerpo.</p>' },
    date: '2026-03-01T00:00:00',
    modified: '2026-03-02T00:00:00',
    acf: {},
    ...overrides,
  };
}

beforeEach(() => {
  cmsFetch.mockReset();
});

describe('listProjects', () => {
  it('mapea los campos ACF al tipo del dominio', async () => {
    cmsFetch.mockResolvedValue([
      wpPost({
        acf: {
          department: 'Antioquia',
          municipality: 'Envigado',
          latitude: 6.17,
          longitude: -75.59,
          install_type: 'Industrial',
          capacity_wp: 250000,
          year: 2026,
          project_status: 'Operativo',
          featured: true,
        },
      }),
    ]);

    const [project] = await wordpressProvider.listProjects();

    expect(project).toMatchObject({
      id: '10',
      slug: 'proyecto-demo',
      department: 'Antioquia',
      municipality: 'Envigado',
      latitude: 6.17,
      longitude: -75.59,
      installType: 'Industrial',
      capacityWp: 250000,
      year: 2026,
      status: 'Operativo',
      featured: true,
    });
  });

  it('deja en null los campos ACF ausentes, sin inventarlos', async () => {
    cmsFetch.mockResolvedValue([wpPost()]);

    const [project] = await wordpressProvider.listProjects();

    expect(project?.department).toBeNull();
    expect(project?.latitude).toBeNull();
    expect(project?.capacityWp).toBeNull();
    expect(project?.year).toBeNull();
    expect(project?.featured).toBe(false);
  });

  it('envía los filtros de ACF con el formato que espera WordPress', async () => {
    cmsFetch.mockResolvedValue([]);

    await wordpressProvider.listProjects({
      department: 'Antioquia',
      installType: 'Industrial',
      year: 2026,
    });

    const [path, options] = cmsFetch.mock.calls[0] ?? [];
    const params = options.search as URLSearchParams;

    expect(path).toBe('project');
    expect(params.get('acf[department]')).toBe('Antioquia');
    expect(params.get('acf[install_type]')).toBe('Industrial');
    expect(params.get('acf[year]')).toBe('2026');
  });

  it('confirma el filtro en memoria, porque la API no lo garantiza', async () => {
    cmsFetch.mockResolvedValue([
      wpPost({ slug: 'a', acf: { department: 'Antioquia' } }),
      wpPost({ slug: 'b', acf: { department: 'Cundinamarca' } }),
    ]);

    const projects = await wordpressProvider.listProjects({ department: 'Antioquia' });

    expect(projects.map((project) => project.slug)).toEqual(['a']);
  });

  it('solo devuelve los proyectos destacados, en el orden del CMS', async () => {
    cmsFetch.mockResolvedValue([
      wpPost({ slug: 'a', acf: { featured: true } }),
      wpPost({ slug: 'b', acf: { featured: false } }),
      wpPost({ slug: 'c', acf: { featured: '1' } }),
      wpPost({ slug: 'd', acf: { featured: true } }),
    ]);

    const featured = await wordpressProvider.listFeaturedProjects(2);

    expect(featured.map((project) => project.slug)).toEqual(['a', 'c']);
  });
});

describe('getProject', () => {
  it('devuelve null si WordPress no encuentra el slug', async () => {
    cmsFetch.mockResolvedValue([]);

    expect(await wordpressProvider.getProject('no-existe')).toBeNull();
  });

  it('consulta por slug', async () => {
    cmsFetch.mockResolvedValue([wpPost()]);

    await wordpressProvider.getProject('proyecto-demo');

    const [, options] = cmsFetch.mock.calls[0] ?? [];

    expect((options.search as URLSearchParams).get('slug')).toBe('proyecto-demo');
  });
});

describe('listNews', () => {
  it('mapea la fecha de publicación y limpia el HTML del resumen', async () => {
    cmsFetch.mockResolvedValue([
      wpPost({
        excerpt: { rendered: '<p>Primer &amp; último</p>\n' },
        content: { rendered: '<p>Cuerpo con <strong>negrita</strong>.</p>' },
      }),
    ]);

    const [post] = await wordpressProvider.listNews();

    expect(post?.publishedAt).toBe('2026-03-01T00:00:00');
    expect(post?.excerpt).toBe('Primer & último');
  });

  it('deja publishedAt en null si la entrada no trae fecha', async () => {
    cmsFetch.mockResolvedValue([wpPost({ date: undefined })]);

    const [entry] = await wordpressProvider.listNews();

    expect(entry?.publishedAt).toBeNull();
  });
});

describe('listSolutions', () => {
  it('ordena por el campo order del CMS', async () => {
    cmsFetch.mockResolvedValue([
      wpPost({ slug: 'tercero', acf: { order: 3 } }),
      wpPost({ slug: 'primero', acf: { order: 1 } }),
      wpPost({ slug: 'segundo', acf: { order: 2 } }),
    ]);

    const solutions = await wordpressProvider.listSolutions();

    expect(solutions.map((solution) => solution.slug)).toEqual([
      'primero',
      'segundo',
      'tercero',
    ]);
  });

  it('descarta entradas de ACF que no son texto', async () => {
    cmsFetch.mockResolvedValue([
      wpPost({ acf: { applications: ['Industrial', 42, null] } }),
    ]);

    const [solution] = await wordpressProvider.listSolutions();

    expect(solution?.applications).toEqual(['Industrial']);
  });
});

describe('getSettings', () => {
  it('devuelve los datos de contacto de la página de configuración', async () => {
    cmsFetch.mockResolvedValue([
      wpPost({
        slug: 'configuracion',
        acf: {
          contact_email: 'contacto@example.com',
          contact_phone: '+57 604 000 0000',
          contact_address: 'Medellín, Colombia',
          social: [
            { label: 'LinkedIn', url: 'https://linkedin.com/company/example' },
            { label: 'Instagram' },
            'no-es-un-objeto',
          ],
        },
      }),
    ]);

    const settings = await wordpressProvider.getSettings();

    expect(settings.email).toBe('contacto@example.com');
    expect(settings.phone).toBe('+57 604 000 0000');
    expect(settings.address).toBe('Medellín, Colombia');
    // La entrada sin `url` se descarta en vez de publicar un enlace roto.
    expect(settings.social).toEqual([
      { label: 'LinkedIn', href: 'https://linkedin.com/company/example' },
    ]);
  });

  it('devuelve valores vacíos si la página de configuración no existe', async () => {
    cmsFetch.mockResolvedValue([]);

    const settings = await wordpressProvider.getSettings();

    expect(settings).toEqual({ email: '', phone: null, address: null, social: [] });
  });

  it('devuelve valores vacíos si el CMS falla, para no tumbar el build', async () => {
    cmsFetch.mockRejectedValue(new Error('sin conexión'));

    const settings = await wordpressProvider.getSettings();

    expect(settings.email).toBe('');
    expect(settings.social).toEqual([]);
  });
});

describe('mapeo de medios', () => {
  it('lee la imagen destacada con su texto alternativo y dimensiones', async () => {
    cmsFetch.mockResolvedValue([
      wpPost({
        _embedded: {
          'wp:featuredmedia': [
            {
              id: 55,
              source_url: 'https://example.com/foto.jpg',
              alt_text: 'Vista de la cubierta',
              media_details: { width: 1600, height: 900 },
            },
          ],
        },
      }),
    ]);

    const [project] = await wordpressProvider.listProjects();

    expect(project?.image).toEqual({
      id: '55',
      url: 'https://example.com/foto.jpg',
      alt: 'Vista de la cubierta',
      width: 1600,
      height: 900,
    });
  });

  it('devuelve null cuando no hay imagen destacada', async () => {
    cmsFetch.mockResolvedValue([wpPost({ _embedded: {} })]);

    const [project] = await wordpressProvider.listProjects();

    expect(project?.image).toBeNull();
  });
});
