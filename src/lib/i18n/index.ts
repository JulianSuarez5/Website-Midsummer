/**
 * Punto de acceso a los textos de interfaz.
 *
 * Hoy solo existe español (es-CO). Cuando se agregue inglés se registra
 * `en.ts` aquí y el selector de locale resuelve por la ruta (`/en/...`).
 * La aplicación no se duplica: solo se agrega un archivo de mensajes.
 */

import { SITE } from '../../config/site.config';
import { es } from './es';

const messages = {
  es,
} as const;

export type Locale = keyof typeof messages;

export const DEFAULT_LOCALE: Locale = 'es';

export function getMessages(locale: Locale = DEFAULT_LOCALE) {
  return messages[locale];
}

export const t = getMessages();

/** Locale de Open Graph en formato `es_CO`. */
export const ogLocale = SITE.ogLocale;

export type { Messages } from './es';
