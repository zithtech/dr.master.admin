import { createBrowserRouter } from 'react-router';

import { ROUTES } from '@/app/routes';
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage';
import { AppLayout } from '@/shared/components/AppLayout';
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
  {
    path: ROUTES.dashboard,
    element: <AppLayout />,
    // Catches throws from this route and everything nested under it, including
    // the 404 below.
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <DashboardPage /> },

      // Splat must stay last. Rendering the error page directly (rather than
      // throwing) keeps the shell's header visible on a wrong URL.
      { path: '*', element: <RouteErrorPage /> },
    ],
  },
]);
