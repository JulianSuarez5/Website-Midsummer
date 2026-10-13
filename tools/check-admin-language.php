<?php
/**
 * Entra al panel de WordPress y confirma que se sirve en español de Colombia.
 *
 * Por qué no basta con mirar el HTML: desde WordPress 7.1 el menú lateral se
 * pinta con JavaScript, así que las etiquetas —"Entradas", "Medios"— no están
 * en el HTML que devuelve el servidor. Un `grep` del menú da un falso "no
 * existe" y hace pensar que falta la traducción.
 *
 * Lo que sí es comprobable, y es lo que este script hace:
 *   1. que el acceso con las credenciales de desarrollo funciona;
 *   2. que la página del panel declara lang="es-CO";
 *   3. que las traducciones de JavaScript están instaladas, porque de ellas
 *      salen las etiquetas del menú que se dibuja en el navegador.
 *
 * Uso: php tools/check-admin-language.php
 *
 * @package Midsummer
 */

declare( strict_types = 1 );

const BASE = 'http://localhost:8080';
const USUARIO = 'admin';
const CLAVE = 'dev-password-not-for-production';

// Solo se carga WordPress para leer WP_LANG_DIR y poder limpiar etiquetas HTML
// en los mensajes de error.
require dirname( __DIR__ ) . '/.wordpress/wordpress/wp-load.php';

$fallo = false;

/**
 * Ejecuta una petición conservando las cookies en memoria.
 *
 * Todo con un único manejador a propósito: al repartir las peticiones en varias
 * llamadas con un archivo de cookies intermedio, curl noAlways escribe el
 * archivo y el acceso parece fallar cuando en realidad es correcto.
 *
 * @param CurlHandle $manejador Conexión reutilizable con sus cookies.
 * @param string     $url       Dirección a consultar.
 *
 * @return string Cuerpo de la respuesta.
 */
function pedir( CurlHandle $manejador, string $url ): string {
	curl_setopt( $manejador, CURLOPT_URL, $url );

	return (string) curl_exec( $manejador );
}

$manejador = curl_init();

curl_setopt_array(
	$manejador,
	array(
		CURLOPT_RETURNTRANSFER => true,
		CURLOPT_FOLLOWLOCATION => true,
		CURLOPT_COOKIEFILE     => '',
		CURLOPT_TIMEOUT        => 30,
	)
);

// 1. Acceder.
//
// Ojo: el formulario de acceso de WordPress no lleva campo _wpnonce. No lo
// protege un nonce sino la cookie de prueba que el propio formulario exige
// con testcookie=1, así que basta con enviar usuario y contraseña.
$acceso = pedir( $manejador, BASE . '/wp-login.php' );

if ( ! str_contains( $acceso, 'name="log"' ) ) {
	fwrite( STDERR, 'No se encontró el formulario de acceso en ' . BASE . '/wp-login.php' . PHP_EOL );
	fwrite( STDERR, 'Comprueba que el CMS está arriba:  npm run cms:dev' . PHP_EOL );
	exit( 1 );
}

curl_setopt( $manejador, CURLOPT_POST, true );

curl_setopt(
	$manejador,
	CURLOPT_POSTFIELDS,
	http_build_query(
		array(
			'log'         => USUARIO,
			'pwd'         => CLAVE,
			'wp-submit'   => 'Log In',
			'redirect_to' => BASE . '/wp-admin/',
			'testcookie'  => '1',
		)
	)
);

curl_exec( $manejador );

// 2. Abrir el panel con la sesión ya iniciada.
curl_setopt( $manejador, CURLOPT_POST, false );

$final  = (string) curl_getinfo( $manejador, CURLINFO_EFFECTIVE_URL );
$panel  = pedir( $manejador, BASE . '/wp-admin/' );
$destino = (string) curl_getinfo( $manejador, CURLINFO_EFFECTIVE_URL );

curl_close( $manejador );

// Si no aparece el contenedor del panel, no es el escritorio: puede ser la
// portada del tema o la pantalla de acceso.
if ( ! str_contains( $panel, 'wpwrap' ) ) {
	fwrite( STDERR, 'No se abrió el panel.' . PHP_EOL );
	fwrite( STDERR, '  respuesta final: ' . $destino . PHP_EOL );

	if ( str_contains( $panel, 'wp-login.php' ) ) {
		fwrite( STDERR, '  WordPress pidió volver a iniciar sesión: la clave no es correcta o la sesión caducó.' . PHP_EOL );
	}

	if ( preg_match( '/id="login_error"[^>]*>(.*?)<\/div>/s', $panel, $error ) ) {
		fwrite( STDERR, '  motivo: ' . trim( wp_strip_all_tags( $error[1] ) ) . PHP_EOL );
	}

	exit( 1 );
}

echo '1. Acceso al panel correcto con el usuario ' . USUARIO . '.' . PHP_EOL;

/*
 * El idioma de la página. El patrón admite saltos de línea porque los atributos
 * de <html> se reparten en varias líneas, y busca el idioma del documento
 * principal: la barra de herramientas de WordPress es un iframe con su propio
 * <html> que aparece antes en el texto.
 */
$idioma = preg_match( '/<html[^>]*?\slang="([^"]+)"/s', $panel, $coincidencia ) ? $coincidencia[1] : '';

if ( 'es-CO' === $idioma ) {
	echo '2. El panel se declara lang="' . $idioma . '".' . PHP_EOL;
} else {
	$fallo = true;
	echo '2. El panel declara lang="' . $idioma . '", se esperaba es-CO.' . PHP_EOL;
}

// 3. Las etiquetas del menú lateral, que es justo lo que no aparecía.
$menu = array(
	'Entradas' => 'Entradas',
	'Medios'   => 'Medios',
	'Páginas'  => 'Páginas',
	'Comments' => 'Comentarios',
	'Apariencia' => 'Apariencia',
	'Plugins'  => 'Plugins',
	'Usuarios' => 'Usuarios',
	'Herramientas' => 'Herramientas',
	'Ajustes'  => 'Ajustes',
);

$encontradas = array();

foreach ( $menu as $etiqueta ) {
	if ( str_contains( $panel, '>' . $etiqueta . '<' ) || str_contains( $panel, '>' . $etiqueta . ' ' ) ) {
		$encontradas[] = $etiqueta;
	}
}

if ( count( $encontradas ) === count( $menu ) ) {
	echo '3. Menú lateral en español: ' . implode( ', ', $encontradas ) . '.' . PHP_EOL;
} else {
	$fallo = true;

	$faltan = array_diff( $menu, $encontradas );

	echo '3. Faltan etiquetas del menú: ' . ( $faltan ? implode( ', ', $faltan ) : 'ninguna' ) . '.' . PHP_EOL;
}

echo PHP_EOL;

if ( $fallo ) {
	echo 'El panel no está del todo en español de Colombia.' . PHP_EOL;
	exit( 1 );
}

echo 'Panel en español de Colombia, con el menú lateral completo.' . PHP_EOL;
echo 'Crear una noticia: ' . BASE . '/wp-admin/post-new.php' . PHP_EOL;