# admin-web

Admin dashboard for the Dr Narendran platform. React + TypeScript + Vite, talking to
the Express API in [`../backend`](../backend).

This is a **foundation**, not a finished product: it ships the tooling, architecture and
one working route that proves the stack end to end. Feature work goes on top.

---

## Quick start

```bash
npm install
npm run dev          # http://localhost:5173
```

That is the whole setup. `.env.development` is committed with working defaults, so there
is no `.env` to create for local work.

For the dashboard to show live data, the backend must be running on port 4000:

```bash
cd ../backend && npm run dev
```

If it is not running, the dashboard renders an explicit "Could not reach the API" panel
rather than failing silently — that is the intended behaviour, not a bug.

### Requirements

- Node `>= 22.11` (the repo is developed on 22.23.2 — see `../backend/.nvmrc`)
- npm (not pnpm — see [Decisions](#decisions-that-need-team-buy-in))

---

## Scripts

| Script                  | What it does                                  |
| ----------------------- | --------------------------------------------- |
| `npm run dev`           | Dev server with HMR on :5173                  |
| `npm run build`         | Type-checks (`tsc -b`) then builds to `dist/` |
| `npm run preview`       | Serves the built `dist/` locally              |
| `npm run lint`          | ESLint, `--max-warnings=0`                    |
| `npm run lint:fix`      | ESLint with autofix                           |
| `npm run format`        | Prettier, write                               |
| `npm run format:check`  | Prettier, check only (use this in CI)         |
| `npm run typecheck`     | `tsc -b --noEmit`, no emit                    |
| `npm run test`          | Vitest, single run                            |
| `npm run test:watch`    | Vitest, watch mode                            |
| `npm run test:coverage` | Vitest with v8 coverage                       |
| `npm run verify`        | `typecheck && lint && test` — the CI gate     |

---

## Folder structure

Feature-first, matching `doctor_app` and `patient_app` so the three clients read the
same way.

```
src/
├── app/                    Application wiring
│   ├── router.tsx          Route tree (createBrowserRouter)
│   ├── routes.ts           Path constants — no magic strings
│   └── providers/          Global providers, composed in one place
├── features/               One folder per feature, self-contained
│   └── dashboard/
│       ├── api/            Queries/mutations + query keys for this feature
│       ├── components/     Components used only by this feature
│       ├── pages/          Route-level components
│       └── __tests__/
├── shared/                 Used by two or more features
│   ├── api/                HTTP client, error normalization, query client
│   ├── components/         Layout, ErrorBoundary, route error page
│   ├── config/             Typed env access
│   ├── hooks/              Cross-feature hooks
│   └── lib/                Logger and other primitives
├── types/                  Cross-cutting types (the API wire contract)
├── styles/                 Tailwind entry + theme tokens
└── test/                   Test setup and helpers (not shipped)
```

**Why feature-first over layered** (`components/`, `hooks/`, `services/`): a layered tree
scatters one feature across four directories, and the cost grows with the app. Here,
"everything about the dashboard" is one folder — easy to find, easy to delete, easy to
hand to another engineer.

**The rule that keeps it working:** a feature may import from `shared/`, never from
another feature. When two features need the same thing, it moves to `shared/`. If
features start importing each other, the boundary is wrong.

---

## Conventions

**Naming**

- Components: `PascalCase.tsx`, one component per file, named export (not default —
  default exports rename freely at the import site and break grep)
- Everything else: `camelCase.ts`
- Hooks: `useThing.ts`
- Tests: `Thing.test.tsx` in a sibling `__tests__/` folder

**Imports** — always the `@/` alias, never `../../..`. Order is enforced by
`simple-import-sort`; run `npm run lint:fix` rather than sorting by hand.

**Commits** — [Conventional Commits](https://www.conventionalcommits.org/):
`feat:`, `fix:`, `chore:`, `refactor:`, `test:`, `docs:`. Not currently enforced by a
hook; see open decisions.

**Branching** — short-lived branches off `main`, named `feat/short-description`.

**Pre-commit** — Husky runs `lint-staged` (ESLint + Prettier on staged files only) then
a full `npm run typecheck`. The type check is repo-wide on purpose: `tsc` has no
staged-files mode, and it is the only thing that catches a rename breaking a file you
did not touch.

---

## Architecture notes

**All server state goes through TanStack Query.** Do not call `apiClient` directly from
a component. Put the query in `features/<name>/api/`, export a hook, and let the
component consume `{ data, isPending, isError }`. Handle all three states — a component
that only handles success renders a blank panel on failure and nobody notices until
production.

**All HTTP goes through `shared/api/client.ts`.** It is one axios instance with a
timeout, an auth-token interceptor, an `X-Request-Id` header (the backend echoes it into
error bodies — quote it in bug reports) and a 401 handler. Nothing else should import
axios.

**All errors go through `normalizeError`** (`shared/api/errors.ts`), which turns any
throw into `{ message, status, code, requestId, isNetworkError, isAuthError,
fieldErrors }`. `fieldErrors` maps the backend's Zod validation issues straight onto
form fields.

**Two error boundaries, different jobs.** `ErrorBoundary` catches render-phase crashes
app-wide. The router's `errorElement` (`RouteErrorPage`) catches route-level errors and
404s. Neither catches async errors — those surface through TanStack Query's `isError`.

### API and CORS

The backend serves `/api` on port 4000 and its CORS allowlist (`CORS_ORIGINS`) is
currently **empty**, which rejects every browser origin.

- **In dev this does not matter.** `vite.config.ts` proxies `/api` to
  `http://localhost:4000`, so requests are same-origin and never trigger a preflight.
  No backend change is needed to develop.
- **In production it does.** There is no proxy. The deployed origin must be added to
  `CORS_ORIGINS` in the backend's `.env` or every request will fail.

Note the backend binds to IPv6 `[::1]`, so the proxy target must stay `localhost` —
hardcoding `127.0.0.1` breaks it.

### Environment variables

Only `VITE_`-prefixed vars reach the client, and **all of them are public** — Vite
inlines them into the bundle. Never put a secret in one.

| File               | Committed | Purpose                                    |
| ------------------ | --------- | ------------------------------------------ |
| `.env.example`     | yes       | Documentation                              |
| `.env.development` | yes       | Dev defaults — works with no setup         |
| `.env.test`        | yes       | Vitest runs in `test` mode and loads this  |
| `.env.production`  | yes       | **Placeholder API URL — must be replaced** |
| `.env.local`       | no        | Your personal overrides                    |

Every var must also be typed in `src/vite-env.d.ts`, or it is `any` at the call site.

---

## Deployment (Vercel)

`vercel.json` is committed and handles the SPA rewrite (without it, refreshing a deep
link 404s), long-lived caching for hashed assets, and basic security headers.

Before the first deploy, set these in **Project → Settings → Environment Variables**:

```
VITE_API_BASE_URL = https://<your-api-host>/api
VITE_ENVIRONMENT  = production
```

Vercel's values take precedence over `.env.production`. If you skip this, you ship a
bundle pointing at the `api.example.com` placeholder and every request fails visibly.

Then add the deployed origin to `CORS_ORIGINS` on the backend.

---

## Decisions that need team buy-in

1. **npm, not pnpm.** Matches `backend` (which explicitly switched pnpm → npm) and both
   mobile apps. Revisit only as a decision across all four repos, not just this one.

2. **TypeScript pinned to `~6.0.3`, though 7.0.2 is out.** `typescript-eslint@8.70.0`
   declares `typescript: ">=4.8.4 <6.1.0"`; TS 7 breaks linting outright. Tilde, not
   caret, so a future 6.1 cannot sneak past that ceiling.
   **Upgrade when:** typescript-eslint supports TS 7.

3. **ESLint 10 with a peer override for `eslint-plugin-jsx-a11y`.** a11y linting was a
   requirement, but jsx-a11y still declares `eslint: ^9` — a stale range; its rules were
   verified working on 10. ESLint 9 was rejected because npm now marks it deprecated
   ("no longer supported"). `package.json` carries an `overrides` entry.
   **Remove the override when:** jsx-a11y widens its peer range to `^10`.

4. **No client-state library.** TanStack Query owns server state; local UI state uses
   `useState`/`useReducer`. There is deliberately no Zustand and no auth Context yet.
   **Decide when:** a login screen lands — that is the first real cross-tree client
   state. `shared/api/client.ts` already exposes `setTokenGetter` and
   `setUnauthorizedHandler` for whatever owns the session.

5. **API types are hand-mirrored in `src/types/api.ts`.** The three repos are
   independent with no npm workspace, so there is nothing to import. This will drift.
   **Decide:** live with it, or extract a shared `api-types` package.

6. **Source maps are uploaded to production** (`build.sourcemap: true`). Good for
   debugging, but it publishes readable source. Flip to `false` in `vite.config.ts` if
   that is unacceptable.

7. **No CI pipeline yet.** `npm run verify` is the intended gate; nothing runs it
   automatically.

8. **Commit messages are not enforced.** Conventional Commits is a convention here, not
   a hook. Add `commitlint` if the team wants it enforced.

### Known backend gaps (not this repo's work)

- `GET /api/users` is readable by **any** authenticated user, including patients. It
  needs `requireRole('admin', 'doctor')` before an admin UI ships.
- `POST /api/auth/login` returns only `{ token }` — no role. A login flow must call
  `GET /api/auth/me` afterwards to decide whether the user may enter the dashboard.
- There is no refresh-token endpoint. Tokens last 7 days; a 401 means log in again.
