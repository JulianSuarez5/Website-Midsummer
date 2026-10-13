# Midsummer Colombia

Sitio corporativo de Midsummer Colombia. Frontend estático en Astro con
WordPress como CMS headless: el contenido se administra en WordPress y el sitio
se genera por completo en cada build.

**Estado:** prototipo navegable. Usa datos de ejemplo y no está publicado.

## Dominio

El dominio público del sitio es **`https://midsummersolar.co`** y es un
requisito fijo del proyecto. Vive en una sola variable, `SITE_URL`, y de ahí
salen canonical, sitemap, `robots.txt`, Open Graph y JSON-LD, para que no haya
que cambiarlo en varios archivos.

| Contexto        | URL                                           |
| :-------------- | :-------------------------------------------- |
| Sitio público   | `https://midsummersolar.co`                   |
| WordPress (CMS) | `CMS_API_URL`, por ejemplo `http://cms.local` |

La URL del CMS es independiente del dominio público: puede apuntar a
`localhost` durante el desarrollo sin que eso altere las URL públicas del sitio.
`CMS_PROVIDER=mock` hace que ni siquiera haga falta definirla.

## Requisitos

- Node.js `>=22.12` (probado en 24.11)
- npm 10 o superior

## Puesta en marcha

```sh
npm install
cp .env.example .env
npm run dev
```

`CMS_PROVIDER=mock` (valor por defecto) hace que el sitio funcione sin
WordPress. Ver `.env.example` para conectar el CMS real.

## Comandos

| Comando                    | Qué hace                                             |
| :------------------------- | :--------------------------------------------------- |
| `npm run dev`              | Servidor de desarrollo con recarga                   |
| `npm run build`            | Genera el sitio estático en `dist/`                  |
| `npm run preview`          | Sirve `dist/` para revisar el resultado final        |
| `npm run check`            | Diagnósticos de Astro y TypeScript                   |
| `npm run lint`             | ESLint                                               |
| `npm run format`           | Prettier (escribe)                                   |
| `npm run format:check`     | Prettier (verifica, no escribe)                      |
| `npm test`                 | Pruebas unitarias con Vitest                         |
| `npm run verify`           | `check` + `lint` + `format:check` + `test` + `build` |
| `npm run cms:install`      | Descarga e instala WordPress en `.wordpress/`        |
| `npm run cms:setup`        | Activa el plugin y crea el contenido `[DEMO]`        |
| `npm run cms:dev`          | Sirve el CMS local en `http://localhost:8080`        |
| `npm run cms:inspect`      | Lista post types y entradas creadas                  |
| `npm run cms:sync`         | Copia el plugin del repo a la copia local del CMS    |
| `npm run cms:receiver`     | Receptor falso de build hooks en `localhost:8099`    |
| `npm run cms:webhook-test` | Publica y comprueba el webhook de compilación        |

`npm run verify` es el que se ejecuta antes de publicar cualquier cosa.

> `npm run cms:sync` hace falta después de editar el plugin: WordPress local
> carga una copia de `wordpress/midsummer-content`, no el directorio del repo.

### WordPress local

Para trabajar contra un CMS real sin contratar nada:

```
npm run cms:install   # descarga WordPress y SQLite, crea wp-config.php
npm run cms:setup     # activa el plugin de Midsummer y siembra contenido [DEMO]
npm run cms:dev       # en otra terminal
```

Probar el flujo de publicación automática sin hosting, con un proveedor falso:

```
npm run cms:receiver     # en otra terminal: el "proveedor" que recibe el build
npm run cms:webhook-test # dispara el webhook y verifica la firma
```

Después, en `.env`:

```
CMS_PROVIDER=wordpress
CMS_API_URL=http://localhost:8080/wp-json/wp/v2
```

El sitio público se sigue generando con `SITE_URL=https://midsummersolar.co`.
Esa diferencia entre las dos URLs es la prueba de que la arquitectura no
depende de que el CMS esté en el mismo dominio.

Los scripts de CMS usan `tools/run-php.mjs`, que busca PHP en el PATH y en las
rutas habituales de XAMPP y Laragon. Si PHP está en otro sitio:
`set PHP_BINARY=C:\ruta\a\php.exe`.

