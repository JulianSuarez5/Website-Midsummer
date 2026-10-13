/**
 * Adaptador de mapa con Leaflet.
 *
 * Este es el ÚNICO archivo del proyecto que importa Leaflet. Por eso se puede
 * reemplazar el proveedor sin tocar las páginas ni los componentes.
 *
 * Leaflet: licencia MIT, ~42 kB comprimido sin comprimir con iconos, sin
 * dependencia obligatoria de API y con soporte de teselas de OpenStreetMap.
 * Además es la pila que ya usa el sitio de la casa matriz, lo que da
 * coherencia institucional sin dependencia técnica compartida.
 *
 * Alternativa si Midsummer lo requiere: MapLibre (vectorial, sin clave para
 * teselas gratuitas) o MapTiler/Mapbox (mejorappearance, plan de pago).
 */

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { MapPoint, MapProvider, MapViewOptions } from '../types';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Etiqueta breve que aparece al pasar el cursor por encima de un marcador. */
function tooltipHtml(point: MapPoint): string {
  const location = [point.municipality, point.department]
    .filter((value): value is string => Boolean(value))
    .join(', ');

  const place = location
    ? `<span class="midsummer-tooltip__place">${escapeHtml(location)}</span>`
    : '';

  return `<span class="midsummer-tooltip__name">${escapeHtml(point.label)}</span>${place}`;
}

/**
 * Icono del marcador: una chincheta de ubicación (map-pin) en lugar de un
 * punto. El color lo define el CSS con `currentColor`, así que re-tematizarlo
 * es cambiar un token, no este SVG.
 */
const MARKER_SVG = `
<svg viewBox="0 0 24 24" width="30" height="40" aria-hidden="true" focusable="false">
  <path fill="currentColor" d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Z"/>
  <circle cx="12" cy="9" r="2.5" fill="var(--color-surface, #fff)"/>
</svg>`;

function markerIcon(): L.DivIcon {
  return L.divIcon({
    className: 'midsummer-marker',
    html: MARKER_SVG,
    iconSize: [30, 40],
    // El ancla es la punta inferior de la chincheta: ahí está el punto real.
    iconAnchor: [15, 40],
  });
}

export const leafletProvider: MapProvider = {
  name: 'leaflet',

  mount(container, options: MapViewOptions) {
    const map = L.map(container, {
      center: [options.center.lat, options.center.lng],
      zoom: options.zoom,
      minZoom: options.minZoom,
      maxZoom: options.maxZoom,
      // Colombia continental: acotar evita que al hacer zoom out se carguen
      // teselas de otros países, que es trabajo de red desperdiciado.
      maxBounds: [
        [options.bounds.south, options.bounds.west],
        [options.bounds.north, options.bounds.east],
      ],
      scrollWheelZoom: false,
      attributionControl: true,
    });

    // Al pulsar el mapa (fuera de un marcador) se cierra la ficha del proyecto.
    // El marcador marca `markerClickHandled` para que el clic que lo abre no
    // llegue también aquí y la cierre en el mismo instante.
    let markerClickHandled = false;

    // El scroll de la rueda solo tras un clic, para no robar el desplazamiento
    // de la página a quien nunca interactuó con el mapa.
    map.on('click', () => {
      map.scrollWheelZoom.enable();

      if (markerClickHandled) {
        markerClickHandled = false;
        return;
      }

      options.onSelect?.(null);
    });
    map.on('mouseout', () => map.scrollWheelZoom.disable());

    L.tileLayer(options.tileUrl, {
      attribution: options.attribution,
      maxZoom: options.maxZoom,
      crossOrigin: true,
    }).addTo(map);

    const group = L.featureGroup();

    for (const point of options.points) {
      const marker = L.marker([point.lat, point.lng], {
        icon: markerIcon(),
        // El marcador se eleva al pasar el cursor para quedar por encima de
        // los puntos vecinos.
        riseOnHover: true,
        // El texto alternativo del marcador no lo lee un lector de pantalla
        // dentro de un canvas; el listado `<details>` del componente es la
        // vía accesible real.
        alt: point.label,
        keyboard: true,
      });

      // Al pasar el cursor: nombre del proyecto y ubicación.
      marker.bindTooltip(tooltipHtml(point), {
        className: 'midsummer-tooltip',
        direction: 'top',
        offset: [0, -12],
        opacity: 1,
      });

      // Al pulsar: se avisa a la interfaz, que abre la ficha del proyecto.
      // La ficha vive fuera de Leaflet (no es un globo), así que no se recorta
      // contra el borde del mapa.
      marker.on('click', () => {
        markerClickHandled = true;
        options.onSelect?.(point);
        window.setTimeout(() => {
          markerClickHandled = false;
        }, 0);
      });

      marker.addTo(group);
    }

    group.addTo(map);

    if (options.points.length > 1) {
      map.fitBounds(group.getBounds(), { padding: [40, 40], maxZoom: options.maxZoom });
    }

    // El contenedor cambia de tamaño entre el momento del render y el del
    // montaje (por ejemplo al rotar el móvil). Sin esto el mapa queda con
    // áreas grises.
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(container);

    return () => {
      observer.disconnect();
      map.remove();
    };
  },
};
