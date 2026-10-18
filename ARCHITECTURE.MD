## System Architecture
This document explains how the Client & Project Hub is structured end-to-end:
database schema, API layer, authentication, and the frontend that ties it all
together. Use it as a map when you need to locate where a particular concern
lives (e.g. "where do I add a new field to a client?" → schema + validators +
types + form).

## 1. High-level overview
```text

┌──────────────────────────────────────────────────────────────────────┐
│                          Browser (Client)                            │
│                                                                      │
│  React 19 + Next.js 16 App Router                                    │
│  ┌───────────────────┐  ┌───────────────────┐  ┌─────────────────┐   │
│  │ Server Components │  │ Client Components │  │  TanStack Query │   │
│  │  (auth + role     │  │  (UI, forms,      │  │   (server state │   │
│  │   gate at /)      │  │   modals, views)  │  │   + caching)    │   │
│  └───────────────────┘  └────────┬──────────┘  └────────┬────────┘   │
│                                  │                      │            │
│                                  │   zustand store      │            │
│                                  │   (view + filters)   │            │
│                                  └─────────┬────────────┘            │
│                                            │                         │
│                                  ┌─────────▼───────────┐             │
│                                  │  axios (src/lib/    │             │
│                                  │  api.ts) — cookies  │             │
│                                  └─────────┬───────────┘             │
└────────────────────────────────────────────┼─────────────────────────┘
                                             │ same-origin /api/*
                                             ▼
┌──────────────────────────────────────────────────────────────────────┐
│                        Next.js Server (Node)                         │
│                                                                      │
│  ┌─────────────────┐    ┌──────────────────────────────────────┐     │
│  │  proxy.ts       │───▶│  Route Handlers (src/app/api/**)     │     │
│  │  (middleware)   │    │                                      │     │
│  │  - session      │    │  /api/auth/[...all]   better-auth    │     │
│  │    cookie gate  │    │  /api/clients          CRUD + search │     │
│  │  - redirect to  │    │  /api/clients/[id]     CRUD          │     │
│  │    /signin      │    │  /api/projects         CRUD + filter │     │
│  └─────────────────┘    │  /api/projects/[id]    CRUD          │     │
│                         │  /api/projects/[id]/activity         │     │
│                         └─────────────┬────────────────────────┘     │
│                                       │                              │
│              ┌────────────────────────┼──────────────────────┐       │
│              │                        │                      │       │
│        ┌─────▼─────┐          ┌───────▼────────┐     ┌───────▼────┐  │
│        │ better-   │          │ Drizzle ORM    │     │  Zod       │  │
│        │ auth      │          │ (db + schema)  │     │  validators│  │
│        │ (sessions │          └───────┬────────┘     └────────────┘  │
│        │  + users) │                  │                              │
│        └─────┬─────┘                  │                              │
└──────────────┼────────────────────────┼──────────────────────────────┘
               │                        │
               ▼                        ▼
        ┌──────────────────────────────────────┐
        │           PostgreSQL                 │
        │  ──────────────────────────────      │
        │  user             (better-auth)      │
        │  session          (better-auth)      │
        │  account          (better-auth)      │
        │  verification     (better-auth)      │
        │  clients          (app)              │
        │  project          (app)              │
        │  activity_logs    (app)              │
        └──────────────────────────────────────┘
```
The same Next.js process serves both the React UI and the JSON API. The
browser only talks to its own origin (/api/...), and the session is
carried by an httpOnly cookie set by better-auth.

---

## 2. Tech stack & responsibilities

| Layer            | Tool                                | Role                                                                |
| ---------------- | ----------------------------------- | ------------------------------------------------------------------- |
| Framework        | Next.js 16 (App Router)             | Server components, route handlers, middleware (`proxy.ts`)          |
| Language         | TypeScript 5                        | End-to-end typing                                                   |
| Auth             | better-auth                         | Email/password auth, sessions, custom `role` field                  |
| ORM              | Drizzle ORM                         | Schema, queries, migrations                                         |
| Database         | PostgreSQL                          | Source of truth                                                     |
| Validation       | Zod (+ drizzle-zod)                 | Request body validation, infer types                                |
| HTTP client      | axios                               | Browser → API calls, cookie auth                                    |
| Server state     | TanStack Query v5                   | Caching, refetching, mutations for clients/projects/activity        |
| Client state     | Zustand                             | Current view + persisted search filters                             |
| Forms            | react-hook-form                     | Client + project create/edit forms                                  |
| UI components    | shadcn/ui (New York)                | Buttons, dialogs, tables, etc.                                      |
| Styling          | Tailwind CSS 4 + tw-animate-css     | Utility-first styling + animations                                  |
| Icons            | lucide-react                        | Icon set                                                            |
| Toasts           | sonner                              | Toast notifications                                                 |
| Theme            | next-themes                         | Light/dark mode                                                     |

