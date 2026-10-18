# Client & Project Hub

A small admin dashboard for managing **clients** and their **projects**,
with a full **activity log** of every project change. Built with Next.js 16,
Drizzle ORM, PostgreSQL, and better-auth.

Only users with the `admin` role can sign in to the dashboard. All other
authenticated users see an "Access restricted" page.

---

## Tech stack

### Core

| Tool                | Why we use it                                                       |
| ------------------- | ------------------------------------------------------------------- |
| **Next.js 16**      | Full-stack React framework. App Router for server components + route handlers. `proxy.ts` (renamed from `middleware.ts`) for the auth gate. |
| **TypeScript 5**    | End-to-end static typing.                                           |
| **PostgreSQL**      | Relational source of truth.                                         |
| **Drizzle ORM**     | Lightweight, SQL-first ORM. Schema lives in code, migrations generated. |
| **better-auth**     | Email/password auth, sessions, custom `role` field on the user table. |
| **Zod** + drizzle-zod | Runtime request validation, types inferred from the DB schema.    |

### Frontend

| Tool                  | Why we use it                                                  |
| --------------------- | -------------------------------------------------------------- |
| **React 19**          | UI library (ships with Next.js 16).                            |
| **Tailwind CSS 4**    | Utility-first styling. Theme tokens via CSS variables.         |
| **shadcn/ui**         | Headless Radix-based component set (New York style).           |
| **lucide-react**      | Icon set.                                                      |
| **TanStack Query v5** | Server state — caching, invalidation, optimistic updates.      |
| **Zustand**           | Client state — current view + persisted search filters.        |
| **react-hook-form**   | Form state for client/project create + edit modals.            |
| **axios**             | HTTP client (centralized in `src/lib/api.ts`, sends cookies).  |
| **next-themes**       | Light/dark mode toggle.                                        |
| **sonner**            | Toast notifications.                                           |
| **date-fns**          | Date utilities.                                                |

### Tooling

| Tool            | Why we use it                                       |
| --------------- | --------------------------------------------------- |
| **Bun**         | Package manager + script runner.                    |
| **ESLint**      | Linting (`bun run lint`).                           |
| **Drizzle Kit** | Schema → migrations (`db:generate`, `db:migrate`).  |

---

## Features

### Clients
- Create / list / search / edit / soft-delete clients
- Search by name, email, or company (case-insensitive)
- Detail page shows contact info + all projects for that client

### Projects
- Create / list / filter / edit / soft-delete projects
- Filter by client and by title search; status and priority filters on the client
- Sorted by priority (HIGH → MEDIUM → LOW) then due date (ascending)
- Detail page shows timeline progress + full activity log
- Overdue indicators and "due in N days" hints

### Activity log
- Every project create/update/delete is recorded with actor + timestamp
- UPDATE entries store field-level diffs (`{ from, to }` per changed field)
- Newest 100 entries shown on the project detail page
- Renders as a timeline with relative timestamps

### Authentication & authorization
- Email/password sign-in and sign-up via better-auth
- Custom `role` field on the user table (`admin | employee | user`, default `user`)
- New signups default to `user` and immediately see an "Access restricted" page
- `proxy.ts` middleware redirects unauthenticated users to `/signin`
- Server components enforce `role === "admin"` for the dashboard
- Sign-out available from both the sidebar and the topbar avatar dropdown

### UX
- Light/dark theme toggle (system-aware)
- Responsive: sidebar collapses to a drawer on mobile
- Loading, error, and empty states everywhere
- Toast notifications for every mutation
- Cross-navigation: client → their projects → project detail → activity; project → client link

---

## Project structure

