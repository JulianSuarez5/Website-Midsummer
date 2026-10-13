<?php
/**
 * Fase 2: deja el CMS local listo para que Astro lo consuma.
 *
 * Se ejecuta después de tools/install-wordpress.php, y a diferencia de él NO
 * define WP_INSTALLING, porque necesita que los plugins estén cargados.
 *
 * Pasos: activa el plugin, registra el contrato de forma explícita, borra el
 * contenido de ejemplo que trae WordPress y siembra el contenido de
 * demostración.
 *
 * Es idempotente. Uso:  php tools/setup-wordpress.php
 *
 * @package Midsummer
 */

declare( strict_types = 1 );

$wp_dir = dirname( __DIR__ ) . '/.wordpress/wordpress';

if ( ! file_exists( $wp_dir . '/wp-load.php' ) ) {
	fwrite( STDERR, "No se encuentra WordPress en $wp_dir\n" );
	exit( 1 );
}

// La ruta la fija DB_DIR/DB_FILE en wp-config.php.
if ( ! is_file( $wp_dir . '/database/wordpress.sqlite' ) ) {
	fwrite( STDERR, "La base de datos no existe. Ejecuta antes: php tools/install-wordpress.php\n" );
	exit( 1 );
}

require_once $wp_dir . '/wp-load.php';
require_once ABSPATH . 'wp-admin/includes/plugin.php';

function out( string $message ): void {
	echo $message, PHP_EOL;
}

// ── 1. El plugin tiene que estar en wp-content/plugins ─────────────────
// Se copia desde el repositorio para no mantener dos versiones a mano.
$source = dirname( __DIR__ ) . '/wordpress/midsummer-content';
$target = WP_PLUGIN_DIR . '/midsummer-content';

if ( is_dir( $source ) ) {
	if ( ! is_dir( $target ) ) {
		mkdir( $target, 0755, true );
	}

	copy( $source . '/midsummer-content.php', $target . '/midsummer-content.php' );
	copy( $source . '/contract.php', $target . '/contract.php' );

	foreach ( array( 'includes', 'assets' ) as $sub ) {
		if ( ! is_dir( $source . '/' . $sub ) ) {
			continue;
		}

		if ( ! is_dir( $target . '/' . $sub ) ) {
			mkdir( $target . '/' . $sub, 0755, true );
		}

		foreach ( glob( $source . '/' . $sub . '/*' ) ?: array() as $file ) {
			if ( is_file( $file ) ) {
				copy( $file, $target . '/' . $sub . '/' . basename( $file ) );
			}
		}
	}
}

// ── 2. Activar el plugin ───────────────────────────────────────────────
$plugin = 'midsummer-content/midsummer-content.php';

if ( ! file_exists( WP_PLUGIN_DIR . '/' . $plugin ) ) {
	fwrite( STDERR, "El plugin no está en WP_PLUGIN_DIR: $plugin\n" );
	exit( 1 );
}

if ( is_plugin_active( $plugin ) ) {
	out( 'El plugin de Midsummer ya estaba activo.' );
} else {
	$activation = activate_plugin( $plugin );

	if ( is_wp_error( $activation ) ) {
		fwrite( STDERR, 'No se pudo activar el plugin: ' . $activation->get_error_message() . "\n" );
		exit( 1 );
	}

	out( 'Plugin de Midsummer activado.' );
}

// ── 3. Registrar el contrato de forma explícita ────────────────────────
// WordPress ya ejecutó `init` antes de activarse el plugin, así que los hooks
// que el plugin registra en `init` no se han ejecutado. Sin esto, `wp_insert_post`
// no encuentra los post types y el contenido de demostración se guardaría con
// el tipo equivocado. Registrar aquí lo hace idempotente.
if ( ! class_exists( 'Midsummer_Post_Types' ) ) {
	fwrite( STDERR, "Las clases del plugin no están cargadas. Revisa el log de error.\n" );
	exit( 1 );
}

Midsummer_Post_Types::register();
Midsummer_Fields::register();

out( 'Post types y campos registrados.' );

// ── 4. Permalinks: el frontend consulta /wp-json/... ────────────────────
if ( '/%postname%/' !== get_option( 'permalink_structure' ) ) {
	update_option( 'permalink_structure', '/%postname%/' );
	out( 'Permalinks configurados como /%postname%/' );
}

// ── 5. Quitar el contenido de ejemplo que trae WordPress ────────────────
// "Hello world!", "Sample Page" y el borrador de política de privacidad no
// aportan nada, y el primero aparecería en el listado de noticias.
foreach ( array( 'hello-world' => 'post', 'sample-page' => 'page', 'privacy-policy' => 'page' ) as $slug => $type ) {
	$found = get_page_by_path( $slug, OBJECT, $type );

	if ( $found instanceof WP_Post ) {
		wp_delete_post( $found->ID, true );
	}
}

