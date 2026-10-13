/**
 * Sincroniza el código del plugin en la copia que carga WordPress local.
 *
 * WordPress local se instala en .wordpress/ y ahí el plugin se despliega como
 * una copia (en `wp-content/plugins/midsummer-content`), no como un enlace.
 * Cada vez que se edita el plugin en `wordpress/`, hay que copiarlo de nuevo
 * para que la instancia local cargue los cambios.
 *
 * Uso:
 *   node tools/sync-plugin.mjs
 *
 * Es idempotente. No toca la base de datos: el contenido demo ya creado no se
 * regenera ni se borra.
 */
import { cpSync, existsSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const source = join(root, 'wordpress', 'midsummer-content');
const target = join(
  root,
  '.wordpress',
  'wordpress',
  'wp-content',
  'plugins',
  'midsummer-content',
);

if (!existsSync(source)) {
  console.error(`El plugin no existe en ${source}.`);
  process.exit(1);
}

if (!existsSync(target)) {
  console.error(
    [
      `WordPress local no está instalado en ${target}.`,
      'Primero ejecuta: npm run cms:install && npm run cms:setup',
    ].join('\n'),
  );
  process.exit(1);
}

// Se borra y se copia en limpio: elimina archivos que ya no existen arriba y
// evita ensuciar la copia con restos de versiones anteriores.
rmSync(target, { recursive: true, force: true });
cpSync(source, target, { recursive: true });

console.log(`Plugin sincronizado en ${target}`);
