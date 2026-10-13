<?php
/**
 * Campos de edición en wp-admin.
 *
 * Sin esto el CMS sería una API que nadie puede llenar. Aquí cada campo del
 * contrato se dibuja en la pantalla de edición del post type correspondiente.
 *
 * Seguridad: nonce en el formulario, verificación del nonce al guardar y
 * saneamiento por tipo antes de escribir. Nunca se guarda lo que llega del POST
 * sin revisar.
 *
 * @package Midsummer
 */

declare( strict_types = 1 );

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Metacajas del contrato.
 */
final class Midsummer_Metaboxes {

	private const NONCE = 'midsummer_content_fields';

	/**
	 * Registra los hooks.
	 */
	public static function register_hooks(): void {
		add_action( 'add_meta_boxes', array( __CLASS__, 'add_meta_boxes' ) );
		add_action( 'save_post', array( __CLASS__, 'save' ), 10, 2 );
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_assets' ) );
	}

	/**
	 * Declara la metacaja de cada post type con campos.
	 */
	public static function add_meta_boxes(): void {
		foreach ( array_keys( Midsummer_Fields::fields_by_post_type() ) as $post_type ) {
			add_meta_box(
				'midsummer-content-fields',
				__( 'Campos de Midsummer', 'midsummer' ),
				array( __CLASS__, 'render' ),
				$post_type,
				'normal',
				'high'
			);
		}
	}

	/**
	 * Dibuja los campos.
	 *
	 * @param WP_Post $post Post en edición.
	 */
	public static function render( WP_Post $post ): void {
		$fields = Midsummer_Fields::fields_by_post_type()[ $post->post_type ] ?? array();

		if ( array() === $fields ) {
			return;
		}

		wp_nonce_field( self::NONCE, self::NONCE . '_nonce' );

		echo '<style>.midsummer-field{margin:0 0 1.25em}.midsummer-field label{display:block;font-weight:600;margin-bottom:.35em}.midsummer-field input[type=text],.midsummer-field input[type=number],.midsummer-field input[type=url],.midsummer-field input[type=email],.midsummer-field textarea{width:100%;max-width:640px}.midsummer-field p.description{margin-top:.35em}</style>';

		foreach ( $fields as $key => $field ) {
			$value = get_post_meta( $post->ID, $key, true );

			echo '<div class="midsummer-field">';
			printf(
				'<label for="midsummer-%1$s">%2$s</label>',
				esc_attr( $key ),
				esc_html( $field['label'] ?? $key )
			);

			self::render_input( $key, $field, $value );

			if ( ! empty( $field['help'] ) ) {
				printf( '<p class="description">%s</p>', esc_html( $field['help'] ) );
			}

			echo '</div>';
		}
	}

	/**
	 * Dibuja el control adecuado al tipo de campo.
	 *
	 * @param string               $key   Nombre del campo.
	 * @param array<string, mixed> $field Definición del campo.
	 * @param mixed                $value Valor actual.
	 */
	private static function render_input( string $key, array $field, $value ): void {
		$id    = 'midsummer-' . $key;
		$name  = 'midsummer_fields[' . $key . ']';
		$ui    = $field['ui'] ?? 'text';
		$value = is_scalar( $value ) ? (string) $value : '';

		switch ( $ui ) {
			case 'checkbox':
				printf(
					'<label><input type="checkbox" id="%1$s" name="%2$s" value="1" %3$s> %4$s</label>',
					esc_attr( $id ),
					esc_attr( $name ),
					checked( '1', $value, false ),
					esc_html__( 'Sí', 'midsummer' )
				);
				break;

			case 'textarea':
				printf(
					'<textarea id="%1$s" name="%2$s" rows="4">%3$s</textarea>',
					esc_attr( $id ),
					esc_attr( $name ),
					esc_textarea( $value )
				);
				break;

			case 'lines':
				$lines = is_array( $value ) ? implode( "\n", array_map( 'strval', $value ) ) : '';
				printf(
					'<textarea id="%1$s" name="%2$s" rows="4">%3$s</textarea>',
					esc_attr( $id ),
					esc_attr( $name ),
					esc_textarea( $lines )
				);
				break;

			case 'repeater':
				self::render_repeater( $id, $name, is_array( $value ) ? $value : array() );
				break;

			case 'number':
				printf(
					'<input type="number" step="%3$s" id="%1$s" name="%2$s" value="%4$s">',
					esc_attr( $id ),
					esc_attr( $name ),
					esc_attr( (string) ( $field['step'] ?? '1' ) ),
					esc_attr( $value )
				);
				break;

			case 'url':
			case 'email':
			case 'text':
			default:
				printf(
					'<input type="%4$s" id="%1$s" name="%2$s" value="%3$s" class="regular-text">',
					esc_attr( $id ),
					esc_attr( $name ),
					esc_attr( $value ),
					esc_attr( 'url' === $ui ? 'url' : ( 'email' === $ui ? 'email' : 'text' ) )
				);
				break;
		}
	}