Las pruebas que hablan con el CMS real se saltan solas si no hay WordPress
levantado, así que `npm test` funciona sin el CMS. Con el CMS en marcha,
`tests/wordpress-endpoints.test.ts` verifica el contrato entero contra la
REST API real.

## Estructura

```text
src/
├── components/
│   ├── content/     Marcadores de contenido pendiente y estados vacíos
│   ├── layout/      BaseLayout y SeoHead
│   ├── navigation/  Encabezado, menú móvil y pie
│   ├── seo/         Etiquetas de datos estructurados
│   └── ui/          Botón, contenedor, encabezado de sección, iconos
├── config/          Dominio, navegación, mapa, tokens de marca
├── features/        Contacto, instaladores, noticias, proyectos, soluciones
├── lib/
│   ├── cms/         Contrato de contenido + proveedores mock y WordPress
│   ├── i18n/        Textos de interfaz
│   ├── map/         Contrato del mapa y adaptador de Leaflet
│   └── seo/         Metadatos y JSON-LD
├── pages/           Rutas del sitio
├── sections/        Bloques de página reutilizables
└── styles/          tokens.css y global.css
```

## Rutas

| Ruta                  | Contenido                               |
| :-------------------- | :-------------------------------------- |
| `/`                   | Portada                                 |
| `/empresa/`           | Información institucional               |
| `/tecnologia/`        | Contenido técnico                       |
| `/soluciones/`        | Listado de soluciones                   |
| `/soluciones/[slug]/` | Ficha de una solución                   |
| `/proyectos/`         | Listado de proyectos con mapa y filtros |
| `/proyectos/[slug]/`  | Ficha de un proyecto                    |
| `/instaladores/`      | Directorio de instaladores y aliados    |
| `/noticias/`          | Listado de noticias                     |
| `/noticias/[slug]/`   | Ficha de una noticia                    |
| `/contacto/`          | Formulario y datos de contacto          |
| `/privacidad/`        | Aviso de privacidad (marcado `noindex`) |
| `/404.html`           | Página de error                         |
| `/robots.txt`         | Generado desde `SITE_URL`               |

## Regla del proyecto

**No se inventa información de Midsummer.** Si un texto, una cifra o un dato de
contacto no ha sido entregado, se muestra el marcador de contenido pendiente en
lugar de rellenarlo con una suposición. Los claims técnicos del sitio de Suecia
no se dan por válidos en Colombia sin confirmación escrita.

Ver `docs/propuesta-alcance.md` y `docs/checklist-contenidos.md`.

## Documentación

| Documento                       | Contenido                                     |
| :------------------------------ | :-------------------------------------------- |
| `docs/responsabilidades.md`     | Quién aporta el contenido y quién la técnica  |
| `docs/infraestructura.md`       | Hosting, URLs, webhook y coste estimado       |
| `docs/presupuesto-servicios.md` | Servicios por cotizar y por aprobar           |
| `docs/architecture.md`          | Decisiones técnicas y sus motivos             |
| `docs/content-model.md`         | Post types y campos que espera el frontend    |
| `docs/propuesta-alcance.md`     | Alcance del proyecto según la propuesta       |
| `docs/checklist-contenidos.md`  | Qué debe entregar Midsummer, y en qué formato |
| `docs/claims-pendientes.md`     | Claims del sitio de Suecia, con su origen     |
| `docs/privacy.md`               | Consentimiento, analítica y datos personales  |
| `docs/handoff.md`               | Estado del trabajo y tareas abiertas          |

## Responsabilidades

Midsummer aporta el **contenido y la información de negocio**: textos, imágenes,
información de productos, proyectos, instaladores, datos de contacto, contenido
legal y la identidad visual oficial.

La parte técnica es nuestra: Astro, WordPress Headless CMS, hosting,
despliegue, webhook, integración WordPress → Astro, DNS, SSL y build
automático. No se le pide a Midsummer una instancia de WordPress, una URL de
WordPress, hosting ni configuración de servidor.

Los servicios que hay que contratar se cotizan y se proponen; Midsummer aprueba
y paga, y las cuentas quedan a nombre de Midsummer. El sitio funciona hoy con
`CMS_PROVIDER=mock`, sin depender de que exista la instancia real.

Ver `docs/responsabilidades.md`.
