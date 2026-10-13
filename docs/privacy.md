# Privacidad, consentimiento y datos personales

El sitio es público, pero maneja datos personales: el formulario de contacto y,
si se activan, las herramientas de analítica. Este documento deja por escrito
qué se hace y qué no.

## Estado actual

**No hay analítica.** Ni Google Analytics ni Tag Manager están cargados. Las
variables `PUBLIC_ANALYTICS_ID` y `PUBLIC_GTM_ID` existen en `.env.example` pero
ningún componente las lee.

La decisión es deliberada, y está documentada en el código: `SeoHead.astro`
tiene el hueco preparado y no lo llena.

## Por qué no se carga analítica todavía

En Colombia, la Ley 1581 de 2012 y la guía de la SIC sobre tratamiento de datos
personales exigen que el tratamiento de datos personales tenga una finalidad
determinada y que el titular lo autorice cuando corresponde. Medir la
navegación es tratamiento de datos personales: las cookies de analítica
identifican al visitante.

Cargar GA o GTM sin banner de consentimiento es un problema de protección de
datos, no una cuestión de rendimiento. Por eso no se hace "para tener métricas
mientras tanto".

> El sitio de Suecia carga hoy dos contenedores de GTM sin banner. No se replica
> esa decisión. Que exista un precedente no lo convierte en correcto.

## Referencia

- Ley 1581 de 2012 (habeas data) y su Decreto reglamentario 1377 de 2013.
- Sentencias y concepto de la SIC sobre cookies y herramientas de seguimiento.
- Reglamento europeo ePrivacy, por si el sitio recibe visitas de la UE.

## Cuando se implemente

1. **Banner de consentimiento** con dos opciones: aceptar y rechazar. El
   rechazo tiene que ser tan fácil como la aceptación.
2. **Carga condicionada**: el script solo se inserta si hay consentimiento para
   analítica (`hasConsent('analytics')`).
3. **Preferencia guardada** y botón para cambiar de opinión después.
4. **Un solo contenedor.** Dos contenedores de GTM significan que cada visita
   carga herramientas duplicadas y que la política de cookies deja de
   reflejar lo que realmente ocurre.
5. **Política de cookies** si se usan cookies no esenciales.
6. **Registro de consentimientos** para poder demostrar que se pidió.

## Aviso de privacidad

`/privacidad/` existe pero **no tiene texto**: el aviso lo redacta la asesoría
de Midsummer, no el equipo técnico. La página está marcada `noindex` mientras
tanto, para que un borrador no aparezca en resultados de búsqueda.

El formulario de contacto declara el consentimiento antes de enviar, y ese texto
es parte del aviso: si se cambia uno, hay que revisar el otro.

## Datos que se recogen hoy

Solo los que una persona escribe en el formulario de contacto: nombre,
empresa, correo, teléfono, asunto y mensaje.

**No se envía a ningún servidor todavía.** `ContactForm.tsx` valida con
`contactSchema` y muestra un mensaje de éxito, pero no hay endpoint. Los datos
no salen del navegador. El comentario en el propio componente lo dice.

Cuando exista el endpoint:

- El servidor **vuelve a validar** con el mismo `contactSchema`. La validación
  del cliente se puede saltar.
- `contactSchema` es una lista blanca: rechaza campos que el navegador no
  debería enviar. El campo trampa es `website_url` (`HONEYPOT_FIELD`).
- Se necesita una política de retención: cuánto tiempo se guarda un mensaje y
  quién lo puede leer.
- Si el envío usa un proveedor externo (correo transaccional, CRM), ese
  proveedor es un encargado del tratamiento y hay que decirlo en el aviso.

## Dominio y cookies

El mapa usa OpenStreetMap a través de Leaflet. Los mosaicos se piden al servidor
de OpenStreetMap, lo que revela la dirección IP del visitante. Está dentro de
lo aceptable sin consentimiento, pero conviene mantenerlo en mente si se
cambia de proveedor.

## Hosting y logs

El hosting es un costo externo que Midsummer contrata directamente
(`docs/propuesta-alcance.md`). Al elegirlo hay que confirmar que su configuración
de registros cumple la normativa y que los certificados TLS se renuevan solos.
