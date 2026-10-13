/**
 * Pruebas de la capa de estilos.
 *
 * Aquí no se prueba "que se vea bonito", que no se puede automatizar, sino las
 * dos cosas que han roto el sitio de verdad y que se ven igual de bien desde el
 * código:
 *
 *   1. Que los estilos globales se importen. El sitio llegó a servirse sin una
 *      sola hoja de estilo porque ningún componente importaba `global.css`.
 *   2. Que el contenedor de layout no choque con Tailwind. Con el nombre
 *      `container`, la utilidad propia de Tailwind v4 ganaba por orden del CSS
 *      y los anchos de página se ignoraban en silencio.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(__dirname, '..');

/** Lee un archivo del repositorio. */
const read = (path: string): string => readFileSync(join(ROOT, path), 'utf8');

/** Devuelve todos los archivos con una extensión concreta. */
function filesIn(dir: string, extension: string): string[] {
  const found: string[] = [];

  for (const entry of readdirSync(join(ROOT, dir))) {
    const full = join(dir, entry);

    if (statSync(join(ROOT, full)).isDirectory()) {
      found.push(...filesIn(full, extension));
    } else if (entry.endsWith(extension)) {
      found.push(full);
    }
  }

  return found;
}

describe('carga de estilos globales', () => {
  it('BaseLayout importa global.css', () => {
    const layout = read('src/components/layout/BaseLayout.astro');

    expect(layout).toMatch(/import\s+['"][^'"]*styles\/global\.css['"]/);
  });

  it('los estilos se importan una sola vez, desde el layout', () => {
    const importers = filesIn('src', '.astro').filter((file) =>
      /import\s+['"][^'"]*styles\/global\.css['"]/.test(read(file)),
    );

    // Importarlo en cada página duplicaría el bundle en el build. El resultado
    // se compara con separadores normalizados para que la prueba no dependa de
    // si se ejecuta en Windows o en Unix.
    const normalized = importers.map((file) => file.split('\\').join('/'));

    // Importarlo en cada página duplicaría el bundle en el build.
    expect(normalized).toEqual(['src/components/layout/BaseLayout.astro']);
  });

  it('global.css carga los tokens y Tailwind, en ese orden', () => {
    const css = read('src/styles/global.css');
    const tokens = css.indexOf("@import './tokens.css'");
    const tailwind = css.indexOf("@import 'tailwindcss'");

    expect(tokens).toBeGreaterThan(-1);
    expect(tailwind).toBeGreaterThan(-1);
    // Tailwind genera las utilidades en la capa base: si se cargara antes, sus
    // resets entrarían después y las reglas de tokens perderían.
    expect(tokens).toBeLessThan(tailwind);
  });

  it('declara los tokens que el resto del sistema da por hechos', () => {
    const tokens = read('src/styles/tokens.css');

    for (const token of [
      '--color-background',
      '--color-foreground',
      '--color-surface',
      '--color-border',
      '--color-accent',
      '--color-focus',
      '--font-sans',
      '--header-height',
      '--container-content',
      '--duration-base',
      '--ease-out-quart',
    ]) {
      expect(tokens, `falta el token ${token}`).toContain(`${token}:`);
    }
  });
});

describe('contenedor de layout', () => {
  it('no usa el nombre `container`, que pertenece a Tailwind', () => {
    const css = read('src/styles/global.css');

    // Tailwind v4 también define `.container`. Dos reglas con el mismo nombre
    // en la misma capa se resuelven por orden de aparición, así que la nuestra
    // perdía sin avisar. El nombre del contenedor de layout es `shell`.
    expect(css).not.toMatch(/^\s*\.container\s*\{/m);
    expect(css).not.toContain('.container--wide');
  });

  it('el componente Container usa la clase shell', () => {
    const component = read('src/components/ui/Container.astro');

    expect(component).toContain("'shell'");
    expect(component).toContain("'shell--wide'");
    expect(component).not.toContain("'container'");
  });

  it('ningún componente usa la clase `container` suelta', () => {
    const offenders = filesIn('src', '.astro').filter((file) =>
      /class=["'][^"']*\bcontainer\b/.test(read(file)),
    );

    expect(offenders).toEqual([]);
  });

  it('shell respeta los anchos definidos en los tokens', () => {
    const css = read('src/styles/global.css');

    expect(css).toMatch(/\.shell\s*\{[^}]*max-width:\s*var\(--container-content\)/);
    expect(css).toMatch(/\.shell--wide\s*\{[^}]*max-width:\s*var\(--container-wide\)/);
  });
});

describe('reglas transversales de accesibilidad', () => {
  it('respeta prefers-reduced-motion', () => {
    expect(read('src/styles/global.css')).toContain('prefers-reduced-motion: reduce');
  });

  it('mantiene visible el foco de teclado', () => {
    const css = read('src/styles/global.css');

    expect(css).toContain(':focus-visible');
    expect(css).toMatch(/var\(--color-focus\)/);
  });

  it('el enlace de salto existe y está en el layout', () => {
    expect(read('src/components/layout/BaseLayout.astro')).toContain('skip-link');
    expect(read('src/styles/global.css')).toContain('.skip-link');
  });

  it('el sitio no depende de gradientes para leerse', () => {
    // Los gradientes no están prohibidos, pero un sitio de energía solar que
    // los usa de base se lee como plantilla. Ninguno debe estar en el CSS
    // global, que es la parte que se aplica a todo.
    expect(read('src/styles/global.css')).not.toMatch(/linear-gradient/);
  });

  it('no hay animation infinitas, que distraen y consumen batería', () => {
    const css = read('src/styles/global.css');

    expect(css).not.toMatch(/infinite/);
  });
});
