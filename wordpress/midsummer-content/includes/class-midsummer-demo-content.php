<?php
/**
 * Contenido de demostración.
 *
 * Estos datos NO son reales. No describen proyectos, clientes, cifras ni
 * certificaciones de Midsummer Colombia. Su único propósito es comprobar que
 * WordPress → REST API → Astro funciona de extremo a extremo con contenido
 * estructurado.
 *
 * Todos los títulos llevan el prefijo [DEMO] y todos los valores son
 * evidentemente ficticios, para que sea imposible confundirlos con contenido
 * real si alguien los ve por error.
 *
 * El contenido se crea una sola vez. Para regenerarlo:
 *
 *   wp midsummer seed-demo --force
 *
 * @package Midsummer
 */

declare( strict_types = 1 );

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Siembra de contenido de demostración.
 */
final class Midsummer_Demo_Content {

	private const PREFIX = '[DEMO]';

	/**
	 * Registra los hooks.
	 */
	public static function register_hooks(): void {
		// Comando de WP-CLI, si está disponible.
		if ( defined( 'WP_CLI' ) && WP_CLI ) {
			WP_CLI::add_command( 'midsummer seed-demo', array( __CLASS__, 'wp_cli_seed' ) );
		}
	}

	/**
	 * Comando de WP-CLI.
	 *
	 * ## OPTIONS
	 *
	 * [--force]
	 * : Borra y vuelve a crear el contenido de demostración.
	 *
	 * @param array<int, string>    $args       Posicionales.
	 * @param array<string, string> $assoc_args Opciones.
	 */
	public static function wp_cli_seed( array $args, array $assoc_args ): void {
		unset( $args );

		$force = isset( $assoc_args['force'] );

		$created = self::seed( $force );

		WP_CLI::success(
			sprintf(
				'%d entradas de demostración listas. Ninguna es contenido real.',
				$created
			)
		);
	}

	/**
	 * Crea el contenido de demostración.
	 *
	 * @param bool $force Borra lo existente antes de crear.
	 * @return int Número de entradas creadas.
	 */
	public static function seed( bool $force = false ): int {
		$existing = self::count_demo_posts();

		if ( $existing > 0 && ! $force ) {
			return 0;
		}

		if ( $force ) {
			self::delete_demo_posts();
		}

		$created = 0;

		$created += self::create_projects();
		$created += self::create_solutions();
		$created += self::create_installers();
		$created += self::create_news();
		$created += self::ensure_settings_page();

		return $created;
	}

	/**
	 * Cuenta las entradas de demostración ya creadas.
	 */
	private static function count_demo_posts(): int {
		$query = new WP_Query(
			array(
				'post_type'              => array( 'project', 'solution', 'installer', 'post', 'page' ),
				'post_status'            => 'any',
				's'                      => self::PREFIX,
				'posts_per_page'         => 1,
				'fields'                 => 'ids',
				'no_found_rows'          => true,
				'update_post_meta_cache' => false,
				'update_post_term_cache' => false,
			)
		);

		return (int) $query->found_posts;
	}

	/**
	 * Borra las entradas de demostración.
	 */
	private static function delete_demo_posts(): void {
		$ids = get_posts(
			array(
				'post_type'      => array( 'project', 'solution', 'installer', 'post', 'page' ),
				'post_status'    => 'any',
				's'              => self::PREFIX,
				'posts_per_page' => -1,
				'fields'         => 'ids',
			)
		);

		foreach ( $ids as $id ) {
			wp_delete_post( (int) $id, true );
		}
	}

