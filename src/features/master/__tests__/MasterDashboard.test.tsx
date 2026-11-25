import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/renderWithProviders';
import { MasterDashboard } from '../pages/MasterDashboard';
import { apiClient } from '@/shared/api/client';

vi.mock('@/shared/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('MasterDashboard - Hospital Tenants Page & CRUD', () => {
  const mockTenants = [
    {
      id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
      tenant_name: 'Metro City Hospital',
      tenant_code: 'T-METRO01',
      email: 'admin@metrocity.org',
      phone: '+91 9876543210',
      address: '123 Health Ave, Metro City',
      status: 'ACTIVE',
      created_at: '2026-11-24T10:00:00Z',
      updated_at: '2026-11-24T10:00:00Z',
    },
  ];

  beforeEach(() => {
    localStorage.setItem('hms_master_auth', 'true');
    vi.clearAllMocks();
  });

  it('renders Tenants tab by default with exact 9 columns and New Tenant button', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockTenants });

    renderWithProviders(<MasterDashboard defaultTab="tenants" />);

    // Check "New Tenant" button exists
    expect(screen.getByRole('button', { name: /new tenant/i })).toBeInTheDocument();

    // Verify all 9 table columns are rendered in the header
    await waitFor(() => {
      expect(screen.getByText('Tenant ID')).toBeInTheDocument();
      expect(screen.getByText('Hospital Name')).toBeInTheDocument();
      expect(screen.getByText('Tenant Code')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Phone')).toBeInTheDocument();
      expect(screen.getByText('Address')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Created Date')).toBeInTheDocument();
      expect(screen.getByText('Updated Date')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });

    // Verify row data is displayed
    await waitFor(() => {
      expect(screen.getByText('Metro City Hospital')).toBeInTheDocument();
      expect(screen.getByText('T-METRO01')).toBeInTheDocument();
      expect(screen.getByText('admin@metrocity.org')).toBeInTheDocument();
      expect(screen.getByText('+91 9876543210')).toBeInTheDocument();
      expect(screen.getByText('123 Health Ave, Metro City')).toBeInTheDocument();
    });
  });

  it('opens Add New Tenant drawer with separate address input fields', async () => {
    const user = userEvent.setup();
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockTenants });

    renderWithProviders(<MasterDashboard defaultTab="tenants" />);

    const newBtn = screen.getByRole('button', { name: /new tenant/i });
    await user.click(newBtn);

    await waitFor(() => {
      expect(screen.getByText('🏥 Add New Tenant')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('e.g. Apollo Medical Center')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Building, Street, Flat / House No.')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Area, Landmark, Colony (Optional)')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('City / District')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('State')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Postal code / PIN (e.g. 600001)')).toBeInTheDocument();
    });
  });
});
