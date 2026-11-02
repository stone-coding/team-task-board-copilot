# Architecture

Requirements and the data model are in [prd.md](prd.md) §6–§7; the rules are in [AGENTS.md](../AGENTS.md). Update this file with any schema or layer change.

## Layers

```mermaid
flowchart TD
  Browser["Browser / API client"] --> Proxy["Proxy (src/proxy.ts): session check"]
  Proxy -->|"no session: page"| Login["Redirect to /login?next=…"]
  Proxy -->|"no session: /api/*"| E401["401 UNAUTHENTICATED"]
  Proxy --> UI["React components (src/components)"]
  UI -->|"fetch /api/v1/*"| API["Route handlers (src/app/api/v1)"]
  API -->|"re-verify JWT"| Auth["Auth (src/server/auth): jose, bcryptjs"]
  API --> Services["Services (src/server/services)"]
  Services --> DB["Prisma client (src/server/db.ts)"]
  DB -->|"@prisma/adapter-pg"| PG[("PostgreSQL")]
```

`src/server/db.ts` builds one `PrismaClient` with the `PrismaPg` driver adapter from `DATABASE_URL`, cached on `globalThis` outside production so Next.js hot reload does not open new connection pools.

## Authentication

Login issues an HS256 JWT (`src/server/auth/token.ts`) in an httpOnly, Secure, SameSite=Lax `session` cookie and returns it in the body for `Authorization: Bearer` clients. `src/proxy.ts` gates every route except `/login`, `/register`, the register/login/logout endpoints, and `/api/v1/health`; route handlers verify the token again before touching data. Details and trade-offs: [decisions/001-jwt-cookie-auth.md](decisions/001-jwt-cookie-auth.md).

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
