import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@/shared/api/client';
import type { HealthResponse } from '@/types/api';

/**
 * Query keys are declared next to the queries that use them so invalidation
 * is discoverable. A flat `['health']` string array is enough here; keep the
 * factory shape for features with parameters (e.g. `users.list(filters)`).
 */
export const healthKeys = {
  all: ['health'] as const,
};

async function fetchHealth(signal: AbortSignal): Promise<HealthResponse> {
  const { data } = await apiClient.get<HealthResponse>('/health', { signal });
  return data;
}

/**
 * Reads GET /api/health.
 *
 * This is the app's proof-of-life: it exercises env config, the axios client,
 * the proxy and TanStack Query against a real endpoint that needs no auth,
 * rather than a placeholder that would have to be deleted later.
 */
export function useHealth() {
  return useQuery({
    queryKey: healthKeys.all,
    // `signal` comes from TanStack Query and is forwarded to axios, so
    // navigating away actually aborts the in-flight request.
    queryFn: ({ signal }) => fetchHealth(signal),
    // Health is the one thing worth polling; it is cheap and the whole point
    // is that it is current.
    refetchInterval: 30_000,
  });
}