out( 'Contenido de ejemplo de WordPress eliminado.' );

// ── 6. Idioma: todo el panel en español de Colombia ─────────────────────
// El sitio es solo para Colombia, así que ni el panel ni el tema propio de
// WordPress pueden quedar en inglés.
//
// Para el núcleo de WordPress existe un paquete oficial en es_CO. Para el tema
// Twenty Twenty-Five solo hay traducción en es_ES, pero sus cadenas son
// genéricas ("Diseñado con WordPress", "Más entradas") y no cambian entre
// España y Colombia, así que se instala bajo el nombre es_CO para que se
// carguen sin dejar nada en inglés.
//
// Es idempotente: si los archivos ya están, no se vuelve a descargar.
out( 'Idioma: es_CO (español de Colombia).' );

$wp_version = get_bloginfo( 'version' );
$languages  = WP_CONTENT_DIR . '/languages';

if ( ! is_dir( $languages ) ) {
	mkdir( $languages, 0755, true );
}

$core_mo = $languages . '/es_CO.mo';

if ( ! file_exists( $core_mo ) ) {
	$zip = $languages . '/core-es_CO.zip';

	if ( midsummer_download( "https://downloads.wordpress.org/translation/core/{$wp_version}/es_CO.zip", $zip ) ) {
		midsummer_unzip( $zip, $languages );
		unlink( $zip );
	} else {
		fwrite( STDERR, "No se pudo descargar el paquete de idioma del núcleo. El panel quedará en inglés.\n" );
	}
}

if ( file_exists( $core_mo ) ) {
	out( '  Traducción del núcleo instalada.' );
} else {
	fwrite( STDERR, "Falta es_CO.mo: el panel seguirá en inglés.\n" );
}

$theme_dir = $languages . '/themes';

if ( ! is_dir( $theme_dir ) ) {
	mkdir( $theme_dir, 0755, true );
}

$theme_mo = $theme_dir . '/twentytwentyfive-es_CO.mo';

if ( ! file_exists( $theme_mo ) ) {
	$zip = $languages . '/theme-es_ES.zip';

	// El tema no tiene paquete es_CO. Se baja el de es_ES y se renombra: sus
	// textos son idénticos y así el tema tampoco queda en inglés.
	//
	// Va en languages/themes/ y no en la raíz porque es donde WordPress busca
	// las traducciones de los temas; en la raíz no se cargan.
	if ( midsummer_download( 'https://downloads.wordpress.org/translation/theme/twentytwentyfive/1.4/es_ES.zip', $zip ) ) {
		$temporal = $languages . '/twentytwentyfive-es_ES.mo';

		if ( midsummer_unzip( $zip, $languages ) && file_exists( $temporal ) ) {
			rename( $temporal, $theme_mo );
		}

		// El .po y el .l10n.php no se usan en ejecución: solo estorban.
		foreach ( glob( $languages . '/twentytwentyfive-es_ES.*' ) ?: array() as $sobra ) {
			unlink( $sobra );
		}

		unlink( $zip );
	}
}

if ( file_exists( $theme_mo ) ) {
	out( '  Traducción del tema instalada.' );
} else {
	fwrite( STDERR, "No se pudo instalar la traducción del tema: quedará partially en inglés.\n" );
}

// El idioma se fija en la base de datos y no en wp-config.php: así el
// instalador no tiene que escribir en un archivo que genera, y se puede
// cambiar desde Ajustes → Generales.
if ( 'es_CO' !== get_locale() ) {
	update_option( 'WPLANG', 'es_CO' );
	out( '  Idioma del panel: es_CO.' );
}

// ── 7. Contenido de demostración ────────────────────────────────────────
$created = Midsummer_Demo_Content::seed( true );

out( "Contenido de demostración creado: $created entradas." );

// ── 8. Resumen ──────────────────────────────────────────────────────────
echo PHP_EOL;

foreach ( array( 'project', 'solution', 'installer', 'post', 'page' ) as $type ) {
	$counts = wp_count_posts( $type );

	printf(
		'  %-10s %d publicados%s',
		$type,
		$counts ? (int) $counts->publish : 0,
		PHP_EOL
	);
}

out( 'Listo. La API esta en ' . rest_url() );

// ── Utilidades de descarga ──────────────────────────────────────────────
/**
 * Descarga un archivo a disco.
 *
 * @param string $url     Dirección de origen.
 * @param string $destino Ruta de destino.
 * @return bool True si se descargó.
 */
function midsummer_download( string $url, string $destino ): bool {
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
 * @param string $zip      Ruta del zip.
 * @param string $destino  Directorio de destino.
 * @return bool True si se descomprimió.
 */
function midsummer_unzip( string $zip, string $destino ): bool {
	$archivo = new ZipArchive();

	if ( true !== $archivo->open( $zip ) ) {
		return false;
	}

	$ok = $archivo->extractTo( $destino );
	$archivo->close();

	return $ok;
}
