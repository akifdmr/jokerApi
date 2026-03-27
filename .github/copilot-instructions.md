## Quick orientation for AI coding agents

This repository contains a small payment utility named "jokerApi". Primary active code is the TypeScript Express backend in `server/`. There are also legacy PHP frontend pieces (`form.html`, `satis.php`) that show how older integrations were done.

Keep instructions short and concrete. Focus on the `server/` folder for changes — it's the canonical, modern codebase.

Key places to read first
- `server/src/server.ts` — app bootstrap, route mounting, and swagger setup.
- `server/src/routes/` — main HTTP handlers (notably `balanceRouter.ts` and `providerRouter.ts`). Use these to see request shapes and error handling.
- `server/src/providers/` — payment provider adapters (Stripe, Wix). New providers should implement the same small surface used by `CoreLimitChecker`.
- `server/src/core/` — DB wiring (`db.ts`), small utilities (Logger, CoreLimitChecker). DB models live in `server/src/models/`.
- `satis.php` and `form.html` (repo root) — legacy examples for external payment POST formats and fields.

Runtime & developer commands
- Local dev: from `server/` run `npm run dev` (uses `tsx watch src/server.ts`).
- Build: `npm run build` (generates `dist/` via `tsc`).
- Start production: `npm run prod` or `npm run start` after build.
- Environment: `.env` file in `server/` is used for API_TOKEN and provider credentials. When running tests or CI, set `API_TOKEN` to match the auth middleware (default fallback is `MY_SECRET_TOKEN`).

API patterns & conventions
- Routes return JSON and follow { error?: string, success?: boolean, ... } shapes. Use existing routes as examples (e.g. `/api/balance-check`).
- Auth: `balanceRouter` uses a simple Bearer token middleware. Token value comes from `process.env.API_TOKEN` or `MY_SECRET_TOKEN` default. For changes to auth, update the middleware in `balanceRouter.ts`.
- Providers: provider classes (e.g. `wixPaymentService`, `StripePaymentService`) are instantiated inside controllers and passed to `CoreLimitChecker`. Keep provider constructors and method names stable to avoid breaking consumers.
- DB: Mongoose is used (see `server/src/core/db.ts`). Model methods like `upsertCard`, `insertCardLimit` are small and used directly in routes.

Swagger & docs
- Swagger is enabled at `/docs` when server runs. Route-level JSDoc/OpenAPI comments are present in `balanceRouter.ts` — keep them updated when changing request/response shapes.

Testing and safety
- There are no automated tests in the repo. Add unit tests under `server/src` with a runner (Jest/ Vitest) if expanding logic.
- Be conservative modifying payment logic: providers interact with external services (Stripe/Wix). Prefer feature toggles, mocks, or environment-based branches for live credentials.

Small examples to reference when making edits
- Add a new provider: implement a class under `server/src/providers/` that exposes the same method set used by `CoreLimitChecker` and register the new provider in `balanceRouter.ts` switch.
- Change request schema: update the OpenAPI block in `balanceRouter.ts` that documents `/joker/api/balance-check` and regenerate docs by restarting the server.
- DB schema updates: add/modify Mongoose models in `server/src/models/`, then run `npm run build` and migrate existing code that uses those models.

What not to do
- Don't remove or rewrite `satis.php` without keeping a compatible example of expected POST fields — it's used as a real-world reference.
- Avoid introducing breaking changes to provider constructors or CoreLimitChecker API without updating all callers.

If anything is unclear, ask for the exact file or the intended runtime (dev vs prod) and I will update the guidance.
