# Walking Skeleton — Deployment Plan

A minimal end-to-end slice: static frontend, backend with one route, persistent storage, auto-deployed to Railway on `git push origin main`.

## Decisions

| Area | Choice | Why |
|---|---|---|
| Hosting | **Railway** | Push-to-deploy with zero config; one project hosts frontend, backend, and a volume. |
| Frontend | **React + Vite + TypeScript** | Largest ecosystem, agent-friendly, static build served by Railway. |
| Backend | **Fastify + TypeScript** | Fast, typed, schema validation built-in. |
| Persistence | **SQLite via `better-sqlite3`** on a **Railway volume** at `/data` | No separate DB service, no migrations to manage, one file. |
| Schema management | **`CREATE TABLE IF NOT EXISTS` at boot** | Walking skeleton has one trivial table; no ORM needed yet. |
| Package manager | **pnpm workspaces** | Monorepo support, fast installs. |
| Deploy trigger | **Railway native GitHub integration** | Connect repo in Railway UI → push to `main` auto-deploys. No GitHub Action required. |
| CI gates | None yet | Add later (typecheck + build) once there's something worth gating. |

## Scope of the walking skeleton

Prove every layer end-to-end with the minimum code:

- **Frontend:** single page that says "Hello" and calls `GET /api/hello`, displays the response.
- **Backend:** Fastify server with one route `GET /hello` that increments a counter in SQLite and returns `{ message: "hello", count: N }`.
- **Persistence:** SQLite file on a mounted volume, one table `pings(id, created_at)`. Counter = `SELECT count(*) FROM pings`.
- **Deploy:** `git push origin main` → Railway rebuilds and redeploys both services.

This proves: build pipeline ✓ static hosting ✓ backend boot ✓ DB write ✓ DB read ✓ volume persistence across redeploys ✓ frontend↔backend wiring ✓.

## Repo layout

```
.
├── apps/
│   ├── web/                       # Vite + React frontend
│   │   ├── package.json
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   └── src/
│   │       ├── main.tsx
│   │       └── App.tsx
│   └── api/                       # Fastify backend
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── server.ts
│           └── db.ts
├── pnpm-workspace.yaml
├── package.json
├── .gitignore
├── README.md
└── PLAN.md                        # this file
```

## Railway project structure

One project, three resources:

1. **Service `api`**
   - Root directory: `apps/api`
   - Build: `pnpm install && pnpm build`
   - Start: `pnpm start`
   - Volume: mounted at `/data`
   - Env: `DB_PATH=/data/app.db`, `PORT` (auto-injected by Railway)
   - Public domain: `api-xxx.up.railway.app`

2. **Service `web`**
   - Root directory: `apps/web`
   - Build: `pnpm install && pnpm build`
   - Output: `dist/` served as static
   - Env: `VITE_API_URL=https://api-xxx.up.railway.app`
   - Public domain: `web-xxx.up.railway.app`

3. **Volume** (attached to `api` only) — persists `/data/app.db` across deploys.

## Frontend↔backend wiring

The frontend reads `VITE_API_URL` at build time and calls `${VITE_API_URL}/hello`. CORS is enabled on the backend for the web service's origin (or `*` for the skeleton).

## Step-by-step implementation

### Phase 1 — local scaffold
1. Create `pnpm-workspace.yaml` and root `package.json`.
2. Scaffold `apps/web` with `pnpm create vite apps/web --template react-ts`.
3. Scaffold `apps/api` with Fastify + better-sqlite3 + TypeScript.
4. Implement `GET /hello` route + SQLite wiring.
5. Implement frontend page that fetches and renders the response.
6. Verify locally: `pnpm --filter api dev` and `pnpm --filter web dev` both work; frontend shows incrementing counter.

### Phase 2 — Railway setup (one-time, in Railway UI)
1. Create a new Railway project, connect this GitHub repo.
2. Add service `api`, set root directory `apps/api`, attach a volume at `/data`, set env `DB_PATH=/data/app.db`.
3. Add service `web`, set root directory `apps/web`.
4. Deploy both; copy `api`'s public URL.
5. Set `VITE_API_URL` on the `web` service to that URL; redeploy `web`.
6. Open `web`'s URL → see "hello, count: 1" → refresh → count increments → confirms persistence.

### Phase 3 — verify push-to-deploy
1. Make a trivial change (e.g. update the greeting), commit, push to `main`.
2. Watch Railway rebuild both services automatically.
3. Confirm change is live and counter persisted across the redeploy.

## Conventions for the agent (to be added to CLAUDE.md later)

- All DB schema changes go in `apps/api/src/db.ts` using `CREATE TABLE IF NOT EXISTS` or `ALTER TABLE` guarded by existence checks.
- Never commit `apps/api/data/*.db` (local SQLite file) — already in `.gitignore`.
- Backend listens on `process.env.PORT` (Railway requirement), not a hardcoded port.
- Frontend reads API URL from `import.meta.env.VITE_API_URL`, never hardcoded.

## Deferred (not in walking skeleton, add when needed)

- Auth
- CI gates (GitHub Action with typecheck/test)
- Drizzle ORM (swap in when schema gets non-trivial)
- Litestream backup of SQLite to S3/R2
- Custom domain
- Shared `packages/shared` for types between web and api
