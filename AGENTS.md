# AGENTS.md — Team Task Board

<!-- Shared rules for AI assistants and humans. Maintainers: Haomiao Shi and Tyler Sarna · v4 (§12).
     Tool: Visual Studio Code + GitHub Copilot Chat (§11). Loads on every request: keep under ~200 lines and link to docs/.
     Change only through its own reviewed PR; revisit at every retro. When partners disagree, this file is the tiebreaker. -->

## 0. Quick reference
Requires **Node.js ≥ 22.12** (Vitest 5 and Prisma 7 refuse older versions).

```bash
npm run dev          # local dev server
npm run lint         # ESLint
npm run typecheck    # next typegen + tsc (generates PageProps/LayoutProps)
npm test             # Vitest, single run (unit, component, integration)
npm run build        # production build; catches the Suspense rule (§2)
npm run test:e2e     # Playwright (Chromium); webServer runs build + start. Output only in test-results/
npx prisma validate  # from #1; run `npx prisma generate` after any schema change
```

**Definition of done** (run all, report the real output):
`npm run lint && npm run typecheck && npm test && npm run build && npm run test:e2e`

-  **Always:** one fresh chat per issue; read the issue body first; work on the issue branch; plan before editing (R0); commit the failing test first (R3); run the definition of done before claiming done; reuse types from `src/lib/`.
-  **Ask first:** adding or upgrading a dependency not approved for the issue (§2); any command that downloads a tool or runtime (`brew install`, `npx playwright install`, `npx <uninstalled tool>`); editing config (`next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `vitest.config.ts`, `playwright.config.ts`, `prisma.config.ts`, `package.json` scripts, `.vscode/`, `.github/`); changing the Prisma schema, an API contract, or files owned by the partner's open branch; any network or GitHub write. Reading the issue you implement (`gh issue view N`) is allowed.
-  **Never:** Never push directly to main, open or merge pull requests, or rewrite Git history without explicit human approval. Every PR must be reviewed by the other partner before merging; amend, rebase, or squash the failing-test commit (graded evidence); skip, delete, or weaken a test (`.skip`, `.only`, changed expectations); `@ts-ignore`, `@ts-expect-error`, `eslint-disable`; read, print, or commit `.env*` (except `.env.example`); edit `src/generated/`; `dangerouslySetInnerHTML`; run tests or seeds against production data.

## 1. Project and scope
Team Task Board is a minimal Kanban app: users group work into projects and move tasks **To Do → In Progress → Done**. CS6983 pair project. Sprint 1: Oct 26 – Nov 2, 2026. Sprint 2: Nov 3 – Nov 10, 2026.
- Requirements (US1–US5, acceptance criteria, data model §6): `docs/prd.md`. UI spec: `DESIGN.md` and `docs/mockups/` (`board.png` 1280px, `board-mobile.png` 375px, `board.html` if you cannot view images).
- Work tracking: GitHub Issues + Project "Team Task Board". **The issue assignee owns the issue** and the files it creates; ownership is never set in this file.
- Out of scope unless a tracked issue adds it: drag-and-drop, WebSockets, notifications, team invitations, multi-user sharing.

## 2. Stack
Major versions: **Next.js 16** (App Router), **React 19**, **TypeScript 5** (strict), **Tailwind CSS 4**, **Prisma 7** (from #1), **PostgreSQL**, **Vitest 5** + Testing Library, **Playwright 1**, ESLint 9. Exact versions: `package.json` / `package-lock.json` only. Do not upgrade without an issue.

**Approved dependencies per issue** (install for your issue without asking; anything else, stop and ask): #1 `@prisma/client`, `@prisma/adapter-pg`, dev `prisma`, `dotenv`; #2 `@vitest/coverage-v8`; #4 `zod`, `jose`, `bcryptjs`. Never import a package before its issue.

**Database: PostgreSQL is our only engine.** Every environment has its own data and credentials:

| Environment | Database | Credentials live in |
|---|---|---|
| Local dev / local tests | Postgres in `docker-compose.yml` (from #1; `docker compose up -d`), separate test database for integration tests | `.env` (gitignored) |
| CI | Postgres service container in GitHub Actions, empty per run | workflow env, no real secrets |
| Vercel preview | Supabase **non-production** project | Vercel Preview env vars |
| Production | Supabase **production** project | Vercel Production env vars |

- Hosted target is **Supabase** (planned, #3). **Open conflict:** `docs/prd.md` §7 and the #3 title say Neon. The #3 owner resolves it with the partner and updates PRD/issue in that PR; until then write no provider-specific code.
- Supabase: migrations need a direct (non-pooled) connection; the app may use the pooled URL. #3 names these variables in `.env.example` (names and placeholders only).

**Prisma 7** (your training data is probably Prisma 5/6):
- Generator `provider = "prisma-client"`, `output = "../src/generated/prisma"`; never legacy `prisma-client-js`. Import from `@/generated/prisma/client`. `/src/generated/prisma/` must be in `.gitignore`; regenerate, never edit or commit.
- No `url` in `schema.prisma`. `prisma.config.ts` starts with `import "dotenv/config"` and sets `datasource.url` from `DATABASE_URL`.
- `PrismaClient` needs the driver adapter: `new PrismaClient({ adapter: new PrismaPg({ connectionString }) })`. `src/server/db.ts` exports one client, cached on `globalThis` outside production.
- Migrations in `prisma/migrations/` with `migration_lock.toml`, created by `npx prisma migrate dev --name <slug>` (without a database: `npx prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script`). Never edit an applied migration; schema changes need a new migration, a new issue, and the schema owner's review. Deploy with `npx prisma migrate deploy`.
- Seed data: `prisma/seed.ts` (when an issue adds it), deterministic and idempotent, includes the `demo` project used by the mockups. Local and test databases only.

### Next.js 16 (your training data is probably older)
- Docs for this exact version: `node_modules/next/dist/docs/`. Read them before using an unfamiliar API.
- `cacheComponents: true`: awaiting `params`, cookies, or other runtime data **outside `<Suspense>` fails `npm run build`**. Keep the page sync; put the async part inside Suspense:
  ```tsx
  export default function ProjectPage({ params }: PageProps<"/projects/[projectId]">) {
    return <Suspense fallback={<BoardSkeleton />}><ProjectBoard params={params} /></Suspense>;
  }
  ```
- Never use `generateStaticParams` to dodge this rule (project ids are dynamic). `params`/`searchParams` are Promises; use the generated `PageProps<"/route">` / `LayoutProps<"/route">`.
- Unknown ids: `notFound()`. The page streams, so the HTTP status can be **200**; tests assert on the not-found text, never `response.status()`.
- Keep `agentRules: false` in `next.config.ts` (stops Next.js rewriting this file); do not enable `experimental.agentFeedback`.
- Tailwind v4: no `tailwind.config.*`. Theme changes go in `@theme` in `src/app/globals.css`, only when an issue requires it. Never `outline-none` on focusable elements.

## 3. Architecture and directories
`(#N)` marks files that issue creates; do not look for them earlier.
```
src/app/                    Routes only; thin. Pages, layouts, route handlers
  api/v1/**/route.ts        (#4/#5/#7) auth → validate (zod) → service → JSON
  api/v1/health/route.ts    (#3) health check (§5)
src/components/<feature>/   Feature UI (board/: ProjectBoard, Board "use client", BoardColumn, TaskCard)
src/components/ui/          Shared primitives, only once used twice
src/lib/                    Framework-free TS: tasks.ts (Task types), mock-tasks.ts, task-status.ts, board.ts
src/server/                 (#1/#4) Server-only: db.ts, services/, auth
src/generated/prisma/       Generated Prisma client (gitignored)
prisma/                     schema.prisma, migrations/, seed.ts
tests/unit/                 Cross-module unit tests
tests/integration/          API + database tests (§6)
e2e/                        Playwright specs
docs/                       prd.md, mockups/, api/openapi.yaml, architecture.md, decisions/, sprints/
.github/                    workflows/, pull_request_template.md, ISSUE_TEMPLATE/
```
- Server components by default; `"use client"` only where state or events need it. Presentational children get callbacks as props.
- Logic lives in pure functions in `src/lib/`, unit tested without React. Statuses come only from `src/lib/task-status.ts` (`TASK_STATUSES`, `STATUS_LABELS`); never hard-code them.
- The UI never knows the data source: Sprint 1 passes mock tasks; Sprint 2 passes the same props from the API.

## 4. Code conventions
- Components `PascalCase.tsx`, one per file, named exports; only Next.js route files default-export. Props: `type XProps = { … }` above the component.
- `camelCase` functions/variables, `UPPER_SNAKE_CASE` constants, `PascalCase` types (no `I` prefix). Prisma models `PascalCase`, fields `camelCase`. Route folders `kebab-case`; descriptive dynamic segments (`[projectId]`).
- Strict TypeScript: no `any`, no non-null `!`, no `as` to silence errors. `@/` imports, no `../../`.
- Tailwind utilities only (no CSS modules, inline `style`, new global CSS). No `console.log` or commented-out code. Split components past ~120 lines.
- Prefer React state, Next.js built-ins, native HTML, `fetch`, Prisma for all DB access. Avoid unless an issue approves: UI kits, global state libraries, drag-and-drop, CSS-in-JS, `classnames`, lodash, moment, axios, raw SQL outside migrations.

## 5. API, design, and documentation
- UI work follows `DESIGN.md` and the mockups: breadcrumb + `<h1>`; three `<section>` columns in `TASK_STATUSES` order, each `<h2>` containing only the title with a count pill beside it and "No tasks yet" when empty; cards with `<h3>`, muted description, native `<select>` named **"Status for {task title}"**.
- Flows: view board (#6) → change status (#6) → persist with `PATCH /api/v1/tasks/:id`, optimistic with rollback and error message (#8) → register/login → projects list → board (#4, #5).
- API errors: `{ error: { code, message } }` with correct status codes. Every endpoint change updates `docs/api/openapi.yaml` in the same PR (served at `/api/docs` by #11).
- `GET /api/v1/health` returns 200 `{ status: "ok" }` after a trivial DB query, 503 if the DB is down; no versions or secrets.
- `docs/architecture.md` holds the architecture and DB-schema diagrams (Mermaid), updated with any schema or layer change. One file per major choice in `docs/decisions/NNN-title.md`.

## 6. TDD and testing
**Red → green → refactor for every feature, fix, and infrastructure issue:**
1. **Red.** Write tests from the acceptance criteria, run them, and show them failing **for the right reason** (an assertion or missing export, not a typo, broken setup, or wrong Node). Commit them alone as `test(#N): …` before any implementation. This covers features, bugs, and infrastructure that code can test (e.g. #1: schema, migration, `.env.example`, db client construction).
   - **CI/CD and deployment issues** (#2, #3, #10), whose result only shows in GitHub Actions or Vercel: the `test(#N): …` commit adds the check that must pass (a test, workflow step, or config validation), and the PR links the failing run or deployment check as red evidence.
   - **Docs-only** issues are exempt; say so in the PR.
2. **Green.** Minimum code to pass. Commit `feat(#N): …` / `fix(#N): …` / `ci(#N): …`. 3. **Refactor** (optional): `refactor(#N): …` with checks green.

| Kind | Location | Notes |
|---|---|---|
| Unit / component | next to the file, `*.test.ts(x)` | jsdom; role/label/text queries; `userEvent`, never `fireEvent` |
| Cross-module unit | `tests/unit/*.test.ts` | e.g. Prisma schema tests, client construction |
| API + DB integration | `tests/integration/*.test.ts` | first line `// @vitest-environment node`; isolated test DB; reset data per test |
| E2E | `e2e/<feature>.spec.ts` | main journey per UI issue; 375px no-horizontal-scroll for layout |

- Every acceptance criterion maps to a test named after the behavior. Vitest globals are off: import from `"vitest"`; cleanup is already in `vitest.setup.ts`.
- Schema tests check every field and constraint in PRD §6; a unit test constructs the client from `src/server/db.ts`. API tests cover validation, authorization (other user's id → 404), CRUD, empty/invalid input, and DB-down errors.
- If the test DB, browser, or Node version is missing, report the check as **not run**; never as passed.
- Coverage target 80%+ lines in `src/lib` and `src/components` (once #2 adds coverage).

## 7. Git, PRs, and pair workflow
- Branch per issue from current `main`: `feature/<N>-<slug>`, `fix/…`, `chore/…`, `docs/…`.
- Commits: `type(#N): imperative summary` (`feat`, `fix`, `test`, `refactor`, `docs`, `chore`, `ci`); body ends `Refs #N`. Use `git commit -m "<subject>" -m "<body>"`. Issue refs in code only for deliberate temporary choices: `// TODO(#8): …`.
- Before a PR, self-review with Copilot: "review this diff for bugs, security issues, and style violations against #file:AGENTS.md and #file:DESIGN.md"; fix real issues; rerun the definition of done.
- PRs are opened by a human from `.github/pull_request_template.md`: `[#N] Summary`; `Closes #N`; acceptance checklist; failing-test SHA; test evidence; UI screenshots; AI-usage note; partner-review checkbox. Issues use `.github/ISSUE_TEMPLATE/` (story, acceptance criteria, estimate, labels, milestone).
- The partner reviews every PR (criteria met, tests included, AGENTS.md followed, no dead code) and **CI must be green**. Merge commits only, never squash. One issue per PR, ideally < ~300 changed lines. Each partner completes 5+ substantive reviews.
- Pairing: one assignee per issue; never edit files on the partner's open branch; agree on shared interfaces (props, API shapes, schema) before splitting; merge often. PO and Scrum Master rotate each sprint.
- **Sprint records** in `docs/sprints/sprint-N/`: `planning.md` (goal, issues, estimates, PO/SM), `standups.md`, `review.md`, `retro.md`. Async standups, 3+ per partner per sprint: `Date · Yesterday · Today · Blockers` (with issue numbers). Copilot may draft from `git log`; humans confirm and post.

**Backlog map** (never guess numbers; the issue body is the source of acceptance criteria; if issue and PRD disagree, ask):
#1 Prisma + PostgreSQL schema · #2 CI pipeline · #3 Vercel deployment with previews and hosted DB (title says Neon; see §2) · #4 Registration/login with JWT (US1) · #5 Projects API + list page (US2) · #6 Three-column board with mock data (US4) — Sprint 1.
#7 Tasks CRUD API (US3, US5) · #8 Board ↔ tasks API, optimistic (US4) · #9 Task create/edit/delete UI (US3) · #10 Security scanning · #11 OpenAPI docs at /api/docs (US5) · #12 E2E core journey · #13 README, diagrams, setup guide — Sprint 2.

## 8. CI/CD and deployment
- `.github/workflows/ci.yml` on every PR to `main`: `npm ci` (Node 22) → lint + typecheck → unit + integration (Postgres service, `prisma migrate deploy`) → build → Playwright E2E. Security job (#10): CodeQL, `npm audit`, Dependabot. Branch protection requires these checks where permissions allow.
- CI never uses production secrets or data. Keep failure logs actionable; never hide or retry away failures.
- Vercel: a preview deploy per PR (Supabase non-production DB), production deploys from `main`. Production migrations run as a written-down step (`npx prisma migrate deploy` with production credentials, by a human). Server-only variables never use `NEXT_PUBLIC_`.
- CI/deploy work is done only after checking the actual GitHub Actions run, Vercel deployment, and `/api/v1/health`.

## 9. Security and accessibility
- Validate every request body with zod at the route boundary. Hash passwords with `bcryptjs`; JWT (`jose`) in `httpOnly`, `Secure`, `SameSite=Lax` cookies. Scope every query by the owner's user id; other users' resources return **404**, not 403.
- Secrets come only from environment variables; never log tokens or passwords. A committed secret must be rotated, not just deleted. No analytics, external scripts, or network calls the issue does not require.
- WCAG 2.1 AA: one `<h1>`, `<h2>` per column, `<h3>` per card; every control has an accessible name; keyboard operable with visible `focus-visible` styles; color never the only signal; text contrast ≥ 4.5:1 (`text-zinc-600` or darker on white).

## 10. Optional practices
Not required, and never a reason to add dependencies without an issue:
- **MCP** in Copilot Chat: read-only GitHub (issues, CI status) and read-only database access to local/test databases only, never production.
- **Browser verification:** run `npm run dev` and compare the page to the mockup at 1280px and 375px (Playwright screenshots into `test-results/` are fine).
- **Pre-commit hook** (Husky + lint-staged running lint/format) only after a tracked issue approves the dev dependencies.

## 11. Rules for AI-assisted implementation
**Setup (humans):** `.vscode/settings.json` sets `"chat.useAgentsMdFile": true`, `"chat.useNestedAgentsMdFiles": false`, and leaves other instruction sources off. Check that `AGENTS.md` appears in the first response's *References*; if not, attach it with *Add Context*. Use Agent mode, one new chat per issue. Keep one root `AGENTS.md`; do not copy rules into other instruction files.

**Assistant:** begin your first reply by listing the sections and rules that apply (e.g. "§2, §6, R0–R7"). Then:
- **R0 Plan, then stop.** The first reply changes no files: acceptance checklist from the issue body, the test for each criterion, files to create/edit, packages to install, risks. End with "Waiting for approval."
- **R1 Scope.** Only the given issue. No unrelated refactors, renames, or config changes (§0).
- **R2 Read first.** The issue body, relevant PRD section, `DESIGN.md` for UI, `src/lib/tasks.ts`, `src/lib/mock-tasks.ts`, `src/lib/task-status.ts`, and `prisma/schema.prisma` for data work. Reuse types; never redefine `Task` or `TaskStatus`.
- **R3 Test-first gate.** After approval, the first commit is `test(#N): …`, after showing its failing output (§6 step 1). Before it you may install approved packages but not create or edit implementation files. This applies to `chore`, infrastructure, and CI/CD issues too (for CI/CD, red evidence follows §6); docs-only issues are the only exception.
- **R4 Dependencies.** Only those approved in §2; otherwise stop and explain.
- **R5 Verify.** Run the definition of done and paste each real result. Environment blockers (Node, browser, database) are reported as not run, then stop. Fixes outside scope: stop and report.
- **R6 Ambiguity.** Choose what is closest to `DESIGN.md`, mockups, and PRD, and state the assumption. If they conflict, or the choice affects data shape or the API, ask.
- **R7 Summary.** Branch; files changed; acceptance checklist with covering tests; commands and results; commit SHAs (test before feat); assumptions; last line `Rules: AGENTS.md`.
- **Terminal:** zsh. Quote paths with brackets (`'src/app/projects/[projectId]/page.tsx'`). Use `git ls-files` or `grep` (`rg` may be missing).

## 12. Maintenance and changelog
Either partner proposes changes through an issue and a PR that the other reviews. Update the PRD, OpenAPI, `DESIGN.md`, and this file together when decisions change. Personal HW3 experiments and reflections stay out of this file.
- **v4 (2026-10-28, shared):** merged Tyler's v3 and Haomiao's v2. Added environment isolation and the Supabase plan (Neon conflict flagged), test locations including `tests/integration/`, assignee ownership, templates, seed, health check, OpenAPI, architecture docs, async standups, CI/CD and Vercel rules, and optional MCP/browser/pre-commit practices.
- **v3 (Tyler):** issue body as criteria source, R0 plan-only reply, R3 test-first gate, Prisma 7 rules. **v2 (Haomiao, HW3):** separate `test(#N)` commit, structure checklist, heading-only `<h2>`, zsh rule.
