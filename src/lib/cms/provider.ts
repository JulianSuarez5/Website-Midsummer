/**
 * Interfaz del proveedor de contenido.
 *
 * Esta interfaz es la frontera de la aplicación: las páginas y los
 * componentes dependen de ella, nunca de WordPress.
 *
 * Consecuencia práctica: cambiar de WordPress a otro CMS (o usar el proveedor
 * de prueba) no obliga a reescribir la aplicación. Solo se agrega un archivo
 * en `providers/` que implemente este contrato.
 *
 * Todas las consultas devuelven datos ya normalizados a los tipos de
 * `./types`. Los datos no disponibles se devuelven como `null` o como
 * cadenas vacías, nunca como valores inventados.
 */

import type {
  Installer,
  Media,
  NewsPost,
  Project,
  ProjectFilters,
  SiteSettings,
  Solution,
} from './types';

export interface ContentProvider {
  /** Identificador del proveedor, útil en logs y diagnóstico. */
  readonly name: string;

  listSolutions(): Promise<readonly Solution[]>;
  getSolution(slug: string): Promise<Solution | null>;

  listProjects(filters?: ProjectFilters): Promise<readonly Project[]>;
  getProject(slug: string): Promise<Project | null>;
  /** Proyectos destacados para la portada. */
  listFeaturedProjects(limit?: number): Promise<readonly Project[]>;

  listNews(limit?: number): Promise<readonly NewsPost[]>;
  getNewsPost(slug: string): Promise<NewsPost | null>;

  listInstallers(): Promise<readonly Installer[]>;

  getSettings(): Promise<SiteSettings>;

  getMedia(id: string): Promise<Media | null>;
}
