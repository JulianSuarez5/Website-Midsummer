/**
 * Proveedor de contenido de prueba.
 *
 * IMPORTANTE: los datos de este archivo son FICTICIOS. Existen únicamente
 * para poder visualizar el diseño y validar la experiencia. No son proyectos,
 * cifras, clientes ni ubicaciones reales de Midsummer.
 *
 * Este proveedor implementa exactamente la misma interfaz que el proveedor de
 * WordPress, lo que permite desarrollar y revisar todo el sitio sin tener un
 * CMS configurado.
 */

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

const MOCK_LABEL = 'MOCK DATA';

function mockMedia(id: string, alt: string): Media {
  return {
    id,
    // Sin imágenes reales: se usa un SVG de marcador local para no inventar
    // material gráfico de Midsummer ni depender de recursos externos.
    url: '/images/placeholder.svg',
    alt,
    width: 1200,
    height: 900,
  };
}

const solutions: readonly Solution[] = [
  {
    id: 'sol-1',
    slug: 'solucion-fotovoltaica-flexible',
    title: '[CONTENIDO PROVISIONAL — MIDSUMMER DEBE PROPORCIONAR TEXTO FINAL]',
    summary:
      'Descripción provisional de la línea de soluciones. Sustituir por la descripción oficial de producto aprobada por Midsummer.',
    body: null,
    image: mockMedia('img-sol-1', 'Imagen provisional de solución'),
    applications: ['CONTENIDO PENDIENTE DE APROBACIÓN'],
    cta: { label: 'Solicitar información', href: '/contacto/' },
    order: 1,
    seo: {},
  },
  {
    id: 'sol-2',
    slug: 'solucion-para-industria',
    title: '[CONTENIDO PROVISIONAL — MIDSUMMER DEBE PROPORCIONAR TEXTO FINAL]',
    summary:
      'Descripción provisional. El alcance, la potencia y las aplicaciones deben ser confirmados por Midsummer antes de publicar cualquier cifra.',
    body: null,
    image: mockMedia('img-sol-2', 'Imagen provisional de solución'),
    applications: ['CONTENIDO PENDIENTE DE APROBACIÓN'],
    cta: { label: 'Solicitar información', href: '/contacto/' },
    order: 2,
    seo: {},
  },
  {
    id: 'sol-3',
    slug: 'solucion-para-comercio',
    title: '[CONTENIDO PROVISIONAL — MIDSUMMER DEBE PROPORCIONAR TEXTO FINAL]',
    summary:
      'Descripción provisional. No publicar especificaciones técnicas hasta que Midsummer las entregue y las apruebe por escrito.',
    body: null,
    image: mockMedia('img-sol-3', 'Imagen provisional de solución'),
    applications: ['CONTENIDO PENDIENTE DE APROBACIÓN'],
    cta: { label: 'Solicitar información', href: '/contacto/' },
    order: 3,
    seo: {},
  },
];

const projects: readonly Project[] = [
  {
    id: 'prj-1',
    slug: 'proyecto-ejemplo-1',
    title: 'Proyecto ejemplo 1',
    summary:
      'Contenido de ejemplo para validar el diseño de la ficha de proyecto. No corresponde a una instalación real de Midsummer.',
    body: 'Contenido de ejemplo. Ningún dato de este registro es real.',
    image: mockMedia('img-prj-1', 'Imagen provisional de proyecto'),
    gallery: [],
    department: 'Cundinamarca (demo)',
    municipality: 'Bogotá D.C. (demo)',
    // Coordenadas [DEMO] solo para validar el mapa. No son una ubicación real
    // de Midsummer y deben reemplazarse por proyectos aprobados desde el CMS.
    latitude: 4.710989,
    longitude: -74.07209,
    installType: 'Cubierta industrial (demo)',
    capacityWp: 120000,
    year: 2024,
    status: 'En operación (demo)',
    featured: true,
    seo: {},
  },
  {
    id: 'prj-2',
    slug: 'proyecto-ejemplo-2',
    title: 'Proyecto ejemplo 2',
    summary:
      'Registro de muestra para comprobar la grilla y el estado vacío del listado. Datos ficticios.',
    body: null,
    image: mockMedia('img-prj-2', 'Imagen provisional de proyecto'),
    gallery: [],
    department: 'Antioquia (demo)',
    municipality: 'Medellín (demo)',
    // Coordenadas [DEMO] solo para validar el mapa. No son una ubicación real
    // de Midsummer y deben reemplazarse por proyectos aprobados desde el CMS.
    latitude: 6.244203,
    longitude: -75.581211,
    installType: 'Tipo de instalación (demo)',
    capacityWp: 180000,
    year: 2025,
    status: 'En operación (demo)',
    featured: true,
    seo: {},
  },
  {
    id: 'prj-3',
    slug: 'proyecto-ejemplo-3',
    title: 'Proyecto ejemplo 3',
    summary:
      'Tercer registro ficticio, necessário para validar el diseño responsive de la grilla.',
    body: null,
    image: mockMedia('img-prj-3', 'Imagen provisional de proyecto'),
    gallery: [],
    department: 'Valle del Cauca (demo)',
    municipality: 'Cali (demo)',
    // Coordenadas [DEMO] solo para validar el mapa. No son una ubicación real
    // de Midsummer y deben reemplazarse por proyectos aprobados desde el CMS.
    latitude: 3.451647,
    longitude: -76.531361,
    installType: 'Cubierta industrial (demo)',
    capacityWp: 80000,
    year: 2025,
    status: 'En operación (demo)',
    featured: false,
    seo: {},
  },
];

