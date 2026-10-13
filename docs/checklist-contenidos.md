# Checklist de contenidos que debe entregar Midsummer

Derivado de la sección 2 de la propuesta. El proyecto se detiene cuando falta
esta información, así que conviene entregarlo por bloques y no todo al final.

## Identidad visual

- [ ] Logo en vectorial (SVG) y en PNG con fondo transparente
- [ ] Manual de marca, si existe
- [ ] Colores oficiales con sus valores exactos
- [ ] Tipografías con sus archivos y licencia de uso
- [ ] Material gráfico de la casa matriz permitido para reutilizar

> Hoy la paleta, la tipografía (Metropolis) y el favicon son **provisionales**.
> Ver `src/styles/tokens.css`. Se reemplazan editando solo ese archivo.

## Información corporativa

- [ ] Historia de la empresa
- [ ] Información institucional
- [ ] Misión y visión (si se desean incluir)
- [ ] Información sobre la tecnología, los productos y las soluciones
- [ ] Información comercial
- [ ] Datos de contacto: correo, teléfono y dirección de la oficina en Colombia
- [ ] URLs oficiales de redes sociales

> El sitio de Suecia usa estos datos, pero son de Suecia. No se reutilizan sin
> confirmación: publicarlos sería dar a un cliente una dirección equivocada.

## Información de proyectos

Por cada proyecto:

- [ ] Nombre
- [ ] Ubicación (departamento y municipio)
- [ ] Descripción
- [ ] Fotografías
- [ ] Videos disponibles
- [ ] Información técnica publicable
- [ ] Fecha o periodo, cuando sea relevante
- [ ] **Autorización para publicar la ubicación en el mapa**

> Las coordenadas se consideran datos de infraestructura del cliente. Si un
> proyecto no trae coordenadas, el mapa lo omite en lugar de mostrarlo en otro
> lugar aproximado.

## Instaladores y aliados

Por cada instalador:

- [ ] Nombre o razón social
- [ ] Información de contacto
- [ ] Ubicación
- [ ] Sitio web o redes sociales
- [ ] Departamentos donde opera
- [ ] **Autorización para publicar sus datos**

## Material audiovisual

- [ ] Fotografías
- [ ] Videos
- [ ] Logos y recursos gráficos
- [ ] Material de proyectos anteriores

## Información relacionada con Suecia

- [ ] URLs oficiales que deben enlazarse
- [ ] Páginas concretas que deban enlazarse
- [ ] Material institucional que deba aparecer en Colombia
- [ ] Lineamientos de marca que deban respetarse

> La v1 no se integra técnicamente con Suecia: son enlaces. Ver
> `docs/propuesta-alcance.md`.

## Administración del contenido

Estas son preguntas de negocio, no de configuración. La configuración técnica
del CMS la hacemos nosotros.

- [ ] ¿Quiénes van a administrar el CMS?
- [ ] ¿Quién aprueba el diseño?
- [ ] ¿Quién aprueba los contenidos?
- [ ] ¿Quién da la aprobación final antes de publicar?
- [ ] ¿Qué necesita cada persona para trabajar (datos de contacto y rol)?

> Los roles y permisos técnicos del CMS se configuran nosotros una vez sepamos
> cuántas personas y qué necesitan. Ver `docs/responsabilidades.md`.

## Texto legal

- [ ] Aviso de privacidad revisado por asesoría legal, con fecha de vigencia
- [ ] Texto de la página de privacidad del formulario de contacto

> La página `/privacidad/` existe pero está marcada `noindex` y sin texto: no se
> publica un borrador legal. Ver `docs/privacy.md`.

## Lo que este checklist NO incluye

Ni la instancia de WordPress, ni su hosting, ni el hosting del sitio, ni el
dominio, ni DNS, ni SSL, ni el webhook, ni el despliegue. Eso lo define y
configura el equipo de desarrollo.

Para los servicios que sí hay que contratar, está
`docs/presupuesto-servicios.md`: se cotizan, se proponen y Midsummer aprueba
antes de pagar nada.

## Criterio de aceptación

Un contenido está listo cuando:

1. Está aprobado por escrito por Midsummer.
2. Tiene el formato que pide el modelo de contenido (`docs/content-model.md`).
3. Las imágenes tienen texto alternativo y dimensiones.
4. Los datos de contacto y de terceros tienen autorización de publicación.
