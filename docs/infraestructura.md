# Infraestructura del sitio headless

Estado: **propuesta técnica, nada contratado**. En este documento no se ha
comprado ni configurado ningún servicio. Las cifras son precios publicados por
los proveedores en agosto de 2026 y sirven para decidir; el importe final exige
una cotización y el visto bueno de Midsummer.

## 1. Qué hay que alojar, y no es lo mismo que antes

El cambio a headless parte el sitio en dos piezas con perfiles de tráfico
opuestos. Esto cambia por completo la decisión de hosting respecto a un
WordPress normal:

| Pieza                 | Qué hace                         | Quién la visita                   | Volumen         |
| --------------------- | -------------------------------- | --------------------------------- | --------------- |
| Sitio público (Astro) | HTML/CSS/JS estático             | Visitantes                        | Todo el tráfico |
| WordPress             | Backoffice de edición + API REST | Editores de Midsummer, y el build | Casi nada       |

La consecuencia práctica: **el hosting caro deja de ser el del WordPress**.
Astro genera archivos estáticos que se sirven desde una CDN, así que el
tráfico de Midsummer lo absorbe el edge y WordPress solo recibe las peticiones
de la API durante los despliegues. Un CMS de uso interno con pocas visitas no
necesita un plan gestionado de 35 USD al mes.

## 2. Opciones y coste aproximado

Precios consultados en fuentes públicas (hostcliff.com, projectcostestimator.com,
planes oficiales de WP Engine y Kinsta), agosto de 2026. Valores en USD, sin
impuestos; la factura en Colombia aplica IVA y la conversión a COP depende del
TRM del día.

### Opción A — WordPress en hosting compartido + sitio estático en edge

| Servicio                        | Rango               | Nota                                                                               |
| ------------------------------- | ------------------- | ---------------------------------------------------------------------------------- |
| Hosting compartido con PHP 8.2+ | 3–15 USD/mes        | Hostinger ~2,99 → 8,99 al renovar; SiteGround ~2,99 → 17,99; GoDaddy ~5,99 → 11,99 |
| Hosting del sitio estático      | 0–20 USD/mes        | Capa gratuita suficiente al principio; se paga si crece el tráfico                 |
| Dominio `midsummersolar.co`     | ~20 USD/año         | Ya definido, pendiente de titularidad                                              |
| **Total estimado**              | **~60–200 USD/año** | Equipo: buscar un plan cuyo precio de renovación sea el publicado                  |

Es la opción que recomiendo. Los tres proveedores tienen el problema
clásico de los hostings baratos: el precio del primer año es una promoción y
al renovar se multiplica. La comparación útil es siempre a tres años, y con el
precio de renovación, no con el de portada:

- Hostinger: ~108 USD a tres años
- SiteGround: ~468 USD a tres años
- Kinsta: ~1.260 USD a tres años
- WP Engine: ~1.020 USD a tres años

### Opción B — WordPress gestionado (WP Engine, Kinsta, Cloudways, Pressable)

WP Engine desde 25 USD/mes (30 al renovar), Kinsta 35 USD/mes fijo,
Cloudways desde 11 USD/mes, Pressable ~20,83 USD/mes.
**Total estimado: ~300–420 USD/año** solo el CMS.

Se paga por algo concreto: actualizaciones de núcleo, PHP y plugins
aplicadas y revertidas si rompen algo; staging; copias de seguridad probadas;
y soporte que entienda un error de PHP. La pregunta que lo decide no es el
precio del plan, sino quién hará las actualizaciones: si la respuesta es
yo, el hosting compartido sale más barato y el trabajo es el mismo.

### Opción C — Hosting en Colombia

Existe la opción de datacenter local, que reduce latencia. Para este proyecto
es un argumento débil: el sitio público no lo sirve el WordPress, sino la CDN,
así que la distancia al editor no afecta a los visitantes. Solo tendría sentido
si Midsummer exige residencia de datos en Colombia por una razón legal
concreta, y eso hay que confirmarlo antes de pagar.

