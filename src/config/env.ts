/**
 * Lectura y validación de variables de entorno.
 *
 * Todo acceso a las variables pasa por aquí. Si falta una variable requerida,
 * el build falla con un mensaje explícito en lugar de publicar un sitio
 * silenciosamente roto.
 *
 * Se lee de `import.meta.env` y no de `process.env` a propósito: Astro carga
 * los archivos `.env` a través de Vite, que los expone en `import.meta.env`.
 * `process.env` solo contiene variables reales del sistema, por lo que leer de
 * ahí haría que un `.env` bien escrito se ignorara sin ningún aviso.
 *
 * Nota de seguridad: en un sitio con salida estática no existen "variables
 * secretas". Cualquier valor `PUBLIC_` viaja en el bundle. Por eso este archivo
 * no expone secretos: solo lee lo que es público por diseño. La credencial del
 * CMS se usa únicamente durante el build y nunca llega al navegador.
 */
import { z } from 'zod';

/** Valores por defecto pensados para que el prototipo funcione sin configurar nada. */
const schema = z.object({
  SITE_URL: z.url().default('https://midsummersolar.co'),

  CMS_PROVIDER: z.enum(['mock', 'wordpress']).default('mock'),

  CMS_API_URL: z
    .url()
    .optional()
    .or(z.literal('').transform(() => undefined)),

  CMS_ALLOWED_ORIGINS: z.string().optional(),

  CMS_STRICT: z
    .enum(['true', 'false'])
    .default('true')
    .transform((value) => value === 'true'),

  CMS_AUTH_USER: z.string().optional(),
  CMS_AUTH_APP_PASSWORD: z.string().optional(),

  MAP_PROVIDER: z.string().default('leaflet'),
  MAP_TILE_URL: z.string().optional(),
  MAP_TILE_ATTRIBUTION: z.string().optional(),
  MAP_API_KEY: z.string().optional(),

  PUBLIC_ANALYTICS_ID: z.string().optional(),
  PUBLIC_GTM_ID: z.string().optional(),
  PUBLIC_TURNSTILE_SITE_KEY: z.string().optional(),
});

export type Env = z.infer<typeof schema>;

/**
 * Las claves se leen una a una y de forma estática. Un acceso dinámico
 * (`import.meta.env[clave]`) no sería reemplazado por el bundler y volvería a
 * fallar en silencio en el build.
 */
function collect(): Record<string, string | undefined> {
  const source = import.meta.env;

  // Un `.env` guardado por editors de Windows suele traer un BOM al principio,
  // que se cuela en el nombre de la primera variable. El síntoma es un error
  // desconcertante del tipo "SITE_URL: Invalid URL" en una variable que sí está
  // escrita bien, así que se quita aquí en lugar de obligar a reguardar el
  // archivo con otro editor.
  const read = (key: string): string | undefined => {
    const value = source[key];

    if (typeof value !== 'string') return undefined;

    return value.replace(/^\uFEFF/, '');
  };

  return {
    SITE_URL: read('SITE_URL'),
    CMS_PROVIDER: read('CMS_PROVIDER'),
    CMS_API_URL: read('CMS_API_URL'),
    CMS_ALLOWED_ORIGINS: read('CMS_ALLOWED_ORIGINS'),
    CMS_STRICT: read('CMS_STRICT'),
    CMS_AUTH_USER: read('CMS_AUTH_USER'),
    CMS_AUTH_APP_PASSWORD: read('CMS_AUTH_APP_PASSWORD'),
    MAP_PROVIDER: read('MAP_PROVIDER'),
    MAP_TILE_URL: read('MAP_TILE_URL'),
    MAP_TILE_ATTRIBUTION: read('MAP_TILE_ATTRIBUTION'),
    MAP_API_KEY: read('MAP_API_KEY'),
    PUBLIC_ANALYTICS_ID: read('PUBLIC_ANALYTICS_ID'),
    PUBLIC_GTM_ID: read('PUBLIC_GTM_ID'),
    PUBLIC_TURNSTILE_SITE_KEY: read('PUBLIC_TURNSTILE_SITE_KEY'),
  };
}

function load(): Env {
  const raw = collect();

  // Una variable declarada pero vacía se trata como ausente, para que
  // `CMS_API_URL=` en `.env` no se confunda con una URL configurada.
  const defined: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (value !== undefined && value !== '') defined[key] = value;
  }

  const result = schema.safeParse(defined);

  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');

    throw new Error(
      `Configuración de entorno inválida. Revisa .env (plantilla en .env.example):\n${details}`,
    );
  }

  return result.data;
}

export const env = load();

/** Dominio público sin barra final, usado para canonical, sitemap y JSON-LD. */
export const SITE_URL = env.SITE_URL.replace(/\/$/, '');

/** Lista de orígenes permitidos para que Astro consulte el CMS durante el build. */
export const CMS_ALLOWED_ORIGINS = env.CMS_ALLOWED_ORIGINS
  ? env.CMS_ALLOWED_ORIGINS.split(',')
      .map((origin) => origin.trim())
      .filter((origin) => origin !== '')
  : undefined;
