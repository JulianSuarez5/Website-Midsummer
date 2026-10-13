/**
 * Proveedor de contenido respaldado por WordPress.
 *
 * Responsabilidad única: traducir la respuesta de WordPress a los tipos del
 * dominio (`./types`). Toda la lógica de negocio del frontend habla esos
 * tipos y no sabe que existe WordPress.
 *
 * Requiere en WordPress (ver docs/content-model.md):
 *   post type `project`     → proyectos (con campos ACF o meta propios)
 *   post type `solution`    → productos / soluciones
 *   post type `installer`   → instaladores / aliados
 *   post type `post`        → noticias
 *   page                    → páginas institucionales
 */

import { cmsFetch } from '../client';
import type { ContentProvider } from '../provider';
import type {
  Installer,
  Media,
  NewsPost,
  Project,
  ProjectFilters,
  SiteSettings,
  Solution,
} from '../types';

/**
 * Rutas de la REST API de WordPress, no nombres de post type.
 *
 * Ojo con la trampa: el post type se llama `post` en singular, pero su ruta en
 * la REST API es `posts` en plural. Igual con `pages`. Estos valores son rutas,
 * no nombres de post type, y confundirlos devuelve un 404 silencioso: la
 * respuesta es válida y el listado sale vacío.
 *
 * Las rutas están fijadas por tests/wordpress-endpoints.test.ts contra la
 * instancia real, porque un doble de prueba no puede detectar un 404.
 */
const POST_TYPES = {
  project: 'project',
  solution: 'solution',
  installer: 'installer',
  news: 'posts',
  pages: 'pages',
} as const;

const PER_PAGE = '100';

/**
 * La WP REST API devuelve las colecciones como arrays JSON planos, no como
 * objetos envueltos. Este alias documenta esa diferencia para no volver a
 * asumir una forma que la API no tiene.
 */
type WpList<T> = readonly T[];

/** Campos de yoast, presentes solo si el plugin está activo. */
interface WpYoastSeo {
  readonly title?: string;
  readonly description?: string;
  readonly og_image?: { readonly url?: string };
  readonly canonical?: { readonly url?: string };
  readonly robots?: { readonly index?: string };
}

interface WpRendered {
  readonly rendered: string;
}

interface WpBase {
  readonly id: number;
  readonly slug: string;
  readonly title: WpRendered;
  readonly excerpt?: WpRendered;
  readonly content?: WpRendered;
  /** ISO 8601. Solo lo sends los post types con fecha (noticias). */
  readonly date?: string;
  readonly modified?: string;
  readonly acf?: Record<string, unknown> | null;
  readonly _embedded?: {
    readonly 'wp:featuredmedia'?: readonly {
      readonly id: number;
      readonly source_url?: string;
      readonly alt_text?: string;
      readonly media_details?: {
        readonly width?: number;
        readonly height?: number;
      };
    }[];
  };
  readonly yoast_head_json?: WpYoastSeo;
}

function acfString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : null;
}

function acfNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function acfStringList(value: unknown): readonly string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

function seoFrom(post: WpBase) {
  const yoast = post.yoast_head_json;
  const acf = post.acf ?? {};

  return {
    title: acfString(acf.seo_title) ?? yoast?.title ?? undefined,
    description:
      acfString(acf.seo_description) ??
      acfString(post.excerpt?.rendered) ??
      yoast?.description ??
      undefined,
    ogImage: acfString(acf.social_image) ?? yoast?.og_image?.url ?? undefined,
    noindex: yoast?.robots?.index === 'noindex' ? true : undefined,
  };
}

function mediaFrom(post: WpBase): Media | null {
  const media = post._embedded?.['wp:featuredmedia']?.[0];
  if (!media?.source_url) return null;

  return {
    id: String(media.id),
    url: media.source_url,
    // Un alt vacío es un problema de accesibilidad, no un detalle cosmético.
    // Si el CMS no lo tiene, se marca como pendiente en lugar de inventarlo.
    alt: media.alt_text ?? '',
    width: media.media_details?.width ?? null,
    height: media.media_details?.height ?? null,
  };
}

/**
 * Filtra los campos del cuerpo que vienen envueltos en etiquetas `<p>`.
 * WordPress devuelve HTML; aquí solo se conserva texto plano seguro.
 */
function plainText(html: string | undefined): string | null {
  if (!html) return null;

  const text = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

  return text === '' ? null : text;
}

async function listByType(
  postType: string,
  params: Readonly<Record<string, string>> = {},
): Promise<readonly WpBase[]> {
  const search = new URLSearchParams({
    per_page: PER_PAGE,
    status: 'publish',
    _embed: '1',
  });

  for (const [key, value] of Object.entries(params)) {
    search.set(key, value);
  }

  return cmsFetch<WpList<WpBase>>(postType, { search });
}

/** Busca un único post por slug. WordPress devuelve un array; se toma el primero. */
async function findBySlug(postType: string, slug: string): Promise<WpBase | null> {
  const search = new URLSearchParams({ slug, per_page: '1', _embed: '1' });
  const result = await cmsFetch<WpList<WpBase>>(postType, { search });
  return result[0] ?? null;
}

function toProject(post: WpBase): Project {
  const acf = post.acf ?? {};

  return {
    id: String(post.id),
    slug: post.slug,
    title: post.title.rendered,
    summary: plainText(post.excerpt?.rendered) ?? 'Resumen pendiente de aprobación.',
    body: post.content?.rendered ?? null,
    image: mediaFrom(post),
    gallery: [],
    department: acfString(acf.department),
    municipality: acfString(acf.municipality),
    latitude: acfNumber(acf.latitude),
    longitude: acfNumber(acf.longitude),
    installType: acfString(acf.install_type),
    capacityWp: acfNumber(acf.capacity_wp),
    year: acfNumber(acf.year),
    status: acfString(acf.project_status),
    featured: acf.featured === true || acf.featured === '1',
    seo: seoFrom(post),
  };
}

