<?php
/**
 * Disparador de la compilación del sitio al publicar contenido.
 *
 * El sitio es estático: WordPress guarda el contenido y alguien tiene que
 * reconstruir los HTML. Si ese "alguien" es una persona, Midsummer no puede
 * publicar sin depender del desarrollador, que es exactamente lo que no
 * queremos. Este archivo lo resuelve: cuando se publica o actualiza contenido
 * relevante, avisa al proveedor de despliegue y el build ocurre solo.
 *
 * Lo que decide y lo que no:
 *   - Decide cuándo AVISAR. No compila nada: Astro corre en su propio entorno.
 *   - Nunca inventa la URL del webhook. Sin configurarla, el plugin no hace
 *     nada, que es el comportamiento correcto en un entorno sin despliegue.
 *
 * Configuración (ver docs/infraestructura.md):
 *   MIDSUMMER_BUILD_HOOK   URL del webhook del proveedor de despliegue.
 *   MIDSUMMER_BUILD_SECRET Secreto compartido, para autenticar la llamada.
 *
 * @package Midsummer
 */

declare( strict_types = 1 );

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Avisa al proveedor de despliegue cuando cambia el contenido del sitio.
 */
class Midsummer_Build_Hook {

	/**
	 * Tope de intentos por evento.
	 *
	 * Si el proveedor devuelve un error unas pocas veces, tiene sentido
	 * reintentar. Si lleva caído un rato, insistir cada pocos segundos solo
	 * llena el log; a partir de aquí se rinde y avisa a un humano.
	 */
	private const MAX_ATTEMPTS = 3;

	/**
	 * Espera entre reintentos, en segundos. WordPress duerme de verdad entre
	 * peticiones, así que esto alarga el guardado de una entrada unos segundos
	 * como mucho.
	 */
	private const RETRY_DELAY = 5;

	/**
	 * Registra los enganches.
	 */
	public static function register_hooks(): void {
		// `transition_post_status` salta al publicar Y al despublicar, y lleva
		// el estado anterior y el nuevo, que es lo que permite distinguir
		// "editó un borrador" de "publicó algo".
		add_action( 'transition_post_status', array( __CLASS__, 'on_transition' ), 10, 3 );

		// Un cambio de slug en un post ya publicado no pasa por la transición de
		// estado, y sí cambia la URL del sitio.
		add_action( 'post_updated', array( __CLASS__, 'on_updated' ), 10, 3 );
	}

	/**
	 * ¿El post es del tipo que el sitio publica?
	 *
	 * Se usa el contrato como fuente de verdad: si mañana se añade un post type,
	 * el webhook lo cubre sin tocar este archivo.
	 *
	 * @param string $post_type Tipo del post.
	 * @return bool True si el sitio lo muestra.
	 */
	private static function is_site_post_type( string $post_type ): bool {
		$contract = midsummer_content_contract();
		$types    = array_keys( $contract['post_types'] ?? array() );

		return in_array( $post_type, $types, true );
	}

	/**
	 * Reacciona a un cambio de estado de publicación.
	 *
	 * @param string  $new_status Estado nuevo.
	 * @param string  $old_status Estado anterior.
	 * @param WP_Post $post       Entrada afectada.
	 */
	public static function on_transition( string $new_status, string $old_status, WP_Post $post ): void {
		if ( wp_is_post_revision( $post->ID ) || wp_is_post_autosave( $post->ID ) ) {
			return;
		}

		if ( ! self::is_site_post_type( $post->post_type ) ) {
			return;
		}

		// interestado solo cuando la entrada entra o sale de la web. Editar una
		// entrada ya publicada se atiende con `post_updated`.
		$was_live = 'publish' === $old_status;
		$is_live  = 'publish' === $new_status;

		if ( $was_live === $is_live ) {
			return;
		}

		$reason = $is_live ? 'publish' : 'unpublish';

		self::trigger( $reason, $post );
	}

	/**
	 * Reacciona a la actualización de una entrada ya publicada.
	 *
	 * `post_updated` recibe el post nuevo y el anterior: la actualización de
	 * una entrada que ya estaba publicada no pasa por `transition_post_status`
	 * y, sin embargo, cambia el sitio. De ahí este segundo enganche.
	 *
	 * @param int          $post_id  Entrada actualizada.
	 * @param WP_Post|null $after    Entrada tal como quedó.
	 * @param WP_Post|null $before   Entrada tal como estaba antes.
	 */
	public static function on_updated( int $post_id, $after = null, $before = null ): void {
		if ( ! $after instanceof WP_Post || ! $before instanceof WP_Post ) {
			return;
		}

		if ( wp_is_post_revision( $post_id ) || wp_is_post_autosave( $post_id ) ) {
			return;
		}

		if ( ! self::is_site_post_type( $after->post_type ) ) {
			return;
		}

		// Solo interesa cuando la entrada estaba publicada: si entra o sale de
		// publicación, ya lo cubre `transition_post_status`.
		if ( 'publish' !== $before->post_status || 'publish' !== $after->post_status ) {
			return;
		}

		self::trigger( 'update', $after );
	}

