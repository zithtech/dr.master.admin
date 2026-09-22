import { NavLink, Outlet } from 'react-router';

import { ROUTES } from '@/app/routes';
import { ENVIRONMENT } from '@/shared/config/env';

/**
 * The application shell: persistent chrome plus an <Outlet /> for whichever
 * child route is active. Because it is a layout route, navigating between
 * pages re-renders only the outlet, not the header.
 */
export function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-baseline gap-3">
            <span className="text-lg font-semibold text-slate-900">Admin</span>

            {/* A visible environment marker: the single cheapest guard against
                running a destructive action believing you are on staging. */}
            {ENVIRONMENT !== 'production' ? (
              <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium tracking-wide text-amber-800 uppercase">
                {ENVIRONMENT}
              </span>
            ) : null}
          </div>

          <nav aria-label="Main">
            <NavLink
              to={ROUTES.home}
              end
              className={({ isActive }) =>
                isActive
                  ? 'text-sm font-medium text-slate-900 underline underline-offset-4'
                  : 'text-sm font-medium text-slate-500 hover:text-slate-900'
              }
            >
              Dashboard
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
