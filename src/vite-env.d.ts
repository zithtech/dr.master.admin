/// <reference types="vite/client" />

/**
 * Types for this app's environment variables.
 *
 * Without this, `import.meta.env.VITE_ANYTHING` is `any` and a typo returns
 * undefined at runtime with no compile-time complaint. Every var added to
 * .env.example must be added here too.
 *
 * All of these are PUBLIC - Vite inlines them into the client bundle. Never
 * put a secret behind a VITE_ prefix.
 */
interface ImportMetaEnv {
  /**
   * Base URL for the API, including the /api prefix.
   * Dev: `/api` (relative, forwarded by the Vite proxy to :4000).
   * Prod: absolute origin, e.g. `https://api.example.com/api`.
   */
  readonly VITE_API_BASE_URL: string;

  /** Drives the environment badge and the cleartext-URL guard. */
  readonly VITE_ENVIRONMENT?: 'development' | 'staging' | 'production';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
