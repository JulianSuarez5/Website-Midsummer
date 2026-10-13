<?php
/**
 * Plugin Name:       Midsummer Content Fields
 * Plugin URI:        https://midsummersolar.co
 * Description:       Registra el contrato de contenido que consume el frontend en Astro: post types, campos y exposicion en la REST API. No requiere ACF ni plugins de pago.
 * Version:           1.0.0
 * Requires at least: 6.5
 * Requires PHP:      8.0
 * Author:            Midsummer Colombia
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       midsummer
 *
 * Registra en WordPress exactamente el contrato de contenido que consume el
 * frontend en Astro, sin depender de ACF ni de plugins de pago.
 *
 * Por qué no ACF: el frontend lee los campos bajo la clave `acf` y el campo
 * `social` es una lista de objetos, que con ACF exige el campo Repeater de la
 * versión Pro. Este plugin expone los mismos nombres de campo bajo `acf` usando
 * las funciones nativas de WordPress, sin licencia y sin campos arbitrarios.
 *
 * Qué hace:
 *   1. Registra los post types project, solution e installer.
 *   2. Registra los campos con register_post_meta() y los expone en la REST API.
 *   3. Inserta esos campos bajo la clave `acf` de cada respuesta, que es donde
 *      el proveedor de Astro los busca.
 *   4. Dibuja los campos en wp-admin para que se puedan editar sin código.
 *
 * El contrato vive en contract.php. Si cambia el frontend, cambia ese archivo.
 *
 * @package Midsummer
 */

declare( strict_types = 1 );

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'MIDSUMMER_CONTENT_VERSION', '1.0.0' );
define( 'MIDSUMMER_CONTENT_FILE', __FILE__ );

require_once __DIR__ . '/contract.php';
require_once __DIR__ . '/includes/class-midsummer-post-types.php';
require_once __DIR__ . '/includes/class-midsummer-fields.php';
require_once __DIR__ . '/includes/class-midsummer-rest.php';
require_once __DIR__ . '/includes/class-midsummer-metaboxes.php';
require_once __DIR__ . '/includes/class-midsummer-build-hook.php';
require_once __DIR__ . '/includes/class-midsummer-build-status.php';
require_once __DIR__ . '/includes/class-midsummer-demo-content.php';

/**
 * Arranque del plugin.
 *
 * Todo se engancha en `plugins_loaded` para no depender del orden de carga de
 * otros archivos del tema.
 */
function midsummer_content_boot(): void {
	Midsummer_Post_Types::register_hooks();
	Midsummer_Fields::register_hooks();
	Midsummer_Rest::register_hooks();
	Midsummer_Metaboxes::register_hooks();
	Midsummer_Build_Hook::register_hooks();
	Midsummer_Demo_Content::register_hooks();

	// La pantalla de estado solo tiene sentido en wp-admin.
	if ( is_admin() ) {
		Midsummer_Build_Status::register_hooks();
	}
}
add_action( 'plugins_loaded', 'midsummer_content_boot' );

/**
 * Comprueba que el PHP del servidor sirve para WordPress.
 *
 * Esta comprobación se activa con `MIDSUMMER_CONTENT_STRICT`. En un entorno de
 * producción es lo razonable: si el PHP es demasiado antiguo, es mejor que el
 * CMS no arranque a que arranque con campos rotos.
 */
function midsummer_content_check_php(): void {
	if ( ! defined( 'MIDSUMMER_CONTENT_STRICT' ) || ! MIDSUMMER_CONTENT_STRICT ) {
		return;
	}

	if ( version_compare( PHP_VERSION, '8.0', '<' ) ) {
		add_action(
			'admin_notices',
			static function (): void {
				printf(
					'<div class="notice notice-error"><p>%s</p></div>',
					esc_html(
						sprintf(
							/* translators: 1: versión requerida, 2: versión actual */
							__(
								'Midsummer Content Fields requiere PHP 8.0 o superior. Este servidor usa PHP %s.',
								'midsummer'
							),
							'8.0',
							PHP_VERSION
						)
					)
				);
			}
		);
	}
}
add_action( 'admin_init', 'midsummer_content_check_php' );
