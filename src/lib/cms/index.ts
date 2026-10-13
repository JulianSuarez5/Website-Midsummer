/**
 * Selección del proveedor de contenido.
 *
 * Único punto del código que decide de dónde viene el contenido. Gracias a
 * esto, las páginas no saben (ni necesitan saber) si hay un WordPress
 * detrás, y el prototipo se desarrolla sin CMS.
 */

import { env } from '../../config/env';
import type { ContentProvider } from './provider';
import { mockProvider } from './providers/mock';
import { wordpressProvider } from './providers/wordpress';

let instance: ContentProvider | null = null;

export function getContentProvider(): ContentProvider {
  if (instance) return instance;

  if (env.CMS_PROVIDER === 'wordpress') {
    instance = wordpressProvider;
  } else {
    instance = mockProvider;
  }

  return instance;
}

/** Reinicia el proveedor. Solo se usa en pruebas. */
export function resetContentProvider(): void {
  instance = null;
}

export type { ContentProvider };
