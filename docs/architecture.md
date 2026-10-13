# Arquitectura

Decisiones técnicas y el motivo de cada una. Para el estado actual del trabajo,
ver `docs/handoff.md`.

## Objetivo

Sitio corporativo estático, administrable sin programar, y barato de mantener.
Tres restricciones explican casi todas las decisiones:

1. **El equipo local administra el contenido sin saber programar.** Por eso
   WordPress y no un JSON editable a mano.
2. **No hay integración técnica con la casa matriz en la v1.** Por eso el sitio
   no depende de midsummer.se para funcionar.
3. **La información de Midsummer llega por partes.** Por eso el sitio tiene que
   poder construirse y verse bien con contenido pendiente, sin inventar datos.

## Pila

| Capa           | Elección                    | Motivo                                                     |
| :------------- | :-------------------------- | :--------------------------------------------------------- |
| Build          | Astro 7, salida estática    | HTML plano en el build; sin servidor de aplicación         |
| CMS            | WordPress (REST API)        | Administración por personal no técnico, licencia $0        |
| Estilos        | Tailwind 4 sobre tokens CSS | Re-tematizar el sitio editando un solo archivo             |
| Interactividad | React 19, solo islas        | React únicamente donde hay estado (formulario, mapa, menú) |
| Mapa           | Leaflet + OpenStreetMap     | Sin clave de API, sin costo, licencia abierta              |
| Pruebas        | Vitest                      | Corre en Node; el sitio se genera en Node                  |

## Decisiones

### Un solo `h1` por página, y lo define la página

`PageHero.astro` es el dueño del `h1` en las páginas interiores. El layout
comprobó que cada ruta tiene exactamente un `h1`.

### JSON-LD con datos confirmados, no con datos completos

`src/lib/seo/jsonld.ts` solo emite campos con valor real. Un `Organization` con
una dirección o un teléfono inventados genera información errónea en los
resultados de búsqueda, que es peor que no tener schema.

`articleSchema` no se emite sin fecha **e** imagen: un `Article` sin
`datePublished` no aporta nada.

### `set:html` en un solo lugar

WordPress devuelve el cuerpo de las páginas como HTML. Renderizarlo con
`set:html` es necesario, pero es una excepción de seguridad, así que está
concentrada en `ContentSection.astro` y en las tres fichas de detalle, nunca
repartida por todas las plantillas. El contenido es redactado por Midsummer en
su propio panel, no es entrada de visitante.

### Iconos: dos implementaciones, un registro

`src/config/icons.ts` guarda los paths. `Icon.astro` es la versión para
plantillas y `Icon.tsx` la de React. No se puede importar un componente
`.astro` desde React: en el navegador no existe y falla en runtime
(`InvalidComponentArgs`).

### `compressHTML: true` explícito

Astro 7 borra por defecto los espacios entre elementos inline. En un sitio con
mucho texto generado desde el CMS eso produce textos pegados
("energíasostenibles"). Se fuerza el comportamiento de HTML.

### Caché de consultas durante el build

`src/lib/cms/queries.ts` resuelve cada clave una sola vez por compilación y
reutiliza el resultado. En `astro dev` la caché se desactiva para que los
cambios en el CMS se vean de inmediato.

`CMS_STRICT=true` hace que un fallo del CMS **detenga** el build en vez de
generar un sitio entero sin contenido. Con `false` se registra el error y la
sección queda vacía. En producción se recomienda `true`.

### Sin dependencias de pago ni claves

El mapa usa OpenStreetMap. `MAP_TILE_URL` y `MAP_API_KEY` existen para el caso
de que Midsummer quiera un proveedor con clave, pero el valor por defecto no
tiene ninguno.

### Sin librería de animación

El efecto de entrada al hacer scroll son 20 líneas con `IntersectionObserver`
nativo, respetando `prefers-reduced-motion`. La animación está en
`BaseLayout.astro`.

## Accesibilidad

- Enlace de salto al contenido en `BaseLayout.astro`.
- Un `h1` por página; jerarquía de encabezados por nivel en cada sección.
- Filtros de proyectos con `<label>` asociada y un `role="status"` que anuncia
  cuántos resultados quedan visibles.
- Estados vacío y de error diferenciados (`StateBlock.astro`): "no hay
  contenido" y "no pudimos cargarlo" son mensajes distintos.
- El mapa tiene lista de respaldo y `ariaLabel`.

`eslint-plugin-jsx-a11y` no está instalado: su versión actual declara soporte
hasta ESLint 9 y el proyecto usa ESLint 10. Se cubre en revisión.

## Estructura de contenido pendiente

El proyecto no inventa información. Hay tres mecanismos, con propósitos
distintos:

| Mecanismo                              | Dónde                                | Cuándo se ve             |
| :------------------------------------- | :----------------------------------- | :----------------------- |
| `ContentPending.astro`                 | Huecos de texto sin fuente en el CMS | Solo en desarrollo       |
| `StateBlock.astro`                     | Secciones sin entradas               | Siempre                  |
| Marcas en los datos del proveedor mock | Registros de ejemplo                 | Siempre, en el prototipo |

El primero se oculta en producción para no emitir texto provisional indexable.
Los otros dos sí se ven: son los que le dicen al equipo qué falta entregar.

## Lo que no se hace aquí

- Analítica. Cargar GA o GTM sin consentimiento previo es un problema de
  protección de datos. Ver `docs/privacy.md`.
- Autenticación o usuarios. El sitio es público.
- Un panel de administración propio. El CMS es WordPress.