## 3. Restricciones reales al elegir hosting

Dos requisitos técnicos que no aparecen en las tablas de precios y que sí
deciden:

1. **Salida HTTPS desde WordPress.** El webhook de publicación necesita hacer
   un POST a un servicio externo. Algunos hostings compartidos limitan o
   bloquean las peticiones salientes. Hay que confirmar que `wp_remote_post`
   funciona y que el certificado del destino valida.
2. **Acceso a `wp-config.php` y a cron.** Necesario para las application
   passwords de lectura y para programar el webhook si se elige dispararlo con
   una tarea programada. En un plan gestionado esto viene resuelto; en
   compartido hay que comprobarlo en la prueba.

Ninguna de las dos se puede comprobar con una tabla de precios. Se validan
en un entorno de prueba antes de contratar el plan definitivo.

## 4. Separación de URLs

El sitio público y el CMS son dos sistemas distintos y se mantienen
separados. El dominio público ya está decidido y no se toca.

| URL                             | Estado                            | Quién la controla              |
| ------------------------------- | --------------------------------- | ------------------------------ |
| `https://midsummersolar.co`     | **Definida.** Es el sitio público | Midsummer                      |
| `https://cms.midsummersolar.co` | **Solo propuesta.** No existe     | Pendiente de contratar hosting |
| `http://localhost:8080`         | **Solo desarrollo local**         | Este repositorio               |

Reglas que ya están aplicadas en el código:

- El sitio público solo conoce la URL del CMS como dato de build
  (`CMS_API_URL`). No comparte base de datos, sesión ni cookies con él.
- La URL del CMS no se sirve en ningún HTML público, pero sí queda en el
  paquete de build, que se descarga el visitante. Es una divulgación menor pero
  real: quien lea el JavaScript sabe dónde está el panel. Por eso el CMS va en
  un subdominio distinto y no debe dejar la edición abierta a cualquier
  visitante anónimo.
- Editar en WordPress no cambia el sitio hasta que hay un despliegue. Esa
  latencia es intencional en headless y hay que explicársela a quien
  publique contenido.

## 5. Flujo de publicación y webhook

```
Editor publica en WordPress
        ↓
  transition_post_status / post_updated en el plugin
        ↓
  WordPress hace POST firmado al build hook del hosting
        ↓
  El hosting ejecuta: npm ci → npm run build → despliega dist/
        ↓
  El sitio público se actualiza en minutos
```

Midsummer publica y el sitio se actualiza solo. Ningún desarrollador tiene que
intervenir, que es el objetivo de este diseño.

### 5.1 Qué evento dispara el build

Lo decide `wordpress/midsummer-content/includes/class-midsummer-build-hook.php`:

| Evento de WordPress      | Cuándo salta                    | Por qué                                                 |
| ------------------------ | ------------------------------- | ------------------------------------------------------- |
| `transition_post_status` | Publicar o despublicar          | Entrar o salir del sitio cambia las páginas que existen |
| `post_updated`           | Editar una entrada ya publicada | Cambia el contenido visible                             |

Filtros aplicados, todos necesarios para no disparar builds inútiles:

- Se ignoran revisiones y autoguardados (`wp_is_post_revision`,
  `wp_is_post_autosave`). Sin esto, cada `Ctrl+S` en el editor sería un
  despliegue.
- Solo cuentan los post types del contrato, leídos de `contract.php`. Añadir un
  post type nuevo no obliga a tocar el webhook.
- Guardar sin que cambie el estado de publicación no dispara nada.

### 5.2 A qué endpoint se envía

Lo emite el proveedor de hosting del sitio estático, y cada uno lo llama de
forma distinta. **Esa URL no se inventa**: se pide al contratar el hosting y
se define en `wp-config.php` del WordPress de producción:

