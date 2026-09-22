import { useNavigate } from 'react-router';

import { ROUTES } from '@/app/routes';

export function DashboardPage() {
  const navigate = useNavigate();

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-900 p-4">
      {/* Background decoration */}
      <div className="pointer-events-none absolute top-0 left-0 z-0 h-full w-full overflow-hidden">
        <div className="absolute -top-[30%] -right-[10%] h-[70%] w-[70%] rounded-full bg-indigo-600/20 blur-[120px]"></div>
        <div className="absolute -bottom-[20%] -left-[10%] h-[60%] w-[60%] rounded-full bg-blue-600/20 blur-[120px]"></div>
      </div>

      <div className="z-10 w-full max-w-5xl">
        <div className="mb-16 text-center">
          <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-white md:text-6xl">
            Doctor Admin{' '}
            <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              Platform
            </span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-slate-400 md:text-xl">
            A fully isolated, multi-tenant cloud architecture for managing hospitals, doctors, and
            patients securely.
          </p>
        </div>

        <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
          {/* Master Portal Card */}
          <div className="group rounded-3xl border border-slate-700 bg-slate-800/50 p-8 backdrop-blur-xl transition-colors hover:bg-slate-800">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-indigo-500/30 bg-indigo-500/20 transition-transform group-hover:scale-110">
              <span className="text-2xl">🌍</span>
            </div>
            <h2 className="mb-3 text-2xl font-bold text-white">Master Admin Portal</h2>
            <p className="mb-8 leading-relaxed text-slate-400">
              For Super Admins to provision new hospitals, manage isolated databases, and oversee
              the entire SaaS platform.
            </p>
            <button
              onClick={() => {
                void navigate(ROUTES.masterLogin);
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-4 font-semibold text-white shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all hover:bg-indigo-500"
            >
              Sign In to Master <span aria-hidden="true">&rarr;</span>
            </button>
          </div>

          {/* Tenant Portal Card */}
          <div className="group rounded-3xl border border-slate-700 bg-slate-800/50 p-8 backdrop-blur-xl transition-colors hover:bg-slate-800">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-500/30 bg-cyan-500/20 transition-transform group-hover:scale-110">
              <span className="text-2xl">🏥</span>
            </div>
            <h2 className="mb-3 text-2xl font-bold text-white">Hospital Portal</h2>
            <p className="mb-8 leading-relaxed text-slate-400">
              For Hospital Administrators to manage their doctors, receptionists, and patients
              securely within their own database.
            </p>
            <div className="space-y-3">
              <p className="text-center text-xs font-semibold tracking-wider text-slate-500 uppercase">
                Demo Environment
              </p>
              <button
                onClick={() => {
                  void navigate('/t/T-ABCDEF/login');
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 px-6 py-4 font-semibold text-white shadow-[0_0_20px_rgba(8,145,178,0.3)] transition-all hover:bg-cyan-500"
              >
                Sign In to Demo Hospital <span aria-hidden="true">&rarr;</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