---

## 3. Database schema

Three app tables plus the four better-auth-managed tables. All app tables
use UUID primary keys and `timestamp with time zone` for created/updated.

### `clients` (app)

| Column      | Type           | Notes                                  |
| ----------- | -------------- | -------------------------------------- |
| id          | uuid (pk)      | `defaultRandom()`                      |
| name        | varchar(150)   | not null                               |
| company     | varchar(200)   | nullable                               |
| email       | varchar(255)   | not null                               |
| phone       | varchar(30)    | nullable                               |
| address     | text           | nullable                               |
| notes       | text           | nullable                               |
| created_at  | timestamptz    | not null, default now()                |
| updated_at  | timestamptz    | not null, default now()                |
| deleted_at  | timestamptz    | nullable — **soft delete marker**      |

### `project` (app)

| Column       | Type                  | Notes                                              |
| ------------ | --------------------- | -------------------------------------------------- |
| id           | uuid (pk)             | `defaultRandom()`                                  |
| client_id    | uuid (fk → clients)   | not null, `onDelete: "restrict"`                   |
| title        | varchar(200)          | not null                                           |
| description  | text                  | nullable                                           |
| status       | enum                  | `PLANNING \| IN_PROGRESS \| REVIEW \| COMPLETED`   |
| priority     | enum                  | `LOW \| MEDIUM \| HIGH`                            |
| start_date   | date                  | not null                                           |
| due_date     | date                  | not null                                           |
| created_at   | timestamptz           | not null                                           |
| updated_at   | timestamptz           | not null                                           |
| deleted_at   | timestamptz           | nullable — **soft delete marker**                  |

### `activity_logs` (app)

Append-only audit trail of project changes.

| Column      | Type                  | Notes                                                              |
| ----------- | --------------------- | ------------------------------------------------------------------ |
| id          | uuid (pk)             | `defaultRandom()`                                                  |
| actor_id    | text (fk → user.id)   | not null, `onDelete: "restrict"`                                   |
| client_id   | uuid (fk → clients)   | not null, `onDelete: "restrict"` (denormalized for query speed)    |
| project_id  | uuid (fk → project)   | not null, `onDelete: "restrict"`                                   |
| action      | enum                  | `PROJECT_CREATED \| PROJECT_UPDATED \| PROJECT_DELETED`            |
| changes     | jsonb                 | `Record<field, { from, to }>` — only set on UPDATE                 |
| created_at  | timestamptz           | not null                                                           |