```php
define( 'MIDSUMMER_BUILD_HOOK', 'https://<build-hook-del-proveedor>' );
```

Sin esa constante el plugin no hace nada, que es el comportamiento correcto en
desarrollo. No hay ninguna URL de ejemplo real en el código.

### 5.3 Cómo se protege

Firma HMAC-SHA256 del cuerpo con un secreto compartido, en dos sitios:

- `X-Midsummer-Signature`, cabecera que el proveedor comprueba.
- `signature` dentro del cuerpo, para proveedores que verifiquen el payload.

```php
define( 'MIDSUMMER_BUILD_SECRET', '<secreto largo y aleatorio>' );
```

El secreto se compara en tiempo constante (`hash_equals`) y nunca viaja dentro
del cuerpo, para no acabar escrito en los logs del proveedor. Sin secreto, el
plugin lo avisa en `wp-admin` y avisa de que no es aceptable en producción:
cualquiera que encuentre la URL podría disparar despliegues.

### 5.4 Cómo se ejecuta y publica el build

Cada proveedor lo hace a su manera; el resultado es el mismo. Con los pasos
equivalentes que ejecuta el hosting:

1. `npm ci`
2. `npm run build` — Astro lee la REST API de WordPress y genera `dist/`
3. Se despliega `dist/` al CDN

Lo que ya está resuelto en el repositorio:

- El build lee el contenido una vez y genera HTML estático, así que el sitio no
  depende de WordPress en tiempo de ejecución: si el CMS se cae, el sitio
  publicado sigue en pie.
- `CMS_STRICT=true` hace que el build **falle** si WordPress no responde, en
  lugar de publicar un sitio vacío. Es la opción segura: preferimos que el
  despliegue no salga a que salga sin contenido.

### 5.5 Errores de build

| Situación                       | Qué hace el plugin                                                     |
| ------------------------------- | ---------------------------------------------------------------------- |
| El proveedor devuelve 2xx o 3xx | Build disparado, se anota en el log                                    |
| Error de red o respuesta 5xx    | Reintenta hasta 3 veces, con 5 s de espera                             |
| Respuesta 4xx                   | No reintenta: la URL o el secreto están mal y insistir no lo arregla   |
| Se agotan los intentos          | Avisa en rojo en `wp-admin` y el sitio sigue con el contenido anterior |

Ese último punto importa: **un fallo de despliegue nunca deja el sitio vacío**.
Como el build es atómico — o sale entero o no sale — el público sigue viendo la
versión anterior. El aviso se muestra en el panel para que Midsummer sepa que
tiene que avisar, sin tener que preguntar.

El plugin también registra el último build en la opción `midsummer_last_build`.

### 5.6 Evitar builds innecesarios

- Los autoguardados no disparan nada.
- Un 4xx no se reintenta.
- En el proveedor conviene usar la purga por etiqueta en lugar de un
  despliegue completo en cada build.
- Publicar cinco entradas por separado sí genera cinco builds. Agrupar en
  borrador y publicar juntas reduce el ruido cuando se edita en bloque.

### 5.7 Publicación segura

- Se publica primero en un entorno de **staging** del propio hosting y se
  revisa ahí, nunca sobre el dominio público.
- El build es determinista: el mismo contenido produce el mismo HTML.
- El despliegue anterior se conserva, así que se puede volver atrás.
- WordPress aplica los cambios en cuanto se publica, pero **el sitio público no
  cambia hasta que el build termina**. Esa latencia de unos minutos es
  intencional y conviene explicarla a quien publica.

### 5.8 Pantalla de estado en WordPress

`wp-admin` incluye **Estado del sitio**, de solo lectura, que muestra si la
publicación automática está activa, si hay secreto configurado, cuándo se pidió
el último build y si el último falló. Sin ella, la única forma de saber si una
publicación salió sería preguntar al desarrollador, que es la dependencia que
este proyecto elimina.

