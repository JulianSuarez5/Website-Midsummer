# Responsabilidades

Quién aporta qué en este proyecto. Está escrito porque la confusión más común en
un proyecto con CMS es exactamente esta: cada parte espera que la otra entregue
la infraestructura.

En una frase: **Midsummer aporta el contenido y la información de negocio;
nosotros diseñamos, proponemos, configuramos e implementamos la solución
técnica completa.**

## Midsummer aporta contenido e información

Midsummer debe proporcionar el material con el que se llenan las páginas:

- Textos de todas las secciones.
- Imágenes y material gráfico.
- Información de productos y soluciones.
- Información de proyectos, con autorización para publicar ubicaciones.
- Información de instaladores, con autorización para publicar sus datos.
- Información corporativa.
- Datos de contacto de Colombia: correo, teléfono y dirección.
- Contenido legal (aviso de privacidad y textos del formulario), ya revisados
  por asesoría legal.
- Identidad visual oficial: logo, manual de marca, colores y tipografías.
- Aprobación escrita de los contenidos antes de publicarlos.
- Definición de quién administra, quién aprueba y quién autoriza la publicación.

El detalle de qué se necesita, en qué formato y en qué momento está en
`docs/checklist-contenidos.md`.

## Midsummer no aporta infraestructura

No se le pide a Midsummer una instancia de WordPress, una URL de WordPress,
hosting para WordPress o para Astro, configuración de servidor, configuración
de webhook, configuración de build o despliegue, infraestructura técnica ni
configuración de DNS.

Si alguno de estos servicios necesita contratar o pagar, se propone y se
gestiona, pero el trabajo técnico es nuestro. Ver
[Servicios externos](#servicios-externos).

## La parte técnica es nuestra

Definimos, configuramos y mantenemos:

- Astro como generador del sitio estático.
- WordPress como Headless CMS.
- La integración WordPress → Astro.
- El hosting, sea del CMS, del sitio o de ambos.
- El despliegue y el build automático.
- El webhook que dispara la actualización del sitio.
- La configuración técnica del dominio.
- DNS y SSL.
- Toda la infraestructura necesaria para llegar a producción.

### Dominio

El sitio público es **`https://midsummersolar.co`**. Está definido y no se
sustituye. Vive en la variable `SITE_URL`; de ahí salen canonical, sitemap,
`robots.txt`, Open Graph y JSON-LD.

## Servicios externos: cómo se contratan

El desarrollador no asume de su bolsillo el costo de los servicios externos.
El proceso es:

1. **Proponemos** las opciones, con su costo y sus características.
2. **Midsummer aprueba** la opción elegida y la asume.
3. **Configuramos** la opción aprobada.

Ejemplos que hay que cotizar antes de contratar: dominio, hosting del CMS,
hosting del sitio, correo corporativo, analítica y producción audiovisual.

Cuando el alcance económico esté resuelto, la cifra exacta se registra en
`docs/presupuesto-servicios.md`. Esa tabla se llena **con cotizaciones, no con
suposiciones**, y no se presenta como un gasto ya realizado.

## Titularidad de las cuentas

Las cuentas de los servicios se crean **a nombre de Midsummer**, con
correos institucionales de Midsummer como usuarios administradores. Así el
cliente es dueño de sus activos digitales y no queda dependiente del
desarrollador para operarlos, renovarlos o transferirlos.

En la práctica esto significa que:

- El dominio, el hosting, el CMS y el repositorio quedan a nombre de Midsummer.
- El desarrollador administra con permisos, no como dueño único.
- Las credenciales se guardan en un gestor compartido por Midsummer, no en el
  equipo del desarrollador.
- La renovación de cada servicio se puede hacer directamente por Midsummer.

Nunca se da de alta un servicio con correo personal del desarrollador como
única vía de acceso.

## Estado de la parte técnica

Lo que ya está hecho no depende de que exista una instancia de WordPress:

- El sitio funciona hoy con el proveedor `mock`, sin ninguna instalación.
- El proveedor `wordpress` está listo para conectarse: mapea ACF, Yoast, medios
  y los post types de `docs/content-model.md`.
- El dominio, el sitemap, el SEO y las 19 rutas ya se generan con el dominio
  público correcto.
- El webhook es el único mecanismo que falta definir por completo, porque
  depende del CMS real.

Cuando exista la instancia de WordPress se conecta, se configura y se prueba
el build real. **No se inventa una URL de WordPress ni credenciales**: mientras
no existan, el sitio se construye con `mock` y la arquitectura queda lista para
el cambio, que es una línea de `.env`.

Ver `docs/architecture.md` para el detalle técnico y `docs/handoff.md` para el
estado de las tareas.
