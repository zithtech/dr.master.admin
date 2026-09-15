import axios from 'axios';

import type { ApiErrorCode, ValidationErrorDetails } from '@/types/api';

/**
 * Normalizes anything thrown by the network layer into a message safe to
 * render, plus the machine-readable bits callers need.
 *
 * Without this, every screen reinvents `err.response?.data?.error ?? 'Failed'`
 * at the call site, and any non-Axios throw gets mislabelled as a request
 * failure. One place to change when the API's error shape changes.
 */

export interface NormalizedError {
  message: string;
  status: number | null;
  code: ApiErrorCode | null;
  /** Echoed from the x-request-id header - quote it when reporting a bug. */
  requestId: string | null;
  isNetworkError: boolean;
  isAuthError: boolean;
  /** Present only on 400 VALIDATION_ERROR; maps directly onto form fields. */
  fieldErrors: Record<string, string> | null;
}

export function normalizeError(error: unknown): NormalizedError {
  if (axios.isAxiosError(error)) {
    // No response at all: DNS failure, connection refused, CORS rejection, or
    // a client-side timeout. `error.response` is undefined in every case.
    if (!error.response) {
      return {
        message:
          error.code === 'ECONNABORTED'
            ? 'The request timed out. Check your connection and try again.'
            : 'Could not reach the server. Check your connection and try again.',
        status: null,
        code: null,
        requestId: null,
        isNetworkError: true,
        isAuthError: false,
        fieldErrors: null,
      };
    }

    const status = error.response.status;
    const body = error.response.data as Partial<{
      error: string;
      message: string;
      code: ApiErrorCode;
      requestId: string;
      details: unknown;
    }> | null;

    return {
      // The API uses `error`; `message` is the fallback for anything sitting
      // in front of it (a proxy or load balancer) that uses the other key.
      message: body?.error ?? body?.message ?? defaultMessageForStatus(status),
      status,
      code: body?.code ?? null,
      requestId: body?.requestId ?? null,
      isNetworkError: false,
      isAuthError: status === 401 || status === 403,
      fieldErrors: extractFieldErrors(body?.details),
    };
  }

  return {
    message: error instanceof Error ? error.message : 'Something went wrong.',
    status: null,
    code: null,
    requestId: null,
    isNetworkError: false,
    isAuthError: false,
    fieldErrors: null,
  };
}

/**
 * Flattens the backend's Zod issue list into `{ fieldPath: message }`. First
 * issue per field wins - showing one message per input is enough.
 */
function extractFieldErrors(details: unknown): Record<string, string> | null {
  if (!isValidationDetails(details)) {
    return null;
  }

  const fieldErrors: Record<string, string> = {};
  for (const issue of details.issues) {
    if (!(issue.path in fieldErrors)) {
      fieldErrors[issue.path] = issue.message;
    }
  }
  return Object.keys(fieldErrors).length > 0 ? fieldErrors : null;
}

function isValidationDetails(value: unknown): value is ValidationErrorDetails {
  return (
    typeof value === 'object' && value !== null && 'issues' in value && Array.isArray(value.issues)
  );
}

function defaultMessageForStatus(status: number): string {
  switch (status) {
    case 400:
      return 'That request was not valid.';
    case 401:
      return 'Your session has expired. Please log in again.';
    case 403:
      return 'You do not have permission to do that.';
    case 404:
      return 'We could not find what you were looking for.';
    case 409:
      return 'That conflicts with something that already exists.';
    case 429:
      return 'Too many attempts. Please wait a moment and try again.';
    default:
      return status >= 500
        ? 'The server had a problem. Please try again shortly.'
        : 'Something went wrong.';
  }
}
