<?php
/**
 * Restaura todo el contenido demo a publicado en el entorno local.
 *
 * Las pruebas del webhook fallidas dejaron proyectos en borrador. Este script
 * devuelve todo a `publish` para que el sitio local vuelva a tener contenido.
 *
 * Uso: php tools/restore-demo-content.php
 *
 * @package Midsummer
 */

declare( strict_types = 1 );

$root = dirname( __DIR__ );

define( 'WP_USE_THEMES', false );
require $root . '/.wordpress/wordpress/wp-load.php';

$editados       = 0;
$publicado      = 0;
$desde_borrador = 0;

foreach ( array( 'project', 'solution', 'installer', 'post', 'page' ) as $tipo ) {
	foreach ( get_posts( array( 'post_type' => $tipo, 'post_status' => 'any', 'posts_per_page' => -1 ) ) as $post ) {
	$editados++;

	if ( 'publish' !== $post->post_status ) {
		$desde_borrador++;
	}

	wp_update_post(
		array(
			'ID'          => $post->ID,
			'post_status' => 'publish',
		)
	);

	$publicado++;
	}
}

$count = wp_count_posts();

echo "editados:   $editados" . PHP_EOL;
echo "publicados: $publicado (de borrador: $desde_borrador)" . PHP_EOL;
echo 'projects publicados (borrador): ' . ( $count->project->publish ?? 0 ) . ' ( ' . ( $count->project->draft ?? 0 ) . ' )';

exit( $desde_borrador > 0 ? 0 : 0 );