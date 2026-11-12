# Architecture

Requirements and the data model are in [prd.md](prd.md) §6–§7; the rules are in [AGENTS.md](../AGENTS.md). Update this file with any schema or layer change.

## Layers

```mermaid
flowchart TD
  Browser["Browser / API client"] --> Proxy["Proxy (src/proxy.ts): session check"]
  Proxy -->|"no session: page"| Login["Redirect to /login?next=…"]
  Proxy -->|"no session: /api/*"| E401["401 UNAUTHENTICATED"]
  Proxy -->|"public"| Docs["API docs (src/app/api/docs): Swagger UI + openapi.yaml"]
  Proxy --> UI["React components (src/components)"]
  UI -->|"client components: fetch /api/v1/*"| API["Route handlers (src/app/api/v1)"]
  UI -->|"server components: initial data"| Services
  API -->|"re-verify JWT"| Auth["Auth (src/server/auth): jose, bcryptjs"]
  API --> Services["Services (src/server/services)"]
  Services --> DB["Prisma client (src/server/db.ts)"]
  DB -->|"@prisma/adapter-pg"| PG[("PostgreSQL")]
```

Server components read their initial data by calling the same services directly, with the user id from `getCurrentUserId()` (`src/server/auth/current-user.ts`). Client components change data only through `/api/v1`: the projects page then calls `router.refresh()` to re-render, and the board updates its own state from the API response (see *Board state*). Each service function takes the owner's user id and filters every query on it, so another user's resource looks exactly like a missing one (404). Route handlers are wrapped in `withErrorHandling` (`src/server/http.ts`), which logs unexpected errors on the server and returns a generic `500 INTERNAL_ERROR`.

`src/server/db.ts` builds one `PrismaClient` with the `PrismaPg` driver adapter from `DATABASE_URL`, cached on `globalThis` outside production so Next.js hot reload does not open new connection pools.

## Authentication

Login issues an HS256 JWT (`src/server/auth/token.ts`) in an httpOnly, Secure, SameSite=Lax `session` cookie and returns it in the body for `Authorization: Bearer` clients. `src/proxy.ts` gates every route except `/login`, `/register`, the register/login/logout endpoints, `/api/v1/health`, and the API docs (`/api/docs`, `/api/docs/openapi.yaml`); route handlers verify the token again before touching data. Details and trade-offs: [decisions/001-jwt-cookie-auth.md](decisions/001-jwt-cookie-auth.md).

## Board state

`ProjectBoard` (server component) loads the project and its tasks through the services and passes them to `Board` (client component), which keeps them in `boardReducer` (`src/lib/board.ts`, pure and unit tested). Status changes are optimistic; creating, editing, and deleting wait for the API and then apply the saved task.

```mermaid
sequenceDiagram
  actor User
  participant Board as Board (boardReducer)
  participant API as PATCH /api/v1/tasks/:id
  User->>Board: choose a new status
  Board->>Board: statusChangeStarted: move the card, clear the error
  Board->>API: { status }
  alt 200 OK
    API-->>Board: { task }
    Board->>Board: statusChangeSucceeded: keep the saved task
  else error or network failure
    API-->>Board: { error: { code, message } }
    Board->>Board: statusChangeFailed: move the card back (unless a newer change moved it), show the error
  end
```

## CI/CD

```mermaid
flowchart LR
  PR["Pull request to main"] --> Audit["Dependency audit (npm audit, high+)"]
  PR --> Checks["Lint + typecheck"] --> Tests["Unit + integration (Postgres service)"] --> E2E["Build + Playwright E2E (Postgres service)"]
  PR --> CodeQL["CodeQL"]
  PR --> Preview["Vercel preview + Neon branch"]
  Merge["Merge to main"] --> Prod["Vercel production: prisma migrate deploy, next build"] --> Health["/api/v1/health"]
  Prod --> Neon[("Neon main branch")]
```

Branch protection requires the CI checks before merging. Dependabot opens weekly update PRs, which go through the same pipeline.

## Database schema

Source: `prisma/schema.prisma`; migrations in `prisma/migrations/`.

```mermaid
erDiagram
  User ||--o{ Project : owns
  Project ||--o{ Task : contains

  User {
    String id PK "cuid"
    String email UK
    String name
    String passwordHash
    DateTime createdAt
  }
  Project {
    String id PK "cuid"
    String name
    String ownerId FK "on delete cascade"
    DateTime createdAt
  }
  Task {
    String id PK "cuid"
    String projectId FK "on delete cascade"
    String title
    String description "nullable"
    TaskStatus status "TODO | IN_PROGRESS | DONE, default TODO"
    DateTime createdAt
    DateTime updatedAt
  }
```

`Task` has an index on `(projectId, status)` for loading a board's columns.
