<?php
/**
 * Fase 1: instala WordPress si no lo está.
 *
 * Va aparte de la fase 2 porque instalar WordPress exige la constante
 * WP_INSTALLING, y con esa constante WordPress no carga los plugins. Si las dos
 * fases estuvieran en el mismo script, el plugin de Midsummer no estaría
 * cargado y los post types no existirían.
 *
 * Es idempotente: si WordPress ya está instalado, no hace nada.
 *
 * Uso:  npm run cms:install
 *
 * @package Midsummer
 */

declare( strict_types = 1 );

$root   = dirname( __DIR__ );
$wp_dir = $root . '/.wordpress/wordpress';

// El drop-in db.php busca el plugin con realpath(__DIR__ . '/plugins/...'),
// así que el plugin tiene que quedar dentro de wp-content/plugins y no aparte.
$plugins_dir = $wp_dir . '/wp-content/plugins';
$sql_dir     = $plugins_dir . '/sqlite-database-integration';

// ── 1. Descarga de WordPress ────────────────────────────────────────────────
// Es idempotente: si el núcleo ya está, no se vuelve a descargar ni a
// extraer. Así se puede volver a ejecutar sin miedo, y un clon limpio del
// repositorio se pone en marcha con un solo comando.
if ( ! file_exists( $wp_dir . '/wp-load.php' ) ) {
	if ( ! extension_loaded( 'zip' ) ) {
		fwrite( STDERR, "Falta la extensión zip de PHP: no se puede descomprimir WordPress.\n" );
		exit( 1 );
	}

	if ( ! download( 'https://wordpress.org/latest.zip', $root . '/.wordpress/wordpress.zip' ) ) {
		fwrite( STDERR, "No se pudo descargar WordPress.\n" );
		exit( 1 );
	}

	if ( ! unzip( $root . '/.wordpress/wordpress.zip', $root . '/.wordpress' ) ) {
		fwrite( STDERR, "No se pudo descomprimir WordPress.\n" );
		exit( 1 );
	}

	unlink( $root . '/.wordpress/wordpress.zip' );

	echo 'WordPress descargado.', PHP_EOL;
} else {
	echo 'WordPress ya estaba descargado.', PHP_EOL;
}

// ── 2. Integración SQLite ──────────────────────────────────────────────────
// Es el motor de base de datos del entorno local. En producción se usará
// MySQL o MariaDB del hosting; SQLite evita depender de un servicio de base
// de datos instalado en la máquina para poder trabajar.
if ( ! file_exists( $sql_dir . '/db.copy' ) ) {
	// El zip del plugin ya viene con la carpeta sqlite-database-integration
	// dentro, así que se extrae directamente en wp-content/plugins.
	if ( ! download( 'https://downloads.wordpress.org/plugin/sqlite-database-integration.zip', $root . '/.wordpress/sqlite.zip' ) ) {
		fwrite( STDERR, "No se pudo descargar la integración SQLite.\n" );
		exit( 1 );
	}

	if ( ! is_dir( $plugins_dir ) ) {
		mkdir( $plugins_dir, 0777, true );
	}

	if ( ! unzip( $root . '/.wordpress/sqlite.zip', $plugins_dir ) ) {
		fwrite( STDERR, "No se pudo descomprimir la integración SQLite.\n" );
		exit( 1 );
	}

	unlink( $root . '/.wordpress/sqlite.zip' );

	echo 'Integración SQLite descargada.', PHP_EOL;
}

if ( ! file_exists( $wp_dir . '/wp-content/db.php' ) ) {
	if ( ! file_exists( $sql_dir . '/db.copy' ) ) {
		fwrite( STDERR, "No se encontró el drop-in db.copy de SQLite.\n" );
		exit( 1 );
	}

	// El drop-in le dice a WordPress que use SQLite en lugar de mysqli. Sus
	// rutas son relativas a la raíz de WordPress, así que el orden de la
	// copia importa: primero el original, después la versión parcheada.
	copy( $sql_dir . '/db.copy', $wp_dir . '/wp-content/db.php' );

	echo 'Drop-in de SQLite instalado.', PHP_EOL;
}

// ── 3. wp-config.php ───────────────────────────────────────────────────────
if ( ! file_exists( $wp_dir . '/wp-config.php' ) ) {
	$constants = <<<'PHP'
/**
 * Configuración de desarrollo local.
 *
 * NO es la configuración de producción: las sales de aquí son de desarrollo
 * y están en claro a propósito, para que el entorno local se levante sin
 * secretos. En producción, las claves van en las variables de entorno que
 * define el hosting, nunca en el repositorio.
 */

define( 'DB_NAME', 'wordpress' );
define( 'DB_USER', '' );
define( 'DB_PASSWORD', '' );
define( 'DB_HOST', 'localhost' );
define( 'DB_CHARSET', 'utf8' );
define( 'DB_COLLATE', '' );

define( 'AUTH_KEY', 'midsummer-dev-auth-key' );
define( 'SECURE_AUTH_KEY', 'midsummer-dev-secure-auth-key' );
define( 'LOGGED_IN_KEY', 'midsummer-dev-logged-in-key' );
define( 'NONCE_KEY', 'midsummer-dev-nonce-key' );
define( 'AUTH_SALT', 'midsummer-dev-auth-salt' );
define( 'SECURE_AUTH_SALT', 'midsummer-dev-secure-auth-salt' );
define( 'LOGGED_IN_SALT', 'midsummer-dev-logged-in-salt' );
define( 'NONCE_SALT', 'midsummer-dev-nonce-salt' );

$table_prefix = 'wp_';

define( 'WP_DEBUG', true );
define( 'WP_DEBUG_LOG', true );
define( 'WP_DEBUG_DISPLAY', false );
define( 'SCRIPT_DEBUG', false );

/**
 * URL local del CMS. El sitio público es otro dominio distinto: esa
 * separación es la que demuestra que el sitio no depende del CMS.
 */
define( 'WP_HOME', 'http://localhost:8080' );
define( 'WP_SITEURL', 'http://localhost:8080' );

if ( ! defined( 'ABSPATH' ) ) {
	define( 'ABSPATH', __DIR__ . '/' );
}

require_once ABSPATH . 'wp-settings.php';

PHP;

	file_put_contents( $wp_dir . '/wp-config.php', $constants );

	echo 'wp-config.php creado para desarrollo local.', PHP_EOL;
}

