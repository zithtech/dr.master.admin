import { createBrowserRouter } from 'react-router';

import { ROUTES } from '@/app/routes';
import { CreateTenant } from '@/features/master/pages/CreateTenant';
import { MasterDashboard } from '@/features/master/pages/MasterDashboard';
import { MasterForgotPassword } from '@/features/master/pages/MasterForgotPassword';
import { MasterLogin } from '@/features/master/pages/MasterLogin';
import { MasterResetPassword } from '@/features/master/pages/MasterResetPassword';
import { TenantDashboard } from '@/features/tenant/pages/TenantDashboard';
import { TenantLogin } from '@/features/tenant/pages/TenantLogin';
import { RouteErrorPage } from '@/shared/components/RouteErrorPage';

/**
 * Data-router API (`createBrowserRouter` + `RouterProvider`), not the legacy
 * `<BrowserRouter><Routes>` tree. It is what unlocks `errorElement`, loaders,
 * actions and deferred data if this app later needs them.
 *
 * Routes are eagerly imported while there is one page. Once the bundle grows,
 * switch child routes to `lazy: () => import(...)` - the data router splits
 * per route without any change to this shape.
 */
export const router = createBrowserRouter([
  // Home → Login
  {
    path: ROUTES.home,
    element: <MasterLogin />,
    errorElement: <RouteErrorPage />,
  },
  // Master Routes
  { path: ROUTES.masterForgotPassword, element: <MasterForgotPassword /> },
  { path: ROUTES.masterResetPassword, element: <MasterResetPassword /> },
  { path: ROUTES.masterDashboard, element: <MasterDashboard /> },
  { path: ROUTES.createTenant, element: <CreateTenant /> },

  // Tenant Routes
  { path: ROUTES.tenantLogin, element: <TenantLogin /> },
  { path: ROUTES.tenantDashboard, element: <TenantDashboard /> },
]);
