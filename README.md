# Team Task Board

A minimal Kanban task board for CS6983 Project 2 (pair project: Haomiao Shi and Tyler Sarna). Users group work into projects and move tasks through **To Do → In Progress → Done**.

| Resource | Link |
|---|---|
| Product requirements | [docs/prd.md](docs/prd.md) |
| Visual spec and mockups | [DESIGN.md](DESIGN.md) · [docs/mockups/](docs/mockups/) |
| Shared rules for humans and AI | [AGENTS.md](AGENTS.md) |
| Scrum board | [GitHub Project](https://github.com/users/stone-coding/projects/3/views/2) · [Milestones](https://github.com/stone-coding/team-task-board-copilot/milestones) · [Issues](https://github.com/stone-coding/team-task-board-copilot/issues) |

Development uses Visual Studio Code with GitHub Copilot Chat, guided by `AGENTS.md`.

## Status (Sprint 1: Oct 26 – Nov 2, 2026)

| Area | State |
|---|---|
| Database: Prisma 7 + PostgreSQL (#1) | Merged into `main` |
| Kanban board with mock data (#6) | Merged into `main` |
| Registration and login with JWT (#4) | Merged into `main` |
| Projects API and list page (#5) | Merged into `main` |
| Tasks API (#7) | Merged into `main` |
| Board connected to the tasks API, optimistic status changes (#8) | In review |
| Task create, edit, and delete on the board (#9) | In review |
| CI pipeline (#2) | GitHub Actions on every PR to `main`; required to merge |
| Vercel deployment (#3) | Production on Vercel with Neon Postgres; a preview deployment per PR |

**Live app:** https://team-task-board-copilot-stonehaomiaoshi-8972.vercel.app (register, then log in). Health check: [team-task-board-copilot-stonehaomiaoshi-8972.vercel.app/api/v1/health](https://team-task-board-copilot-stonehaomiaoshi-8972.vercel.app/api/v1/health).

## Prerequisites

| Tool | Version | Check |
|---|---|---|
| Node.js | **22.12 or later** (Vitest 5 and Prisma 7 refuse older versions) | `node -v` |
| npm | 10 or later (ships with Node) | `npm -v` |
| Git | any recent version | `git --version` |
| Docker | Docker Desktop or Engine with Compose v2 (local PostgreSQL) | `docker compose version` |

## Local setup

**1. Clone the repository.**

```bash
git clone https://github.com/stone-coding/team-task-board-copilot.git
cd team-task-board-copilot
```

**2. Install dependencies.** `npm ci` installs the exact versions in `package-lock.json`.

```bash
npm ci
```

**3. Start PostgreSQL and apply migrations.** `docker-compose.yml` runs Postgres 17 on port 5432 with a `team_task_board` database and a separate `team_task_board_test` database for integration tests.

```bash
cp .env.example .env
docker compose up -d --wait
npx prisma migrate dev
npm run db:test:migrate
npx prisma generate
```

`migrate dev` applies `prisma/migrations/` to the development database. `npm run db:test:migrate` applies the same migrations to the test database (`TEST_DATABASE_URL`); without it the integration tests fail with "The table `public.User` does not exist". Then run `npx prisma generate` to generate the client into `src/generated/prisma/` (gitignored); Prisma 7 does not do this during `migrate dev`. After any schema change, run `npx prisma generate` and `npm run db:test:migrate` again. Stop the database with `docker compose down` (add `-v` to delete its data).

**4. Install the Playwright browser** (once, only needed for end-to-end tests).

```bash
npx playwright install chromium
```

**5. Start the development server.**

```bash
npm run dev
```

**6. Create an account and log in.** Every page except `/login` and `/register` requires a session; signed-out visitors are redirected to `/login`.
- Open http://localhost:3000/register, enter your name, an email, and a password of at least 8 characters, and submit.
- You land on `/login`; log in with the same email and password.

**7. Open a board:** create a project at http://localhost:3000/projects and click its name. Tasks come from the tasks API (#7, #8):
- Change a card's **Status** dropdown: the card moves to that column at once, the counts update, and the change is saved. If saving fails, the card moves back and an error appears.
- Add a task with the form above the columns (title required, description optional); it appears in To Do.
- Each card has **Edit** (change title and description) and **Delete** (asks for confirmation first).
- An empty column shows **"No tasks yet"**.
- Below 768px the columns stack vertically.
- An unknown project, such as `/projects/other`, shows the not-found page.

Stop the server with `Ctrl+C`.

## Checks

```bash
npm run lint        # ESLint
npm run typecheck   # Next.js route types + TypeScript
npm test            # Vitest unit, component, and integration tests (needs Postgres running and step 3)
npm run build       # production build
npm run test:e2e    # Playwright end-to-end tests (builds and starts the app on port 3000)
```

**Definition of done** (see `AGENTS.md`), all in one go:

```bash
npm run lint && npm run typecheck && npm test && npm run build && npm run test:e2e
```

To run the production build locally: `npm run build && npm run start`.

**CI.** `.github/workflows/ci.yml` runs the same checks on every pull request to `main` and every push to it, in three jobs: lint + typecheck → unit and integration tests (Postgres service, `npm run db:test:migrate`) → build + Playwright E2E (Postgres service, `prisma migrate deploy`). Each job needs the previous one, and branch protection on `main` requires all three. A failed E2E run uploads the Playwright report as an artifact.

**Deployment.** Vercel builds every push: pull requests get a preview URL (posted on the PR, behind Vercel login), and `main` deploys to production. `vercel.json` runs `scripts/vercel-build.mjs`, which generates the Prisma client, applies migrations with `prisma migrate deploy` over Neon's direct connection (`DATABASE_URL_UNPOOLED`), then runs `next build`. Each preview deployment gets its own Neon database branch; production uses the main branch. `DATABASE_URL`/`DATABASE_URL_UNPOOLED` come from the Neon integration and `JWT_SECRET` is set per environment in Vercel (all Sensitive). After a deploy, check `/api/v1/health`.

## Project structure

```
src/app/                    Routes: pages, layouts, and (later) API route handlers
src/components/<feature>/   UI components, with tests next to them
src/lib/                    Shared types, mock data, pure logic
tests/unit/                 Cross-module unit tests
tests/integration/          API + database tests (use the test database)
scripts/                    Developer scripts (test-database migration)
e2e/                        Playwright specs
.github/workflows/          CI (GitHub Actions)
docs/                       PRD and mockups; later API docs, architecture, sprint notes
AGENTS.md, DESIGN.md        Shared rules and visual spec
```

`prisma/` holds the schema and migrations, and `src/server/db.ts` exports the shared Prisma client.

## Contributing

1. Pick an issue assigned to you on the Project board.
2. Branch from `main`: `feature/<issue>-<slug>`, `fix/…`, `chore/…`, or `docs/…`.
3. Commit the failing test first as `test(#N): …`, then `feat(#N): …`.
4. Run the definition of done, then open a PR titled `[#N] Summary` with `Closes #N`.
5. Your partner reviews every PR before it merges, using a merge commit.

The full rules are in [AGENTS.md](AGENTS.md).

## Troubleshooting

| Problem | Fix |
|---|---|
| `Port 3000 is in use` | Stop the other server, or run `npm run dev -- -p 3001` |
| `npm run test:e2e` tests an old app | Playwright reuses a server already on port 3000 locally; stop that server first |
| `npm run test:e2e` cannot find a browser | Run `npx playwright install chromium` |
| `npm test` crashes before running tests | Upgrade to Node 22.12 or later |
| `Cannot find module '@/generated/prisma/client'` | Run `npx prisma generate` |
| `docker compose up` fails: port 5432 is already allocated | Another Postgres is running; stop it, or map another host port and update `DATABASE_URL` in `.env` |
| `npm test`: "The table `public.User` does not exist" | The test database has no tables: run `npm run db:test:migrate` |
| `npm test`: "Can't reach database server" | Start Postgres with `docker compose up -d --wait` |
| A board (`/projects/<id>`) sends you to `/login` | You are signed out: register at `/register`, then log in (step 6) |

## HW3

Individual HW3 materials (rules experiment, report, and evidence) are on the [`hw3-haomiao`](https://github.com/stone-coding/team-task-board-copilot/tree/hw3-haomiao) branch and are not part of the P2 codebase.
