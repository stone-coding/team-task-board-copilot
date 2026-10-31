# Architecture

Requirements and the data model are in [prd.md](prd.md) §6–§7; the rules are in [AGENTS.md](../AGENTS.md). Update this file with any schema or layer change.

## Layers

```mermaid
flowchart TD
  UI["React components (src/components)"] -->|"fetch /api/v1/*"| API["Route handlers (src/app/api/v1)"]
  API --> Services["Services (src/server/services)"]
  Services --> DB["Prisma client (src/server/db.ts)"]
  DB -->|"@prisma/adapter-pg"| PG[("PostgreSQL")]
```

`src/server/db.ts` builds one `PrismaClient` with the `PrismaPg` driver adapter from `DATABASE_URL`, cached on `globalThis` outside production so Next.js hot reload does not open new connection pools.

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
