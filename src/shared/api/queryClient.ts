import { QueryClient } from '@tanstack/react-query';
import axios from 'axios';

/**
 * TanStack Query owns all server state.
 *
 * This is the same configuration doctor_app and patient_app use, so cache and
 * retry behaviour is consistent across every client of this API. It also means
 * "loading" and "error" are structural states a component must handle, rather
 * than something each screen reinvents (and usually forgets, producing a
 * silent empty list on failure).
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,

        // Retry transient failures, never permanent ones: a 401/403/404 will
        // return exactly the same response on the third attempt, so retrying
        // only delays the error the user needs to see. 429 is excluded too -
        // the backend rate-limits at 300 req/15min and retrying makes it worse.
        retry: (failureCount, error) => {
          if (axios.isAxiosError(error)) {
            const status = error.response?.status;
            if (status === 401 || status === 403 || status === 404 || status === 429) {
              return false;
            }
          }
          return failureCount < 2;
        },
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8_000),

        // A dashboard left open on a second monitor would otherwise refetch
        // every table on every tab focus, against a rate-limited API.
        refetchOnWindowFocus: false,
      },
      mutations: {
        // Never auto-retry a write: the first attempt may well have succeeded
        // before the response was lost, and this API has no idempotency keys.
        retry: 0,
      },
    },
  });
}
