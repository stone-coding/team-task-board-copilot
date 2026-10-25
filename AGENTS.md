# AGENTS.md — Team Task Board

<!--
  Rules for AI coding assistants (and humans) working in this repository.
  Owner: Haomiao Shi (personal HW3 version; the shared P2 version will be agreed with my partner).
  Version: v1. See "Changelog" at the end.
  IDE workflow: Visual Studio Code with GitHub Copilot Chat. See "How the assistant receives these rules" in §11.
  Keep it short enough to be read in full. Every rule must match the real repository.
-->

## 1. Project overview

Team Task Board is a minimal Kanban app. Users group work into projects and move tasks
through **To Do → In Progress → Done**. It is a CS6983 pair project. Two sprints:
Sprint 1 runs Oct 26 – Nov 2, and Sprint 2 runs Nov 3 – Nov 10, 2026.

- Product requirements (user stories US1–US5 and their acceptance criteria): `docs/prd.md`
- Board mockup: `docs/mockups/board.png` (desktop) and `docs/mockups/board-mobile.png` (375px). The HTML source is `docs/mockups/board.html`.
- Backlog: the GitHub Project "Team Task Board". One issue per unit of work.

**Before building any UI, read the matching PRD section and open the mockup image.** The mockup is the visual spec.

## 2. Tech stack (versions as installed — do not upgrade without an issue)

| Area | Package | Version |
|---|---|---|
| Framework | next (App Router) | 16.4.3 |
| UI | react / react-dom | 19.3.0 |
| Language | typescript (strict) | 5.9.3 |
| Styling | tailwindcss (v4, CSS-first config in `src/app/globals.css`) | 4.3.3 |
| Lint | eslint + eslint-config-next | 9.39.5 / 16.4.3 |
| Unit and component tests | vitest, jsdom, @testing-library/react, @testing-library/user-event, @testing-library/jest-dom | 5.0.5, 30.1.3, 16.3.3, 14.6.8, 7.0.1 |
| E2E tests | @playwright/test (Chromium) | 1.64.1 |

**Planned, not installed yet** (each is added by its own issue): Prisma + PostgreSQL (Neon), zod, jose (JWT), bcryptjs.

### Next.js 16 specifics (training data is often older than this)

- `cacheComponents: true` is on in `next.config.ts`. A page that awaits `params`, cookies, or other runtime data **outside `<Suspense>` fails `npm run build`** with "Uncached data was accessed outside of `<Suspense>`". Pattern to use:
  ```tsx
  // src/app/projects/[projectId]/page.tsx — page stays sync; the async part is inside Suspense
  export default function ProjectPage({ params }: PageProps<"/projects/[projectId]">) {
    return (
      <Suspense fallback={<BoardSkeleton />}>
        <ProjectBoard params={params} />
      </Suspense>
    );
  }
  ```
- `params` and `searchParams` are Promises. Use the generated global helpers `PageProps<"/route">` and `LayoutProps<"/route">`. They are created by `next typegen`, which `npm run typecheck` runs.
- Framework docs for this exact version are in `node_modules/next/dist/docs/`. Check them before using an API you are unsure about.
- Do not change `agentRules: false` in `next.config.ts`. This file is maintained by hand.
- **Unknown ids:** call `notFound()` from `next/navigation`. Because the page streams under `cacheComponents`,
  the HTTP status can still be **200**. Tests must assert on the rendered not-found text, not on `response.status()`.
- Do not use `generateStaticParams` to work around the Suspense rule. Real project ids are dynamic (Sprint 2).

## 3. Architecture and directory structure

