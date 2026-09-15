/**
 * Prettier 3. Every option is set explicitly rather than inherited, so a
 * future Prettier major cannot silently reformat the whole repo by changing a
 * default.
 *
 * Note this intentionally diverges from doctor_app/patient_app, which use
 * printWidth 80 with bracketSpacing off. Those are React Native files; JSX
 * with Tailwind class lists is unreadable wrapped at 80.
 */

/** @type {import("prettier").Config} */
export default {
  printWidth: 100,
  semi: true,
  singleQuote: true,
  jsxSingleQuote: false, // double quotes in JSX attributes, matching HTML
  trailingComma: 'all',
  arrowParens: 'always',
  bracketSpacing: true,
  bracketSameLine: false,
  tabWidth: 2,
  useTabs: false,
  endOfLine: 'lf', // repo is developed on Windows; keep the diff clean on CI

  // Sorts Tailwind classes into the canonical order so two engineers writing
  // the same styles produce the same string. Must be the last plugin loaded.
  plugins: ['prettier-plugin-tailwindcss'],
};
