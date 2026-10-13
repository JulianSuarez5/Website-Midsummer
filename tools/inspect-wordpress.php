<?php
/**
 * Inspección del estado del CMS local.
 *
 * Uso:  php tools/inspect-wordpress.php
 *
 * @package Midsummer
 */

declare( strict_types = 1 );

$wp_dir = dirname( __DIR__ ) . '/.wordpress/wordpress';
require_once $wp_dir . '/wp-load.php';

echo "post types registrados: ";
$registered = get_post_types( array(), 'names' );
foreach ( array( 'project', 'solution', 'installer', 'post', 'page' ) as $type ) {
	echo $type, '=', ( post_type_exists( $type ) ? 'si' : 'NO' ), ' ';
}
echo PHP_EOL;

unset( $registered );

echo "plugin activo: ", ( is_plugin_active( 'midsummer-content/midsummer-content.php' ) ? 'si' : 'no' ), PHP_EOL;

foreach ( array( 'post', 'page', 'project', 'solution', 'installer' ) as $type ) {
	$counts = wp_count_posts( $type );

	if ( ! $counts ) {
		echo "  $type: (post type no registrado)", PHP_EOL;
		continue;
	}

	$all = array();
	foreach ( get_object_vars( $counts ) as $status => $n ) {
		if ( $n > 0 ) {
			$all[] = "$status=$n";
		}
	}

	echo "  $type: ", ( $all ? implode( ', ', $all ) : 'vacio' ), PHP_EOL;
}

echo PHP_EOL, "Entradas creadas:", PHP_EOL;

$posts = get_posts(
	array(
		'post_type'      => array( 'post', 'page', 'project', 'solution', 'installer' ),
		'post_status'    => 'any',
		'posts_per_page' => -1,
		'orderby'        => 'ID',
		'order'          => 'ASC',
	)
);

foreach ( $posts as $post ) {
	printf(
		"  #%-4d %-10s %-9s %s%s",
		$post->ID,
		$post->post_type,
		$post->post_status,
		$post->post_title,
		PHP_EOL
	);
}
