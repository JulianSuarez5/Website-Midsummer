/**
 * Árbol de navegación del sitio.
 *
 * La navegación se define aquí y se renderiza en el header, el menú móvil y
 * el pie de página. Si se agrega una sección, se agrega en un solo lugar.
 *
 * `href` apunta a la ruta interna con el prefijo de locale. Para English
 * se usaría `/en/...`; hoy solo existe `es`.
 */

export interface NavItem {
  readonly label: string;
  readonly href: string;
  /** Descripción corta para búsqueda y metadatos. */
  readonly description: string;
}

export const PRIMARY_NAV: readonly NavItem[] = [
  {
    label: 'Inicio',
    href: '/',
    description: 'Midsummer Colombia: qué hacemos y por qué importa.',
  },
  {
    label: 'Empresa',
    href: '/empresa/',
    description: 'Quiénes somos e información institucional.',
  },
  {
    label: 'Tecnología',
    href: '/tecnologia/',
    description: 'La propuesta tecnológica de Midsummer.',
  },
  {
    label: 'Soluciones',
    href: '/soluciones/',
    description: 'Productos y soluciones disponibles en Colombia.',
  },
  {
    label: 'Proyectos',
    href: '/proyectos/',
    description: 'Proyectos realizados y en desarrollo en Colombia.',
  },
  {
    label: 'Instaladores',
    href: '/instaladores/',
    description: 'Instaladores y aliados en Colombia.',
  },
  {
    label: 'Noticias',
    href: '/noticias/',
    description: 'Novedades y communicate de Midsummer Colombia.',
  },
  {
    label: 'Contacto',
    href: '/contacto/',
    description: 'Contacto comercial y solicitudes de información.',
  },
];

/** Enlaces legales del pie de página. PENDIENTE: texto legal aprobado por asesoría legal. */
export const FOOTER_LEGAL: readonly NavItem[] = [
  {
    label: 'Aviso de privacidad',
    href: '/privacidad/',
    description: 'Tratamiento de datos personales.',
  },
];

/** Enlaces de navegación que no dependen del CMS. */
export const FOOTER_SECTIONS = PRIMARY_NAV.filter(
  (item) => item.href !== '/' && item.href !== '/contacto/',
);
