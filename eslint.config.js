/**
 * ESLint 10 flat config.
 *
 * Layer order matters and is deliberate:
 *   ignores -> base JS -> TS (type-aware) -> React hooks -> a11y -> imports
 *   -> test overrides -> prettier LAST.
 *
 * `eslint-config-prettier` must stay last because it only turns rules *off*;
 * anything placed after it can re-enable a stylistic rule that then fights
 * Prettier on every save.
 *
 * Note on ESLint 10: `eslint-plugin-jsx-a11y@6.10.2` still declares a peer of
 * `eslint: ^9`, which is stale - its rules run correctly on 10 (verified
 * against alt-text and anchor-is-valid). package.json carries an `overrides`
 * entry to satisfy npm. Remove that override once jsx-a11y widens its range.
 * We did not pin to ESLint 9 instead because npm now marks 9.x deprecated
 * ("no longer supported").
 */
import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import importX from 'eslint-plugin-import-x';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    // Nothing below this line is ever linted.
    ignores: ['dist/**', 'coverage/**', 'node_modules/**', 'html/**', '*.tsbuildinfo'],
  },

  js.configs.recommended,

  // Type-aware linting. `recommendedTypeChecked` catches the bugs that
  // syntax-only rules cannot - floating promises, unsafe `any` flowing through
  // call chains, misused thenables. It requires a TS program, wired via
  // `projectService` below.
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        // Replaces the old `project: [...]` array - resolves each file to the
        // right tsconfig automatically, including files not listed in one.
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: globals.browser,
    },
  },

  // React hooks.
  //
  // Must be `configs.flat.*`: the top-level `configs.recommended` and
  // `configs['recommended-latest']` in v7 are still eslintrc-style (their
  // `plugins` is an array of strings) and ESLint 10 rejects them outright.
  //
  // `flat.recommended` over `flat['recommended-latest']` deliberately - the
  // "latest" alias picks up newly added rules on a minor bump, which with
  // `--max-warnings=0` turns a routine `npm update` into a red CI run. This
  // set includes the React Compiler rules (purity, immutability,
  // set-state-in-render), which catch real bugs, not just style.
  reactHooks.configs.flat.recommended,

  // Accessibility. This is a dashboard behind a login, but keyboard and
  // screen-reader support is not optional and regressions here are invisible
  // without linting.
  jsxA11y.flatConfigs.recommended,

  {
    files: ['**/*.{ts,tsx,js}'],
    plugins: {
      'simple-import-sort': simpleImportSort,
      'import-x': importX,
    },
    rules: {
      // Deterministic import order with zero configuration and no resolver
      // dependency. Pairs with import-x below, matching the backend's setup.
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',

      // tsc already rejects unresolved imports, so we do NOT enable
      // import-x/no-unresolved - it would duplicate the check and need a
      // resolver plugin. These two catch what tsc allows:
      'import-x/no-duplicates': 'error',
      'import-x/newline-after-import': 'error',

      // Unused variables are a defect signal, not style.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],

      // console.* survives into the production bundle and leaks data into
      // users' devtools. warn/error are allowed; everything else goes through
      // @/shared/lib/logger.
      'no-console': ['error', { allow: ['warn', 'error'] }],

      // `void somePromise()` is the idiomatic marker for a deliberately
      // un-awaited promise; keep that signal while still catching `void` used
      // as an expression.
      'no-void': ['error', { allowAsStatement: true }],

      // An un-awaited promise that rejects is an unhandled rejection. Allow
      // the explicit `void` escape hatch above.
      '@typescript-eslint/no-floating-promises': ['error', { ignoreVoid: true }],
    },
  },

  // Plain-JS config files (this one, prettier.config.js) are not part of any
  // TS program, so the type-aware rules above cannot run on them and throw
  // "you have used a rule which requires type information" instead of just
  // skipping. Turning those rules off here is the supported escape hatch.
  {
    files: ['**/*.js'],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: { globals: globals.node },
    rules: {
      'no-console': 'off',
    },
  },

  // Node-side files that ARE type-checked.
  {
    files: ['*.config.ts', 'src/test/**'],
    languageOptions: { globals: globals.node },
    rules: {
      'no-console': 'off',
    },
  },

  // Tests get to be looser: assertions on `any`-shaped mocks are normal, and
  // console output is a debugging tool, not a shipped artifact.
  {
    files: ['**/*.{spec,test}.{ts,tsx}', '**/__tests__/**/*.{ts,tsx}'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-explicit-any': 'off',

      // Referencing `someObject.method` to assert on it is the entire point of
      // a mock, but the rule cannot tell that from an accidental unbound
      // reference. typescript-eslint documents disabling it in test files for
      // exactly this reason. It stays ON in application code, where the bug it
      // catches is real.
      '@typescript-eslint/unbound-method': 'off',
    },
  },

  // MUST remain last. See the header comment.
  prettier,
);
