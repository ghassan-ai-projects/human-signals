import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';

export default tseslint.config(
  {
    ignores: [
      'dist',
      'coverage',
      'public/content',
      'playwright-report',
      'test-results',
      // Specification artifacts, not application source.
      'documentation/**',
      'eslint.config.js',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/restrict-template-expressions': [
        'error',
        { allowNumber: true, allowBoolean: true },
      ],
      '@typescript-eslint/consistent-type-imports': 'error',
      // Document 10: never render untrusted content as HTML and never evaluate content as code.
      'no-restricted-properties': [
        'error',
        { property: 'innerHTML', message: 'Render text through React; see document 10.' },
        { property: 'outerHTML', message: 'Render text through React; see document 10.' },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'JSXAttribute[name.name="dangerouslySetInnerHTML"]',
          message: 'Content is plain text. See document 10.',
        },
        { selector: "NewExpression[callee.name='Function']", message: 'No dynamic code evaluation.' },
        { selector: "CallExpression[callee.name='eval']", message: 'No dynamic code evaluation.' },
      ],
      'no-console': ['error', { allow: ['warn', 'error'] }],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    files: ['src/**/*.tsx'],
    plugins: { 'react-hooks': reactHooks, 'jsx-a11y': jsxA11y },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.flatConfigs.strict.rules,
      // A scrollable region needs a tab stop and an accessible name to be keyboard reachable.
      'jsx-a11y/no-noninteractive-tabindex': [
        'error',
        { tags: [], roles: ['tabpanel', 'region'], allowExpressionValues: true },
      ],
    },
  },
  {
    files: ['scripts/**/*.ts', 'tests/**/*.ts', 'tests/**/*.tsx', '*.config.ts', '*.config.js'],
    rules: { 'no-console': 'off', '@typescript-eslint/no-non-null-assertion': 'off' },
  },
);
