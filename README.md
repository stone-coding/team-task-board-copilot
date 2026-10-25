# Team Task Board

A minimal Kanban task board for CS6983 Project 2. Users group work into projects and move tasks through **To Do → In Progress → Done**.

- Product requirements: [docs/prd.md](docs/prd.md)
- Board mockup: [docs/mockups/board.png](docs/mockups/board.png)
- Scrum board: [GitHub Project](https://github.com/users/stone-coding/projects/3/views/2)
- Development workflow: Visual Studio Code with GitHub Copilot Chat, guided by [AGENTS.md](AGENTS.md)
- HW3 submission (rules, before/after experiment, reflection): [docs/hw3/](docs/hw3/)

## Branches

| Branch | Contents |
|---|---|
| `hw3-haomiao` (default) | `AGENTS.md` v2, the HW3 report, evidence, and submission PDF. **No board UI yet** |
| `experiment-b-with-rules` | Working Kanban board built by GitHub Copilot Chat **with** `AGENTS.md` v1 (HW3 run B) |
| `experiment-a-no-rules` | Working Kanban board built by GitHub Copilot Chat **without** rules (HW3 run A) |
| `main` | Project scaffold, PRD, and mockup (the experiment baseline) |
| `hw3-eval` | Hidden acceptance tests and scoring script used for the HW3 experiment |

To run the board, check out one of the `experiment-*` branches (step 2 below).

## Prerequisites

| Tool | Version | Check |
|---|---|---|
| Node.js | 20.9 or later (developed on 22) | `node -v` |
| npm | 10 or later (comes with Node) | `npm -v` |
| Git | any recent version | `git --version` |

No database, accounts, or environment variables are needed yet. The board uses local mock data (`src/lib/mock-tasks.ts`).

## Local setup

**1. Clone the repository.**

```bash
git clone https://github.com/stone-coding/team-task-board-copilot.git
cd team-task-board-copilot
```

**2. Check out the branch with the board.**

```bash
git checkout experiment-b-with-rules    # or: experiment-a-no-rules
```

**3. Install the dependencies.** `npm ci` installs the exact versions in `package-lock.json`.

```bash
npm ci
```

**4. Install the Playwright browser.** This is only needed once, and only for end-to-end tests.

```bash
npx playwright install chromium
```

**5. Start the development server.**

```bash
npm run dev
```

**6. Open the board** at **http://localhost:3000/projects/demo**.
- **Change a status:** use any card's **Status** dropdown. The card moves to that column immediately and the counts update.
- **See the empty state:** a column with no tasks shows **"No tasks yet"**. Done starts empty.
- **Check responsiveness:** narrow the window below 768px and the columns stack vertically.
- **Try an unknown project:** for example, `/projects/other` shows the "not found" page.

Stop the server with `Ctrl+C`.

## Production build

```bash
npm run build
npm run start      # http://localhost:3000
```

## Checks

```bash
npm run lint        # ESLint
npm run typecheck   # Next.js route types + TypeScript
npm test            # Vitest unit and component tests
npm run test:e2e    # Playwright end-to-end tests (builds and starts the app on port 3000)
```

To run all of them in one go:

```bash
npm run lint && npm run typecheck && npm test && npm run build && npm run test:e2e
```

## Re-running the HW3 evaluation (optional)

The scoring script runs the hidden acceptance tests, lint, types, unit tests, and build against one experiment branch:

```bash
git checkout hw3-eval
git worktree add ../run-b experiment-b-with-rules
(cd ../run-b && npm ci)
hw3/eval/evaluate.sh ../run-b ../run-b-results    # writes metrics.json and metrics.md
```

## Project structure

```
src/app/                    Routes (pages and, later, API route handlers)
src/components/<feature>/   UI components (experiment branches)
src/lib/                    Shared types, mock data, pure logic
tests/unit/                 Vitest tests
e2e/                        Playwright tests
docs/                       PRD, mockups, HW3 report and evidence
AGENTS.md                   Project rules for the AI assistant (hw3-haomiao branch)
```

## Troubleshooting

| Problem | Fix |
|---|---|
| `Port 3000 is in use` | Stop the other server, or run `npm run dev -- -p 3001` |
| `npm run test:e2e` cannot find a browser | Run `npx playwright install chromium` |
| `/projects/demo` returns 404 | You are on `main` or `hw3-haomiao`; check out an `experiment-*` branch |
| `npm ci` fails on an old Node version | Upgrade to Node 20.9 or later |
