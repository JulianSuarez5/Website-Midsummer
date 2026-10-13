# Claims técnicos: qué se encontró y qué falta aprobar

El sitio público de la casa matriz, <https://midsummer.se/en/>, publica
afirmaciones técnicas concretas sobre el producto. Este archivo las registra
**con su origen**, para que Midsummer Colombia decida cuáles puede repetir.

Nada de lo que está aquí se publica hoy. Las páginas del sitio dicen
`[CONTENIDO PROVISIONAL]` o muestran el marcador de pendiente, y en
`src/config/site.config.ts` el `tagline` está marcado como provisional.

## Por qué no se publican tal cual

Son afirmaciones sobre el producto de la casa matriz que hay que verificar para
el mercado colombiano. Publicar "90% menos de CO₂" en un sitio corporativo sin
que Midsummer lo confirme es poner una cifra en su nombre que después puede
resultar incorrecta, y un buscador la indexa.

## Claims encontrados en midsummer.se

| Claim                    | Dato              | Qué hace falta                                                 |
| :----------------------- | :---------------- | :------------------------------------------------------------- |
| Celda sin silicio        | —                 | Confirmar que el producto que se vende en Colombia es el mismo |
| Menor huella de carbono  | 6 g CO₂/kWh       | Metodología, año del estudio y comparativo usado               |
| Versus.panel de silicio  | ~90% menos de CO₂ | Fuente de la comparación                                       |
| Peso                     | ~3 kg/m²          | Condiciones de medición                                        |
| Reciclabilidad           | 98%               | Qué significa el porcentaje y quién lo certifica               |
| Material reutilizado     | 63%               | Fuente                                                         |
| Velocidad de instalación | ~50% más rápido   | Contra qué se compara y en qué tipo de cubierta                |
| Origen                   | "Sueco"           | Si aplica a la producción que se comercializa en Colombia      |

## Productos mencionados

El sitio de Suecia describe tres líneas: **WAVE**, **SLIM** y **BOLD**. El
proveedor mock del proyecto usa nombres genéricos a propósito
(`solucion-fotovoltaica-flexible`, `solucion-para-industria`,
`solucion-para-comercio`) porque se ignora a propósito qué producto hay.

Decisión pendiente: si Colombia comercializa las mismas líneas, se reemplazan
los nombres del mock por los reales y se documentan las especificaciones
correspondientes.

## Instalación

- Järfälla (Suecia) y Bari (Italia) aparecen como sitios de fabricación.
- Esto no es una garantía de disponibilidad en Colombia. Si se publica, debe ir
  acompañado de lo que Midsummer Colombia sí puede asegurar.

## Datos que nunca se copian

Estos **no** son de Midsummer Colombia y no deben aparecer en el sitio:

- Correo, teléfono, dirección y número de identificación de Suecia
- Dirección de la oficina de Suecia
- Nombres y cargos del equipo de Suecia

El `sweden.url` sí es un enlace institucional válido y ya está configurado.

## Método

Para aprobar un claim hace falta, por escrito:

1. El enunciado exacto que se va a publicar.
2. La fuente o el estudio de donde sale.
3. Las condiciones bajo las que es cierto.
4. Si aplica igual en Colombia.

Con eso se reemplaza el marcador de contenido pendiente por el texto
definitivo, y el claim sale de esta lista.
