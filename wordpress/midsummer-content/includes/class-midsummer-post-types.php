<?php
/**
 * Registro de los post types del contrato.
 *
 * @package Midsummer
 */

declare( strict_types = 1 );

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Post types de Midsummer.
 */
final class Midsummer_Post_Types {

	/**
	 * Registra los hooks.
	 */
	public static function register_hooks(): void {
		add_action( 'init', array( __CLASS__, 'register' ) );
	}

	/**
	 * Declara los post types del contrato.
	 */
	public static function register(): void {
		$contract = midsummer_content_contract();

		foreach ( $contract['post_types'] as $slug => $definition ) {
			register_post_type(
				$slug,
				array(
					'labels'             => array(
						'name'          => $definition['label'],
						'singular_name' => $definition['singular'],
					),
					'public'             => true,
					'has_archive'       => false,
					'hierarchical'      => false,
					'supports'          => $definition['supports'],
					'menu_icon'         => $definition['menu_icon'],
					'show_in_rest'      => true,
					'rest_base'         => $definition['rest_base'],
					'menu_position'     => 26,
					// El contenido lo publica el equipo de Midsummer desde
					// wp-admin, no desde la API.
					'map_meta_cap'      => true,
					'capability_type'   => 'post',
				)
			);
		}
	}
}
