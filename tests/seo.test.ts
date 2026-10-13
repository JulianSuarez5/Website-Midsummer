/**
 * Pruebas de metadatos SEO y datos estructurados.
 *
 * Aquí se decide qué ve un buscador: título, descripción, canonical y
 * `noindex`. Son reglas que no se ven en la pantalla y por eso son las que más
 * silenciosamente se rompen.
 */
import { describe, expect, it } from 'vitest';
import { SITE, absoluteUrl } from '../src/config/site.config';
import { buildMeta } from '../src/lib/seo/meta';
import {
  articleSchema,
  breadcrumbSchema,
  serializeJsonLd,
} from '../src/lib/seo/jsonld';

describe('buildMeta', () => {
  it('arma el título con el nombre de marca al final', () => {
    const meta = buildMeta({ path: '/empresa/', title: 'Empresa' });

    expect(meta.title).toBe('Empresa | Midsummer Colombia');
  });

  it('usa el tagline de marca cuando la página no trae título', () => {
    const meta = buildMeta({ path: '/' });

    expect(meta.title).toBe(`${SITE.name} ${SITE.market} — ${SITE.tagline}`);
  });

  it('deja que los valores SEO del CMS ganen sobre los de la página', () => {
    const meta = buildMeta({
      path: '/proyectos/demo/',
      title: 'Proyecto demo',
      description: 'Descripción de la página',
      seo: { title: 'Título del CMS', description: 'Descripción del CMS' },
    });

    expect(meta.title).toBe('Título del CMS | Midsummer Colombia');
    expect(meta.description).toBe('Descripción del CMS');
  });

  it('recorta la descripción a una longitud legible en buscadores', () => {
    const meta = buildMeta({
      path: '/x/',
      description: 'palabra '.repeat(80),
    });

    expect(meta.description.length).toBeLessThanOrEqual(155);
    expect(meta.description.endsWith('…')).toBe(true);
  });

  it('construye una canonical absoluta', () => {
    const meta = buildMeta({ path: '/noticias/una-noticia/' });

    expect(meta.canonical).toBe(`${SITE.url}/noticias/una-noticia/`);
  });

  it('respeta noindex coming del CMS', () => {
    expect(buildMeta({ path: '/x/', seo: { noindex: true } }).noindex).toBe(true);
    expect(buildMeta({ path: '/x/' }).noindex).toBe(false);
  });
});

describe('articleSchema', () => {
  it('no se emite sin fecha de publicación', () => {
    const article = articleSchema({
      title: 'Noticia',
      description: 'Resumen',
      path: '/noticias/noticia/',
      publishedAt: null,
      image: 'https://example.com/foto.jpg',
    });

    expect(article).toBeNull();
  });

  it('no se emite sin imagen', () => {
    const article = articleSchema({
      title: 'Noticia',
      description: 'Resumen',
      path: '/noticias/noticia/',
      publishedAt: '2026-03-01T00:00:00',
      image: null,
    });

    expect(article).toBeNull();
  });

  it('se emite con fecha e imagen', () => {
    const article = articleSchema({
      title: 'Noticia',
      description: 'Resumen',
      path: '/noticias/noticia/',
      publishedAt: '2026-03-01T00:00:00',
      image: 'https://example.com/foto.jpg',
    });

    expect(article?.['@type']).toBe('Article');
    expect(article?.datePublished).toBe('2026-03-01T00:00:00');
  });
});

describe('breadcrumbSchema', () => {
  it('numera las posiciones desde 1 y usa URLs absolutas', () => {
    const schema = breadcrumbSchema([
      { name: 'Inicio', path: '/' },
      { name: 'Proyectos', path: '/proyectos/' },
    ]);

    expect(schema.itemListElement).toEqual([
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: `${SITE.url}/` },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Proyectos',
        item: `${SITE.url}/proyectos/`,
      },
    ]);
  });
});

describe('serializeJsonLd', () => {
  it('escapa `<` para que el JSON no rompa la etiqueta script', () => {
    const json = serializeJsonLd({ name: '</script><script>alerta()' });

    expect(json).not.toContain('</script>');
    expect(json).toContain('\\u003c');
  });
});

describe('absoluteUrl', () => {
  it('resuelve contra el dominio configurado', () => {
    expect(absoluteUrl('/contacto/')).toBe(`${SITE.url}/contacto/`);
  });
});