	/**
	 * Envía el aviso al proveedor de despliegue.
	 *
	 * @param string  $reason Motivo del build.
	 * @param WP_Post $post   Entrada que cambió.
	 */
	private static function trigger( string $reason, WP_Post $post ): void {
		$url = self::hook_url();

		if ( '' === $url ) {
			// Sin proveedor de despliegue no hay nada que avisar. Es la
			// situación por defecto en desarrollo, así que no se avisa a nadie.
			return;
		}

		// Se guarda antes de enviar la petición: si el proveedor no responde o
		// el proceso se corta a mitad, la pantalla de estado sigue sabiendo
		// que hubo un intento.
		update_option(
			'midsummer_last_build',
			array(
				'reason'  => $reason,
				'post_id' => $post->ID,
				'time'    => gmdate( 'c' ),
			),
			false
		);

		$body = array(
			'reason'  => $reason,
			'post_id' => $post->ID,
			'type'    => $post->post_type,
			'slug'    => $post->post_name,
			'time'    => gmdate( 'c' ),
		);

		// Firma del secreto. Permite al proveedor comprobar que la llamada
		// viene de este WordPress y no de cualquiera que encuentre la URL.
		$secret = self::secret();

		if ( '' !== $secret ) {
			$body['signature'] = hash_hmac( 'sha256', (string) wp_json_encode( $body ), $secret );
		}

		$payload = wp_json_encode( $body );

		$headers = array(
			'Content-Type'    => 'application/json',
			'X-Midsummer-Event' => $reason,
		);

		if ( '' !== $secret ) {
			$headers['X-Midsummer-Signature'] = $body['signature'];
		}

		for ( $intento = 1; $intento <= self::MAX_ATTEMPTS; $intento++ ) {
			$response = wp_remote_post(
				$url,
				array(
					'timeout'     => 15,
					'redirection' => 0,
					'headers'     => $headers,
					'body'        => $payload,
					// El build no necesita un user agent de navegador, pero WordPress
					// exige enviar uno para no aparecer como bot.
					'user-agent'  => 'Midsummer-Content-Fields/' . MIDSUMMER_CONTENT_VERSION . '; ' . home_url( '/' ),
				)
			);

			if ( ! is_wp_error( $response ) ) {
				$code = (int) wp_remote_retrieve_response_code( $response );

				// 2xx y 3xx: el proveedor aceptó el build.
				if ( $code >= 200 && $code < 400 ) {
					self::log(
						sprintf(
							'Build disparado (%s, %s, intento %d).',
							$reason,
							$post->post_type,
							$intento
						)
					);

					return;
				}

				// 4xx: el webhook está mal configurado. Reintentar no lo arregla y
				// se convierte en ruido, así que se abandona.
				if ( $code >= 400 && $code < 500 ) {
					self::log(
						sprintf(
							'El proveedor rechazó el build con HTTP %d. Revisar la URL y el secreto del webhook.',
							$code
						),
						true
					);

					return;
				}
			}

			if ( $intento < self::MAX_ATTEMPTS ) {
				sleep( self::RETRY_DELAY );
			}
		}

		self::log(
			sprintf(
				'No se pudo avisar al proveedor tras %d intentos. El sitio publicado sigue con el contenido anterior.',
				self::MAX_ATTEMPTS
			),
			true
		);
	}

	/**
	 * URL del webhook de compilación.
	 *
	 * @return string URL, o cadena vacía si no está configurada.
	 */
	private static function hook_url(): string {
		if ( defined( 'MIDSUMMER_BUILD_HOOK' ) && is_string( MIDSUMMER_BUILD_HOOK ) ) {
			return trim( MIDSUMMER_BUILD_HOOK );
		}

		/**
		 * Permite configurar el webhook desde wp-config.php o desde el panel,
		 * sin editar el código del plugin.
		 */
		return (string) apply_filters( 'midsummer_build_hook_url', '' );
	}

	/**
	 * Secreto compartido con el proveedor.
	 *
	 * @return string Secreto, o cadena vacía si no hay.
	 */
	private static function secret(): string {
		if ( defined( 'MIDSUMMER_BUILD_SECRET' ) && is_string( MIDSUMMER_BUILD_SECRET ) ) {
			return trim( MIDSUMMER_BUILD_SECRET );
		}

		return (string) apply_filters( 'midsummer_build_hook_secret', '' );
	}

	/**
	 * Deja constancia del build en el log de WordPress.
	 *
	 * Importa para el desarrollador: si Midsummer publica y nada cambia, el
	 * primer sitio donde mirar es el log del CMS, no el del frontend.
	 *
	 * @param string $mensaje Texto a registrar.
	 * @param bool   $es_error Si es un fallo.
	 */
	private static function log( string $mensaje, bool $es_error = false ): void {
		if ( $es_error && defined( 'WP_DEBUG' ) && WP_DEBUG ) {
			error_log( '[midsummer] ' . $mensaje );
		}

		if ( $es_error ) {
			self::notice( $mensaje );
		}
	}

	/**
	 * Muestra un aviso en wp-admin cuando un build falla.
	 *
	 * Se ve al instante en el panel, sin pedir a nadie que mire un log.
	 *
	 * @param string $mensaje Texto a mostrar.
	 */
	private static function notice( string $mensaje ): void {
		if ( ! current_user_can( 'edit_posts' ) ) {
			return;
		}

		set_transient( 'midsummer_build_error', $mensaje, 5 * MINUTE_IN_SECONDS );

		add_action(
			'admin_notices',
			static function (): void {
				$texto = get_transient( 'midsummer_build_error' );

				if ( ! $texto ) {
					return;
				}

				printf(
					'<div class="notice notice-error is-dismissible"><p><strong>Midsummer:</strong> %s</p></div>',
					esc_html( $texto )
				);

				delete_transient( 'midsummer_build_error' );
			}
		);
	}
}
