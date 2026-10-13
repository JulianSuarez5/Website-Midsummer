# Estado del trabajo

Resumen para quien retome el proyecto. La fecha de referencia es el estado del
repositorio, no una promesa de entrega.

> Contexto de la última sesión de trabajo (vista previa, texto `PENDIENTE:`,
> mapa): `docs/notas-sesion.md`.

## Lo que funciona

- Build estático completo: 19 rutas generadas, sitemap y `robots.txt`.
- `npm run verify` en verde: `astro check` (0 errores), ESLint, Prettier,
  97 pruebas unitarias (13 omitidas) y build.
- Sistema de diseño por tokens, accesible y adaptable a la marca oficial.
- Proveedores de contenido `mock` y `wordpress` intercambiables por variable de
  entorno.
- Adaptador de WordPress con mapeo de ACF, Yoast, medios y filtros.
- Formulario de contacto con validación en cliente.
- Mapa de proyectos con Leaflet, sin claves ni costos.
- Tarjeta de proyecto sobre el mapa con imagen, ubicación, meta y enlace
  (ya no usa el popup de Leaflet).

## Decisiones ya tomadas

No volver a abrir sin un motivo nuevo:

- **Dominio público `https://midsummersolar.co`.** Es un requisito fijo del
  proyecto, no una preferencia. Vive únicamente en `SITE_URL`; canonical,
  sitemap, `robots.txt`, Open Graph y JSON-LD se derivan de ahí. La URL del
  CMS (`CMS_API_URL`) es independiente y puede ser local durante el desarrollo.
  El nombre de la empresa se escribe siempre **Midsummer**. La prueba
  `tests/site-identity.test.ts` falla si alguien cambia el nombre o el dominio.
- **Midsummer entrega contenido, no infraestructura.** WordPress, hosting,
  despliegue, webhook, DNS y SSL los define y configura el equipo de
  desarrollo (`docs/responsabilidades.md`).
- **Astro estático + WordPress Headless.** La propuesta recomienda WordPress.
- **Sitio independiente**, no subdominio de Suecia, sin integración técnica en
  la v1.
- **No se inventa información.** Tres mecanismos de marcador según el caso
  (`docs/architecture.md`).
- **Sin analítica** hasta que exista el consentimiento (`docs/privacy.md`).
- **Claims técnicos de Suecia no se publican** en Colombia sin confirmación.
- **`set:html` concentrado** en `ContentSection.astro` y las fichas.
- **Los claims de la casa matriz** (celda sin silicio, 3 kg/m², 6 g CO₂/kWh,
  98% reciclable) están registrados con su origen en
  `docs/claims-pendientes.md` y no se publican hasta que Midsummer los apruebe
  por escrito.

## Tareas abiertas

Las tareas están separadas según quién las resuelve. La separación importa: la
infraestructura es trabajo nuestro y no se le pide a Midsummer. Ver
`docs/responsabilidades.md`.

### Contenido pendiente de Midsummer

Información y material para llenar las páginas. El detalle está en
`docs/checklist-contenidos.md`.

- [ ] Textos de cada sección: empresa, tecnología, soluciones, proyectos,
      instaladores, noticias y contacto
- [ ] Logo en SVG y PNG, manual de marca, colores y tipografías con licencia
- [ ] Información de productos y soluciones
- [ ] Información de proyectos, con autorización para publicar ubicaciones
- [ ] Información de instaladores, con autorización para publicar sus datos
- [ ] Información corporativa
- [ ] Datos de contacto de Colombia: correo, teléfono y dirección
- [ ] URLs oficiales de redes sociales
- [ ] Contenido legal revisado por asesoría legal
- [ ] Aprobación de los claims técnicos (`docs/claims-pendientes.md`)
- [ ] Quién administra, quién aprueba y quién autoriza la publicación

### Implementación técnica pendiente (nosotros)

Infraestructura, servicios y configuración. No es trabajo de Midsummer.

- [ ] Cotizar y proponer las opciones de servicios externos
      (`docs/presupuesto-servicios.md`), y configurar la que se apruebe
- [ ] Contratar y configurar el hosting del sitio
- [ ] Crear la instancia de WordPress y los post types de
      `docs/content-model.md`
- [ ] Crear la página `configuracion` con los campos de contacto
- [ ] Definir usuarios y permisos del CMS
- [ ] Implementar el webhook de actualización automática
- [ ] Configurar el despliegue y el build automático
- [ ] Configurar DNS y SSL de `midsummersolar.co`
- [ ] Configurar el endpoint del formulario con validación en servidor
- [ ] Crear las cuentas de servicio a nombre de Midsummer, con correos
      institucionales como administradores
- [ ] Activar la analítica cuando exista el consentimiento

Mientras no exista la instancia de WordPress, el sitio se construye con
`mock`. No se inventa una URL de WordPress ni credenciales: conectar el CMS
real es cambiar dos líneas de `.env`.

### Pulido técnico

- [ ] `ContactForm.tsx` usa textos fijos en vez de las claves `t.contact.*`
- [ ] Los datos del proveedor mock llevan `CONTENIDO PENDIENTE DE APROBACIÓN`
      visible en producción; conviene que el mock marque sus registros con
      `seo.noindex` mientras no haya contenido real
- [ ] Los `select` del CMS no tienen `id` propio; si WordPress los expone, el
      frontend los descarta hoy
- [ ] `CMS_ALLOWED_ORIGINS` está definido en `.env.example` y en
      `src/config/env.ts` pero no lo usa nadie
- [ ] Falta decidir si los filtros de proyecto deben reflejarse en la URL para
      poder compartirse y guardarse
- [ ] Considerar `eslint-plugin-jsx-a11y` cuando soporte ESLint 10

## Cómo verificar un cambio

```sh
npm run verify
```

Es `check` + `lint` + `format:check` + `test` + `build`. Si va a publicarse algo,
esta es la puerta.

## Conexión con el CMS

```sh
# .env
CMS_PROVIDER=wordpress
CMS_API_URL=https://.../wp-json/wp/v2
CMS_STRICT=true
CMS_AUTH_USER=...          # application password de solo lectura
CMS_AUTH_APP_PASSWORD=...
```

`CMS_STRICT=true` hace que un fallo del CMS detenga el build en lugar de
generar un sitio sin contenido. Recomendado en producción.

## Referencia

- `docs/architecture.md` — decisiones técnicas y sus motivos
- `docs/responsabilidades.md` — quién aporta el contenido y quién la técnica
- `docs/infraestructura.md` — hosting, URLs, webhook y coste estimado
- `docs/presupuesto-servicios.md` — servicios por cotizar y por aprobar
- `docs/content-model.md` — qué espera el frontend de WordPress
- `docs/propuesta-alcance.md` — alcance según la propuesta económica
- `docs/checklist-contenidos.md` — qué debe entregar Midsummer
- `docs/claims-pendientes.md` — claims técnicos hallados en el sitio de Suecia
- `docs/privacy.md` — consentimiento y datos personales
