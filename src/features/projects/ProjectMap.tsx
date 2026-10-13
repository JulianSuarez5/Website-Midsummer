/**
 * Mapa de proyectos.
 *
 * El componente no conoce Leaflet. Recibe el NOMBRE del proveedor y lo
 * resuelve con `loadMapProvider` dentro del navegador. Así:
 *
 *   - Las props siguen siendo datos serializables (requisito de las islas).
 *   - Leaflet entra en un chunk aparte que solo se descarga si hay mapa.
 *   - Cambiar de proveedor es cambiar `MAP_PROVIDER` en la configuración.
 *
 * Se monta con `client:visible`: el mapa no descarga su JavaScript en páginas
 * que no lo muestran, y en móvil espera a que la sección entre en pantalla.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { loadMapProvider } from '../../lib/map';
import type { MapPoint, MapViewOptions } from '../../lib/map/types';
import Icon from '../../components/ui/Icon';
import { t } from '../../lib/i18n';

/** Formatea una capacidad en Wp con separadores locales, o null si no aplica. */
function formatCapacity(value: number | null): string | null {
  if (value === null || !Number.isFinite(value) || value <= 0) return null;

  return `${new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 }).format(value)} Wp`;
}

/**
 * Ficha del proyecto seleccionado.
 *
 * Se dibuja FUERA de Leaflet, como hermana del contenedor del mapa. Los globos
 * nativos viven DENTRO del contenedor, que recorta con `overflow: hidden`, así
 * que se cortan en cuanto su alto supera el del mapa. Esta tarjeta no se
 * recorta y además desplaza su propio contenido. En móvil es una hoja
 * inferior; en pantallas grandes, un panel en la esquina superior derecha
 * (donde no choca con el control de zoom de Leaflet).
 */
function ProjectMapCard({ point, onClose }: { point: MapPoint; onClose: () => void }) {
  const location = [point.municipality, point.department]
    .filter((value): value is string => Boolean(value))
    .join(', ');

  const rows: { term: string; value: string | null }[] = [
    { term: t.project.installType, value: point.installType },
    { term: t.project.year, value: point.year === null ? null : String(point.year) },
    { term: t.project.capacity, value: formatCapacity(point.capacityWp) },
    { term: t.project.status, value: point.status },
  ];

  const meta = rows.filter(
    (row): row is { term: string; value: string } => row.value !== null,
  );

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label={`${t.project.mapCardTitle}: ${point.label}`}
      className="absolute inset-x-3 bottom-3 z-[1000] max-h-[85%] overflow-y-auto rounded-lg border border-border bg-surface p-4 shadow-lg sm:inset-x-auto sm:bottom-auto sm:right-4 sm:top-4 sm:w-80"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-2 top-2 inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-neutral-100 hover:text-foreground"
      >
        <span className="sr-only">{t.common.close}</span>
        <Icon name="close" className="h-5 w-5" />
      </button>

      {point.image && (
        <img
          src={point.image}
          alt=""
          loading="lazy"
          className="mb-3 aspect-video w-full rounded-md object-cover"
        />
      )}

      {location && (
        <p className="text-xs font-semibold uppercase tracking-wide text-accent">
          {location}
        </p>
      )}

      <h3 className="mt-0.5 pr-8 font-display text-base leading-snug text-foreground">
        {point.label}
      </h3>

      {point.summary && (
        <p className="mt-1.5 text-sm text-muted-foreground">{point.summary}</p>
      )}

      {meta.length > 0 && (
        <dl className="mt-3 flex flex-col gap-1 text-sm">
          {meta.map((row) => (
            <div key={row.term} className="flex justify-between gap-4">
              <dt className="text-muted-foreground">{row.term}</dt>
              <dd className="text-right font-semibold">{row.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {point.href && (
        <a
          href={point.href}
          className="mt-3 inline-block text-sm font-semibold text-accent underline underline-offset-2 hover:text-accent-hover"
        >
          {t.project.viewProject}
        </a>
      )}
    </div>
  );
}

interface Props extends Omit<MapViewOptions, 'onSelect' | 'points'> {
  providerName: string;
  points: MapViewOptions['points'];
  /** Texto cuando todavía no hay proyectos con ubicación publicada. */
  noPointsMessage: string;
  /** Etiqueta del listado alternativo accesible. */
  listFallbackLabel: string;
  className?: string;
}

export default function ProjectMap({
  providerName,
  points,
  noPointsMessage,
  listFallbackLabel,
  className,
  ...mapOptions
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const [selected, setSelected] = useState<MapPoint | null>(null);

  const handleSelect = useCallback((point: MapPoint | null) => {
    setSelected(point);
  }, []);

  // Serializado para que un cambio de props reconstruya el mapa. `onSelect`
  // es una función y no es comparable, por eso queda fuera de la dependencia.
  const optionsKey = JSON.stringify({ ...mapOptions, points });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let disposed = false;
    let cleanup: (() => void) | undefined;

    loadMapProvider(providerName)
      .then((provider) => {
        if (disposed) return;
        cleanup = provider.mount(container, {
          ...mapOptions,
          points,
          onSelect: handleSelect,
        });
      })
      .catch((error) => {
        console.error('[map] no se pudo cargar el proveedor', error);
        if (!disposed) setFailed(true);
      });

    return () => {
      disposed = true;
      cleanup?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providerName, optionsKey, handleSelect]);

  if (points.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border bg-surface px-6 py-10 text-center text-sm text-muted-foreground">
        {noPointsMessage}
      </p>
    );
  }

  if (failed) {
    return (
      <div
        className={`flex items-center justify-center rounded-lg border border-danger/40 bg-danger/5 px-6 py-10 text-center text-sm text-muted-foreground ${className ?? ''}`}
        role="alert"
      >
        No pudimos cargar el mapa de proyectos. El listado de proyectos sigue
        disponible.
      </div>
    );
  }

  return (
    <>
      <div className="relative">
        <div
          ref={containerRef}
          role="application"
          aria-label={mapOptions.ariaLabel}
          className={`h-[26rem] w-full overflow-hidden rounded-lg border border-border bg-neutral-100 sm:h-[30rem] ${className ?? ''}`}
        />

        {selected && (
          <ProjectMapCard point={selected} onClose={() => setSelected(null)} />
        )}
      </div>

      {/*
        Alternativa accesible. Un mapa es una imagen para un lector de
        pantalla: sin este listado, la información de ubicación quedaría
        inaccesible. También cubre el caso en que el mapa no carga.
      */}
      <details className="mt-4 rounded-lg border border-border bg-surface p-4">
        <summary className="cursor-pointer text-sm font-semibold text-foreground">
          {listFallbackLabel} ({points.length})
        </summary>

        <ul className="mt-3 flex flex-col gap-3">
          {points.map((point) => (
            <li key={point.id} className="text-sm">
              {point.href ? (
                <a
                  href={point.href}
                  className="font-medium text-accent hover:underline"
                >
                  {point.label}
                </a>
              ) : (
                <span className="font-medium text-foreground">{point.label}</span>
              )}

              {point.summary && (
                <p className="mt-0.5 text-muted-foreground">{point.summary}</p>
              )}
            </li>
          ))}
        </ul>
      </details>
    </>
  );
}
