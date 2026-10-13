/**
 * Contrato del mapa de proyectos.
 *
 * El mapa NO se expone directamente a los componentes. La UI consume
 * `MapPoint[]` y un adaptador implementa `MapProvider`. Cambiar de Leaflet a
 * MapLibre, Mapbox o Google es agregar un adaptador y cambiar una variable de
 * entorno: no tocar las páginas ni las tarjetas.
 *
 * Razón: un proveedor de mapas es una dependencia externa cara de cambiar
 * (licencia, coste, privacidad, rendimiento). La flexibilidad se paga aquí,
 * en un solo archivo.
 */

export interface MapPoint {
  readonly id: string;
  readonly label: string;
  readonly lat: number;
  readonly lng: number;
  /** Texto corto para el marcador emergente. */
  readonly summary: string | null;
  /** Ruta interna del proyecto. */
  readonly href: string | null;
  readonly image: string | null;
  /** Municipio o ciudad, para el globo del marcador. */
  readonly municipality: string | null;
  /** Departamento, para el globo del marcador. */
  readonly department: string | null;
  /** Tipo de instalación, para el globo del marcador. */
  readonly installType: string | null;
  /** Potencia en Wp. Se muestra solo si el CMS la expone. */
  readonly capacityWp: number | null;
  readonly year: number | null;
  /** Estado del proyecto (operativo, en construcción, etc.). */
  readonly status: string | null;
}

export interface MapBounds {
  readonly south: number;
  readonly west: number;
  readonly north: number;
  readonly east: number;
}

export interface MapViewOptions {
  readonly center: { readonly lat: number; readonly lng: number };
  readonly zoom: number;
  readonly minZoom: number;
  readonly maxZoom: number;
  readonly bounds: MapBounds;
  readonly tileUrl: string;
  readonly attribution: string;
  readonly points: readonly MapPoint[];
  /** Etiqueta accesible del mapa. */
  readonly ariaLabel: string;
  /**
   * Se invoca al seleccionar un punto. Recibe `null` cuando se hace clic en el
   * mapa fuera de un marcador, para que la interfaz cierre la ficha abierta.
   */
  readonly onSelect?: (point: MapPoint | null) => void;
}

export interface MapProvider {
  readonly name: string;
  /**
   * Monta el mapa en el elemento dado. Devuelve una función de limpieza.
   * Se ejecuta en el navegador, nunca durante el build.
   */
  mount(container: HTMLElement, options: MapViewOptions): () => void;
}

/** Proyecto tal como lo consume el mapa, con los campos que puede mostrar. */
export interface MapProjectInput {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly summary: string;
  readonly latitude: number | null;
  readonly longitude: number | null;
  readonly image?: { readonly url: string } | null;
  readonly department?: string | null;
  readonly municipality?: string | null;
  readonly installType?: string | null;
  readonly capacityWp?: number | null;
  readonly year?: number | null;
  readonly status?: string | null;
}

/** Filtra los puntos que tienen coordenadas válidas dentro de Colombia. */
export function toMapPoints(items: readonly MapProjectInput[]): readonly MapPoint[] {
  return items
    .filter(
      (item): item is typeof item & { latitude: number; longitude: number } =>
        typeof item.latitude === 'number' &&
        typeof item.longitude === 'number' &&
        Number.isFinite(item.latitude) &&
        Number.isFinite(item.longitude),
    )
    .map((item) => ({
      id: item.id,
      label: item.title,
      lat: item.latitude,
      lng: item.longitude,
      summary: item.summary,
      href: `/proyectos/${item.slug}/`,
      image: item.image?.url ?? null,
      municipality: item.municipality ?? null,
      department: item.department ?? null,
      installType: item.installType ?? null,
      capacityWp: item.capacityWp ?? null,
      year: item.year ?? null,
      status: item.status ?? null,
    }));
}
