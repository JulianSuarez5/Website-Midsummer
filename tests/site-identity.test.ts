/**
 * Pruebas de identidad del sitio: nombre de marca y dominio público.
 *
 * El dominio `midsummersolar.co` es un requisito fijo del proyecto, no una
 * preferencia, y el nombre correcto es siempre "Midsummer". Estas pruebas
 * existen porque un dominio o un nombre mal escritos no rompen el build: se
 * propagan en silencio a canonical, sitemap, `robots.txt`, Open Graph, JSON-LD
 * y documentación, que es exactamente donde más daño hacen.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { describe, expect, it } from 'vitest';
import { SITE, absoluteUrl } from '../src/config/site.config';
import { SITE_URL } from '../src/config/env';

const REPO_ROOT = join(__dirname, '..');

const PUBLIC_DOMAIN = 'https://midsummersolar.co';

/**
 * Hosts de las plataformas de vista previa que usa el proyecto. Cuando el sitio
 * se compila para una demostración, `SITE_URL` apunta a propósito al dominio
 * temporal (para que canonical/OG/sitemap coincidan con la URL que se comparte)
 * y no a producción. La exigencia de `midsummersolar.co` sigue aplicando a todo
 * lo demás: si el host no es uno de estos, la prueba falla igual.
 */
const PREVIEW_HOST_SUFFIXES = ['.netlify.app', '.surge.sh'];

const isPreviewDomain = (url: string) =>
  PREVIEW_HOST_SUFFIXES.some((suffix) => new URL(url).hostname.endsWith(suffix));
const BRAND_NAME = 'Midsummer';

const IGNORED_DIRECTORIES = new Set([
  'node_modules',
  '.git',
  '.astro',
  'dist',
  'coverage',
]);

function collectFiles(directory: string): string[] {
  const found: string[] = [];

  for (const entry of readdirSync(directory)) {
    if (IGNORED_DIRECTORIES.has(entry)) continue;

    const fullPath = join(directory, entry);

    if (statSync(fullPath).isDirectory()) {
      found.push(...collectFiles(fullPath));
      continue;
    }

    if (/\.(ts|tsx|astro|mjs|js|json|md|css|txt)$/i.test(entry)) {
      found.push(fullPath);
    }
  }

  return found;
}

const repositoryFiles = collectFiles(REPO_ROOT);

describe('nombre de marca', () => {
  it('es exactamente "Midsummer"', () => {
    expect(SITE.name).toBe(BRAND_NAME);
  });

  it('no contiene errores de transcripción conocidos', () => {
    expect(SITE.name).not.toMatch(/mixommer|mixomer|mixsummer|middsummer/i);
  });
});

describe('dominio público', () => {
  it('es midsummersolar.co fuera de una vista previa', () => {
    // En una vista previa conocida, el dominio temporal es intencional. En
    // cualquier otro caso, un dominio distinto es un error que debe fallar.
    if (isPreviewDomain(SITE_URL)) return;

    expect(SITE_URL).toBe(PUBLIC_DOMAIN);
    expect(SITE.url).toBe(PUBLIC_DOMAIN);
  });

  it('no usa una barra final, para no duplicar la barra en las URL absolutas', () => {
    expect(SITE_URL).not.toMatch(/\/$/);
  });

  it('propaga el dominio configurado a las URL absolutas', () => {
    expect(absoluteUrl('/contacto/')).toBe(`${SITE_URL}/contacto/`);
  });

  it('deja el enlace de Suecia aparte, sin convertirlo en el dominio local', () => {
    expect(SITE.sweden.url).toBe('https://midsummer.se/');
    expect(SITE.sweden.url).not.toContain('midsummersolar.co');
  });
});

