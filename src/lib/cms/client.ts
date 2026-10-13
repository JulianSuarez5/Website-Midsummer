/**
 * Cliente de la REST API de WordPress.
 *
 * Se ejecuta durante el build (nunca en el navegador), porque el sitio se
 * genera estático. Por eso:
 *
 * - Se puede (y debe) usar una credencial de lectura sin que llegue al bundle.
 * - La latencia se paga una vez por build, no en cada visita.
 * - Si WordPress no responde, se decide explícitamente si el build falla.
 *
 * La credencial recomendada es un Application Password de un usuario con
 * permisos solo de lectura, no la cuenta de administrador.
 */

import { env, CMS_ALLOWED_ORIGINS } from '../../config/env';

const DEFAULT_TIMEOUT_MS = 10_000;

export class CmsError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'CmsError';
  }
}

function authHeader(): Record<string, string> {
  if (!env.CMS_AUTH_USER || !env.CMS_AUTH_APP_PASSWORD) return {};

  const credentials = Buffer.from(
    `${env.CMS_AUTH_USER}:${env.CMS_AUTH_APP_PASSWORD}`,
  ).toString('base64');

  return { Authorization: `Basic ${credentials}` };
}

/** Campos que se piden a WordPress. Mantenerlos mínimos mejora el tiempo de build. */
function baseFields(): string {
  return 'id,slug,title,excerpt,content,link,featured_media';
}

export interface FetchOptions {
  readonly search?: URLSearchParams;
}

export async function cmsFetch<T>(
  path: string,
  { search }: FetchOptions = {},
): Promise<T> {
  if (!env.CMS_API_URL) {
    throw new CmsError('CMS_PROVIDER=wordpress requiere CMS_API_URL. Revisa .env.');
  }

  const url = new URL(path, `${env.CMS_API_URL.replace(/\/$/, '')}/`);

  if (search) {
    url.search = search.toString();
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        ...authHeader(),
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new CmsError(
        `WordPress respondió ${response.status} ${response.statusText} para ${url.pathname}`,
      );
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof CmsError) throw error;

    if (error instanceof Error && error.name === 'AbortError') {
      throw new CmsError(`Tiempo de espera agotado al consultar ${url.pathname}`);
    }

    throw new CmsError(`No se pudo consultar el CMS en ${url.pathname}`, error);
  } finally {
    clearTimeout(timeout);
  }
}

export { baseFields, CMS_ALLOWED_ORIGINS };
