<?php
/**
 * Receptor de prueba del webhook de compilación.
 *
 * Sustituye al proveedor de despliegue durante las pruebas: recibe la llamada,
 * anota las cabeceras y el cuerpo en un archivo, y responde 200 para que el
 * plugin lo considere un build disparado.
 *
 * Se deja junto a tools/ en el repo para que la prueba cms:webhook-test sea
 * reproducible en cualquier máquina sin montar infraestructura.
 *
 * Uso (desde la raíz del repo): php -S localhost:8099 tools/receiver.php
 *
 * @package Midsummer
 */

declare( strict_types = 1 );

// El log se escribe en el directorio temporal del sistema, fuera del repo.
$log = sys_get_temp_dir() . '/midsummer-build-received.json';

$raw   = file_get_contents( 'php://input' );
$body  = json_decode( (string) $raw, true );
$bytes = strlen( (string) $raw );

file_put_contents(
	$log,
	json_encode(
		array(
			'headers' => array(
				'event'     => $_SERVER['HTTP_X_MIDSUMMER_EVENT'] ?? null,
				'signature' => $_SERVER['HTTP_X_MIDSUMMER_SIGNATURE'] ?? null,
				'type'      => $_SERVER['CONTENT_TYPE'] ?? null,
			),
			'body'     => $body,
			'bytes'    => $bytes,
		),
		JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES
	)
);

// 200 = el proveedor acepta el build.
http_response_code( 200 );
header( 'Content-Type: application/json' );

echo json_encode(
	array(
		'received' => true,
		'bytes'    => $bytes,
	)
);