```
.
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx              Root layout (fonts, providers)
│  │  ├─ page.tsx                Dashboard entry — server component, auth+role check
│  │  ├─ signin/page.tsx         Sign-in form
│  │  ├─ signup/page.tsx         Sign-up form
│  │  └─ api/
│  │     ├─ auth/[...all]/       better-auth handlers
│  │     ├─ clients/             CRUD + search
│  │     ├─ projects/            CRUD + filter
│  │     └─ projects/[id]/activity/   GET activity log
│  ├─ proxy.ts                   Next.js 16 middleware (session gate)
│  ├─ lib/
│  │  ├─ auth.ts                 better-auth config
│  │  ├─ auth-helpers.ts         getUser() helper
│  │  ├─ auth-client.ts          better-auth React client
│  │  ├─ db.ts                   Drizzle client
│  │  ├─ api.ts                  axios instance
│  │  ├─ types.ts                TS types matching schema
│  │  └─ utils.ts                date helpers, status/priority metadata
│  ├─ db/
│  │  ├─ schema/                 Drizzle table definitions
│  │  └─ validators.ts           drizzle-zod schemas
│  ├─ hooks/                     TanStack Query hooks (clients, projects, activity)
│  ├─ stores/                    Zustand stores (app view + filters)
│  └─ components/
│     ├─ layout/                 AppShell, Sidebar, ThemeToggle
│     ├─ auth/                   AuthShell, Unauthorized page
│     ├─ clients/                ClientFormModal
│     ├─ projects/               ProjectFormModal, StatusBadge, PriorityBadge
│     ├─ activity/               ActivityTimeline
│     ├─ views/                  Dashboard, Clients, ClientDetail, Projects, ProjectDetail
│     └─ ui/                     shadcn/ui primitives
├─ drizzle/                      Generated migrations
├─ ARCHITECTURE.md               Detailed system architecture
└─ README.md                     This file
```

For the full design — schema, API contract, auth flow, request lifecycles,
file map — see **[ARCHITECTURE.md](./ARCHITECTURE.md)**.

---

## Getting started

### Prerequisites

