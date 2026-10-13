<?php
/**
 * Contrato de contenido: la fuente única de verdad.
 *
 * Este archivo define los post types y los campos que el frontend de Astro
 * consume (ver docs/content-model.md y src/lib/cms/providers/wordpress.ts).
 * Si un campo no está aquí, el frontend no lo puede leer. Si está aquí y el
 * frontend no lo lee, sobra.
 *
 * El plugin usa esta definición para tres cosas: registrar los post types,
 * exponer los campos en la REST API y dibujar los campos de edición. Por eso
 * el contrato está en un solo lugar y no repetido en tres.
 *
 * `type` es el tipo JSON que WordPress expone por la REST API, y es el mismo
 * que el proveedor de Astro espera:
 *
 *   string  → acfString()
 *   number  → acfNumber()
 *   boolean → comparación con true / "1"
 *   string[] → acfStringList()
 *   object[] → lista de objetos (redes sociales)
 *
 * @package Midsummer
 */

declare( strict_types = 1 );

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Definición del contrato de contenido.
 *
 * @return array<string, mixed>
 */
function midsummer_content_contract(): array {
	return array(
		'post_types' => array(
			'project'   => array(
				'rest_base' => 'project',
				'label'     => __( 'Proyectos', 'midsummer' ),
				'singular'  => __( 'Proyecto', 'midsummer' ),
				'menu_icon' => 'dashicons-portfolio',
				'supports'  => array( 'title', 'editor', 'excerpt', 'thumbnail' ),
			),
			'solution'  => array(
				'rest_base' => 'solution',
				'label'     => __( 'Soluciones', 'midsummer' ),
				'singular'  => __( 'Solución', 'midsummer' ),
				'menu_icon' => 'dashicons-lightbulb',
				'supports'  => array( 'title', 'editor', 'excerpt', 'thumbnail' ),
			),
			'installer' => array(
				'rest_base' => 'installer',
				'label'     => __( 'Instaladores', 'midsummer' ),
				'singular'  => __( 'Instalador', 'midsummer' ),
				'menu_icon' => 'dashicons-groups',
				'supports'  => array( 'title', 'editor', 'excerpt', 'thumbnail' ),
			),
		),

		'fields'     => array(
			'project'   => array(
				'department'     => array(
					'type'        => 'string',
					'rest_type'    => 'string',
					'label'        => __( 'Departamento', 'midsummer' ),
					'help'         => __( 'Debe coincidir con el dominio cerrado del CMS.', 'midsummer' ),
					'ui'           => 'text',
				),
				'municipality'   => array(
					'type'        => 'string',
					'rest_type'    => 'string',
					'label'        => __( 'Municipio', 'midsummer' ),
					'ui'           => 'text',
				),
				'latitude'       => array(
					'type'        => 'number',
					'rest_type'    => 'number',
					'label'        => __( 'Latitud', 'midsummer' ),
					'help'         => __( 'Solo si Midsummer autoriza publicar la ubicación.', 'midsummer' ),
					'ui'           => 'number',
					'step'         => 'any',
				),
				'longitude'      => array(
					'type'        => 'number',
					'rest_type'    => 'number',
					'label'        => __( 'Longitud', 'midsummer' ),
					'ui'           => 'number',
					'step'         => 'any',
				),
				'install_type'   => array(
					'type'        => 'string',
					'rest_type'    => 'string',
					'label'        => __( 'Tipo de instalación', 'midsummer' ),
					'ui'           => 'text',
				),
				'capacity_wp'    => array(
					'type'        => 'number',
					'rest_type'    => 'number',
					'label'        => __( 'Capacidad (Wp)', 'midsummer' ),
					'help'         => __( 'Solo si Midsummer autoriza la cifra.', 'midsummer' ),
					'ui'           => 'number',
					'step'         => 'any',
				),
				'year'           => array(
					'type'        => 'number',
					'rest_type'    => 'number',
					'label'        => __( 'Año', 'midsummer' ),
					'ui'           => 'number',
				),
				'project_status' => array(
					'type'        => 'string',
					'rest_type'    => 'string',
					'label'        => __( 'Estado del proyecto', 'midsummer' ),
					'ui'           => 'text',
				),
				'featured'       => array(
					'type'        => 'boolean',
					'rest_type'    => 'boolean',
					'label'        => __( 'Destacado en la portada', 'midsummer' ),
					'ui'           => 'checkbox',
				),
			),

			'solution'  => array(
				'applications'   => array(
					'type'        => 'string[]',
					'rest_type'    => 'array',
					'rest_items'   => array( 'type' => 'string' ),
					'label'        => __( 'Aplicaciones', 'midsummer' ),
					'help'         => __( 'Un valor por línea.', 'midsummer' ),
					'ui'           => 'lines',
				),
				'cta_label'      => array(
					'type'        => 'string',
					'rest_type'    => 'string',
					'label'        => __( 'Texto del botón', 'midsummer' ),
					'ui'           => 'text',
				),
				'cta_url'        => array(
					'type'        => 'string',
					'rest_type'    => 'string',
					'label'        => __( 'URL del botón', 'midsummer' ),
					'ui'           => 'url',
				),
				'order'          => array(
					'type'        => 'number',
					'rest_type'    => 'number',
					'label'        => __( 'Orden', 'midsummer' ),
					'help'         => __( 'Menor número, antes en el listado.', 'midsummer' ),
					'ui'           => 'number',
				),
			),

			'installer' => array(
				'coverage'       => array(
					'type'        => 'string[]',
					'rest_type'    => 'array',
					'rest_items'   => array( 'type' => 'string' ),
					'label'        => __( 'Departamentos donde opera', 'midsummer' ),
					'help'         => __( 'Un valor por línea.', 'midsummer' ),
					'ui'           => 'lines',
				),
				'website'        => array(
					'type'        => 'string',
					'rest_type'    => 'string',
					'label'        => __( 'Sitio web', 'midsummer' ),
					'ui'           => 'url',
				),
				'email'          => array(
					'type'        => 'string',
					'rest_type'    => 'string',
					'label'        => __( 'Correo', 'midsummer' ),
					'ui'           => 'email',
				),
				'phone'          => array(
					'type'        => 'string',
					'rest_type'    => 'string',
					'label'        => __( 'Teléfono', 'midsummer' ),
					'ui'           => 'text',
				),
			),

			// La página "configuracion" es una page normal de WordPress con
			// estos campos. El slug lo fija el frontend, no el nombre.
			'page'      => array(
				'contact_email'   => array(
					'type'        => 'string',
					'rest_type'    => 'string',
					'label'        => __( 'Correo de contacto', 'midsummer' ),
					'ui'           => 'email',
				),
				'contact_phone'   => array(
					'type'        => 'string',
					'rest_type'    => 'string',
					'label'        => __( 'Teléfono', 'midsummer' ),
					'ui'           => 'text',
				),
				'contact_address' => array(
					'type'        => 'string',
					'rest_type'    => 'string',
					'label'        => __( 'Dirección', 'midsummer' ),
					'ui'           => 'textarea',
				),
				'social'          => array(
					'type'        => 'object[]',
					'rest_type'    => 'array',
					'rest_items'   => array(
						'type'       => 'object',
						'properties' => array(
							'label' => array( 'type' => 'string' ),
							'url'   => array( 'type' => 'string' ),
						),
					),
					'label'        => __( 'Redes sociales', 'midsummer' ),
					'ui'           => 'repeater',
				),
			),
		),

		// Campos de SEO presentes en todos los post types, incluidas las
		// noticias. El proveedor los lee antes que Yoast.
		'seo'       => array(
			'seo_title'       => array(
				'type'     => 'string',
				'rest_type' => 'string',
				'label'     => __( 'Título para buscadores', 'midsummer' ),
				'ui'        => 'text',
			),
			'seo_description' => array(
				'type'     => 'string',
				'rest_type' => 'string',
				'label'     => __( 'Descripción para buscadores', 'midsummer' ),
				'ui'        => 'textarea',
			),
			'social_image'    => array(
				'type'     => 'string',
				'rest_type' => 'string',
				'label'     => __( 'URL de la imagen social', 'midsummer' ),
				'ui'        => 'url',
			),
		),

		// El SEO se registra en estos post types. "post" son las noticias.
		'seo_types'  => array( 'post', 'page', 'project', 'solution', 'installer' ),
	);
}
