/**
 * Tipos del dominio de contenido.
 *
 * Estos tipos son el contrato entre el CMS y el frontend. Los componentes
 * consumen estos tipos, nunca la respuesta cruda de WordPress. Si el CMS
 * cambia, se adapta en `providers/` y nada más se toca.
 *
 * Regla: si un campo no está confirmado por Midsummer, es opcional y su valor
 * de ejemplo va marcado como pendiente. No se inventa información.
 */

export type ContentStatus = 'draft' | 'published' | 'pending';

export interface SeoFields {
  readonly title?: string;
  readonly description?: string;
  /** Ruta de la imagen para Open Graph, relativa o absoluta. */
  readonly ogImage?: string;
  /** Impide la indexación de la página. */
  readonly noindex?: boolean;
}

export interface Cta {
  readonly label: string;
  readonly href: string;
}

export interface Project {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  /** Resumen corto para tarjetas y resultados de búsqueda. */
  readonly summary: string;
  readonly body: string | null;
  readonly image: Media | null;
  readonly gallery: readonly Media[];
  /** Departamento de Colombia. Debe venir del dominio cerrado del CMS. */
  readonly department: string | null;
  /** Municipio o ciudad. */
  readonly municipality: string | null;
  /**
   * Coordenadas del proyecto. OJO: son datos de ubicación de infraestructura
   * del cliente. No deben ser más precisas que lo necesario y su publicación
   * debe estar aprobada por Midsummer.
   */
  readonly latitude: number | null;
  readonly longitude: number | null;
  /** Tipo de instalación. Texto controlado en el CMS. */
  readonly installType: string | null;
  /** Potencia en Wp. Solo si Midsummer autoriza publicarlo. */
  readonly capacityWp: number | null;
  readonly year: number | null;
  readonly status: string | null;
  readonly featured: boolean;
  readonly seo: SeoFields;
}

export interface Solution {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly summary: string;
  readonly body: string | null;
  readonly image: Media | null;
  /** Aplicaciones o usos típicos: industria, comercio, agrícola, etc. */
  readonly applications: readonly string[];
  readonly cta: Cta | null;
  readonly order: number;
  readonly seo: SeoFields;
}

export interface NewsPost {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly excerpt: string;
  readonly body: string | null;
  readonly image: Media | null;
  /** ISO 8601. */
  readonly publishedAt: string | null;
  readonly tags: readonly string[];
  readonly seo: SeoFields;
}

export interface Installer {
  readonly id: string;
  readonly slug: string;
  readonly companyName: string;
  readonly summary: string;
  readonly logo: Media | null;
  /** Departamentos donde opera. */
  readonly coverage: readonly string[];
  readonly website: string | null;
  readonly email: string | null;
  readonly phone: string | null;
  readonly seo: SeoFields;
}

export interface SiteSettings {
  readonly email: string;
  readonly phone: string | null;
  readonly address: string | null;
  readonly social: readonly { readonly label: string; readonly href: string }[];
}

export interface Media {
  readonly id: string;
  /** URL absoluta del recurso en el CMS. */
  readonly url: string;
  readonly alt: string;
  readonly width: number | null;
  readonly height: number | null;
}

/** Filtros de listado de proyectos. Todos opcionales. */
export interface ProjectFilters {
  readonly department?: string;
  readonly installType?: string;
  readonly year?: number;
}
