<?php
/**
 * Registro de los campos del contrato en la REST API.
 *
 * Usa register_post_meta() con show_in_rest, que es la forma nativa de exponer
 * metadatos por la API. No requiere ACF.
 *
 * La conversión entre el tipo del contrato y el tipo que WordPress entiende:
 *
 *   string / number / boolean → directo
 *   string[]                  → array con items de tipo string, guardado como JSON
 *   object[]                  → array de objetos, guardado como JSON
 *
 * @package Midsummer
 */

declare( strict_types = 1 );

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Campos del contrato.
 */
final class Midsummer_Fields {

	/**
	 * Registra los hooks.
	 */
	public static function register_hooks(): void {
		add_action( 'init', array( __CLASS__, 'register' ), 20 );
	}

	/**
	 * Mapa post type → campos que le corresponden.
	 *
	 * @return array<string, array<string, array<string, mixed>>>
	 */
	public static function fields_by_post_type(): array {
		$contract = midsummer_content_contract();

		$map = array();

		foreach ( $contract['fields'] as $post_type => $fields ) {
			$map[ $post_type ] = $fields;
		}

		// Los campos de SEO se replican en todos los post types del contrato.
		foreach ( $contract['seo_types'] as $post_type ) {
			$map[ $post_type ] = array_merge(
				$map[ $post_type ] ?? array(),
				$contract['seo']
			);
		}

		return $map;
	}

	/**
	 * Traduce el tipo del contrato al tipo que WordPress acepta en el esquema.
	 *
	 * @param array<string, mixed> $field Definición del campo.
	 * @return string
	 */
	private static function wp_type( array $field ): string {
		$rest_type = $field['rest_type'] ?? 'string';

		// WordPress no distingue entre número entero y decimal en el esquema.
		return 'number' === $rest_type ? 'number' : $rest_type;
	}

	/**
	 * Construye el esquema que ve la REST API.
	 *
	 * @param array<string, mixed> $field Definición del campo.
	 * @return array<string, mixed>
	 */
	private static function schema( array $field ): array {
		$schema = array( 'type' => self::wp_type( $field ) );

		if ( isset( $field['rest_items'] ) ) {
			$schema['items'] = $field['rest_items'];
		}

		return $schema;
	}

	/**
	 * Declara todos los campos.
	 */
	public static function register(): void {
		foreach ( self::fields_by_post_type() as $post_type => $fields ) {
			foreach ( $fields as $key => $field ) {
				register_post_meta(
					$post_type,
					$key,
					array(
						'type'              => self::wp_type( $field ),
						'description'       => $field['label'] ?? $key,
						'show_in_rest'      => true,
						'single'            => true,
						'sanitize_callback' => static function ( $value ) use ( $field ) {
							return self::sanitize( $value, $field );
						},
						'auth_callback'     => static function (): bool {
							return current_user_can( 'edit_posts' );
						},
					)
				);
			}
		}
	}

	/**
	 * Sanea un valor según el tipo del contrato.
	 *
	 * @param mixed                $value Valor recibido.
	 * @param array<string, mixed> $field Definición del campo.
	 * @return mixed
	 */
	public static function sanitize( $value, array $field ) {
		$type = $field['type'] ?? 'string';

		switch ( $type ) {
			case 'string':
				return is_scalar( $value ) ? sanitize_text_field( (string) $value ) : '';

			case 'number':
				return is_numeric( $value ) ? (float) $value : null;

			case 'boolean':
				// WordPress y el frontend aceptan tanto true como "1".
				return (bool) $value;

			case 'string[]':
				if ( ! is_array( $value ) ) {
					return array();
				}

				return array_values(
					array_filter(
						array_map(
							static fn( $item ): string => sanitize_text_field( (string) $item ),
							$value
						),
						static fn( string $item ): bool => '' !== $item
					)
				);

			case 'object[]':
				if ( ! is_array( $value ) ) {
					return array();
				}

				$clean = array();

				foreach ( $value as $item ) {
					if ( ! is_array( $item ) ) {
						continue;
					}

					$entry = array();

					foreach ( array( 'label', 'url' ) as $property ) {
						if ( isset( $item[ $property ] ) && is_scalar( $item[ $property ] ) ) {
							$entry[ $property ] = sanitize_text_field( (string) $item[ $property ] );
						}
					}

					if ( array() !== $entry ) {
						$clean[] = $entry;
					}
				}

				return $clean;

			default:
				return $value;
		}
	}

	/**
	 * Normaliza un valor almacenado para devolverlo como el frontend lo espera.
	 *
	 * Solo se decodifica JSON en los campos compuestos. Aplicar `json_decode` a
	 * cualquier cadena convierte el texto plano en `array()`, porque
	 * `json_decode('Un departamento')` devuelve null: los campos de texto
	 * desaparecían de la respuesta sin error visible.
	 *
	 * Un campo vacío tampoco es lo mismo que un campo en blanco, así que cada
	 * tipo tiene su valor vacío: los compuestos son `[]`, los booleanos
	 * `false` y el resto `null`.
	 *
	 * @param mixed                $value Valor crudo de la base de datos.
	 * @param array<string, mixed> $field Definición del campo.
	 * @return mixed
	 */
	public static function for_rest( $value, array $field ) {
		$type  = $field['type'] ?? 'string';
		$isSet = null !== $value && '' !== $value && array() !== $value;

		if ( ! $isSet ) {
			return self::empty_for_rest( $type );
		}

		if ( in_array( $type, array( 'string[]', 'object[]' ), true ) ) {
			$decoded = is_string( $value ) ? json_decode( $value, true ) : $value;

			return is_array( $decoded ) ? $decoded : array();
		}

		if ( 'boolean' === $type ) {
			// WordPress guarda los booleanos como '' o '1'.
			return (bool) $value;
		}

		if ( 'number' === $type ) {
			return is_numeric( $value ) ? $value + 0 : null;
		}

		return is_scalar( $value ) ? (string) $value : null;
	}

	/**
	 * Valor vacío de un tipo del contrato.
	 *
	 * @param string $type Tipo del campo.
	 * @return mixed
	 */
	private static function empty_for_rest( string $type ) {
		if ( in_array( $type, array( 'string[]', 'object[]' ), true ) ) {
			return array();
		}

		if ( 'boolean' === $type ) {
			return false;
		}

		return null;
	}
}
