import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import eslintConfigPrettier from 'eslint-config-prettier';
import globals from 'globals';

const repoJsFiles = [
  '*.{js,mjs,cjs}',
  'scripts/**/*.{js,mjs,cjs}',
  'tests/**/*.{js,mjs,cjs}',
  'packages/*/*.{js,mjs,cjs}',
  'packages/*/src/**/*.{js,mjs,cjs}',
  'packages/*/tests/**/*.{js,mjs,cjs}',
  'packages/*/scripts/**/*.{js,mjs,cjs}',
  'packages/*/bin/**/*.{js,mjs,cjs}',
];

const repoTsFiles = [
  '*.ts',
  'scripts/**/*.ts',
  'tests/**/*.{ts,tsx}',
  'packages/*/*.ts',
  'packages/*/src/**/*.{ts,tsx}',
  'packages/*/tests/**/*.{ts,tsx}',
  'packages/*/scripts/**/*.ts',
  'packages/*/bin/**/*.ts',
];

const repoIgnores = [
  '**/*.d.ts',
  '.git/**',
  '.sampo/**',
  'build/**',
  'coverage/**',
  'dist/**',
  'examples/**',
  'node_modules/**',
  'packages/**/dist/**',
  'packages/create/templates/**',
  'packages/create/tests/fixtures/**',
  'packages/wp-typia-project-tools/tests/fixtures/**',
  'playwright-report/**',
  'test-results/**',
  'vendor/**',
];

export default [
  {
    ignores: repoIgnores,
  },
  {
    ...js.configs.recommended,
    files: repoJsFiles,
    languageOptions: {
      ecmaVersion: 'latest',
      globals: {
        ...globals.node,
      },
      sourceType: 'module',
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': 'off',
    },
  },
  {
    files: ['**/*.cjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: {
        ...globals.node,
      },
      sourceType: 'commonjs',
    },
  },
  {
    files: repoTsFiles,
    languageOptions: {
      ecmaVersion: 'latest',
      globals: {
        ...globals.node,
      },
      parser: tsParser,
      sourceType: 'module',
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...tsPlugin.configs['eslint-recommended'].overrides[0].rules,
      ...tsPlugin.configs.recommended.rules,
      '@typescript-eslint/no-namespace': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/triple-slash-reference': 'off',
    },
  },
  eslintConfigPrettier,
];
