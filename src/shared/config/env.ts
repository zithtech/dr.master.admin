/**
 * Typed, validated access to environment configuration.
 *
 * Only `VITE_`-prefixed variables reach the client - Vite refuses to expose
 * anything else, which is the guardrail that stops a server secret being
 * bundled by accident. Nothing in here is secret: everything below ships
 * inside the JS bundle and is readable by anyone who opens devtools.
 */

export type Environment = 'development' | 'staging' | 'production';

/**
 * Fails loudly at module load rather than producing `undefined` that surfaces
 * later as a request to the literal URL "undefined/api/health".
 */
function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing required env var "${name}". Copy .env.example to .env and fill it in.`,
    );
  }
  return value;
}

/**
 * In dev this is the relative path `/api`, which the Vite proxy forwards to
 * the backend on :4000 - same-origin, so no CORS preflight. In production it
 * is the absolute API origin, and that origin must be present in the
 * backend's CORS_ORIGINS allowlist.
 */
export const API_BASE_URL: string = required(
  'VITE_API_BASE_URL',
  import.meta.env.VITE_API_BASE_URL,
);

export const ENVIRONMENT: Environment = import.meta.env.VITE_ENVIRONMENT ?? 'development';

export const IS_PRODUCTION = ENVIRONMENT === 'production';

/** Vite's own flag, driven by the build mode rather than our env var. */
export const IS_DEV = import.meta.env.DEV;

/**
 * A production bundle pointed at cleartext http:// would have every request
 * blocked as mixed content the moment the app is served over https. Failing
 * at startup beats shipping a dashboard whose network layer is dead on
 * arrival. Relative URLs (dev proxy) are exempt - they inherit the page
 * origin.
 */
if (IS_PRODUCTION && API_BASE_URL.startsWith('http://')) {
  throw new Error(
    `Refusing to start: production build points at cleartext URL "${API_BASE_URL}". Use https://.`,
  );
}

/** Axios defaults to no timeout, which hangs a request forever. */
export const REQUEST_TIMEOUT_MS = 15_000;