	/**
	 * Crea un post con sus campos.
	 *
	 * @param string               $post_type Tipo de post.
	 * @param string               $title     Título sin prefijo.
	 * @param string               $slug      Slug.
	 * @param array<string, mixed> $fields    Campos del contrato.
	 * @param string               $excerpt   Resumen.
	 * @param string               $content   Contenido.
	 * @return int Id del post creado, 0 si no se pudo crear.
	 */
	private static function create_post(
		string $post_type,
		string $title,
		string $slug,
		array $fields,
		string $excerpt = '',
		string $content = ''
	): int {
		$post_id = wp_insert_post(
			array(
				'post_type'    => $post_type,
				'post_status'  => 'publish',
				'post_title'   => self::PREFIX . ' ' . $title,
				'post_name'    => $slug,
				'post_excerpt' => '' !== $excerpt ? $excerpt : null,
				'post_content' => '' !== $content ? $content : null,
			),
			true
		);

		if ( is_wp_error( $post_id ) || ! $post_id ) {
			return 0;
		}

		foreach ( $fields as $key => $value ) {
			$definition = self::field_definition( $post_type, $key );

			if ( null === $definition ) {
				continue;
			}

			$clean = Midsummer_Fields::sanitize( $value, $definition );

			if ( null === $clean || '' === $clean || array() === $clean ) {
				continue;
			}

			if ( in_array( $definition['type'], array( 'string[]', 'object[]' ), true ) ) {
				$clean = wp_json_encode( $clean );
			}

			update_post_meta( $post_id, $key, $clean );
		}

		return (int) $post_id;
	}

	/**
	 * Busca la definición de un campo.
	 *
	 * @param string $post_type Tipo de post.
	 * @param string $key       Nombre del campo.
	 * @return array<string, mixed>|null
	 */
	private static function field_definition( string $post_type, string $key ): ?array {
		$map = Midsummer_Fields::fields_by_post_type();

		return $map[ $post_type ][ $key ] ?? null;
	}

	/**
	 * Proyectos de demostración.
	 */
	private static function create_projects(): int {
		$projects = array(
			array(
				'title'         => 'Proyecto de ejemplo A',
				'slug'          => 'proyecto-demo-a',
				'department'    => 'Departamento de ejemplo',
				'municipality'  => 'Municipio de ejemplo',
				'latitude'      => 4.710989,
				'longitude'     => -74.07209,
				'install_type'  => 'Tipo de instalación de ejemplo',
				'capacity_wp'   => 0,
				'year'          => 2024,
				'project_status' => 'Ejemplo',
				'featured'      => true,
			),
			array(
				'title'         => 'Proyecto de ejemplo B',
				'slug'          => 'proyecto-demo-b',
				'department'    => 'Otro departamento de ejemplo',
				'municipality'  => 'Otro municipio de ejemplo',
				'latitude'      => null,
				'longitude'     => null,
				'install_type'  => 'Otro tipo de ejemplo',
				'capacity_wp'   => null,
				'year'          => 2025,
				'project_status' => 'Ejemplo',
				'featured'      => false,
			),
			array(
				'title'         => 'Proyecto de ejemplo C',
				'slug'          => 'proyecto-demo-c',
				'department'    => 'Departamento de ejemplo',
				'municipality'  => 'Municipio de ejemplo',
				'latitude'      => null,
				'longitude'     => null,
				'install_type'  => 'Tipo de instalación de ejemplo',
				'capacity_wp'   => null,
				'year'          => 2025,
				'project_status' => 'Ejemplo',
				'featured'      => false,
			),
		);

		$created = 0;

		foreach ( $projects as $project ) {
			$created += self::create_post(
				'project',
				$project['title'],
				$project['slug'],
				array_diff_key( $project, array_flip( array( 'title', 'slug' ) ) ),
				'Resumen de un proyecto ficticio, creado para comprobar la conexión entre WordPress y el sitio. No describe ningún proyecto real.',
				'<p>Contenido de ejemplo. Este texto no corresponde a ningún proyecto real de Midsummer Colombia.</p>'
			) > 0 ? 1 : 0;
		}

		return $created;
	}