```
src/
  app/                          Routes only: pages, layouts, route handlers. Thin; no business logic.
    page.tsx                    Home
    projects/[projectId]/page.tsx   Project board page (server component)
    api/v1/**/route.ts          (planned) REST API: auth → validate → service → JSON
  components/
    board/                      Feature components for the board
      Board.tsx                 Client component that owns board state
      BoardColumn.tsx           One status column: header, count, cards, empty state
      TaskCard.tsx              One task: title, description, status select
    ui/                         Small shared primitives, added only when used twice
  lib/                          Framework-free TypeScript: types, constants, pure functions
    tasks.ts                    Task and TaskStatus types (single source of truth)
    task-status.ts              Ordered statuses and their display labels
    board.ts                    Pure board logic, e.g. groupTasksByStatus and moveTask
    mock-tasks.ts               Mock data used until the API exists (Sprint 2)
  server/                       (planned) db client, services, auth helpers. Server-only.
tests/unit/                     Tests that span modules
e2e/                            Playwright specs
docs/                           PRD, mockups, (later) OpenAPI, sprint notes
```

Key patterns:
- **Server components by default.** Add `"use client"` only to the component that needs state or events (`Board.tsx`). Child components can stay presentational.
- **State logic lives in pure functions in `src/lib/`.** Components call them, and they are unit tested without React. Board state is one `useState` or `useReducer` in `Board`, keyed by task id.
- **One source of truth for statuses.** Status order and labels come from `src/lib/task-status.ts`:
  `TASK_STATUSES = ["TODO", "IN_PROGRESS", "DONE"]` and `STATUS_LABELS = { TODO: "To Do", IN_PROGRESS: "In Progress", DONE: "Done" }`. Never hard-code the label strings in components.
- **Sprint 1 data source:** the board page passes `mockTasks` (filtered by `projectId`) into `Board`. In Sprint 2 the same props come from the API. Keep `Board` unaware of where data comes from.

## 4. Naming conventions and coding standards

- Components: `PascalCase.tsx`, one component per file, **named exports** (`export function TaskCard`). Route files (`page.tsx`, `layout.tsx`) use default exports because Next.js requires it.
- Functions and variables: `camelCase`. Constants: `UPPER_SNAKE_CASE`. Types and interfaces: `PascalCase`, with no `I` prefix.
- Route folders: `kebab-case`; dynamic segments use descriptive names (`[projectId]`, not `[id]`).
- Tests: `*.test.ts` or `*.test.tsx` **next to the file under test**. E2E: `e2e/*.spec.ts`.
- Props: declare a `type XxxProps = { … }` above the component.
- TypeScript strict: no `any`, no non-null `!` assertions, no `@ts-ignore`.
- Styling: Tailwind utility classes only. No CSS modules, inline `style` objects, or new global CSS.
- Imports: use the `@/` alias for `src/` and avoid deep relative paths (`../../`).
- Keep files small. If a component grows past about 120 lines, split it.

## 5. UI components and expected behavior (US4, mockup `docs/mockups/board.png`)

| Component | Must do |
|---|---|
| Page `/projects/[projectId]` | `<h1>` with the project name (mock project: "Demo Project"), breadcrumb "Projects / Demo Project", then the board |
| `Board` | Renders the three columns in the order **To Do, In Progress, Done**. Holds the task list in state. A status change updates state immediately (no reload) |
| `BoardColumn` | `<section aria-labelledby>` with an `<h2>` title and a count badge (pill) that shows the number of tasks. Cards are `<ul>`/`<li>`. Empty column shows a dashed box with the text **"No tasks yet"** |
| `TaskCard` | `<h3>` title, optional description in muted text, and a native `<select>` with options To Do / In Progress / Done. The select's accessible name is **"Status for {task title}"** (`aria-label`); the visible "Status" text is `aria-hidden` |

Visual tokens from the mockup:
- Page background `bg-zinc-100`; cards `bg-white border border-zinc-200 rounded-lg`.
- Each column has a 4px top border: To Do `border-t-slate-500`, In Progress `border-t-blue-600`, Done `border-t-green-600`.
- Count pill: `rounded-full bg-zinc-200 text-xs font-semibold`.
- Layout: `grid grid-cols-1 gap-4 md:grid-cols-3`. Columns stack below 768px. No horizontal page scroll at 375px.

