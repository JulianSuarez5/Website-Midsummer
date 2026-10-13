/**
 * Ejecuta PHP con el intérprete que haya en la máquina.
 *
 * Motivo: en Windows, PHP rara vez está en el PATH — XAMPP y Laragon lo
 * instalan en una carpeta propia y lo añaden a veces. Escribir `php` en los
 * scripts de npm funciona en mi máquina y falla en la del cliente, que es
 * justo donde no puede fallar.
 *
 * Uso:
 *   node tools/run-php.mjs tools/setup-wordpress.php
 *   node tools/run-php.mjs -S localhost:8080 -t ruta router.php
 *
 * Si el primer argumento empieza por `-`, se pasan todos tal cual a PHP.
 */
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { delimiter } from 'node:path';
import process from 'node:process';

/**
 * Rutas donde suele instalarse PHP, en orden de preferencia. `PHP_BINARY`
 * tiene prioridad porque es la forma explícita de indicar cuál usar.
 */
const CANDIDATES = [
  process.env.PHP_BINARY,
  'php',
  'C:\\xampp\\php\\php.exe',
  'C:\\laragon\\bin\\php',
  '/opt/homebrew/bin/php',
  '/usr/local/bin/php',
  '/usr/bin/php',
].filter(Boolean);

/**
 * Busca un intérprete de PHP que responda.
 *
 * @returns {string|null} Ruta o nombre del ejecutable, o null si no hay ninguno.
 */
function resolvePhp() {
  for (const candidate of CANDIDATES) {
    // Un nombre suelto se busca en el PATH; una ruta se comprueba en disco.
    if (candidate.includes('/') || candidate.includes('\\')) {
      if (existsSync(candidate)) return candidate;

      continue;
    }

    // Sin `shell: true`: concatenar argumentos sin escapar es un riesgo que
    // Node ya no permite en silencio. Node resuelve el ejecutable por el PATH
    // de la plataforma, así que no hace falta la shell en Windows.
    const probe = spawnSync(candidate, ['-v'], { stdio: 'ignore', shell: false });

    if (probe.status === 0) return candidate;
  }

  // Último recurso: buscar php.exe en los subdirectorios de Laragon, que
  // instala una versión distinta por directorio (php-8.2.0, php-8.3.0, ...).
  for (const base of ['C:\\laragon\\bin\\php', 'C:\\xampp\\php']) {
    if (!existsSync(base)) continue;

    for (const entry of readdirSync(base, { withFileTypes: true })) {
      const candidate = `${base}\\${entry.name}\\php.exe`;

      if (entry.isDirectory() && existsSync(candidate)) return candidate;
    }
  }

  return null;
}

const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('Uso: node tools/run-php.mjs <script.php | argumentos de php>');
  process.exit(1);
}

const php = resolvePhp();

if (!php) {
  console.error(
    [
      'No se encontró PHP.',
      '',
      'Instálalo (XAMPP, Laragon o el paquete oficial) o indica la ruta con:',
      '  set PHP_BINARY=C:\\ruta\\a\\php.exe',
      '',
      `Rutas ya probadas: ${CANDIDATES.join(', ')}`,
      `Separador del PATH en esta máquina: ${delimiter}`,
    ].join('\n'),
  );
  process.exit(1);
}

const child = spawn(php, args, { stdio: 'inherit', shell: false });

child.on('error', (error) => {
  console.error(`No se pudo ejecutar PHP (${php}): ${error.message}`);
  process.exit(1);
});

// El código de salida de PHP se propaga: si el script falla, npm lo ve.
child.on('exit', (code, signal) => {
  process.exit(signal ? 1 : (code ?? 0));
});
