import { useHealth } from '@/features/dashboard/api/useHealth';
import { StatusCard } from '@/features/dashboard/components/StatusCard';
import { normalizeError } from '@/shared/api/errors';

/**
 * The one working route. It exists to prove the stack end to end - routing,
 * env config, the axios client, error normalization and TanStack Query - not
 * to be a finished dashboard.
 *
 * All three query states are rendered explicitly. That is the pattern every
 * future page should copy: a component that only handles the success case
 * renders a blank panel on failure and nobody notices until production.
 */
export function DashboardPage() {
  const { data, isPending, isError, error } = useHealth();

  return (
    <section>
      <h1 className="text-xl font-semibold text-slate-900">System status</h1>
      <p className="mt-1 text-sm text-slate-600">Live readout from the API&rsquo;s health check.</p>

      <div className="mt-6" aria-live="polite" aria-busy={isPending}>
        {isPending ? <p className="text-slate-500">Checking API&hellip;</p> : null}

        {isError ? <ApiUnreachable message={normalizeError(error).message} /> : null}

        {data ? (
          <div className="grid gap-4 sm:grid-cols-3">
            <StatusCard
              label="API"
              value={data.status}
              tone={data.status === 'ok' ? 'good' : 'bad'}
            />
            <StatusCard label="Database" value={data.db} tone={data.db === 'up' ? 'good' : 'bad'} />
            <StatusCard label="Uptime" value={formatUptime(data.uptimeSeconds)} />
          </div>
        ) : null}
      </div>
    </section>
  );
}

function ApiUnreachable({ message }: { message: string }) {
  return (
    <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4">
      <p className="font-medium text-red-900">Could not reach the API</p>
      <p className="mt-1 text-sm text-red-700">{message}</p>
      <p className="mt-2 text-xs text-red-600">
        Is the backend running on port 4000? Start it with <code>npm run dev</code> in{' '}
        <code>../backend</code>.
      </p>
    </div>
  );
}

function formatUptime(seconds: number): string {
  if (seconds < 60) return `${Math.floor(seconds)}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  return `${Math.floor(seconds / 3600)}h`;
}