Indexes (defined via Drizzle's table callback):

- `activity_logs_project_created_idx` — `(project_id, created_at DESC)`
- `activity_logs_client_created_idx` — `(client_id, created_at DESC)`
- `activity_logs_created_at_idx` — `(created_at DESC)`

### better-auth tables (managed)

`user`, `session`, `account`, `verification`. The `user` table has an
additional `role` column (`admin | employee | user`, default `user`,
`input: false` so it can't be set via the signup form).

---

## 4. Soft delete pattern

We do **not** physically delete rows. Instead we set `deleted_at` to the
current timestamp:

```ts
// Example: soft-deleting a client
const deleted = await db
  .update(client)
  .set({ deletedAt: new Date() })
  .where(and(eq(client.id, clientId), isNull(client.deletedAt)))
  .returning({ id: client.id });
```

Implications:

- **List queries must filter out soft-deleted rows** — every `SELECT` on
  `clients` / `project` should add `isNull(deletedAt)` to the WHERE clause.
- **Foreign-key constraints do NOT fire** on soft delete (because the row
  still exists), so a client with projects can still be "deleted". The
  application may want to block this in the route handler if desired.
- **Activity log integrity is preserved** — `PROJECT_DELETED` entries still
  point to a real (soft-deleted) project row.
- **Restoration is trivial** — set `deleted_at = NULL`.

---

## 5. Activity logging pattern

Every project write happens inside a transaction and writes a corresponding
row to `activity_logs`:

| Operation                | Action logged         | `changes` field                                |
| ------------------------ | --------------------- | ---------------------------------------------- |
| `POST /api/projects`     | `PROJECT_CREATED`     | `null` / not set                               |
| `PUT /api/projects/[id]` | `PROJECT_UPDATED`     | `Record<field, { from, to }>` — only changed fields |
| `DELETE /api/projects/[id]` | `PROJECT_DELETED`  | `null` / not set                               |

The UPDATE handler computes field-level diffs:

```ts
// pseudocode — see src/app/api/projects/[id]/route.ts
const oldRow = await db.select().from(project).where(eq(project.id, id));
const changedEntries = Object.entries(payload).filter(
  ([k, v]) => normalized(oldRow[k]) !== normalized(v)
);
const changes = Object.fromEntries(
  Object.entries(changedEntries).map(([k, v]) => [
    k,
    { from: oldRow[k], to: v }
  ])
);
await db.transaction(async (tx) => {
  await tx.update(project).set(changedEntries).where(eq(project.id, id));
  await tx.insert(projectActivityLog).values({
    actorId: actor.id,
    clientId: oldRow.clientId,
    projectId: id,
    action: "PROJECT_UPDATED",
    changes,
  });
});
```

The `GET /api/projects/[id]/activity` endpoint joins `activity_logs` with
`user` to return `actorName`, and reshapes `changes` into an array of
`{ name, from, to }` for easy rendering on the frontend.

---

## 6. Authentication & authorization

### better-auth config (`src/lib/auth.ts`)

```ts
export const auth = betterAuth({
  user: {
    additionalFields: {
      role: {
        type: ["admin", "employee", "user"],
        required: false,
        defaultValue: "user",
        input: false,            // cannot be set via signup form
      },
    },
  },
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
});
```

### Server-side helper (`src/lib/auth-helpers.ts`)

```ts
export async function getUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("User does unauthorized");
  return session.user;
}
```

Every route handler that needs auth calls `getUser()` at the top. The
`session.user` object includes the `role` field.

### Edge middleware (`src/proxy.ts` — Next.js 16 renamed `middleware.ts`)

Runs before every matched request. Public routes: `/signin`, `/signup`,
`/api/auth/*`. Everything else requires a session cookie:

```ts
const sessionCookie = getSessionCookie(request);
if (!sessionCookie) {
  return NextResponse.redirect(new URL("/signin", request.url));
}
```

The cookie is an opaque DB-backed token, so **the role cannot be read in
middleware**. Role enforcement happens in the server component
(`src/app/page.tsx`):

```ts
const user = await getUser();
if (user.role !== "admin") return <Unauthorized />;
return <ProtectedApp ... />;
```

### Role model

| Role     | Can access dashboard | Can call /api/clients, /api/projects |
| -------- | -------------------- | ------------------------------------ |
| admin    | yes                  | yes                                  |
| employee | no                   | configurable                         |
| user     | no                   | configurable                         |

New signups default to `user`. Promoting to `admin` requires direct DB
access.

---

## 7. API surface

| Method | Route                                | Purpose                                       | Returns                                  |
| ------ | ------------------------------------ | --------------------------------------------- | ---------------------------------------- |
| POST   | `/api/auth/[...all]`                 | better-auth (sign-up, sign-in, sign-out, ...) | varies                                   |
| GET    | `/api/auth/[...all]`                 | better-auth (get-session, etc.)               | varies                                   |
| POST   | `/api/clients`                       | Create a client                               | 201 `{ clientId }`                       |
| GET    | `/api/clients?query=`                | List clients (search name/email/company)      | 200 `Client[]`                           |
| GET    | `/api/clients/[id]`                  | Get one client                                | 200 `Client`                             |
| PATCH  | `/api/clients/[id]`                  | Partial update                                | 200 `Client`                             |
| DELETE | `/api/clients/[id]`                  | Soft delete                                   | 204                                      |
| POST   | `/api/projects`                      | Create + log `PROJECT_CREATED`                | 201 `Project`                            |
| GET    | `/api/projects?clientId=&query=`     | List (filter by client, search by title)      | 200 `Project[]` (sorted by priority, due) |
| GET    | `/api/projects/[id]`                 | Get one project                               | 200 `Project`                            |
| PUT    | `/api/projects/[id]`                 | Update + log `PROJECT_UPDATED` w/ diff        | 200 `{ ok }`                             |
| DELETE | `/api/projects/[id]`                 | Soft delete + log `PROJECT_DELETED`           | 204                                      |
| GET    | `/api/projects/[id]/activity`        | Activity log (max 100, newest first)          | 200 `{ logs: ActivityLog[] }`            |

### Validation

Request bodies are validated with Zod schemas generated by `drizzle-zod`:

- `insertClientSchema` — adds `.email()` validation on the email field
- `updateClientSchema` — all fields optional
- `insertProjectSchema` — straight from the table
- `updateProjectSchema` — all fields optional

### Error responses

| Status | Meaning                                    |
| ------ | ------------------------------------------ |
| 400    | Validation failed or invalid id            |
| 401    | Not authenticated (thrown by `getUser()`)  |
| 404    | Resource not found                         |
| 500    | Unexpected error                           |

---

## 8. Frontend architecture

### Routing model

Only `/` is a "real" Next.js route for the dashboard — but the user
perceives multiple "pages" via **client-side view-state routing** in a
Zustand store (`src/stores/app-store.ts`):

```ts
type View =
  | { name: "dashboard" }
  | { name: "clients" }
  | { name: "client-detail"; clientId: string }
  | { name: "projects" }
  | { name: "project-detail"; projectId: string };
```

`/signin` and `/signup` are real Next.js routes (separate pages).

> Why not use real Next.js routes for everything? The sandbox preview only
> exposes `/` — so the dashboard runs as a single page with internal view
> state. In a production deployment you could split each view into its own
> route without changing the component code.

### Server vs client component split

```
src/app/page.tsx                  ← Server Component
  └─ getUser() + role check
  └─ renders <Unauthorized />  OR  <ProtectedApp>

src/components/protected-app.tsx  ← Client Component ("use client")
  └─ holds <AppShell> + view switch
  └─ receives userName/userEmail/userRole from server as props

src/components/layout/app-shell.tsx ← layout (sidebar + topbar)
src/components/views/*.tsx        ← individual screens
```

### State management

| Concern                          | Tool              | File                                |
| -------------------------------- | ----------------- | ----------------------------------- |
| Server data (clients, projects)  | TanStack Query    | `src/hooks/use-clients.ts`, `use-projects.ts`, `use-activity.ts` |
| Current view + persisted filters | Zustand           | `src/stores/app-store.ts`           |
| Form state                       | react-hook-form   | `src/components/clients/client-form-modal.tsx`, `src/components/projects/project-form-modal.tsx` |
| Theme                            | next-themes       | `src/components/providers.tsx`      |

### Data fetching flow

```
Component renders
  └─ useClients(search)  ← TanStack Query hook
        └─ axios.get("/api/clients", { params: { query: search } })
              └─ Next.js route handler
                    └─ db.select().from(client).where(...)
                          └─ PostgreSQL
```

Mutations invalidate the relevant query keys so lists/details refetch
automatically. Example from `use-clients.ts`:

```ts
export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input) => api.post<{ clientId: string }>("/clients", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: clientKeys.all }),
  });
}
```

### Form validation

react-hook-form handles client-side UX (required fields, email pattern,
password length). The server re-validates with Zod via
`insertClientSchema.safeParseAsync(body)` — never trust the client.

---

## 9. Request lifecycle example: editing a project

1. User clicks "Edit" on a project row.
2. `ProjectFormModal` opens with the project's current values.
3. User changes status from `IN_PROGRESS` → `REVIEW` and clicks "Save".
4. `useUpdateProject().mutateAsync({ id, input: { status: "REVIEW" } })` fires.
5. axios sends `PUT /api/projects/{id}` with `{ status: "REVIEW" }`.
6. Route handler:
   - `getUser()` → throws if not signed in.
   - `updateProjectSchema.safeParseAsync(body)` → validates.
   - Loads `oldProjectData`.
   - Computes `changedEntries = { status: "REVIEW" }` (only the changed field).
   - In a transaction:
     - `UPDATE project SET status='REVIEW' WHERE id=...`
     - `INSERT INTO activity_logs (action='PROJECT_UPDATED', changes={status:{from:'IN_PROGRESS',to:'REVIEW'}}, ...)`
   - Returns `{ ok: true }`.
7. TanStack Query invalidates `projectKeys.detail(id)`, `projectKeys.all`,
   and `["projects", id, "activity"]`.
8. UI refetches → badge updates to "Review", new activity entry appears at
   top of the timeline.
9. sonner toast says "Project updated".

---

## 10. File map (where things live)

```
src/
├─ app/
│  ├─ layout.tsx                  Root layout (fonts, providers)
│  ├─ page.tsx                    Dashboard entry — server component, auth+role check
│  ├─ globals.css                 Tailwind + theme tokens
│  ├─ signin/page.tsx             Sign-in form
│  ├─ signup/page.tsx             Sign-up form
│  └─ api/
│     ├─ auth/[...all]/route.ts   better-auth handlers
│     ├─ clients/route.ts         POST + GET (list/search)
│     ├─ clients/[id]/route.ts    GET + PATCH + DELETE
│     ├─ projects/route.ts        POST + GET (list/filter)
│     ├─ projects/[id]/route.ts   GET + PUT + DELETE
│     └─ projects/[id]/activity/route.ts   GET activity log
├─ proxy.ts                       Next.js 16 middleware (session gate)
├─ lib/
│  ├─ auth.ts                     better-auth config
│  ├─ auth-helpers.ts             getUser()
│  ├─ auth-client.ts              better-auth React client
│  ├─ db.ts                       Drizzle client
│  ├─ api.ts                      axios instance + error normalization
│  ├─ types.ts                    TS types matching schema
│  └─ utils.ts                    date helpers, status/priority metadata
├─ db/
│  ├─ schema/                     Drizzle table definitions
│  └─ validators.ts               drizzle-zod schemas
├─ hooks/
│  ├─ use-clients.ts              TanStack Query hooks for clients
│  ├─ use-projects.ts             TanStack Query hooks for projects
│  └─ use-activity.ts             TanStack Query hook for activity log
├─ stores/
│  └─ app-store.ts                Zustand store (view + filters)
└─ components/
   ├─ providers.tsx               QueryClient + Theme + Toaster
   ├─ protected-app.tsx           Client wrapper for dashboard
   ├─ layout/
   │  ├─ app-shell.tsx            Sidebar + topbar + main
   │  ├─ sidebar.tsx              Nav + user card + sign out
   │  └─ theme-toggle.tsx
   ├─ auth/
   │  ├─ auth-shell.tsx           Centered card layout for signin/signup
   │  └─ unauthorized.tsx         "Access restricted" page
   ├─ clients/
   │  └─ client-form-modal.tsx    Create/edit client
   ├─ projects/
   │  ├─ project-form-modal.tsx   Create/edit project
   │  ├─ status-badge.tsx
   │  └─ priority-badge.tsx
   ├─ activity/
   │  └─ activity-timeline.tsx    Timeline with field-level changes
   ├─ views/
   │  ├─ dashboard-view.tsx
   │  ├─ clients-view.tsx
   │  ├─ client-detail-view.tsx
   │  ├─ projects-view.tsx
   │  └─ project-detail-view.tsx
   └─ ui/                         shadcn/ui primitives
```

---

## 11. Cross-cutting concerns

### Error handling

- **Route handlers** catch all errors and return a consistent shape:
  `{ message: string, details?: unknown }` with an appropriate status code.
- **Client side** — `toApiError(err)` in `src/lib/api.ts` normalizes axios
  errors into `{ message, status, details }`. Mutations show toasts on
  failure.

### Caching strategy

- TanStack Query default `staleTime: 30s`, `retry: 1`,
  `refetchOnWindowFocus: false`.
- List queries use `keepPreviousData` so search-as-you-type doesn't flash
  empty states.
- Mutations invalidate by query key prefix — e.g. creating a project
  invalidates all `["projects", ...]` queries.

### Theming

CSS variables defined in `globals.css` for both `:root` (light) and
`.dark` (dark). `next-themes` toggles the `class` attribute on `<html>`.
shadcn/ui components consume the variables via Tailwind classes like
`bg-background`, `text-foreground`.

### Responsive design

- Mobile-first Tailwind breakpoints.
- Sidebar collapses to a drawer on `< md` screens.
- Tables hide non-essential columns at small breakpoints
  (e.g. `hidden md:table-cell`).

---

## 12. Adding a new feature: checklist

Suppose you want to add a "tags" field to projects. Touch:

1. **Schema** — `src/db/schema/project.ts`: add `tags: text("tags").array()`.
2. **Migration** — run `bun run db:generate` + `bun run db:migrate` (or `db:push`).
3. **Validators** — drizzle-zod auto-includes new columns; add custom rules
   in `src/db/validators.ts` if needed.
4. **Types** — `src/lib/types.ts`: add `tags: string[]` to `Project`,
   `ProjectInput`, `ProjectUpdate`.
5. **Route handlers** — `src/app/api/projects/route.ts` (POST) and
   `src/app/api/projects/[id]/route.ts` (PUT) automatically pass through
   new fields from the validated payload. Add to the diff computation in PUT
   if you want it logged in `changes`.
6. **Frontend hook** — no change needed (uses generic types).
7. **Form** — add a tag input to `src/components/projects/project-form-modal.tsx`.
8. **Display** — add tag badges to `projects-view.tsx` and
   `project-detail-view.tsx`.
9. **Filters** (optional) — extend the Zustand store + add a Select in
   `projects-view.tsx` to filter by tag.

---

This architecture favors **small, explicit modules** over clever
abstractions. Each layer (DB → schema → validator → route → hook →
component) is independently testable and follows the same naming
convention so you can navigate by grep.
