/**
 * Datos estructurados JSON-LD.
 *
 * Solo se emite lo que Midsummer haya confirmado. Un schema.org con datos
 * inventados (dirección, teléfono, número de empleados) es peor que no
 * tenerlo: genera información errónea en los resultados de búsqueda.
 *
 * Campos obligatorios con valor real: nombre, URL, logo.
 * Campos que dependen de datos no confirmados: se omiten del objeto.
 */

import { SITE, absoluteUrl } from '../../config/site.config';

interface JsonLdBase {
  '@context': 'https://schema.org';
}

export interface OrganizationSchema extends JsonLdBase {
  '@type': 'Organization';
  name: string;
  alternateName: string;
  url: string;
  logo: string;
  description: string;
  areaServed: string;
  /** Solo si se conocen las URLs oficiales de los perfiles. */
  sameAs?: string[];
}

export interface BreadcrumbItem {
  readonly name: string;
  readonly path: string;
}

export interface BreadcrumbSchema extends JsonLdBase {
  '@type': 'BreadcrumbList';
  itemListElement: readonly {
    '@type': 'ListItem';
    position: number;
    name: string;
    item: string;
  }[];
}

export function organizationSchema(): OrganizationSchema {
  const sameAs = SITE.social
    .map((item) => item.href)
    .filter((href) => href.startsWith('http'));

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: `${SITE.name} ${SITE.market}`,
    alternateName: SITE.name,
    url: SITE.url,
    logo: absoluteUrl('/logo.svg'),
    description: SITE.description,
    areaServed: 'CO',
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };
}

export function breadcrumbSchema(items: readonly BreadcrumbItem[]): BreadcrumbSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export interface ArticleSchema extends JsonLdBase {
  '@type': 'Article';
  headline: string;
  description: string;
  url: string;
  datePublished?: string;
  inLanguage: string;
  image?: string;
  publisher: {
    '@type': 'Organization';
    name: string;
    logo: { '@type': 'ImageObject'; url: string };
  };
}

/** Solo se emite si hay fecha e imagen: un Article sin ellos no aporta nada. */
export function articleSchema(input: {
  title: string;
  description: string;
  path: string;
  publishedAt: string | null;
  image: string | null;
}): ArticleSchema | null {
  if (!input.publishedAt || !input.image) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: input.title,
    description: input.description,
    url: absoluteUrl(input.path),
    datePublished: input.publishedAt,
    inLanguage: SITE.locale,
    image: absoluteUrl(input.image),
    publisher: {
      '@type': 'Organization',
      name: `${SITE.name} ${SITE.market}`,
      logo: { '@type': 'ImageObject', url: absoluteUrl('/logo.svg') },
    },
  };
}

/** Serializa de forma segura: `</script>` rompería el contexto de la etiqueta. */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