	/**
	 * Soluciones de demostración.
	 *
	 * Los nombres son genéricos a propósito: el prototipo no puede afirmar que
	 * se comercialicen productos concretos hasta que Midsummer lo confirme.
	 */
	private static function create_solutions(): int {
		$solutions = array(
			array(
				'title'        => 'Solución de ejemplo para un tipo de instalación',
				'slug'         => 'solucion-demo-a',
				'applications' => array( 'Aplicación de ejemplo 1', 'Aplicación de ejemplo 2' ),
				'cta_label'    => 'Ver ficha de ejemplo',
				'cta_url'      => '/contacto/',
				'order'        => 1,
			),
			array(
				'title'        => 'Solución de ejemplo para otro tipo de instalación',
				'slug'         => 'solucion-demo-b',
				'applications' => array( 'Aplicación de ejemplo 3' ),
				'cta_label'    => null,
				'cta_url'      => null,
				'order'        => 2,
			),
		);

		$created = 0;

		foreach ( $solutions as $solution ) {
			$created += self::create_post(
				'solution',
				$solution['title'],
				$solution['slug'],
				array_diff_key( $solution, array_flip( array( 'title', 'slug' ) ) ),
				'Descripción de una solución ficticia, para comprobar la conexión con el sitio. No describe un producto real.',
				'<p>Contenido de ejemplo. No describe un producto comercializado por Midsummer Colombia.</p>'
			) > 0 ? 1 : 0;
		}

		return $created;
	}

	/**
	 * Instaladores de demostración.
	 */
	private static function create_installers(): int {
		$installers = array(
			array(
				'title'    => 'Instalador de ejemplo uno',
				'slug'     => 'instalador-demo-uno',
				'coverage' => array( 'Departamento de ejemplo' ),
				'website'  => '',
				'email'    => '',
				'phone'    => '',
			),
			array(
				'title'    => 'Instalador de ejemplo dos',
				'slug'     => 'instalador-demo-dos',
				'coverage' => array( 'Otro departamento de ejemplo' ),
				'website'  => '',
				'email'    => '',
				'phone'    => '',
			),
		);

		$created = 0;

		foreach ( $installers as $installer ) {
			$created += self::create_post(
				'installer',
				$installer['title'],
				$installer['slug'],
				array_diff_key( $installer, array_flip( array( 'title', 'slug' ) ) ),
				'Ficha de un instalador ficticio, para comprobar la conexión. No es una empresa real.',
				'<p>Contenido de ejemplo. No representa a ninguna empresa real.</p>'
			) > 0 ? 1 : 0;
		}

		return $created;
	}

	/**
	 * Noticias de demostración.
	 */
	private static function create_news(): int {
		$news = array(
			array(
				'title'   => 'Noticia de ejemplo para comprobar la conexión',
				'slug'    => 'noticia-demo-a',
				'excerpt' => 'Resumen de una noticia ficticia, creada para comprobar que WordPress entrega noticias al sitio.',
				'content' => '<p>Contenido de ejemplo. No es una noticia real ni una declaración de Midsummer.</p>',
			),
			array(
				'title'   => 'Segunda noticia de ejemplo',
				'slug'    => 'noticia-demo-b',
				'excerpt' => 'Otro resumen ficticio, para probar el listado de noticias.',
				'content' => '<p>Contenido de ejemplo. Sin información real.</p>',
			),
		);

		$created = 0;

		foreach ( $news as $item ) {
			$created += self::create_post(
				'post',
				$item['title'],
				$item['slug'],
				array(),
				$item['excerpt'],
				$item['content']
			) > 0 ? 1 : 0;
		}

		return $created;
	}

	/**
	 * Crea la página de configuración que el frontend busca por el slug
	 * `configuracion`.
	 *
	 * Los campos de contacto se dejan vacíos a propósito: son datos reales que
	 * Midsummer debe entregar. Un contacto vacío hace que el sitio muestre el
	 * marcador de pendiente, que es el comportamiento correcto.
	 */
	private static function ensure_settings_page(): int {
		$existing = get_page_by_path( 'configuracion' );

		if ( $existing instanceof WP_Post ) {
			return 0;
		}

		return self::create_post(
			'page',
			'Configuración del sitio',
			'configuracion',
			array(
				// Sin datos de contacto: los entrega Midsummer.
				'seo_title'       => 'Configuración',
				'seo_description' => 'Página de configuración del sitio. Sin uso público.',
			),
			'Página de configuración. No es de uso público.',
			''
		) > 0 ? 1 : 0;
	}
}
