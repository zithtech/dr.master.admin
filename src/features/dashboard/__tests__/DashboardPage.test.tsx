import { screen, waitFor } from '@testing-library/react';
import { AxiosError, AxiosHeaders } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DashboardPage } from '@/features/dashboard/pages/DashboardPage';
import { apiClient } from '@/shared/api/client';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { HealthResponse } from '@/types/api';

// Mock at the transport boundary, not at the hook. This exercises the real
// useHealth hook, the real query config and the real error normalization -
// mocking useHealth instead would test almost nothing.
vi.mock('@/shared/api/client', () => ({
  apiClient: { get: vi.fn() },
  setTokenGetter: vi.fn(),
  setUnauthorizedHandler: vi.fn(),
}));

const mockGet = vi.mocked(apiClient).get;

const healthyResponse: HealthResponse = {
  status: 'ok',
  db: 'up',
  uptimeSeconds: 7200,
  pool: { total: 10, idle: 9, waiting: 0 },
};

describe('DashboardPage', () => {
  beforeEach(() => {
    mockGet.mockReset();
  });

  it('shows a loading state, then the resolved health data', async () => {
    mockGet.mockResolvedValue({ data: healthyResponse });

    renderWithProviders(<DashboardPage />);

    // The loading state must be announced, not just visible.
    expect(screen.getByText(/checking api/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('ok')).toBeInTheDocument();
    });

    expect(screen.getByText('up')).toBeInTheDocument();
    // 7200s formats as hours, not a raw second count.
    expect(screen.getByText('2h')).toBeInTheDocument();
    expect(screen.queryByText(/checking api/i)).not.toBeInTheDocument();
    expect(mockGet).toHaveBeenCalledWith(
      '/health',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it('renders the API error message when the request fails', async () => {
    const config = { headers: new AxiosHeaders() };
    mockGet.mockRejectedValue(
      new AxiosError('Service Unavailable', 'ERR_BAD_RESPONSE', config, null, {
        status: 503,
        statusText: '',
        headers: {},
        config,
        data: { error: 'Database is unreachable.', code: 'SERVICE_UNAVAILABLE' },
      }),
    );

    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    // The message came through normalizeError, not a hardcoded string.
    expect(screen.getByText('Database is unreachable.')).toBeInTheDocument();
    expect(screen.getByText(/could not reach the api/i)).toBeInTheDocument();
  });

  it('marks a degraded API as bad rather than silently showing nothing', async () => {
    mockGet.mockResolvedValue({
      data: { status: 'degraded', db: 'down', uptimeSeconds: 45 } satisfies HealthResponse,
    });

    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('degraded')).toBeInTheDocument();
    });
    expect(screen.getByText('down')).toBeInTheDocument();
    expect(screen.getByText('45s')).toBeInTheDocument();
  });
});
