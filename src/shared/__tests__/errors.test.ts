import { AxiosError, AxiosHeaders } from 'axios';
import { describe, expect, it } from 'vitest';

import { normalizeError } from '@/shared/api/errors';
import type { ApiErrorBody } from '@/types/api';

/**
 * Builds an AxiosError shaped the way axios really shapes one. Constructing
 * it by hand (rather than `{ isAxiosError: true }`) matters because
 * `normalizeError` branches on `axios.isAxiosError`, which checks the
 * prototype.
 */
function axiosErrorWithResponse(status: number, data: Partial<ApiErrorBody> | null): AxiosError {
  const config = { headers: new AxiosHeaders() };
  return new AxiosError('Request failed', 'ERR_BAD_REQUEST', config, null, {
    status,
    statusText: '',
    headers: {},
    config,
    data,
  });
}

describe('normalizeError', () => {
  it('surfaces the API error message, code and requestId', () => {
    const result = normalizeError(
      axiosErrorWithResponse(409, {
        error: 'That email is already registered.',
        code: 'CONFLICT',
        requestId: 'req-123',
      }),
    );

    expect(result.message).toBe('That email is already registered.');
    expect(result.code).toBe('CONFLICT');
    expect(result.requestId).toBe('req-123');
    expect(result.status).toBe(409);
    expect(result.isAuthError).toBe(false);
    expect(result.isNetworkError).toBe(false);
  });

  it('flattens validation issues into per-field messages', () => {
    const result = normalizeError(
      axiosErrorWithResponse(400, {
        error: 'Validation failed.',
        code: 'VALIDATION_ERROR',
        details: {
          source: 'body',
          issues: [
            { path: 'email', message: 'Invalid email address', code: 'invalid_string' },
            { path: 'password', message: 'Too short', code: 'too_small' },
            // Second issue for the same field must not overwrite the first.
            { path: 'email', message: 'Already taken', code: 'custom' },
          ],
        },
      }),
    );

    expect(result.fieldErrors).toEqual({
      email: 'Invalid email address',
      password: 'Too short',
    });
  });

  it('flags 401 and 403 as auth errors', () => {
    expect(normalizeError(axiosErrorWithResponse(401, null)).isAuthError).toBe(true);
    expect(normalizeError(axiosErrorWithResponse(403, null)).isAuthError).toBe(true);
    expect(normalizeError(axiosErrorWithResponse(500, null)).isAuthError).toBe(false);
  });

  it('falls back to a per-status message when the body has none', () => {
    expect(normalizeError(axiosErrorWithResponse(404, null)).message).toBe(
      'We could not find what you were looking for.',
    );
    expect(normalizeError(axiosErrorWithResponse(503, {})).message).toBe(
      'The server had a problem. Please try again shortly.',
    );
  });

  it('distinguishes a timeout from an unreachable server', () => {
    const config = { headers: new AxiosHeaders() };

    const timeout = new AxiosError('timeout', 'ECONNABORTED', config);
    expect(timeout.response).toBeUndefined();
    expect(normalizeError(timeout).message).toMatch(/timed out/i);
    expect(normalizeError(timeout).isNetworkError).toBe(true);

    const offline = new AxiosError('Network Error', 'ERR_NETWORK', config);
    expect(normalizeError(offline).message).toMatch(/could not reach the server/i);
    expect(normalizeError(offline).isNetworkError).toBe(true);
  });

  it('handles throws that did not come from axios at all', () => {
    expect(normalizeError(new Error('boom')).message).toBe('boom');
    expect(normalizeError('a bare string').message).toBe('Something went wrong.');
    expect(normalizeError(undefined).isNetworkError).toBe(false);
  });
});