User flows:
1. **View board (Sprint 1):** Home → "Open the demo board" → `/projects/demo` → three columns with counts.
2. **Change status (Sprint 1):** pick a new value in a card's select → the card moves to that column → both counts update → an emptied column shows "No tasks yet".
3. **(Sprint 2)** The status change calls `PATCH /api/v1/tasks/:id`. The UI updates optimistically, rolls back if the request fails, and shows an error message.
4. **(Sprint 1–2)** Register or log in → projects list → open a project → board.

## 6. Testing strategy and TDD

- **Red → green → refactor for every feature issue:**
  1. Write tests from the issue's acceptance criteria first and run them to see them fail. Commit as `test(#N): …`.
  2. Write the minimum code to make them pass. Commit as `feat(#N): …`.
  3. Refactor with the tests still green. Commit as `refactor(#N): …` (optional).
- **Each acceptance criterion maps to at least one test.** Name the test after the behavior it checks, for example `it("moves a card to Done when its status changes")`.
- Component tests use Testing Library **queries by role, label, or text** (`getByRole("combobox", { name: "Status for …" })`), never CSS classes or test ids. Simulate the user with `userEvent`, not `fireEvent`.
- Pure functions in `src/lib/` get their own unit tests, including edge cases (empty list, unknown id).
- **Testing Library cleanup** is already registered once in `vitest.setup.ts` (Vitest globals are off). Do not add `cleanup()` to individual test files.
- Coverage goal: 80% or more of lines in `src/lib` and `src/components`. The coverage tool (`@vitest/coverage-v8`) is added with the CI issue (#2). Until then, do not install it yourself.
- **E2E: every UI feature issue adds or extends a spec in `e2e/<feature>.spec.ts`** covering its main user flow. For layout work, include the 375px no-horizontal-scroll check. Keep the spec and commit it with the feature; never write a temporary spec and delete it. E2E covers journeys, not every branch.
- Scratch output (screenshots, traces) goes only to the gitignored `test-results/` folder, never `/tmp` or other paths outside the repo.
- **Definition of done:** these all pass locally:
  ```bash
  npm run lint && npm run typecheck && npm test && npm run build
  ```
  `npm run build` matters because of the `cacheComponents` rule in §2.

## 7. Git, issues, and pull requests

- Work only on a branch, never on `main`. Branch names: `feature/<issue>-<slug>`, `fix/<issue>-<slug>`, `chore/<issue>-<slug>`, `docs/<issue>-<slug>`. Example: `feature/6-kanban-board`.
- Commits follow Conventional Commits with the issue number: `type(#N): imperative summary`.
  Types: `feat`, `fix`, `test`, `refactor`, `docs`, `chore`, `ci`. Example: `test(#6): add failing tests for board columns`.
- Reference issues in commit bodies (`Refs #N`) and PR bodies (`Closes #N`). Code comments mention an issue only for a deliberate temporary choice, for example `// TODO(#8): replace mock data with API`.
- PRs:
  - Title is `[#N] Summary`.
  - The body has the acceptance-criteria checklist, the SHA of the failing-test commit, test evidence, screenshots for UI changes, and an "AI usage" note (tool and what it generated).
  - At least one partner review is required. Merge with a **merge commit** (no squash) so the red/green history survives.
- Keep PRs small: one issue per PR, ideally under about 300 changed lines.

### Backlog map (use these numbers in `TODO(#N)`, `Refs #N` and `Closes #N`; never guess)

| # | Issue | Sprint |
|---|---|---|
| 1 | Set up Prisma with PostgreSQL schema | 1 |
| 2 | CI pipeline (lint, typecheck, unit, E2E) | 1 |
| 3 | Vercel deployment with previews and Neon | 1 |
| 4 | Registration and login with JWT | 1 |
| 5 | Projects API and projects list page | 1 |
| 6 | Three-column Kanban board with mock data | 1 |
| 7 | Tasks CRUD API | 2 |
| 8 | Connect board to tasks API (optimistic updates) | 2 |
| 9 | Task create/edit/delete UI | 2 |
| 10 | Security scanning (CodeQL, npm audit, Dependabot) | 2 |
| 11 | OpenAPI docs at /api/docs | 2 |
| 12 | E2E test for the core journey | 2 |
| 13 | README, diagrams, setup guide | 2 |

## 8. Libraries: prefer and avoid

Prefer: React state and hooks, Next.js built-ins (`next/link`, route handlers), Tailwind, native HTML elements, and the testing libraries above.

Avoid unless an issue explicitly approves it (explain why in the PR):
- UI kits (MUI, Chakra, Ant) or headless component libraries for things native HTML already does
- Global state libraries (Redux, Zustand, MobX). Board state is local.
- Drag-and-drop libraries. Out of scope.
- CSS-in-JS, `classnames` (template strings are enough), lodash, moment, or axios (`fetch` is enough)
- Any new runtime dependency added without asking

## 9. Security

- Treat all user text as text. Never use `dangerouslySetInnerHTML`.
- (Planned API) Validate every request body with zod at the route boundary. Return `{ error: { code, message } }` with correct status codes.
- (Planned auth) Hash passwords with bcrypt. Issue JWTs in httpOnly, Secure, SameSite=Lax cookies. Scope every query by the owner's user id, and return **404 rather than 403** for other users' resources.
- Secrets only come from environment variables. Never commit `.env*` files except `.env.example`. Never log tokens or passwords.
- Do not add analytics, external scripts, or network calls that the issue does not require.

## 10. Accessibility (WCAG 2.1 AA)

- Heading order: one `<h1>` per page, `<h2>` for columns, `<h3>` for cards.
- Every form control has an accessible name. Prefer native `<select>`, `<button>`, and `<input>` over custom widgets.
- Everything works with the keyboard. Keep the visible focus style (`focus-visible:outline`).
- Color is never the only signal. Columns also have text titles and counts.
- Text contrast is at least 4.5:1. Use `text-zinc-600` or darker on white for muted text.

## 11. Rules for AI-assisted implementation

**How the assistant receives these rules.** We develop in Visual Studio Code with GitHub Copilot Chat:
- `.vscode/settings.json` enables `chat.useAgentsMdFile`, so Copilot Chat adds this file to every request automatically.
- Check the *References* list of the first response. If `AGENTS.md` is not listed, attach it with *Add Context → AGENTS.md*.
- Start each issue in a new chat.

**Assistant:** before writing code, list the numbered rules from this file that apply to the task. This shows the rules were loaded.

1. **Scope:** implement only the issue or task you were given. Do not refactor unrelated code, rename files, or change configuration (`next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `package.json` scripts) unless the task requires it.
2. **Read first:** `docs/prd.md` (the relevant US), the mockup, `src/lib/tasks.ts`, and `src/lib/mock-tasks.ts`. Reuse existing types; do not redefine `Task`.
   The issue's acceptance criteria match the PRD user story with the same name. Use the PRD and the backlog map (§7). Do not call `gh` or other network tools to fetch the issue unless you are asked to.
3. **Follow TDD (§6).** Show the failing test run before implementing.
4. **No new dependencies.** If you think one is needed, stop and explain why.
5. **Verify before claiming done.** Run the full definition-of-done command from §6 and report the real output. Never claim a check passed if you did not run it.
6. **If the spec is ambiguous,** choose the option closest to the mockup and state the assumption in your summary.
7. **Finish with a summary** that has: files changed, the acceptance-criteria checklist (each item checked or not), the commands you ran with their results, and the final line `Rules: AGENTS.md v1`.

## Changelog

- **v1:** initial rules for the Visual Studio Code + GitHub Copilot Chat workflow.