describe('dominios en el repositorio', () => {
  /**
   * Solo interesan los dominios que llevan el nombre de la marca. Un dominio
   * de un tercero (openstreetmap.org, schema.org, npmjs.org) no es un error de
   * transcripción, así que no se revisa.
   */
  const brandDomainPattern =
    /\b((?:[a-z0-9-]+\.)*midsummer[a-z0-9-]*\.(?:co|com|se|net|org|io|dev))\b/gi;

  const ALLOWED_BRAND_DOMAINS = new Set([
    'midsummersolar.co',
    'www.midsummersolar.co',
    'cms.midsummersolar.co',
    'midsummer.se',
    'www.midsummer.se',
  ]);

  it('encuentra archivos de texto para revisar', () => {
    expect(repositoryFiles.length).toBeGreaterThan(0);
  });

  it('usa midsummersolar.co y midsummer.se como único dominio de la marca', () => {
    const offenders: string[] = [];

    for (const file of repositoryFiles) {
      const contents = readFileSync(file, 'utf8');

      for (const match of contents.matchAll(brandDomainPattern)) {
        const host = match[1].toLowerCase();

        if (ALLOWED_BRAND_DOMAINS.has(host)) continue;

        offenders.push(`${relative(REPO_ROOT, file).split(sep).join('/')}: ${host}`);
      }
    }

    expect(offenders).toEqual([]);
  });

  it('no menciona ninguna variante incorrecta del nombre ni del dominio', () => {
    // Este archivo contiene los términos prohibidos a propósito, para
    // comprobarlos, así que queda fuera de su propio escaneo.
    const forbidden =
      /mixommer|mixomersolar|mixomer|mixsummer|middsummer|midsumer|midsummer\.co/i;
    const offenders: string[] = [];

    for (const file of repositoryFiles) {
      if (file === __filename) continue;

      if (forbidden.test(readFileSync(file, 'utf8'))) {
        offenders.push(relative(REPO_ROOT, file).split(sep).join('/'));
      }
    }

    expect(offenders).toEqual([]);
  });

  it('declara el dominio público en la documentación', () => {
    const documented: string[] = [];

    for (const file of repositoryFiles) {
      if (!/\.md$/i.test(file)) continue;

      if (/midsummersolar\.co/.test(readFileSync(file, 'utf8'))) {
        documented.push(relative(REPO_ROOT, file).split(sep).join('/'));
      }
    }

    expect(documented).toContain('README.md');
    expect(documented).toContain('docs/handoff.md');
  });
});

describe('separación de responsabilidades', () => {
  const read = (path: string) => readFileSync(join(REPO_ROOT, path), 'utf8');

  it('documenta las dos responsabilidades', () => {
    expect(read('docs/responsabilidades.md')).toMatch(/Midsummer aporta contenido/i);
    expect(read('docs/responsabilidades.md')).toMatch(/parte técnica es nuestra/i);
  });

  it('el handoff separa contenido pendiente de implementación técnica', () => {
    const handoff = read('docs/handoff.md');

    expect(handoff).toMatch(/### Contenido pendiente de Midsummer/);
    expect(handoff).toMatch(/### Implementación técnica pendiente \(nosotros\)/);
  });

  it('el checklist de contenidos no le pide infraestructura a Midsummer', () => {
    const checklist = read('docs/checklist-contenidos.md');
    const infrastructure =
      /hosting|credenciales|instancia de WordPress|webhook|DNS|SSL/i;
    const offenders = checklist
      .split('\n')
      .map((line, index) => ({ line: line.trim(), index }))
      // Se ignoran las menciones que explican que NO es responsabilidad suya.
      .filter(({ line }) => !line.startsWith('>') && !line.startsWith('|'))
      .filter(
        ({ line }) =>
          infrastructure.test(line) && !/no incluye|no es|ni la|ni el|nADA/i.test(line),
      )
      .map(({ line }) => line);

    expect(offenders).toEqual([]);
  });

  it('ningún documento pendiente asigna hosting a Midsummer', () => {
    const offenders: string[] = [];
    const pattern =
      /Midsummer[^.\n]{0,80}(proporciona|entrega|entregar|aporta|debe)[^.\n]{0,80}(hosting|WordPress|infraestructura|DNS|SSL|webhook|credenciales)/i;
    // "Midsummer no aporta infraestructura" es justamente lo que se quiere
    // afirmar, así que las frases con negación quedan fuera del escaneo.
    const negation = /\bno\b|\bnunca\b|\bni\b|\bexcepto\b/i;

    for (const file of repositoryFiles) {
      if (!/\.md$/i.test(file)) continue;

      for (const line of readFileSync(file, 'utf8').split('\n')) {
        if (!pattern.test(line) || negation.test(line)) continue;

        offenders.push(
          `${relative(REPO_ROOT, file).split(sep).join('/')}: ${line.trim()}`,
        );
      }
    }

    expect(offenders).toEqual([]);
  });
});
