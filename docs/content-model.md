# Modelo de contenido

Lo que el frontend espera encontrar en WordPress. Si WordPress y el código no
coinciden, la página sale vacía: por eso el contrato vive aquí y las pruebas de
`tests/wordpress-provider.test.ts` lo verifican.

## Dónde vive el contrato

El contrato tiene dos mitades y ambas tienen que coincidir:

- **El plugin** `wordpress/midsummer-content/` define los post types, registra
  los campos y publica un objeto `acf` en cada respuesta de la REST API. Es la
  fuente de verdad: `contract.php` es el archivo a editar si cambia un campo.
- **El frontend** lee ese objeto `acf` en
  `src/lib/cms/providers/wordpress.ts`.

**No se usa ACF.** Los campos son metadatos nativos de WordPress registrados con
`register_post_meta()`, y el plugin los expone bajo la clave `acf` para que el
formato de la respuesta sea el que el frontend ya esperaba. La consecuencia
práctica: si algún día se instala ACF de verdad, ambos sistemas se pisan. Hay
que elegir uno, y aquí está elegido el que no depende de un plugin de pago.

Los tipos de campo admitidos son `string`, `number`, `boolean`, `string[]` y
`object[]`. Un valor vacío no es lo mismo que un campo en blanco: los compuestos
se devuelven como `[]`, los booleanos como `false` y el resto como `null`.

## Post types

| Clave       | WordPress   | Contenido del sitio     |
| :---------- | :---------- | :---------------------- |
| `project`   | `project`   | Proyectos en Colombia   |
| `solution`  | `solution`  | Soluciones y productos  |
| `installer` | `installer` | Instaladores y aliados  |
| `post`      | `post`      | Noticias                |
| —           | `page`      | Páginas institucionales |

Los cuatro primeros se piden siempre con `status=publish` y `_embed=1` para
traer la imagen destacada.

## Campos

Solo se leen estos, siempre bajo la clave `acf` de cada entrada. Un campo que no
existe se devuelve como `null` y la interfaz muestra el marcador de pendiente:
no se inventa.

### `project`

| Campo            | Tipo     | Tipo del dominio | Notas                                  |
| :--------------- | :------- | :--------------- | :------------------------------------- |
| `department`     | texto    | `string \| null` | Debe venir del dominio cerrado del CMS |
| `municipality`   | texto    | `string \| null` |                                        |
| `latitude`       | número   | `number \| null` | No se publica sin autorización         |
| `longitude`      | número   | `number \| null` | No se publica sin autorización         |
| `install_type`   | texto    | `string \| null` |                                        |
| `capacity_wp`    | número   | `number \| null` | Solo si Midsummer autoriza la cifra    |
| `year`           | número   | `number \| null` |                                        |
| `project_status` | texto    | `string \| null` |                                        |
| `featured`       | booleano | `boolean`        | `true` o `"1"`                         |

### `solution`

| Campo          | Tipo   | Tipo del dominio    |
| :------------- | :----- | :------------------ |
| `applications` | lista  | `readonly string[]` |
| `cta_label`    | texto  | `Cta \| null`       |
| `cta_url`      | texto  | `Cta \| null`       |
| `order`        | número | `number`            |

`cta` solo se construye si vienen **los dos** campos. El listado se ordena por
`order`.

### `installer`

| Campo      | Tipo  | Tipo del dominio    |
| :--------- | :---- | :------------------ |
| `coverage` | lista | `readonly string[]` |
| `website`  | texto | `string \| null`    |
| `email`    | texto | `string \| null`    |
| `phone`    | texto | `string \| null`    |

### Página `configuracion`

Es una `page` con slug `configuracion`. De ahí salen los datos de contacto del
sitio. Si no existe, `getSettings()` devuelve valores vacíos y el pie de página
muestra el marcador de pendiente en lugar de fallar el build.

| Campo             | Tipo  | Efecto                             |
| :---------------- | :---- | :--------------------------------- |
| `contact_email`   | texto | correo en el pie y en `/contacto/` |
| `contact_phone`   | texto | teléfono                           |
| `contact_address` | texto | dirección                          |
| `social`          | lista | objetos `{ label, url }`           |

Las entradas de `social` sin `url` se descartan: es preferible no mostrar un
enlace a mostrar uno roto.

## Campos SEO

Se leen en este orden, gana el primero que exista:

1. SEO: `seo_title`, `seo_description`, `social_image`
2. Yoast (`yoast_head_json`), si el plugin está activo
3. El `excerpt` del post

`noindex` se activa si Yoast marca `robots.index = "noindex"`.

## Formato de la respuesta

La WP REST API devuelve las colecciones como **arrays JSON planos**, no como
objetos con una clave `items`. El tipo `WpList<T>` en el proveedor existe para
dejar esa diferencia documentada; no reintroducir la forma envuelta.

## Rutas de la API

Las rutas de la REST API no son los nombres de los post types. El post type se
llama post en singular pero su ruta es posts, y lo mismo con pages. Una
ruta mal escrita devuelve un 404 y el listado sale vacío sin ningún error
visible, que es la forma más difícil de detectar de este tipo de fallo. Las
rutas están fijadas en src/lib/cms/providers/wordpress.ts y verificadas
contra el CMS real en ests/wordpress-endpoints.test.ts.

## Filtros

`listProjects(filters)` envía `acf[department]`, `acf[install_type]` y
`acf[year]`, y además vuelve a filtrar en memoria. WordPress no aplica de forma
fiable varios `acf[...]` a la vez, y la confirmación en memoria evita publicar
proyectos que no corresponden al filtro.

## Texto de los posts

- `title.rendered` se usa tal cual, sin limpiar.
- `excerpt.rendered` y `content.rendered` sí se limpian cuando el frontend los
  muestra como texto plano. `content` se renderiza como HTML en las fichas
  (`set:html`), en un solo componente: `src/sections/ContentSection.astro`.

## Imágenes

Se leen de `_embedded['wp:featuredmedia'][0]`: `source_url`, `alt_text`,
`media_details.width` y `media_details.height`. Sin `alt_text` el `alt` queda
vacío a propósito: es preferible a inventar una descripción.