La pantalla es de solo lectura a propósito: Midsummer administra el contenido,
el desarrollador administra el diseño y el despliegue. Nadie desde WordPress
puede cambiar el aspecto del sitio ni romper su estructura.

### 5.9 Probar el webhook en local, sin hosting

El flujo se puede probar entero en desarrollo, contra un receptor que hace de
proveedor falso. Tres terminales:

```
# Terminal 1: WordPress (como siempre)
npm run cms:dev

# Terminal 2: el proveedor falso, que recibe la llamada
npm run cms:receiver

# Terminal 3: dispara el webhook y lo verifica
npm run cms:webhook-test
```

`cms:webhook-test` despublica el primer proyecto, comprueba que el plugin envía
la llamada firmada (cabecera `X-Midsummer-Signature` y firma en el cuerpo),
restaura el contenido a publicado y verifica las dos firmas contra el secreto
de prueba. Si el receptor responde 200 y las firmas coinciden, termina con
«PRUEBA SUPERADA».

Los archivos que lo hacen posible:

- `tools/test-build-hook.php`: el que dispara y verifica.
- `tools/receiver.php`: el proveedor falso (`php -S` con router).
- `tools/sync-plugin.mjs`: copia el plugin del repo a la instancia local, que
  carga una copia (`npm run cms:sync`). Sin sincronizar, WordPress local sigue
  cargando la versión anterior del plugin.
- `tools/restore-demo-content.php`: devuelve todo el contenido demo a
  publicado si una prueba falla a mitad.

Ninguna de estas herramientas toca un proveedor real: trabajan solo contra
`localhost:8099`.

## 6. Qué decide Midsummer y qué decide el desarrollo

| Decisión                             | Quién                                    | Estado                               |
| ------------------------------------ | ---------------------------------------- | ------------------------------------ |
| Dominio público                      | Midsummer                                | **Ya definido:** `midsummersolar.co` |
| Nombre de marca                      | Midsummer                                | **Ya definido:** Midsummer           |
| Hosting del CMS                      | Midsummer aprueba, el desarrollo propone | Recomendación: opción A              |
| Hosting del sitio estático           | Midsummer aprueba, el desarrollo propone | Sin definir                          |
| Cuenta y tarjeta de pago             | **Midsummer**                            | Pendiente                            |
| Titularidad del dominio y del CMS    | **Midsummer**                            | Pendiente                            |
| Correo corporativo                   | Midsummer                                | Pendiente                            |
| Textos legales y aviso de privacidad | Midsummer, con revisión jurídica         | Pendiente                            |
| Contenido y datos de contacto        | Midsummer                                | Pendiente                            |

Las cuentas se abren a nombre de Midsummer, nunca del desarrollador. Así el
proyecto sobrevive a la relación comercial: si cambia el proveedor, todo
sigue bajo control del cliente.

## 7. Puesta en marcha local

Para trabajar contra un WordPress real, sin contratar nada:

```
npm run cms:install    # descarga WordPress y SQLite, crea wp-config.php
npm run cms:setup      # activa el plugin y crea el contenido [DEMO]
npm run cms:dev        # sirve el CMS en http://localhost:8080
```

Después, `.env` apunta a la API local y el sitio se genera igual que en
producción, con la diferencia de la URL:

```
CMS_PROVIDER=wordpress
CMS_API_URL=http://localhost:8080/wp-json/wp/v2
```

El sitio público sigue saliendo con `SITE_URL=https://midsummersolar.co`.
Esa separación es la que demuestra que la arquitectura no depende de que el
CMS esté en el mismo dominio.

## 8. Lo que no está hecho

- No hay despliegue en producción.
- No hay DNS, ni SSL emitido, ni certificado wildcard.
- No hay build hook, porque no hay proveedor de hosting elegido.
- No hay webhooks implementados en el plugin, solo el diseño de arriba.
- No hay contenido real: todo lo que hay en la base de datos local está
  marcado `[DEMO]`.
- No hay formulario con envío real.
