/**
 * Configuración central de marca, dominio e identidad institucional.
 *
 * Este es el único lugar donde vive el dominio, el nombre de marca y los
 * enlaces institucionales. Cambiar cualquiera de ellos no debe requerir
 * tocar componentes.
 */
import { SITE_URL } from './env';

export interface SocialLink {
  /** Nombre legible para lectores de pantalla. */
  readonly label: string;
  /** URL pública del perfil. PENDIENTE: MIDSUMMER DEBE PROPORCIONAR las URLs oficiales. */
  readonly href: string;
  /** Nombre del icono en src/components/ui/Icon.astro */
  readonly icon: 'linkedin' | 'instagram' | 'facebook' | 'youtube' | 'mail';
}

export interface SiteConfig {
  /** Nombre comercial usado en títulos, JSON-LD y pie de página. */
  readonly name: string;
  /** Sufijo de marca. Colombia y Suecia comparten nombre, no identidad. */
  readonly market: string;
  /** Dominio público, sin barra final. */
  readonly url: string;
  /** Código de locale BCP-47. */
  readonly locale: string;
  /** Texto del atributo lang. */
  readonly language: string;
  /** Locale regional para Open Graph. */
  readonly ogLocale: string;
  /**
   * Claim principal. PROVISIONAL: tomado de la señal pública del sitio de
   * Suecia, no de un documento de marca. Debe aprobarlo Midsummer Colombia.
   */
  readonly tagline: string;
  /** Descripción por defecto para SEO. */
  readonly description: string;
  readonly email: string;
  readonly phone: string | null;
  readonly address: string | null;
  /** URL del sitio de la casa matriz. Enlace institucional, no técnico. */
  readonly sweden: {
    readonly label: string;
    readonly url: string;
  };
  readonly social: readonly SocialLink[];
  /** Marcas de agua para contenido pendiente de aprobación. */
  readonly pendingContentLabel: string;
}

export const SITE: SiteConfig = {
  name: 'Midsummer',
  market: 'Colombia',
  url: SITE_URL,
  locale: 'es-CO',
  language: 'es',
  ogLocale: 'es_CO',
  tagline: 'Tecnología solar sin silicio',
  description:
    'Midsummer Colombia: tecnología solar ligera y de bajo impacto para proyectos en Colombia.',
  email: 'PENDIENTE: MIDSUMMER DEBE PROPORCIONAR el correo de contacto oficial',
  phone: null,
  address: null,
  sweden: {
    label: 'Midsummer Sweden',
    url: 'https://midsummer.se/',
  },
  social: [
    {
      label: 'Midsummer en LinkedIn',
      href: 'PENDIENTE: MIDSUMMER DEBE PROPORCIONAR la URL oficial de LinkedIn',
      icon: 'linkedin',
    },
    {
      label: 'Midsummer en Instagram',
      href: 'PENDIENTE: MIDSUMMER DEBE PROPORCIONAR la URL oficial de Instagram',
      icon: 'instagram',
    },
  ],
  pendingContentLabel: 'Contenido pendiente de aprobación',
};

/** Construye una URL absoluta a partir de una ruta interna. */
export function absoluteUrl(path = '/'): string {
  return new URL(path, `${SITE.url}/`).toString();
}
