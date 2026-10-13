/**
 * Construcción de metadatos SEO.
 *
 * Todo título y descripción pasa por aquí. Reglas:
 *   - Si el contenido define el campo SEO, gana sobre el valor por defecto.
 *   - Si no, se deriva del contenido, nunca se inventa.
 *   - El título se recorta a una longitud legible en resultados de búsqueda.
 */

import { SITE, absoluteUrl } from '../../config/site.config';
import type { SeoFields } from '../cms/types';

const TITLE_MAX = 60;
const DESCRIPTION_MAX = 155;

export interface PageMeta {
  readonly title: string;
  readonly description: string;
  readonly canonical: string;
  readonly ogImage: string | null;
  readonly noindex: boolean;
  readonly publishedTime: string | null;
}

export interface PageMetaInput {
  /** Ruta interna con barra inicial, p. ej. `/proyectos/`. */
  readonly path: string;
  /** Título específico de la página. Si falta, se usa el nombre de marca. */
  readonly title?: string;
  /** Descripción específica. Si falta, se usa SITE.description. */
  readonly description?: string;
  /** Valores SEO que vienen del CMS. Tienen prioridad. */
  readonly seo?: SeoFields;
  readonly ogImage?: string | null;
  readonly publishedTime?: string | null;
}

function clamp(text: string, max: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;

  const cut = trimmed.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(' ');

  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}

export function buildMeta({
  path,
  title,
  description,
  seo,
  ogImage,
  publishedTime,
}: PageMetaInput): PageMeta {
  const pageTitle = seo?.title ?? title;

  const fullTitle = pageTitle
    ? `${clamp(pageTitle, TITLE_MAX)} | ${SITE.name} ${SITE.market}`
    : `${SITE.name} ${SITE.market} — ${SITE.tagline}`;

  const rawDescription = seo?.description ?? description ?? SITE.description;

  return {
    title: fullTitle,
    description: clamp(rawDescription, DESCRIPTION_MAX),
    canonical: absoluteUrl(path),
    ogImage: ogImage ?? seo?.ogImage ?? null,
    noindex: seo?.noindex ?? false,
    publishedTime: publishedTime ?? null,
  };
}
