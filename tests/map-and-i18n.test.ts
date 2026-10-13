/**
 * Pruebas del contrato del mapa y de los textos de interfaz.
 *
 * El mapa tiene una regla que no es negociable: un punto sin coordenadas
 * publicables no se dibuja. Publicar la ubicación de una instalación sin
 * autorización de Midsummer es una filtración de datos del cliente, y un punto
 * más en el mapa es la forma más fácil de que ocurra por descuido.
 */
import { describe, expect, it } from 'vitest';
import { toMapPoints } from '../src/lib/map/types';
import { t } from '../src/lib/i18n';

const item = (overrides: Record<string, unknown> = {}) => ({
  id: '1',
  slug: 'proyecto-demo',
  title: 'Proyecto demo',
  summary: 'Resumen',
  latitude: 6.17 as number | null,
  longitude: -75.59 as number | null,
  image: null as { url: string } | null,
  department: 'Antioquia',
  municipality: 'Envigado',
  installType: 'Industrial',
  capacityWp: 250000,
  year: 2026,
  status: 'Operativo',
  ...overrides,
});

describe('toMapPoints', () => {
  it('convierte un proyecto con coordenadas', () => {
    const [point] = toMapPoints([item()]);

    expect(point).toEqual({
      id: '1',
      label: 'Proyecto demo',
      lat: 6.17,
      lng: -75.59,
      summary: 'Resumen',
      href: '/proyectos/proyecto-demo/',
      image: null,
      municipality: 'Envigado',
      department: 'Antioquia',
      installType: 'Industrial',
      capacityWp: 250000,
      year: 2026,
      status: 'Operativo',
    });
  });

  it('deja en null los datos del globo que no llegan', () => {
    const [point] = toMapPoints([
      item({
        department: undefined,
        municipality: undefined,
        installType: undefined,
        capacityWp: undefined,
        year: undefined,
        status: undefined,
      }),
    ]);

    expect(point?.municipality).toBeNull();
    expect(point?.department).toBeNull();
    expect(point?.installType).toBeNull();
    expect(point?.capacityWp).toBeNull();
    expect(point?.year).toBeNull();
    expect(point?.status).toBeNull();
  });

  it('descarta proyectos sin una o las dos coordenadas', () => {
    const points = toMapPoints([
      item({ slug: 'sin-lat', latitude: null }),
      item({ slug: 'sin-lng', longitude: null }),
      item({ slug: 'completo' }),
    ]);

    expect(points.map((point) => point.href)).toEqual(['/proyectos/completo/']);
  });

  it('descarta coordenadas no finitas', () => {
    const points = toMapPoints([item({ latitude: Number.NaN })]);

    expect(points).toHaveLength(0);
  });

  it('usa la imagen del proyecto cuando existe', () => {
    const [point] = toMapPoints([
      item({ image: { url: 'https://example.com/foto.jpg' } }),
    ]);

    expect(point?.image).toBe('https://example.com/foto.jpg');
  });

  it('devuelve una lista vacía si no hay proyectos', () => {
    expect(toMapPoints([])).toEqual([]);
  });
});

describe('textos de interfaz', () => {
  it('no deja claves sin traducir en español', () => {
    const missing: string[] = [];

    const walk = (node: unknown, path: string) => {
      if (typeof node === 'string') {
        if (node.trim() === '') missing.push(path);
        return;
      }
      if (node && typeof node === 'object') {
        for (const [key, value] of Object.entries(node)) walk(value, `${path}.${key}`);
      }
    };

    walk(t, 't');

    expect(missing).toEqual([]);
  });
});
