/**
 * Consultas de contenido con caché de build.
 *
 * Por qué existe: durante el desarrollo se ejecutan decenas de builds y cada
 * uno golpearía la API de WordPress. Además, con `CMS_STRICT=true` un fallo
 * del CMS debe detener el build, no producir páginas vacías.
 *
 * Comportamiento:
 *   - En `astro dev` la caché se desactiva: siempre datos frescos.
 *   - En build, cada clave se resuelve una vez y se reutiliza.
 *   - Con `CMS_STRICT=true`, un error aborta el build. Con `false`, se
 *     registra el error y se devuelve una lista vacía.
 */

import { env } from '../../config/env';
import { getContentProvider } from './index';
import type {
  Installer,
  NewsPost,
  Project,
  ProjectFilters,
  SiteSettings,
  Solution,
} from './types';

const isDev = import.meta.env.DEV;

/** Claves ya resueltas en este proceso de build. */
const cache = new Map<string, Promise<unknown>>();

/**
 * Ejecuta `resolve` una sola vez por clave dentro del proceso.
 * En desarrollo no se memoriza, para que los cambios en el CMS se vean.
 */
function once<T>(key: string, resolve: () => Promise<T>): Promise<T> {
  if (isDev) return resolve();

  const existing = cache.get(key);
  if (existing) return existing as Promise<T>;

  const promise = resolve();
  cache.set(key, promise);
  return promise;
}

async function safely<T>(
  label: string,
  resolve: () => Promise<T>,
  fallback: T,
): Promise<T> {
  try {
    return await resolve();
  } catch (error) {
    if (env.CMS_STRICT) {
      // `cause` se adjunta para que el error original siga siendo legible en
      // la traza. Copiar solo el mensaje en el texto pierde el stack.
      throw new Error(
        `No se pudo obtener "${label}" del CMS. ` +
          `Arregla el CMS o ejecuta el build con CMS_STRICT=false para revelar la página sin contenido.`,
        { cause: error },
      );
    }

    console.warn(`[cms] "${label}" no disponible: ${String(error)}`);
    return fallback;
  }
}

const provider = () => getContentProvider();

export const content = {
  listSolutions: (): Promise<readonly Solution[]> =>
    once('solutions', () =>
      safely('solutions', () => provider().listSolutions(), [] as Solution[]),
    ),

  getSolution: (slug: string): Promise<Solution | null> =>
    once(`solution:${slug}`, () =>
      safely(`solution:${slug}`, () => provider().getSolution(slug), null),
    ),

  listProjects: (filters: ProjectFilters = {}): Promise<readonly Project[]> =>
    once(
      `projects:${filters.department ?? ''}:${filters.installType ?? ''}:${filters.year ?? ''}`,
      () => safely('projects', () => provider().listProjects(filters), [] as Project[]),
    ),

  getProject: (slug: string): Promise<Project | null> =>
    once(`project:${slug}`, () =>
      safely(`project:${slug}`, () => provider().getProject(slug), null),
    ),

  listFeaturedProjects: (limit = 3): Promise<readonly Project[]> =>
    once(`projects:featured:${limit}`, () =>
      safely(
        'featured projects',
        () => provider().listFeaturedProjects(limit),
        [] as Project[],
      ),
    ),

  listNews: (limit = 10): Promise<readonly NewsPost[]> =>
    once(`news:${limit}`, () =>
      safely('news', () => provider().listNews(limit), [] as NewsPost[]),
    ),

  getNewsPost: (slug: string): Promise<NewsPost | null> =>
    once(`news:${slug}`, () =>
      safely(`news:${slug}`, () => provider().getNewsPost(slug), null),
    ),

  listInstallers: (): Promise<readonly Installer[]> =>
    once('installers', () =>
      safely('installers', () => provider().listInstallers(), [] as Installer[]),
    ),

  getSettings: (): Promise<SiteSettings> =>
    once('settings', () =>
      safely('settings', () => provider().getSettings(), {
        email: '',
        phone: null,
        address: null,
        social: [],
      }),
    ),
};