const news: readonly NewsPost[] = [
  {
    id: 'news-1',
    slug: 'noticia-ejemplo-1',
    title: 'Noticia de ejemplo 1',
    excerpt:
      'Resumen de ejemplo para validar la tarjeta de noticia. No contiene información real ni comunicados de Midsummer.',
    body: 'Cuerpo de ejemplo. Contenido ficticio.',
    image: mockMedia('img-news-1', 'Imagen provisional de noticia'),
    publishedAt: null,
    tags: ['EJEMPLO'],
    seo: {},
  },
  {
    id: 'news-2',
    slug: 'noticia-ejemplo-2',
    title: 'Noticia de ejemplo 2',
    excerpt:
      'Segundo registro ficticio. La fecha se deja sin valor a propósito: no se inventan fechas de publicación.',
    body: null,
    image: mockMedia('img-news-2', 'Imagen provisional de noticia'),
    publishedAt: null,
    tags: ['EJEMPLO'],
    seo: {},
  },
  {
    id: 'news-3',
    slug: 'noticia-ejemplo-3',
    title: 'Noticia de ejemplo 3',
    excerpt: 'Tercer registro de muestra para el listado.',
    body: null,
    image: mockMedia('img-news-3', 'Imagen provisional de noticia'),
    publishedAt: null,
    tags: ['EJEMPLO'],
    seo: {},
  },
];

const installers: readonly Installer[] = [
  {
    id: 'ins-1',
    slug: 'instalador-ejemplo-1',
    companyName: 'Instalador de ejemplo 1',
    summary:
      'Registro ficticio. El nombre, la cobertura y los datos de contacto deben provenir de Midsummer.',
    logo: null,
    coverage: ['CONTENIDO PENDIENTE DE APROBACIÓN'],
    website: null,
    email: null,
    phone: null,
    seo: {},
  },
  {
    id: 'ins-2',
    slug: 'instalador-ejemplo-2',
    companyName: 'Instalador de ejemplo 2',
    summary: 'Segundo registro de muestra para validar el diseño del directorio.',
    logo: null,
    coverage: ['CONTENIDO PENDIENTE DE APROBACIÓN'],
    website: null,
    email: null,
    phone: null,
    seo: {},
  },
];

const settings: SiteSettings = {
  email: 'PENDIENTE: MIDSUMMER DEBE PROPORCIONAR el correo de contacto oficial',
  phone: null,
  address: null,
  social: [],
};

export const mockProvider: ContentProvider = {
  name: MOCK_LABEL,

  async listSolutions() {
    return [...solutions].sort((a, b) => a.order - b.order);
  },

  async getSolution(slug) {
    return solutions.find((item) => item.slug === slug) ?? null;
  },

  async listProjects(filters: ProjectFilters = {}) {
    return projects.filter((project) => {
      if (filters.department && project.department !== filters.department) return false;
      if (filters.installType && project.installType !== filters.installType)
        return false;
      if (filters.year && project.year !== filters.year) return false;
      return true;
    });
  },

  async getProject(slug) {
    return projects.find((item) => item.slug === slug) ?? null;
  },

  async listFeaturedProjects(limit = 3) {
    return projects.filter((project) => project.featured).slice(0, limit);
  },

  async listNews(limit = 10) {
    return news.slice(0, limit);
  },

  async getNewsPost(slug) {
    return news.find((item) => item.slug === slug) ?? null;
  },

  async listInstallers() {
    return installers;
  },

  async getSettings() {
    return settings;
  },

  async getMedia(id) {
    const all = [
      ...solutions.map((item) => item.image),
      ...projects.map((item) => item.image),
      ...news.map((item) => item.image),
    ];
    return all.find((item) => item?.id === id) ?? null;
  },
};