function toSolution(post: WpBase): Solution {
  const acf = post.acf ?? {};

  return {
    id: String(post.id),
    slug: post.slug,
    title: post.title.rendered,
    summary:
      plainText(post.excerpt?.rendered) ?? 'Descripción pendiente de aprobación.',
    body: post.content?.rendered ?? null,
    image: mediaFrom(post),
    applications: acfStringList(acf.applications),
    cta:
      typeof acf.cta_label === 'string' && typeof acf.cta_url === 'string'
        ? { label: acf.cta_label, href: acf.cta_url }
        : null,
    order: typeof acf.order === 'number' ? acf.order : 0,
    seo: seoFrom(post),
  };
}

function toNews(post: WpBase): NewsPost {
  return {
    id: String(post.id),
    slug: post.slug,
    title: post.title.rendered,
    excerpt: plainText(post.excerpt?.rendered) ?? 'Resumen pendiente de aprobación.',
    body: post.content?.rendered ?? null,
    image: mediaFrom(post),
    publishedAt: post.date ?? null,
    tags: [],
    seo: seoFrom(post),
  };
}

function toInstaller(post: WpBase): Installer {
  const acf = post.acf ?? {};

  return {
    id: String(post.id),
    slug: post.slug,
    companyName: post.title.rendered,
    summary:
      plainText(post.excerpt?.rendered) ?? 'Información pendiente de aprobación.',
    logo: mediaFrom(post),
    coverage: acfStringList(acf.coverage),
    website: acfString(acf.website),
    email: acfString(acf.email),
    phone: acfString(acf.phone),
    seo: seoFrom(post),
  };
}

/**
 * Filtros → parámetros de la WP REST API.
 *
 * ACF se filtra con `acf[campo]=valor`. La comparación por defecto es "igual a";
 * para `department` se admite la alternativa `field=value` solo si WordPress lo
 * tiene configurado, por eso el filtro exacto se aplica también en memoria.
 */
function projectFilterParams(filters: ProjectFilters = {}): Record<string, string> {
  const params: Record<string, string> = {};

  if (filters.department) params['acf[department]'] = filters.department;
  if (filters.installType) params['acf[install_type]'] = filters.installType;
  if (filters.year) params['acf[year]'] = String(filters.year);

  return params;
}

async function fetchProjects(
  filters: ProjectFilters = {},
): Promise<readonly Project[]> {
  const posts = await listByType(POST_TYPES.project, projectFilterParams(filters));

  // WP no interpreta de forma fiable varios `acf[...]` a la vez, y el slug de
  // un proyecto no es un dato confiable para filtrar. El volumen de un sitio
  // corporativo no justifica paginación server-side, así que se confirma el
  // filtro en memoria sobre el conjunto ya acotado por la API.
  return posts.map(toProject).filter((project) => {
    if (filters.department && project.department !== filters.department) {
      return false;
    }
    if (filters.installType && project.installType !== filters.installType) {
      return false;
    }
    if (filters.year && project.year !== filters.year) return false;
    return true;
  });
}

export const wordpressProvider: ContentProvider = {
  name: 'wordpress',

  async listSolutions() {
    const posts = await listByType(POST_TYPES.solution);
    return posts.map(toSolution).sort((a, b) => a.order - b.order);
  },

  async getSolution(slug) {
    const post = await findBySlug(POST_TYPES.solution, slug);
    return post ? toSolution(post) : null;
  },

  async listProjects(filters = {}) {
    return fetchProjects(filters);
  },

  async getProject(slug) {
    const post = await findBySlug(POST_TYPES.project, slug);
    return post ? toProject(post) : null;
  },

  async listFeaturedProjects(limit = 3) {
    const projects = await fetchProjects();
    return projects.filter((project) => project.featured).slice(0, limit);
  },

  async listNews(limit = 10) {
    const search = new URLSearchParams({ per_page: String(limit) });
    const posts = await cmsFetch<WpList<WpBase>>(POST_TYPES.news, { search });
    return posts.map(toNews);
  },

  async getNewsPost(slug) {
    const post = await findBySlug(POST_TYPES.news, slug);
    return post ? toNews(post) : null;
  },

  async listInstallers() {
    const posts = await listByType(POST_TYPES.installer);
    return posts.map(toInstaller);
  },

  async getSettings(): Promise<SiteSettings> {
    // Los datos de contacto son editables en el CMS (página "Configuración"),
    // pero su fuente debe existir. Si no existe, se devuelven vacíos y la
    // interfaz muestra el marcador de pendiente en lugar de fallar.
    const empty: SiteSettings = {
      email: '',
      phone: null,
      address: null,
      social: [],
    };

    try {
      const page = await findBySlug(POST_TYPES.pages, 'configuracion');
      if (!page) return empty;

      const acf = page.acf ?? {};
      const social = Array.isArray(acf.social)
        ? acf.social.filter(
            (item): item is { label: string; url: string } =>
              typeof item === 'object' &&
              item !== null &&
              typeof (item as { label?: unknown }).label === 'string' &&
              typeof (item as { url?: unknown }).url === 'string',
          )
        : [];

      return {
        email: acfString(acf.contact_email) ?? '',
        phone: acfString(acf.contact_phone),
        address: acfString(acf.contact_address),
        social: social.map((item) => ({ label: item.label, href: item.url })),
      };
    } catch {
      return empty;
    }
  },

  async getMedia(id) {
    try {
      const media = await cmsFetch<WpBase>(`media/${id}`);
      return mediaFrom(media);
    } catch {
      return null;
    }
  },
};
