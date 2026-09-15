import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';

import { API_BASE_URL, REQUEST_TIMEOUT_MS } from '@/shared/config/env';
import { logger } from '@/shared/lib/logger';

/**
 * The single HTTP client for the app. Nothing outside this folder should
 * import axios directly - that is how per-component fetch logic, missing
 * timeouts and inconsistent error handling creep back in.
 *
 * axios over native fetch: the request/response interceptor pair below has no
 * clean fetch equivalent without hand-rolling a wrapper, and
 * `axios.isAxiosError` is what lets errors.ts and queryClient.ts share one
 * error model. The same client exists in doctor_app and patient_app, so error
 * behaviour stays identical across all three clients.
 */

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json' },
});

/**
 * Auth token accessor.
 *
 * The transport layer must not import an auth store directly - that is a
 * circular dependency (auth -> client -> auth) and it would weld the HTTP
 * client to one state library. Whatever owns the session registers itself
 * here instead. Until a login screen exists this simply returns null.
 */
type TokenGetter = () => string | null;
let getToken: TokenGetter = () => null;

export function setTokenGetter(getter: TokenGetter): void {
  getToken = getter;
}

/**
 * Session-expiry callback, registered by whatever owns the session, for the
 * same reason as above.
 */
type UnauthorizedHandler = () => void;
let onUnauthorized: UnauthorizedHandler | null = null;

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  onUnauthorized = handler;
}

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getToken();
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }

  // The backend echoes this into every error body as `requestId`, which is
  // what makes a user's bug report traceable to a specific server log line.
  config.headers.set('X-Request-Id', crypto.randomUUID());

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;

      if (status === 401) {
        // The token is dead, not flaky. Tear the session down so the UI routes
        // to login instead of retrying a request that can never succeed.
        // There is no refresh endpoint on this API.
        logger.warn('Received 401; clearing session.', { url: error.config?.url });
        onUnauthorized?.();
      } else if (!error.response) {
        logger.warn('Network request failed with no response.', {
          url: error.config?.url,
          code: error.code,
        });
      }
    }
    return Promise.reject(error instanceof Error ? error : new Error(String(error)));
  },
);
