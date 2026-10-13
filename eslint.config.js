import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import astro from 'eslint-plugin-astro';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

/**
 * ESLint plano (eslint.config.js).
 *
 * Objetivo: atrapar errores reales, no imponer estilo. El formato lo lleva
 * Prettier; si las dos herramientas se pelean por las mismas reglas, el
 * resultado es código que se reformatea en cada commit.
 */
export default [
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      '.astro/**',
      'public/**',
      // Núcleo de WordPress descargado. No es código nuestro: lintarlo genera
      // decenas de miles de errores de jQuery y globals de wp-admin sobre
      // archivos que no se han escrito aquí. El plugin de Midsummer, en cambio,
      // sí se revisa: vive fuera de esta carpeta.
      '.wordpress/**',
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  // Archivos .astro: el plugin aporta el parser y el processor.
  // Se usan las variantes `flat/*`, que son las que encajan con ESLint 10.
  ...astro.configs['flat/recommended'],

  // El preset de accesibilidad de `eslint-plugin-astro` queda fuera a
  // propósito: `eslint-plugin-jsx-a11y` declara soporte hasta ESLint 9 y este
  // proyecto usa ESLint 10. Forzar el par con `--force` meteria una
  // dependencia oficialmente incompatible para ganar un lint que, además,
  // solo revisa las islas React y no las plantillas .astro.
  //
  // La accesibilidad se cubre hoy en revisión y con `astro check`. Cuando
  // jsx-a11y soporte ESLint 10, se agrega aquí. Ver docs/handoff.md.

  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },

  {
    // El frontmatter y los <script> de .astro se analizan como TypeScript.
    files: ['**/*.astro'],
    rules: {
      // Los imports sin extensión .astro son válidos dentro de .astro; el
      // problema aquí es el orden, que no aporta nada.
      'sort-imports': 'off',
    },
  },

  {
    files: ['**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      // El codebase usa `interface` y tipos donde aportan; no se fuerza `type`.
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
      ],
      'no-console': ['warn', { allow: ['warn', 'error'] }],

      // Las reglas nuevas de React detectan errores reales de renderizado y de
      // dependencias en hooks. `set-state-in-effect` queda desactivada porque en
      // este proyecto los efectos legítimamente sincronizan estado externo tras
      // montar (el mapa se inicializa una sola vez).
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/set-state-in-effect': 'off',
    },
  },

  {
    // Las pruebas declaran fixtures largos que no son código de producción.
    files: ['**/*.test.ts', '**/*.test.tsx'],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
];
