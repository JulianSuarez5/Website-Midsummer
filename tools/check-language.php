<?php
/**
 * Comprueba que el CMS local está en español de Colombia.
 *
 * Traduce las cadenas que el usuario ve en el panel y en la pantalla pública
 * de WordPress, para confirmar que no queda nada en inglés.
 *
 * Uso: php tools/check-language.php
 *
 * @package Midsummer
 */

declare( strict_types = 1 );

$root = dirname( __DIR__ );

/*
 * WordPress carga un pack distinto según dónde se esté: el general, y otro
 * aparte solo para el panel (`admin-es_CO.mo`). Desde la línea de comandos, sin
 * WP_ADMIN, las cadenas del panel —"Guardar cambios", "Vista previa"— no están
 * cargadas y aparecen en inglés aunque en el navegador estén traducidas.
 * Por eso se declaran las dos cosas.
 */
define( 'WP_ADMIN', true );
define( 'WP_USE_THEMES', false );

require $root . '/.wordpress/wordpress/wp-load.php';
require_once ABSPATH . 'wp-admin/includes/admin.php';

echo 'locale: ' . get_locale() . PHP_EOL;
echo 'idioma del sitio: ' . get_bloginfo( 'language' ) . PHP_EOL;
echo 'contexto: panel de administración' . PHP_EOL;
echo PHP_EOL;

// Cadenas del panel de WordPress.
$panel = array(
	'Posts'         => array( 'Entradas' ),
	'Dashboard'     => array( 'Escritorio' ),
	'Settings'      => array( 'Ajustes' ),
	'Media'         => array( 'Medios' ),
	'Pages'         => array( 'Páginas' ),
	'Comments'      => array( 'Comentarios' ),
	'Edit Post'     => array( 'Editar entrada' ),
	'Published'     => array( 'Publicada' ),
	'Drafts'        => array( 'Borradores' ),
	'Uncategorized' => array( 'Sin categoría' ),
	'Save Changes'  => array( 'Guardar cambios' ),
	'Publish'       => array( 'Publicar' ),
	'Update'        => array( 'Actualizar' ),
	'Categories'    => array( 'Categorías' ),
	'Tags'          => array( 'Etiquetas' ),
	'Users'         => array( 'Usuarios' ),
	'Tools'         => array( 'Herramientas' ),
);

// Cadenas que se ven en la pantalla pública de WordPress (localhost:8080),
// con el tema Twenty Twenty-Five.
//
// No todas son del mismo dominio: "Saltar al contenido" es del núcleo y "Más
// entradas" del tema. Se prueban los dos porque una comprobación con el
// dominio equivocado da un falso "sin traducir".
$tema = array(
	'Skip to content' => 'Saltar al contenido',
	'Leave a Reply'   => 'Deja un comentario',
	'Post navigation' => 'Navegación de entradas',
	'Search'          => 'Buscar',
);

$fallos = 0;

echo 'Panel de WordPress:' . PHP_EOL;

foreach ( $panel as $ingles => $esperado ) {
	$traducido = __( $ingles, 'default' );
	$ok        = ( $traducido === $esperado[0] );

	if ( ! $ok ) {
		$fallos++;
	}

	printf( '  %-16s -> %-28s %s%s', $ingles, $traducido, $ok ? 'ok' : 'REVISAR', PHP_EOL );
}

/*
 * "Preview" significa dos cosas en WordPress —el verbo y el sustantivo— y solo
 * tiene traducción como sustantivo. Sin el contexto, `__()` devuelve el
 * inglés; por eso va aparte y se comprueba con `_x()`.
 */
printf(
	'  %-16s -> %-28s %s%s',
	'Preview (noun)',
	_x( 'Preview', 'noun' ),
	'Vista previa' === _x( 'Preview', 'noun' ) ? 'ok' : 'REVISAR',
	PHP_EOL
);

echo PHP_EOL, 'Pantalla pública de WordPress:' . PHP_EOL;

foreach ( $tema as $ingles => $esperado ) {
	$traducido = __( $ingles, 'default' );
	$dominio   = 'núcleo';

	if ( $traducido === $ingles ) {
		$traducido = __( $ingles, 'twentytwentyfive' );
		$dominio   = 'tema';
	}

	$ok = ( $traducido === $esperado );

	if ( ! $ok ) {
		$fallos++;
	}

	printf( '  %-16s -> %-28s %-7s %s%s', $ingles, $traducido, '(' . $dominio . ')', $ok ? 'ok' : 'REVISAR', PHP_EOL );
}

echo PHP_EOL;

/*
 * Cadenas que ni el pack de Colombia ni el de España traducen. Vienen del tema
 * por defecto de WordPress y solo se ven en localhost:8080, que no es el sitio
 * entregable. Se listan para saber qué queda en inglés y por qué: inventar una
 * traducción aquí sería disimular una carencia de WordPress.
 */
$sin_traduccion = array();

foreach ( array( 'Written by', 'More posts', 'Designed with WordPress', 'Read More' ) as $ingles ) {
	if ( $ingles === __( $ingles, 'default' ) ) {
		$sin_traduccion[] = $ingles;
	}
}

if ( $sin_traduccion ) {
	echo 'Sin traducción oficial (solo en el tema por defecto de WordPress):' . PHP_EOL;

	foreach ( $sin_traduccion as $ingles ) {
		echo "  $ingles" . PHP_EOL;
	}

	echo '  No afectan al sitio de localhost:4321, que es el entregable.' . PHP_EOL;
	echo PHP_EOL;
}

if ( $fallos > 0 ) {
	echo "Faltan $fallos cadenas por revisar." . PHP_EOL;
	exit( 1 );
}

echo 'Panel y tema en español.' . PHP_EOL;