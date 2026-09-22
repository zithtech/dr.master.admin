import { useState } from 'react';
import { useNavigate } from 'react-router';

import { ROUTES } from '@/app/routes';

interface TenantResult {
  tenantCode: string;
  databaseName: string;
}

export function CreateTenant() {
  const [tenantName, setTenantName] = useState('');
  const [databaseName, setDatabaseName] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<TenantResult | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('http://localhost:4000/api/master/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantName, databaseName, status }),
      });
      if (res.ok) {
        const data = (await res.json()) as { data: TenantResult };
        setResult(data.data);
      } else {
        alert('Failed to create hospital');
      }
    } catch {
      alert('Network error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (result) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl">
          <div className="bg-emerald-500 p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white text-3xl text-emerald-500 shadow-lg">
              ✓
            </div>
            <h2 className="text-2xl font-bold text-white">Hospital Onboarded Successfully</h2>
            <p className="mt-2 text-emerald-50">Database provisioned & migrations completed.</p>
          </div>

          <div className="space-y-6 p-8">
            <div className="grid grid-cols-2 gap-6 rounded-xl border border-slate-100 bg-slate-50 p-6">
              <div>
                <p className="text-sm font-medium tracking-wider text-slate-500 uppercase">
                  Hospital Name
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-900">{tenantName}</p>
              </div>
              <div>
                <p className="text-sm font-medium tracking-wider text-slate-500 uppercase">
                  Tenant Code
                </p>
                <p className="mt-1 font-mono text-lg font-bold text-indigo-600">
                  {result.tenantCode}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-sm font-medium tracking-wider text-slate-500 uppercase">
                  Database Name
                </p>
                <p className="text-md mt-1 inline-block rounded border border-slate-200 bg-white p-2 font-mono text-slate-700">
                  {result.databaseName}
                </p>
              </div>
            </div>

            <div className="flex gap-4 border-t border-slate-100 pt-6">
              <button
                onClick={() => {
                  void navigate(ROUTES.home);
                }}
                className="flex-1 rounded-xl border-2 border-slate-200 bg-white px-6 py-3 font-semibold text-slate-700 transition-all duration-200 hover:border-slate-300 hover:bg-slate-50"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="flex w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl">
        {/* Left Side: Branding / Info */}
        <div className="hidden w-1/3 flex-col justify-between bg-indigo-600 p-8 text-white md:flex">
          <div>
            <h2 className="mb-4 text-2xl font-bold">Onboard New Hospital</h2>
            <p className="text-sm leading-relaxed text-indigo-100">
              Create a completely isolated database environment. Hospital data is securely siloed.
            </p>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm text-indigo-100">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500">
                ✓
              </div>
              <span>Dedicated PostgreSQL DB</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-indigo-100">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500">
                ✓
              </div>
              <span>Master Admin Controls</span>
            </div>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="w-full p-8 md:w-2/3 md:p-12">
          <button
            onClick={() => {
              void navigate(-1);
            }}
            className="mb-8 flex items-center gap-1 text-sm font-medium text-slate-400 transition-colors hover:text-slate-800"
          >
            &larr; Back to Dashboard
          </button>

          <form
            onSubmit={(e) => {
              void handleSubmit(e);
            }}
            className="space-y-6"
          >
            <div className="border-b border-slate-100 pb-6">
              <h3 className="mb-4 text-lg font-bold text-slate-800">Hospital Details</h3>
              <div className="mt-4 grid grid-cols-1 gap-6">
                <div>
                  <label
                    htmlFor="hospitalName"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Hospital Name
                  </label>
                  <input
                    id="hospitalName"
                    type="text"
                    value={tenantName}
                    onChange={(e) => setTenantName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 transition-all focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="e.g. Cauvery Hospital"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="databaseName"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Database Name
                  </label>
                  <input
                    id="databaseName"
                    type="text"
                    value={databaseName}
                    onChange={(e) => setDatabaseName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 transition-all focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="e.g. hms_cauvery_dev"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="statusSelect"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Status
                  </label>
                  <select
                    id="statusSelect"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 transition-all focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl bg-indigo-600 py-4 text-lg font-bold text-white shadow-lg shadow-indigo-200 transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-xl disabled:opacity-70 disabled:hover:translate-y-0"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="h-5 w-5 animate-spin text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Provisioning Environment...
                  </span>
                ) : (
                  'Create Hospital & Provision DB'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
