/**
 * Resolución del adaptador de mapa.
 *
 * El mapa se carga de forma diferida dentro del navegador. Dos razones:
 *
 * 1. Las props de una isla React tienen que ser serializables a JSON, así que
 *    no se puede pasar el objeto proveedor desde Astro.
 * 2. Una importación estática aquí incluiría Leaflet en el bundle de cualquier
 *    página, aunque no tenga mapa. Al usar `import()` dinámico, el código
 *    y Leaflet se descargan solo cuando el mapa debe mostrarse (intersection
 *    con la vista), lo que evita cargar JavaScript innecesario.
 *
 * Solo se usa en desarrollo: `php -S localhost:8080 -t . router.php`.
 *
 * @package Midsummer
 */

import type { MapProvider } from './types';

/**
 * Nombres de proveedor soportados, para validar configuración.
 */
export const availableMapProviders = ['leaflet'];

/**
 * Cargadores de proveedor.
 *
 * Cada entrada es un `import()` con una ruta LITERAL, no una plantilla. Vite
 * necesita la ruta estática en el punto del import para poder generar el chunk
 * diferido: con `import(\`./adapters/${name}\`)` el plugin de import dinámico se
 * salta la resolución y el archivo no entra en el build, así que el mapa
 * funciona en `dev` pero desaparece al desplegar. Con el mapa explícito, el
 * código y Leaflet siguen descargándose solo cuando la isla se hace visible,
 * pero el chunk existe de verdad en la salida.
 */
const providerLoaders: Record<string, () => Promise<MapProvider>> = {
  leaflet: async () => (await import('./adapters/leaflet')).leafletProvider,
};

/**
 * Carga el proveedor de mapas solicitado.
 *
 * Usa `import()` dinámico para que el código y Leaflet solo se descarguen
 * en el navegador cuando el mapa debe renderizarse (la isla es `client:visible`).
 * Si el proveedor no está disponible, lanza un error descriptivo.
 *
 * @param name - Nombre del proveedor a cargar (ej. 'leaflet').
 * @returns Una Promise que se resuelve con el objeto MapProvider.
 */
export async function loadMapProvider(name: string): Promise<MapProvider> {
  const load = providerLoaders[name];

  if (!load) {
    throw new Error(
      `Proveedor de mapa desconocido: "${name}". Disponibles: ${availableMapProviders.join(', ')}`,
    );
  }

  return load();
}
