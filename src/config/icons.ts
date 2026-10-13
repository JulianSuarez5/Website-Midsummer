/**
 * Registro de iconos de interfaz.
 *
 * Fuente única de verdad para los paths SVG. La consumen tanto el componente
 * Astro (`Icon.astro`) como el de React (`Icon.tsx`), porque un componente
 * `.astro` no se puede renderizar desde dentro de una isla React: React lo
 * trataría como una función y Astro lo prohíbe explícitamente.
 *
 * Solo están los iconos que el sitio usa. SVG en línea: sin fuente de iconos,
 * sin petición de red, sin destellos de icono.
 */

export const ICON_NAMES = [
  'arrow-right',
  'arrow-up-right',
  'menu',
  'close',
  'pin',
  'linkedin',
  'instagram',
  'facebook',
  'youtube',
  'mail',
  'sun',
  'shield',
  'leaf',
] as const;

export type IconName = (typeof ICON_NAMES)[number];

export const ICON_PATHS: Record<IconName, string> = {
  'arrow-right': 'M4 12h16m0 0-6-6m6 6-6 6',
  'arrow-up-right': 'M7 17 17 7M8 7h9v9',
  menu: 'M4 7h16M4 12h16M4 17h16',
  close: 'M6 6l12 12M18 6L6 18',
  pin: 'M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
  linkedin:
    'M4.5 9h3v11h-3zM6 4.5a1.75 1.75 0 1 1 0 3.5 1.75 1.75 0 0 1 0-3.5ZM10.5 9h2.9v1.6c.4-.8 1.5-1.9 3.3-1.9 2.4 0 3.3 1.5 3.3 3.8V20h-3v-6.3c0-1.5-.5-2.4-1.8-2.4-1 0-1.7.7-1.9 1.4-.1.2-.1.6-.1.9V20h-2.7z',
  instagram:
    'M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Zm5 5.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7ZM17.5 6a.9.9 0 1 0 0 1.8.9.9 0 0 0 0-1.8Z',
  facebook:
    'M13.5 21v-7.5H15l.5-3h-2V8.8c0-.9.3-1.5 1.6-1.5h1V4.6c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8v2.2H8V14h2.2v7z',
  youtube:
    'M3 8.5A2.5 2.5 0 0 1 5.5 6h13A2.5 2.5 0 0 1 21 8.5v7a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 15.5zM10.5 9.8v4.4L14.5 12z',
  mail: 'M4 6h16v12H4zM4 7l8 6 8-6',
  sun: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0-6v3m0 14v3M2 12h3m14 0h3M4.9 4.9l2.1 2.1m10 10 2.1 2.1m0-14.2-2.1 2.1m-10 10-2.1 2.1',
  shield: 'M12 3 5 6v5.5c0 4.3 2.9 8.2 7 9.5 4.1-1.3 7-5.2 7-9.5V6zM9 12l2 2 4-4',
  leaf: 'M5 19c0-8 5-12 14-13-1 9-5 13-11 13H5Zm0 0c1.5-3 3.5-5 6-6.5',
};

/**
 * Iconos de marca. Se dibujan rellenos porque un logotipo de red social en
 * trazo se reconoce peor; el resto del sistema usa trazo.
 */
export const ICON_FILLED: ReadonlySet<IconName> = new Set([
  'linkedin',
  'instagram',
  'facebook',
  'youtube',
]);

export const isFilledIcon = (name: IconName) => ICON_FILLED.has(name);
