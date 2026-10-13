<?php
/**
 * Prueba manual del webhook de compilación.
 *
 * Levanta WordPress con un webhook y un secreto de prueba, y despublica una
 * entrada para comprobar que el build se dispara y llega firmado. Comprueba
 * contra un receptor local, nunca contra un servicio real.
 *
 * Uso: npm run cms:webhook-test
 *
 * @package Midsummer
 */

declare( strict_types = 1 );

$root = dirname( __DIR__ );

$receptor = $argv[1] ?? 'http://localhost:8099/build-hook';
$log      = $argv[2] ?? ( sys_get_temp_dir() . '/midsummer-build-received.json' );

// El receptor de prueba, para poder ver qué llega sin montar nada.
if ( ! file_exists( $log ) ) {
	file_put_contents( $log, '{}' );
}

define( 'WP_USE_THEMES', false );
define( 'MIDSUMMER_BUILD_HOOK', $receptor );
define( 'MIDSUMMER_BUILD_SECRET', 'secreto-de-prueba-no-usar-en-produccion' );

require $root . '/.wordpress/wordpress/wp-load.php';

echo 'Webhook configurado: ', MIDSUMMER_BUILD_HOOK, PHP_EOL;

$posts = get_posts(
	array(
		'post_type'      => 'project',
		'post_status'    => 'publish',
		'posts_per_page' => 1,
	)
);

if ( ! $posts ) {
	fwrite( STDERR, "No hay proyectos publicados que probar.\n" );
	exit( 1 );
}

$id   = $posts[0]->ID;
$prev = $posts[0]->post_status;

echo 'Despublicando el proyecto #', $id, ' (', $posts[0]->post_name, ')', PHP_EOL;

wp_update_post(
	array(
		'ID'          => $id,
		'post_status' => 'draft',
	)
);

$registro = get_option( 'midsummer_last_build' );
echo 'Ultimo build registrado: ', wp_json_encode( $registro ), PHP_EOL;

// Se devuelve a publicado para no dejar el entorno local cojo.
wp_update_post(
	array(
		'ID'          => $id,
		'post_status' => $prev,
	)
);

echo 'Contenido restaurado a ', $prev, PHP_EOL;

// Si el receptor no ha escrito nada, el webhook no salió.
clearstatcache();
$recibido = json_decode( (string) file_get_contents( $log ), true );

if ( empty( $recibido ) || ! isset( $recibido['body'] ) ) {
	fwrite( STDERR, "El receptor no registro ninguna llamada al webhook.\n" );
	exit( 1 );
}

echo PHP_EOL, 'Receptor registro:', PHP_EOL;
echo json_encode( $recibido, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES ), PHP_EOL;

// El plugin firma el cuerpo SIN el campo signature (que añade después), y lo
// firma con el mismo orden de claves. Para verificar hay que quitar la firma
// del cuerpo recibido y recomputarla con el secreto de prueba.
$secreto = 'secreto-de-prueba-no-usar-en-produccion';
$cuerpo  = $recibido['body'];
$firma   = (string) ( $cuerpo['signature'] ?? '' );
unset( $cuerpo['signature'] );

$esperado = hash_hmac( 'sha256', (string) wp_json_encode( $cuerpo ), $secreto );

$firma_ok      = hash_equals( $esperado, $firma );
$cabecera_ok   = hash_equals( $esperado, (string) ( $recibido['headers']['signature'] ?? '' ) );
$email_ok      = 'publish' === ( $recibido['headers']['event'] ?? '' );
$json_ok       = 'application/json' === ( $recibido['headers']['type'] ?? '' );

echo PHP_EOL, 'Firma del cuerpo verificada:   ', $firma_ok ? 'correcta' : 'INCORRECTA', PHP_EOL;
echo 'Firma de la cabecera verificada: ', $cabecera_ok ? 'correcta' : 'INCORRECTA', PHP_EOL;
echo 'Evento en cabecera:              ', $email_ok ? 'publish (correcto)' : ( $recibido['headers']['event'] ?? 'falta' ), PHP_EOL;
echo 'Tipo de contenido:               ', $json_ok ? 'JSON (correcto)' : ( $recibido['headers']['type'] ?? 'falta' ), PHP_EOL;
echo 'El cuerpo incluye el id del post: ', ( $cuerpo['post_id'] ?? 0 ) === $id ? 'si' : 'no', PHP_EOL;

$ok = $firma_ok && $cabecera_ok && $email_ok && $json_ok;

echo PHP_EOL, $ok ? 'PRUEBA SUPERADA' : 'PRUEBA NO SUPERADA', PHP_EOL;

exit( $ok ? 0 : 1 );