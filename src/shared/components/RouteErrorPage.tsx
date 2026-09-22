import { isRouteErrorResponse, Link, useRouteError } from 'react-router';

import { ROUTES } from '@/app/routes';
import { logger } from '@/shared/lib/logger';

/**
 * The router's `errorElement`. It handles two distinct cases that are easy to
 * conflate:
 *
 *  - a 404 from an unmatched URL, which is expected and not a bug
 *  - a genuine throw from a loader, action, or render
 *
 * Only the second is worth logging. Reporting every mistyped URL as an error
 * is how a reporting budget gets burned on noise.
 */
export function RouteErrorPage() {
  const error = useRouteError();
  const isNotFound = isRouteErrorResponse(error) && error.status === 404;

  if (!isNotFound) {
    logger.error(error, { source: 'router' });
  }

  return (
    <div
      role="alert"
      data-testid="route-error"
      className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center"
    >
      <p className="text-sm font-medium tracking-widest text-slate-400 uppercase">
        {isRouteErrorResponse(error) ? error.status : 'Error'}
      </p>

      <h1 className="text-2xl font-semibold text-slate-900">
        {isNotFound ? 'Page not found' : 'Something went wrong'}
      </h1>

      <p className="max-w-md text-slate-600">
        {isNotFound
          ? 'That URL does not match any page in the dashboard.'
          : 'The page failed to load. Try again, or head back to the dashboard.'}
      </p>

      <Link
        to={ROUTES.home}
        className="rounded bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-700"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
