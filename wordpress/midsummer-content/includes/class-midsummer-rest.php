<?php
/**
 * Puente entre los campos registrados y la clave `acf` que lee el frontend.
 *
 * El proveedor de Astro (src/lib/cms/providers/wordpress.ts) busca los campos
 * bajo `post.acf.<campo>`, porque el modelo original se resolvió con ACF. En vez
 * de obligar a instalar ACF Pro, este filtro reconstruye esa clave con los
 * metadatos registrados por register_post_meta().
 *
 * El resultado es que el frontend no cambia una línea, el contrato sigue siendo
 * el de docs/content-model.md y no hace falta ninguna licencia.
 *
 * @package Midsummer
 */

declare( strict_types = 1 );

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Exposición de los campos bajo la clave `acf`.
 */
final class Midsummer_Rest {

	/**
	 * Registra los hooks.
	 */
	public static function register_hooks(): void {
		foreach ( array( 'post', 'page', 'project', 'solution', 'installer' ) as $post_type ) {
			add_filter( "rest_prepare_{$post_type}", array( __CLASS__, 'inject_acf' ), 10, 3 );
		}
	}

	/**
	 * Añade la clave `acf` con los campos del post type.
	 *
	 * @param WP_REST_Response $response Respuesta que se va a devolver.
	 * @param WP_Post          $post     Post solicitado.
	 * @param WP_REST_Request  $request  Petición original.
	 * @return WP_REST_Response
	 */
	public static function inject_acf( $response, $post, $request ) {
		if ( ! $post instanceof WP_Post ) {
			return $response;
		}

		$fields = Midsummer_Fields::fields_by_post_type()[ $post->post_type ] ?? array();

		if ( array() === $fields ) {
			return $response;
		}

		$data = $response->get_data();
		$acf  = is_array( $data ) && isset( $data['acf'] ) && is_array( $data['acf'] )
			? $data['acf']
			: array();

		foreach ( $fields as $key => $field ) {
			$acf[ $key ] = Midsummer_Fields::for_rest( get_post_meta( $post->ID, $key, true ), $field );
		}

		$data['acf'] = $acf;

		$response->set_data( $data );

		return $response;
	}
}