// ── 3b. Router del servidor de desarrollo ──────────────────────────────────
// El servidor de PHP no reescribe URLs como Apache, así que `npm run cms:dev`
// usa este router. Vive en .wordpress/, que está en .gitignore, y por eso se
// escribe aquí: si no, se perdería al reinstalar y el CMS dejaría de arrancar.
$router = <<<'PHP'
<?php
/**
 * Router para el servidor embebido de PHP.
 *
 * El servidor de desarrollo de PHP no reescribe URLs como lo hace Apache o
 * nginx, así que las peticiones a /wp-json/... y a los permalinks llegarían a un
 * archivo inexistente y devolverían 404. Este router las envía a index.php,
 * que es lo que hace el servidor real de WordPress.
 *
 * Solo se usa en desarrollo: `php -S localhost:8080 -t . router.php`.
 *
 * @package Midsummer
 */

$root = __DIR__;
$path = parse_url( $_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH );
$file = realpath( $root . urldecode( (string) $path ) );

// Si la petición corresponde a un archivo que existe, se sirve tal cual.
if ( $file && str_starts_with( $file, realpath( $root ) ) && is_file( $file ) ) {
	return false;
}

/*
 * Un directorio se resuelve con su index.php, que es lo que hacen Apache y
 * nginx. Sin esto, entrar a /wp-admin/ no abriría el panel: al no ser un
 * archivo, caería en el index.php del sitio y se vería la portada en lugar del
 * escritorio, sin menú y sin la opción "Entradas".
 */
if ( $file && str_starts_with( $file, realpath( $root ) ) && is_dir( $file ) && is_file( $file . '/index.php' ) ) {
	$script = rtrim( (string) parse_url( $_SERVER['REQUEST_URI'], PHP_URL_PATH ), '/' ) . '/index.php';

	$_SERVER['SCRIPT_NAME']     = $script;
	$_SERVER['SCRIPT_FILENAME'] = $file . '/index.php';

	require $file . '/index.php';

	return true;
}

// Todo lo demás lo resuelve WordPress.
$_SERVER['SCRIPT_NAME'] = '/index.php';

require $root . '/index.php';
PHP;

if ( ! file_exists( $wp_dir . '/router.php' ) || file_get_contents( $wp_dir . '/router.php' ) !== $router ) {
	file_put_contents( $wp_dir . '/router.php', $router );

	echo 'router.php creado para el servidor de desarrollo.', PHP_EOL;
}

// ── 4. Instalación de WordPress ────────────────────────────────────────────
// Va aparte de la descarga porque instalar exige la constante WP_INSTALLING, y
// con esa constante WordPress no carga los plugins. Si las dos fases estuvieran
// aquí, el plugin de Midsummer no estaría cargado y los post types no existirían.
define( 'WP_INSTALLING', true );
require_once $wp_dir . '/wp-load.php';
require_once ABSPATH . 'wp-admin/includes/upgrade.php';

if ( is_blog_installed() ) {
	echo 'WordPress ya estaba instalado.', PHP_EOL;
	exit( 0 );
}

$result = wp_install(
	'Midsummer Colombia (desarrollo)',
	'admin',
	'admin@example.invalid',
	true,
	'',
	'dev-password-not-for-production'
);

if ( is_wp_error( $result ) ) {
	fwrite( STDERR, 'Falló la instalación: ' . $result->get_error_message() . "\n" );
	exit( 1 );
}

echo 'WordPress instalado. Usuario: admin (contraseña de desarrollo).', PHP_EOL;

/**
 * Descarga una URL a disco.
 *
 * @param string $url     Dirección de origen.
 * @param string $destino Ruta de destino.
 * @return bool True si se descargó.
 */
function download( string $url, string $destino ): bool {
	if ( ! is_dir( dirname( $destino ) ) ) {
		mkdir( dirname( $destino ), 0777, true );
	}

	$contenido = @file_get_contents( $url ); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged

	if ( false === $contenido || '' === $contenido ) {
		return false;
	}

	return false !== file_put_contents( $destino, $contenido );
}

/**
 * Descomprime un zip en un directorio.
 *
 * @param string $zip      Ruta del archivo.
 * @param string $destino  Directorio de destino.
 * @return bool True si se descomprimió.
 */
function unzip( string $zip, string $destino ): bool {
	$archivo = new ZipArchive();

	if ( true !== $archivo->open( $zip ) ) {
		return false;
	}

	$ok = $archivo->extractTo( $destino );
	$archivo->close();

	return $ok;
}
