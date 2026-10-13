<?php
/**
 * Pantalla de estado de la publicación en wp-admin.
 *
 * El problema que resuelve: en un sitio headless, publicar en WordPress no
 * cambia nada visible hasta que hay un despliegue. Sin esta pantalla, la única
 * forma de saber si salió es preguntar al desarrollador, que es justo la
 * dependencia que este proyecto quiere quitar.
 *
 * La pantalla es de solo lectura y no permite cambiar nada: el diseño y el
 * despliegue son territorio del desarrollador.
 *
 * @package Midsummer
 */

declare( strict_types = 1 );

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Añade la página al menú del panel.
 */
class Midsummer_Build_Status {

	/**
	 * Registra los enganches.
	 */
	public static function register_hooks(): void {
		add_action( 'admin_menu', array( __CLASS__, 'add_page' ) );
	}

	/**
	 * Crea la entrada del menú.
	 */
	public static function add_page(): void {
		add_menu_page(
			__( 'Estado del sitio', 'midsummer' ),
			__( 'Estado del sitio', 'midsummer' ),
			'edit_posts',
			'midsummer-build-status',
			array( __CLASS__, 'render' ),
			'dashicons-cloud',
			58
		);
	}

	/**
	 * Dibuja la pantalla.
	 */
	public static function render(): void {
		if ( ! current_user_can( 'edit_posts' ) ) {
			wp_die( esc_html__( 'No tienes permiso para ver esta página.', 'midsummer' ) );
		}

		$url     = self::hook_url();
		$secret  = self::has_secret();
		$ultimo  = get_option( 'midsummer_last_build', array() );
		$error   = get_transient( 'midsummer_build_error' );
		$posts   = get_posts(
			array(
				'post_type'      => midsummer_content_contract()['post_types'] ? array_keys( midsummer_content_contract()['post_types'] ) : array(),
				'post_status'    => 'publish',
				'posts_per_page' => 1,
				'orderby'        => 'modified',
				'order'          => 'DESC',
			)
		);
		$reciente = $posts ? $posts[0] : null;
		?>
		<div class="wrap">
			<h1><?php esc_html_e( 'Estado del sitio', 'midsummer' ); ?></h1>

			<?php if ( $error ) : ?>
				<div class="notice notice-error">
					<p><strong><?php esc_html_e( 'El último build no se pudo lanzar:', 'midsummer' ); ?></strong>
					<?php echo esc_html( $error ); ?></p>
				</div>
			<?php endif; ?>

			<table class="widefat striped" style="max-width: 46rem;">
				<tbody>
					<tr>
						<td style="width: 16rem;"><strong><?php esc_html_e( 'Publicación automática', 'midsummer' ); ?></strong></td>
						<td>
							<?php if ( '' !== $url ) : ?>
								<span class="dashicons dashicons-yes-alt" style="color:#1a7f37;"></span>
								<?php esc_html_e( 'Activa. Al publicar contenido, el sitio se reconstruye solo.', 'midsummer' ); ?>
							<?php else : ?>
								<span class="dashicons dashicons-info" style="color:#996800;"></span>
								<?php esc_html_e( 'Inactiva. Nadie ha configurado todavía el proveedor de despliegue, así que publicar aquí no actualiza el sitio público.', 'midsummer' ); ?>
							<?php endif; ?>
						</td>
					</tr>
					<tr>
						<td><strong><?php esc_html_e( 'Webhook de compilación', 'midsummer' ); ?></strong></td>
						<td>
							<?php if ( '' !== $url ) : ?>
								<code><?php echo esc_html( self::mask( $url ) ); ?></code>
							<?php else : ?>
								<?php esc_html_e( 'Sin configurar.', 'midsummer' ); ?>
							<?php endif; ?>
						</td>
					</tr>
					<tr>
						<td><strong><?php esc_html_e( 'Autenticación', 'midsummer' ); ?></strong></td>
						<td>
							<?php if ( $secret ) : ?>
								<span class="dashicons dashicons-yes-alt" style="color:#1a7f37;"></span>
								<?php esc_html_e( 'Con secreto compartido: solo este WordPress puede pedir un build.', 'midsummer' ); ?>
							<?php else : ?>
								<span class="dashicons dashicons-warning" style="color:#996800;"></span>
								<?php esc_html_e( 'Sin secreto. No se debe activar en producción.', 'midsummer' ); ?>
							<?php endif; ?>
						</td>
					</tr>
					<tr>
						<td><strong><?php esc_html_e( 'Último build solicitado', 'midsummer' ); ?></strong></td>
						<td>
							<?php if ( $ultimo ) : ?>
								<?php
								printf(
									/* translators: %s: fecha y hora */
									esc_html__( 'Con motivo de "%s", el %s.', 'midsummer' ),
									esc_html( (string) ( $ultimo['reason'] ?? '' ) ),
									esc_html( (string) ( $ultimo['time'] ?? '' ) )
								);
								?>
							<?php else : ?>
								<?php esc_html_e( 'Todavía no se ha solicitado ninguno.', 'midsummer' ); ?>
							<?php endif; ?>
						</td>
					</tr>
					<tr>
						<td><strong><?php esc_html_e( 'Último contenido editado', 'midsummer' ); ?></strong></td>
						<td>
							<?php if ( $reciente ) : ?>
								<?php
								printf(
									'%s — %s',
									esc_html( get_the_title( $reciente ) ),
									esc_html( get_post_meta( $reciente->ID, '_midsummer_last_build', true ) ?: '' )
								);
								?>
							<?php else : ?>
								<?php esc_html_e( 'No hay contenido publicado.', 'midsummer' ); ?>
							<?php endif; ?>
						</td>
					</tr>
				</tbody>
			</table>

			<p style="max-width: 46rem;">
				<?php esc_html_e( 'Esta pantalla es de solo lectura. El contenido (textos, imágenes, proyectos, noticias, instaladores y contacto) se edita en WordPress; el diseño y el despliegue los configura el desarrollador.', 'midsummer' ); ?>
			</p>
		</div>
		<?php
	}

	/**
	 * Oculta la mayor parte de la URL del webhook al mostrarla.
	 *
	 * No hace falta que quien publica vea la URL, y mostrarla en pantalla
	 * añade una copia más que proteger.
	 *
	 * @param string $url URL del webhook.
	 * @return string URL recortada.
	 */
	private static function mask( string $url ): string {
		$partes = wp_parse_url( $url );
		$host   = $partes['host'] ?? '';
		$path   = $partes['path'] ?? '';

		return $host . ( strlen( $path ) > 8 ? substr( $path, 0, 5 ) . '…' : $path );
	}

	/**
	 * URL configurada.
	 *
	 * @return string URL o cadena vacía.
	 */
	private static function hook_url(): string {
		if ( defined( 'MIDSUMMER_BUILD_HOOK' ) && is_string( MIDSUMMER_BUILD_HOOK ) ) {
			return trim( MIDSUMMER_BUILD_HOOK );
		}

		return (string) apply_filters( 'midsummer_build_hook_url', '' );
	}

	/**
	 * ¿Hay secreto configurado?
	 *
	 * @return bool True si hay secreto.
	 */
	private static function has_secret(): bool {
		return defined( 'MIDSUMMER_BUILD_SECRET' ) && '' !== trim( (string) MIDSUMMER_BUILD_SECRET );
	}
}