- [Bun](https://bun.sh)
- A PostgreSQL database

### 1. Install dependencies

```bash
bun install
```

### 2. Configure environment variables

Create a `.env` file in the project root:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/client_project_hub

# better-auth
BETTER_AUTH_SECRET=your-long-random-secret-here
BETTER_AUTH_URL=http://localhost:3000
```

> Generate a secret with `openssl rand -base64 32` or `bun -e "console.log(crypto.randomUUID())"`.

### 3. Set up the database

```bash
# Generate migrations from the Drizzle schema
bun run db:generate

# Apply them to your Postgres instance
bun run db:migrate

# (or, for prototyping: push schema directly without migrations)
bun run db:push
```

better-auth will create its own tables (`user`, `session`, `account`,
`verification`) on first run. The custom `role` field on `user` is
declared in `src/lib/auth.ts`.

### 4. Promote at least one user to admin

Sign up via the UI at `/signup`, then in your database:

```sql
UPDATE "user" SET role = 'admin' WHERE email = 'you@example.com';
```

(You can also seed an admin user directly in SQL before starting.)

### 5. Run the dev server

```bash
bun run dev
```

Open `http://localhost:3000`. You'll be redirected to `/signin`.

---

## Available scripts

| Script              | Purpose                                          |
| ------------------- | ------------------------------------------------ |
| `bun run dev`       | Start the dev server (port 3000)                 |
| `bun run build`     | Production build                                 |
| `bun run start`     | Run the production server                        |
| `bun run lint`      | ESLint                                           |
| `bun run db:generate` | Generate SQL migrations from Drizzle schema    |
| `bun run db:migrate`  | Apply migrations to the database               |
| `bun run db:push`     | Push schema directly (no migration files)      |
| `bun run db:reset`    | Drop and recreate the database (dev only)      |

---

## API reference

All endpoints require a valid session cookie (except `/api/auth/*` and the
signin/signup pages). Request/response shapes are validated with Zod.

### Auth (better-auth)

| Method | Route                       | Purpose                                  |
| ------ | --------------------------- | ---------------------------------------- |
| POST   | `/api/auth/sign-up/email`   | Create account + set session cookie      |
| POST   | `/api/auth/sign-in/email`   | Verify credentials + set session cookie  |
| POST   | `/api/auth/sign-out`        | Clear session                            |
| GET    | `/api/auth/get-session`     | Get current session + user               |

### Clients

| Method | Route                  | Body / Query                         | Returns                  |
| ------ | ---------------------- | ------------------------------------ | ------------------------ |
| POST   | `/api/clients`         | `{ name, email, company?, ... }`     | 201 `{ clientId }`       |
| GET    | `/api/clients`         | `?query=` (name/email/company)       | 200 `Client[]`           |
| GET    | `/api/clients/[id]`    | —                                    | 200 `Client`             |
| PATCH  | `/api/clients/[id]`    | partial client fields                | 200 `Client`             |
| DELETE | `/api/clients/[id]`    | —                                    | 204 (soft delete)        |

### Projects

| Method | Route                                | Body / Query                         | Returns                       |
| ------ | ------------------------------------ | ------------------------------------ | ----------------------------- |
| POST   | `/api/projects`                      | `{ clientId, title, startDate, ... }` | 201 `Project` + logs CREATED |
| GET    | `/api/projects`                      | `?clientId=&query=`                  | 200 `Project[]` (sorted)      |
| GET    | `/api/projects/[id]`                 | —                                    | 200 `Project`                 |
| PUT    | `/api/projects/[id]`                 | partial project fields               | 200 `{ ok }` + logs UPDATED   |
| DELETE | `/api/projects/[id]`                 | —                                    | 204 (soft delete) + logs DELETED |
| GET    | `/api/projects/[id]/activity`        | —                                    | 200 `{ logs: ActivityLog[] }` |

### Error responses

```json
{ "message": "Something went wrong" }
// or
{ "message": "Validation failed", "details": "..." }
```

| Status | Meaning                              |
| ------ | ------------------------------------ |
| 400    | Validation failed or invalid id      |
| 401    | Not authenticated                    |
| 404    | Resource not found                   |
| 500    | Unexpected error                     |

---

## Auth & role flow

```
Browser visits /
    │
    ▼
proxy.ts (middleware)
    │
    ├─ No session cookie?  ──▶ redirect to /signin
    │
    └─ Has session cookie? ──▶ let request through
                                       │
                                       ▼
                            page.tsx (Server Component)
                                       │
                            getUser() from better-auth
                                       │
                                       ├─ No session?       ──▶ render null (proxy should have caught this)
                                       │
                                       ├─ role !== "admin"? ──▶ render <Unauthorized />
                                       │
                                       └─ role === "admin"  ──▶ render <ProtectedApp />
                                                                   │
                                                                   ▼
                                                            Dashboard with
                                                            sidebar, topbar,
                                                            user info, sign-out
```

New signups default to `user` role and immediately hit the Unauthorized
page. Promote them to `admin` via direct DB access (or a future admin UI).

---

## Soft delete

We never physically delete rows. Instead we set `deleted_at`:

```ts
await db
  .update(client)
  .set({ deletedAt: new Date() })
  .where(and(eq(client.id, clientId), isNull(client.deletedAt)));
```

Implications:

- **List queries must filter** `deleted_at IS NULL`.
- **Foreign-key constraints don't fire** on soft delete — a client with
  projects can still be archived (block in the route handler if you want
  to prevent this).
- **Activity log integrity is preserved** — `PROJECT_DELETED` entries
  still point to a real (archived) project row.
- **Restoration is trivial** — set `deleted_at = NULL`.

---

## Notes on the sandbox preview

This repo includes a few files that exist **only** so the preview works
without a real Postgres + better-auth backend. **Delete them when you
integrate into your real project** — you already have the real versions:

| Sandbox file                              | Real replacement                                   |
| ----------------------------------------- | -------------------------------------------------- |
| `src/lib/mock-auth-store.ts`              | (delete — better-auth uses your DB)                |
| `src/lib/auth.ts` (mock)                  | Your real `auth.ts` with `betterAuth({...})`       |
| `src/lib/auth-helpers.ts` (mock)          | Your real `auth-helpers.ts` (same `getUser()`)     |
| `src/app/api/auth/[...all]/route.ts` (mock) | `toNextJsHandler(auth)` (one line)               |
| `src/lib/mock-db.ts`                      | (delete — Drizzle hits your DB)                    |
| `src/app/api/clients/**`, `src/app/api/projects/**` (mock) | Your real Drizzle route handlers |

In `src/proxy.ts`, also replace the clearly marked `SANDBOX AUTO-LOGIN`
block with:

```ts
const url = new URL("/signin", request.url);
url.searchParams.set("callbackUrl", pathname);
return NextResponse.redirect(url);
```

---

## Contributing

1. Lint before committing: `bun run lint`.
2. Schema changes go through Drizzle migrations (`db:generate` + `db:migrate`).
3. Keep route handlers thin — push business logic into reusable functions
   when a handler grows beyond ~80 lines.
4. Every project write should be wrapped in a transaction that also writes
   to `activity_logs`.

---

## License

Private / internal — not currently licensed for redistribution.