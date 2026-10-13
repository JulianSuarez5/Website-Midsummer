<?php
/**
 * Muestra el estado de publicación de los post types del sitio.
 *
 * Uso: php tools/check-demo-content.php
 *
 * @package Midsummer
 */

declare( strict_types = 1 );

$root = dirname( __DIR__ );

define( 'WP_USE_THEMES', false );
require $root . '/.wordpress/wordpress/wp-load.php';

foreach ( array( 'project', 'solution', 'installer', 'post', 'page' ) as $tipo ) {
	$c = wp_count_posts( $tipo );

	printf(
		'%-12s publish=%-3d draft=%-3d otros=%d%s',
		$tipo,
		(int) ( $c->publish ?? 0 ),
		(int) ( $c->draft ?? 0 ),
		( (int) ( $c->publish ?? 0 ) + (int) ( $c->draft ?? 0 ) ),
		PHP_EOL
	);
}