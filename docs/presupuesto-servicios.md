# Servicios externos: costos y aprobación

Los servicios que este proyecto necesita y que **no** se resuelven dentro del
código. No están contratados: esta tabla sirve para proponerlos, cotizarlos y
que Midsummer apruebe la opción.

Ver `docs/responsabilidades.md` para quién hace qué.

## Cómo se llena esta tabla

1. Cotizamos con el proveedor, no con suposiciones ni con precios de blog.
2. Presentamos **dos o tres opciones** con costo, lo que incluye y lo que no.
3. Midsummer aprueba una.
4. Contratamos y configuramos.

Mientras una fila diga `Por cotizar`, nadie ha comprometido dinero.

## Servicios

| Servicio                    | Para qué sirve                          | Responsable | Estado      | Opciones / costo                               |
| :-------------------------- | :-------------------------------------- | :---------- | :---------- | :--------------------------------------------- |
| Dominio `midsummersolar.co` | URL pública del sitio                   | Midsummer   | Definido    | Dominio ya establecido para el proyecto        |
| Hosting del sitio           | Servir el HTML generado por Astro       | Desarrollo  | Por cotizar | Según tamaño de tráfico                        |
| Hosting del CMS             | Instancia de WordPress                  | Desarrollo  | Por cotizar | Comparar hosting gestionado vs. VPS            |
| Correo corporativo          | Envío y recepción de formularios        | Midsummer   | Por cotizar | Google Workspace, Microsoft 365,Correo hosting |
| Analítica                   | Medición de tráfico, con consentimiento | Desarrollo  | Por cotizar | Se activa solo tras el consentimiento          |
| Producción audiovisual      | Fotos y video propias                   | Desarrollo  | Por cotizar | Se cotiza aparte si el material no basta       |

## Notas por servicio

**Dominio.** El dominio público ya está definido: `https://midsummersolar.co`.
La compra y la titularidad son de Midsummer; la configuración técnica de DNS y
SSL es nuestra.

**Hosting del sitio.** El resultado de Astro es estático, así que el hosting es
sencillo: un plan que sirva archivos estáticos con SSL y compresión. No necesita
Node en producción, porque el build ocurre en otro lado.

**Hosting del CMS.** WordPress necesita PHP y base de datos. Hay dos caminos:

- Hosting gestionado: más barato y sin mantenimiento, pero con límites para el
  webhook.
- VPS o servidor propio: más control, mejor para el webhook y para los jobs de
  publicación, a cambio de mantenimiento.

La elección depende de cuánto se publique y con qué frecuencia, así que se
decide cuando Midsummer defina su flujo editorial.

**Correo.** El formulario necesita enviar correo desde una dirección
institucional. También es la titular de las cuentas de los servicios, para que
Midsummer no dependa del desarrollador.

**Analítica.** No se activa hasta que exista el consentimiento. Ver
`docs/privacy.md`.

**Audiovisual.** La propuesta prioriza el material que entregue Midsummer. Si
falta material, la producción se cotiza aparte.

## Coste del proyecto

El valor del proyecto es de **14.600.000 COP** según la propuesta económica
(`Propuesta_Sitio web_Midsummer_Colombia.pdf`, septiembre de 2026, preliminar).
Ese monto es la contraprestación del trabajo de diseño y desarrollo, y es
independiente de los servicios externos de esta tabla, que se pagan aparte
tras su aprobación.