	/**
	 * Dibuja el editor de la lista de redes sociales.
	 *
	 * @param string              $id    Id del contenedor.
	 * @param string              $name  Nombre del campo.
	 * @param array<int, mixed>   $items Entradas actuales.
	 */
	private static function render_repeater( string $id, string $name, array $items ): void {
		$rows = array();

		foreach ( $items as $item ) {
			if ( is_array( $item ) ) {
				$rows[] = array(
					'label' => isset( $item['label'] ) ? (string) $item['label'] : '',
					'url'   => isset( $item['url'] ) ? (string) $item['url'] : '',
				);
			}
		}

		echo '<div data-midsummer-repeater>';

		foreach ( $rows as $index => $row ) {
			printf(
				'<div data-midsummer-row=""><p><input type="text" name="%1$s[%2$d][label]" value="%3$s" placeholder="%4$s"> <input type="url" name="%1$s[%2$d][url]" value="%5$s" placeholder="%6$s" class="regular-text"> <button type="button" class="button-link-delete" data-midsummer-remove>&times;</button></p></div>',
				esc_attr( $name ),
				(int) $index,
				esc_attr( $row['label'] ),
				esc_attr__( 'Nombre', 'midsummer' ),
				esc_attr( $row['url'] ),
				esc_attr__( 'https://', 'midsummer' )
			);
		}

		// La entrada vacía se declara una sola vez, aquí, y JavaScript clona este
		// template. Mantener el marcado en PHP y en JavaScript a la vez lo
		// desincroniza: ya pasó con el índice de los campos repetibles, que en
		// JavaScript quedaba sin sustituir y se veía tal cual en el formulario.
		printf(
			'<template data-midsummer-template data-name="%1$s"><div data-midsummer-row><p><input type="text" name="%1$s[__INDEX__][label]" value="" placeholder="%2$s"> <input type="url" name="%1$s[__INDEX__][url]" value="" placeholder="%3$s" class="regular-text"> <button type="button" class="button-link-delete" data-midsummer-remove>&times;</button></p></div></template>',
			esc_attr( $name ),
			esc_attr__( 'Nombre', 'midsummer' ),
			esc_attr__( 'https://', 'midsummer' )
		);

		printf(
			'<p><button type="button" class="button" data-midsummer-add data-midsummer-name="%s">%s</button></p>',
			esc_attr( $name ),
			esc_html__( 'Añadir entrada', 'midsummer' )
		);

		echo '</div>';
	}

	/**
	 * Encola el script de los campos repetibles.
	 *
	 * @param string $hook_suffix Pantalla actual.
	 */
	public static function enqueue_assets( string $hook_suffix ): void {
		$screen = get_current_screen();

		if ( null === $screen || ! in_array( $screen->post_type, array_keys( Midsummer_Fields::fields_by_post_type() ), true ) ) {
			return;
		}

		wp_enqueue_script(
			'midsummer-content-fields',
			plugins_url( 'assets/admin.js', MIDSUMMER_CONTENT_FILE ),
			array(),
			MIDSUMMER_CONTENT_VERSION,
			true
		);

		unset( $hook_suffix );
	}

	/**
	 * Guarda los campos enviados por el formulario.
	 *
	 * @param int     $post_id Id del post.
	 * @param WP_Post $post    Post en edición.
	 */
	public static function save( int $post_id, WP_Post $post ): void {
		if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
			return;
		}

		if ( wp_is_post_revision( $post_id ) ) {
			return;
		}

		$nonce = isset( $_POST[ self::NONCE . '_nonce' ] )
			? sanitize_text_field( wp_unslash( $_POST[ self::NONCE . '_nonce' ] ) )
			: '';

		if ( ! wp_verify_nonce( $nonce, self::NONCE ) ) {
			return;
		}

		if ( ! current_user_can( 'edit_post', $post_id ) ) {
			return;
		}

		$fields = Midsummer_Fields::fields_by_post_type()[ $post->post_type ] ?? array();

		if ( array() === $fields ) {
			return;
		}

		// Un checkbox sin marcar no llega en el POST: se comprueba aparte.
		$submitted = isset( $_POST['midsummer_fields'] ) && is_array( $_POST['midsummer_fields'] )
			? wp_unslash( $_POST['midsummer_fields'] )
			: array();

		foreach ( $fields as $key => $field ) {
			$raw = $submitted[ $key ] ?? null;

			if ( 'checkbox' === ( $field['ui'] ?? '' ) ) {
				$raw = null === $raw ? '' : $raw;
			}

			if ( null === $raw ) {
				continue;
			}

			// Las listas llegan como textarea con un valor por línea.
			if ( 'lines' === ( $field['ui'] ?? '' ) && is_string( $raw ) ) {
				$raw = preg_split( '/\r\n|\r|\n/', $raw ) ?: array();
			}

			$clean = Midsummer_Fields::sanitize( $raw, $field );

			if ( null === $clean || '' === $clean || array() === $clean ) {
				delete_post_meta( $post_id, $key );
				continue;
			}

			// Los tipos compuestos se guardan como JSON.
			if ( in_array( $field['type'], array( 'string[]', 'object[]' ), true ) ) {
				$clean = wp_json_encode( $clean );
			}

			update_post_meta( $post_id, $key, $clean );
		}
	}
}
