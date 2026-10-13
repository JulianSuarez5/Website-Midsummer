/**
 * Pruebas del disparador de compilación automática.
 *
 * El plugin de WordPress es PHP y no se ejecuta aquí: lo que se comprueba es
 * que el repositorio siga siendo coherente con el flujo de publicación. Estas
 * pruebas atrapan el fallo más probable en el futuro, que es tocar el plugin
 * y dejar el flujo de publicación documenting en un sitio y no en el otro.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(__dirname, '..');

const read = (path: string): string => readFileSync(join(ROOT, path), 'utf8');

const hook = read(
  'wordpress/midsummer-content/includes/class-midsummer-build-hook.php',
);
const plugin = read('wordpress/midsummer-content/midsummer-content.php');
const infra = read('docs/infraestructura.md');

describe('el plugin engancha el disparador de compilación', () => {
  it('el plugin carga la clase y la registra', () => {
    expect(plugin).toContain('class-midsummer-build-hook.php');
    expect(plugin).toContain('Midsummer_Build_Hook::register_hooks()');
  });

  it('el plugin carga la pantalla de estado', () => {
    expect(plugin).toContain('class-midsummer-build-status.php');
    expect(plugin).toContain('Midsummer_Build_Status::register_hooks()');
  });
});

describe('cuándo se dispara el build', () => {
  it('reacciona a publicar y a despublicar', () => {
    // `transition_post_status` es el evento que cubre ambos casos; observar
    // solo `save_post` dejaría fuera el despublicado, que también cambia el
    // sitio.
    expect(hook).toContain("add_action( 'transition_post_status'");
  });

  it('reacciona a editar una entrada ya publicada', () => {
    expect(hook).toContain("add_action( 'post_updated'");
  });

  it('ignora borradores, revisiones y autosaves', () => {
    // Un build por cada autoguardado del editor llenaría el historial de
    // despliegues y no aportaría nada.
    expect(hook).toContain('wp_is_post_revision');
    expect(hook).toContain('wp_is_post_autosave');
  });

  it('ignora autosaves explícitamente en la transición', () => {
    expect(hook).toMatch(/wp_is_post_autosave[\s\S]{0,400}return;/);
  });

  it('soloConsidera los post types del contrato', () => {
    // La lista sale del contrato, no de una copia en el webhook: así, añadir
    // un post type no obliga a tocar dos archivos.
    expect(hook).toContain('is_site_post_type');
    expect(hook).toContain('midsummer_content_contract()');
  });

  it('no dispara si se guarda sin cambios de estado', () => {
    expect(hook).toMatch(/\$was_live === \$is_live[\s\S]{0,120}return;/);
  });
});

describe('cómo se protege el webhook', () => {
  it('firma el cuerpo con un secreto compartido', () => {
    expect(hook).toContain("hash_hmac( 'sha256'");
  });

  it('envía la firma en una cabecera propia', () => {
    expect(hook).toContain('X-Midsummer-Signature');
  });

  it('el secreto se lee de una constante, nunca del código', () => {
    expect(hook).toContain('MIDSUMMER_BUILD_SECRET');
  });

  it('no lleva el secreto dentro del cuerpo enviado', () => {
    // El cuerpo viaja entero al proveedor; mandar ahí el secreto lo escribiría
    // en los logs del proveedor.
    expect(hook).not.toMatch(/\$body\['secret'\]/);
  });
});

describe('cómo se maneja un fallo', () => {
  it('reintenta un número acotado de veces', () => {
    expect(hook).toContain('MAX_ATTEMPTS');
    expect(hook).toMatch(/for \(\s*\$intento = 1; \$intento <= self::MAX_ATTEMPTS/);
  });

  it('no insiste si el webhook está mal configurado', () => {
    // Un 4xx significa URL o secreto equivocados: reintentar no lo arregla y
    // solo genera ruido.
    expect(hook).toMatch(/\$code >= 400 && \$code < 500[\s\S]{0,200}return;/);
  });

  it('avisa a un humano cuando el build no sale', () => {
    expect(hook).toContain('notice-error');
    expect(hook).toContain('midsummer_build_error');
  });

  it('deja constancia del build en el log de WordPress', () => {
    expect(hook).toContain('error_log');
  });
});

describe('comportamiento sin proveedor de despliegue', () => {
  it('no hace nada si la URL del webhook no está configurada', () => {
    // Es el estado por defecto en desarrollo. Inventar una URL sería peor que
    // no enviar nada.
    expect(hook).toMatch(/if \( '' === \$url \) \{[\s\S]{0,200}return;/);
  });

  it('lee la URL de una constante, no de una URL escrita a mano', () => {
    expect(hook).toContain('MIDSUMMER_BUILD_HOOK');
  });

  it('no hay ninguna URL real en el plugin', () => {
    // Ni cms.midsummersolar.co ni ningún otro dominio comprometido: el
    // destino lo decide quien contrata el hosting.
    expect(hook).not.toMatch(/https?:\/\/(?!localhost)[a-z0-9.-]+\.[a-z]{2,}/i);
  });
});

describe('la documentación cuenta lo mismo que el código', () => {
  it('documenta las seis preguntas del flujo de publicación', () => {
    for (const concepto of [
      'transition_post_status',
      'MIDSUMMER_BUILD_HOOK',
      'X-Midsummer-Signature',
      'CMS_STRICT',
    ]) {
      expect(infra, `falta ${concepto} en docs/infraestructura.md`).toContain(concepto);
    }
  });
});
