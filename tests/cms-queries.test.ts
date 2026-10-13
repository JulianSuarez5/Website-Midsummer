/**
 * Pruebas del contrato de contenido: caché, tolerancia a fallos y `CMS_STRICT`.
 *
 * Son la red de seguridad del build. El error que justifican es concreto: con
 * WordPress caído, una versión ingenua de estas consultas genera el sitio
 * entero sin contenido y lo publica. Aquí se comprueba que eso no ocurra.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ContentProvider } from '../src/lib/cms/provider';
import type { Project, ProjectFilters } from '../src/lib/cms/types';

const mocks = vi.hoisted(() => ({
  provider: { current: null as ContentProvider | null },
  env: { CMS_STRICT: false } as { CMS_STRICT: boolean },
}));

vi.mock('../src/lib/cms', () => ({
  getContentProvider: () => {
    if (!mocks.provider.current)
      throw new Error('Proveedor sin configurar en la prueba');
    return mocks.provider.current;
  },
}));

vi.mock('../src/config/env', () => ({ env: mocks.env }));

const { content } = await import('../src/lib/cms/queries');

const project = (slug: string): Project =>
  ({
    id: slug,
    slug,
    title: slug,
    summary: '',
    body: null,
    image: null,
    gallery: [],
    department: null,
    municipality: null,
    latitude: null,
    longitude: null,
    installType: null,
    capacityWp: null,
    year: null,
    status: null,
    featured: false,
    seo: {},
  }) as Project;

function stubProvider(partial: Partial<ContentProvider>): void {
  mocks.provider.current = {
    name: 'test',
    listSolutions: async () => [],
    getSolution: async () => null,
    listProjects: async () => [],
    getProject: async () => null,
    listFeaturedProjects: async () => [],
    listNews: async () => [],
    getNewsPost: async () => null,
    listInstallers: async () => [],
    getSettings: async () => ({ email: '', phone: null, address: null, social: [] }),
    ...partial,
  } as ContentProvider;
}

beforeEach(() => {
  mocks.env.CMS_STRICT = false;
});

describe('tolerancia a fallos del CMS', () => {
  it('devuelve una lista vacía si el CMS falla y CMS_STRICT es false', async () => {
    stubProvider({
      listProjects: async () => {
        throw new Error('WordPress no responde');
      },
    });

    await expect(content.listProjects()).resolves.toEqual([]);
  });

  it('detiene el build si el CMS falla y CMS_STRICT es true', async () => {
    mocks.env.CMS_STRICT = true;
    stubProvider({
      listProjects: async () => {
        throw new Error('WordPress no responde');
      },
    });

    await expect(content.listProjects()).rejects.toThrow(
      /No se pudo obtener "projects"/,
    );
  });

  it('mantiene la causa original del error cuando detiene el build', async () => {
    mocks.env.CMS_STRICT = true;
    const original = new Error('timeout del socket');
    stubProvider({
      listNews: async () => {
        throw original;
      },
    });

    await expect(content.listNews()).rejects.toMatchObject({ cause: original });
  });
});

describe('valores por defecto', () => {
  it('devuelve ajustes vacíos si el CMS no responde', async () => {
    stubProvider({
      getSettings: async () => {
        throw new Error('sin conexión');
      },
    });

    await expect(content.getSettings()).resolves.toEqual({
      email: '',
      phone: null,
      address: null,
      social: [],
    });
  });

  it('devuelve null al pedir una entrada que no existe', async () => {
    stubProvider({ getProject: async () => null });

    await expect(content.getProject('no-existe')).resolves.toBeNull();
  });
});

describe('listado de proyectos', () => {
  it('reenvía los filtros al proveedor', async () => {
    const calls: unknown[] = [];
    stubProvider({
      listProjects: async (filters: ProjectFilters) => {
        calls.push(filters);
        return [project('a')];
      },
    });

    await content.listProjects({ department: 'Antioquia', year: 2026 });

    expect(calls).toEqual([{ department: 'Antioquia', year: 2026 }]);
  });
});
