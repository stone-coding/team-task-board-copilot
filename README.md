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
| Kanban board with mock data (#6) | Implemented on feature branch; PR pending: [`feature/6-kanban-board`](https://github.com/stone-coding/team-task-board-copilot/tree/feature/6-kanban-board) |
| Database: Prisma 7 + PostgreSQL (#1) | Planned |
| CI pipeline (#2), Vercel deployment (#3) | Planned |
| Auth (#4), projects API and list page (#5) | Planned |

There is no live deployment yet; Vercel preview and production URLs arrive with #3.

## Prerequisites

| Tool | Version | Check |
|---|---|---|
| Node.js | **22.12 or later** (Vitest 5 and Prisma 7 refuse older versions) | `node -v` |
| npm | 10 or later (ships with Node) | `npm -v` |
| Git | any recent version | `git --version` |

No database, accounts, or environment variables are needed yet. Docker (for local PostgreSQL) and `.env` setup will be added here by #1.

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

**3. Install the Playwright browser** (once, only needed for end-to-end tests).

```bash
npx playwright install chromium
```

**4. Start the development server.**

```bash
npm run dev
```

**5. Open the app** at http://localhost:3000. The demo board at **http://localhost:3000/projects/demo** works on the `feature/6-kanban-board` branch, **not yet on `main`** (it reaches `main` when #6 is merged). To try it now, run `git switch feature/6-kanban-board` before `npm run dev`:
- Change a card's **Status** dropdown: the card moves to that column and the counts update.
- An empty column shows **"No tasks yet"** (Done starts empty).
- Below 768px the columns stack vertically.
- An unknown project, such as `/projects/other`, shows the not-found page.

Stop the server with `Ctrl+C`.

## Checks

```bash
npm run lint        # ESLint
npm run typecheck   # Next.js route types + TypeScript
npm test            # Vitest unit and component tests
npm run build       # production build
npm run test:e2e    # Playwright end-to-end tests (builds and starts the app on port 3000)
```

**Definition of done** (see `AGENTS.md`), all in one go:

```bash
npm run lint && npm run typecheck && npm test && npm run build && npm run test:e2e
```

To run the production build locally: `npm run build && npm run start`.

## Project structure

```
src/app/                    Routes: pages, layouts, and (later) API route handlers
src/components/<feature>/   UI components, with tests next to them
src/lib/                    Shared types, mock data, pure logic
tests/unit/                 Cross-module unit tests
e2e/                        Playwright specs
docs/                       PRD and mockups; later API docs, architecture, sprint notes
AGENTS.md, DESIGN.md        Shared rules and visual spec
```

`AGENTS.md` §3 lists the planned additions (`src/server/`, `prisma/`, `tests/integration/`, `.github/`).

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
| `/projects/demo` returns "not found" | The board is on `feature/6-kanban-board`, not yet on `main`: run `git switch feature/6-kanban-board` |

## HW3

Individual HW3 materials (rules experiment, report, and evidence) are on the [`hw3-haomiao`](https://github.com/stone-coding/team-task-board-copilot/tree/hw3-haomiao) branch and are not part of the P2 codebase.
