# Alcance del proyecto

Fuente: `Propuesta_Sitio web_Midsummer_Colombia.pdf` (propuesta económica
preliminar, septiembre de 2026). Este documento traduce la propuesta a
decisiones técnicas verificables en el código.

Para saber quién hace qué parte de este alcance, ver
`docs/responsabilidades.md`.

## Lo que define la propuesta

- Sitio **independiente y permanente** para Colombia, con la imagen de marca de
  la casa matriz en Suecia y administración autónoma del equipo local.
- **No es un subdominio** de midsummer.se ni comparte infraestructura con
  Suecia.
- La v1 **no tiene integración técnica** entre las dos plataformas: sin base de
  datos compartida, sin inicio de sesión único, sin sincronización de
  contenidos. La relación son **enlaces** entre sitios.
- CMS recomendado por el equipo: **WordPress**, por facilidad de administración
  para personal no técnico y costo de mantenimiento.
- 8 semanas, $14.600.000 COP. Presupuesto preliminar, no cerrado.

## Contenido que debe mostrar el sitio

De la sección 1 de la propuesta:

| Elemento                      | Dónde vive en el sitio |
| :---------------------------- | :--------------------- |
| Midsummer                     | `/empresa/`            |
| Su tecnología                 | `/tecnologia/`         |
| Proyectos en Colombia         | `/proyectos/` + mapa   |
| Información para instaladores | `/instaladores/`       |
| Instaladores autorizados      | `/instaladores/`       |
| Canales de contacto comercial | `/contacto/`           |

## Cronograma y qué implica cada semana

Las semanas 4, 5 y 8 incluyen trabajo técnico nuestro. No dependen de que
Midsummer entregue infraestructura.

| Semana | Entregable de la propuesta              | Estado en el repositorio                                                              |
| :----: | :-------------------------------------- | :------------------------------------------------------------------------------------ |
|   1    | Levantamiento, alcance y arquitectura   | Hecho: `docs/propuesta-alcance.md`, este documento                                    |
|   2    | Diseño UI/UX y modelo navegable         | Hecho: sistema de tokens, componentes y 19 rutas                                      |
|   3    | Desarrollo de la plataforma             | Hecho: páginas, formularios, mapa, filtros                                            |
|   4    | CMS y enlaces con Suecia                | El adaptador WordPress está listo; falta crear la instancia y definir los enlaces     |
|   5    | Dominio, hosting, seguridad             | Nuestro: cotizar, aprobar y configurar dominio, hosting, DNS y SSL                    |
|   6    | SEO inicial y herramientas de analítica | Hecho: metadatos, canonical, JSON-LD, sitemap. Analítica pendiente del consentimiento |
|   7    | Carga de contenidos definitivos         | Depende de los contenidos que entregue Midsummer                                      |
|   8    | Publicación y plan de comunicación      | Nuestro: despliegue y publicación una vez aprovisionada la infraestructura            |

Las semanas 5 y 8 se ejecutan con trabajo nuestro y con la aprobación de los
servicios externos (`docs/presupuesto-servicios.md`). La única semana que
depende de una entrega de Midsummer es la 7, que es de contenido.

## Servicios dentro del alcance

Son trabajo nuestro de diseño y desarrollo, y no requieren que Midsummer
entregue nada para construirlos:

- **Mapa interactivo** de proyectos en Colombia. Implementado con Leaflet y
  OpenStreetMap, sin clave de API ni costo de licencia. Los puntos solo se
  dibujan si el proyecto trae coordenadas autorizadas.
- **Formularios de contacto.** Validación en el cliente lista; falta el
  endpoint en el servidor, que configuramos nosotros.
- **Directorio de instaladores.** Implementado; los datos de contacto solo se
  muestran si el CMS los entrega.
- **CMS** para que el equipo de Midsummer administre noticias, proyectos,
  textos, imágenes, instaladores e información corporativa. La instancia la
  creamos y configuramos nosotros.
- **SEO inicial**: títulos, descripciones, canonical, datos estructurados,
  sitemap y `robots.txt`.
- **Enlaces institucionales con Suecia**: un enlace a midsummer.se ya existe en
  `SITE.sweden` (`src/config/site.config.ts`). Falta definir el resto.

## Infraestructura y servicios externos

También es trabajo nuestro, con una diferencia: los servicios que se contratan
requieren que Midsummer apruebe el gasto.

- Definimos y configuramos hosting, despliegue, build automático, webhook, DNS
  y SSL.
- Cotizamos y proponemos las opciones de los servicios que se contratan; Midsummer
  aprueba y paga. La tabla está en `docs/presupuesto-servicios.md`.
- El resultado de Astro es estático: el hosting del sitio es un servicio de
  archivos, sin Node en producción. WordPress sí necesita PHP y base de datos,
  y ahí la decisión entre hosting gestionado y servidor propio depende del flujo
  editorial que defina Midsummer.

Ver `docs/responsabilidades.md` para la separación completa.

## Fuera de alcance de la v1

- Intercambio automático de datos con la casa matriz.
- Analítica cargada sin consentimiento previo.
- Publicidad pagada en redes y manejo permanente de redes sociales.
- Producción audiovisual: se prioriza el material que entregue Midsummer; la
  producción de fotos y video se cotiza aparte.

## Costos externos

Los servicios que se contratan aparte (dominio, hosting, correo, analítica,
producción audiovisual) **no están incluidos** en los 14.600.000 COP del
proyecto, que corresponden al trabajo de diseño y desarrollo. Se cotizan, se
proponen y Midsummer aprueba antes de contratarse.

El detalle está en `docs/presupuesto-servicios.md`.
