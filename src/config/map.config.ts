/**
 * Configuración del mapa de proyectos.
 *
 * El mapa está detrás de una interfaz (src/lib/map/) para poder cambiar de
 * proveedor sin reescribir la aplicación. Cambiar de Leaflet/OSM a MapTiler o
 * Mapbox debe ser una modificación de este archivo y, en el peor caso, de un
 * adaptador: nunca de los componentes que lo consumen.
 *
 * Referencia institucional: el sitio de Suecia usa OpenStreetMap con Leaflet
 * (plugin osm-map-elementor). Mantener coherencia con la casa matriz.
 */
import { env } from './env';

export interface MapConfig {
  /** Identificador del adaptador activo en src/lib/map/adapters/ */
  readonly provider: string;
  /** Plantilla de URL de teselas. {s} = subdominio, {z}/{x}/{y} = tesela. */
  readonly tileUrl: string;
  /** Atribución obligatoria. No eliminar: es un requisito de OpenStreetMap. */
  readonly attribution: string;
  /** Centro por defecto: Colombia continental. */
  readonly center: { readonly lat: number; readonly lng: number };
  readonly zoom: number;
  /** Límites aproximados de Colombia continental, para acotar el paneo. */
  readonly bounds: {
    readonly south: number;
    readonly west: number;
    readonly north: number;
    readonly east: number;
  };
  /** Zoom máximo para evitar cargar teselas de otros países al hacer zoom-out. */
  readonly maxZoom: number;
  readonly minZoom: number;
}

export const MAP: MapConfig = {
  provider: env.MAP_PROVIDER,
  tileUrl: env.MAP_TILE_URL ?? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution:
    env.MAP_TILE_ATTRIBUTION ??
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> — colaboradores',
  center: { lat: 4.5709, lng: -74.2973 },
  zoom: 6,
  bounds: { south: -4.3, west: -79.1, north: 13.6, east: -66.8 },
  maxZoom: 18,
  minZoom: 4,
};
