# HW3 Submission: Context Engineering — Rules & Process

**Student:** Tyler Sarna · **Course:** CS6983 · **Project:** Team Task Board (P2, pair project with Haomiao Shi) · **Date:** October 29, 2026

HW3 is individual. The repository, Project board, milestones, issues, PRD, and mockups are shared P2 artifacts. My rules file (v3), experiment, and reflection are my own and live on branch `sarna-rules-experiment`. Development uses VS Code with GitHub Copilot Chat.

## 1. Links

| Deliverable | Link |
|---|---|
| Repository | [stone-coding/team-task-board-copilot](https://github.com/stone-coding/team-task-board-copilot) |
| GitHub Project (board view) | [Team Task Board, Sprint Board](https://github.com/users/stone-coding/projects/3/views/2) |
| Milestones | [Sprint 1 and Sprint 2](https://github.com/stone-coding/team-task-board-copilot/milestones) |
| Issues | [Issue list](https://github.com/stone-coding/team-task-board-copilot/issues) |
| My HW3 branch | [`sarna-rules-experiment`](https://github.com/stone-coding/team-task-board-copilot/tree/sarna-rules-experiment) |
| My rules file, `AGENTS.md` v3 (root) | [AGENTS.md @ `749a5cb`](https://github.com/stone-coding/team-task-board-copilot/blob/749a5cb/AGENTS.md) |
| Rules iteration v1 → v3 | [Compare `8502947`…`749a5cb`](https://github.com/stone-coding/team-task-board-copilot/compare/8502947...749a5cb) |
| Shared rules file, `AGENTS.md` v4 on `main` (v3 merged with my partner's v2, Issue #14) | [AGENTS.md on main](https://github.com/stone-coding/team-task-board-copilot/blob/main/AGENTS.md) |
| PRD | [docs/prd.md](https://github.com/stone-coding/team-task-board-copilot/blob/main/docs/prd.md) |
| Design spec and mockups | [DESIGN.md](https://github.com/stone-coding/team-task-board-copilot/blob/main/DESIGN.md) · [docs/mockups](https://github.com/stone-coding/team-task-board-copilot/tree/main/docs/mockups) |
| Before/after comparison | [sarna-rules-comparison.md](https://github.com/stone-coding/team-task-board-copilot/blob/sarna-rules-experiment/docs/hw3/sarna-rules-comparison.md) |
| Run 5, no rules (code) | [`hw3/run5-no-rules-valid`](https://github.com/stone-coding/team-task-board-copilot/tree/hw3/run5-no-rules-valid) |
| Run 6, AGENTS.md v3 (code) | [`hw3/run6-rules-v3-valid`](https://github.com/stone-coding/team-task-board-copilot/tree/hw3/run6-rules-v3-valid) |
| Reflection | [sarna-reflection.md](https://github.com/stone-coding/team-task-board-copilot/blob/sarna-rules-experiment/docs/hw3/sarna-reflection.md) |

## 2. Scrum setup

- **Board:** a GitHub Project in board layout with the Status columns Backlog → Sprint Todo → In Progress → In Review → Done.
- **Milestones:**
  - Sprint 1: Oct 26 – Nov 2, 2026, due Nov 2.
  - Sprint 2: Nov 3 – Nov 10, 2026, due Nov 10.
- **Issues:** 13 backlog issues derived from PRD user stories US1–US5 and the P2 technical requirements, plus #14 for merging the rules files. Each backlog issue has:
  - an action-oriented title
  - a user story or technical objective
  - an acceptance-criteria checklist
  - a type label (`feature`, `chore`, `docs`, or `test`) and a priority label
  - a milestone, dependencies, and an estimate
- **Board placement:** Sprint 1 issues (#1–#6) are in Sprint Todo, and Sprint 2 issues (#7–#13) are in Backlog.

## 3. Rules file

`AGENTS.md` sits in the repository root and has a header comment giving its owner, version, and maintenance rule. It covers each part of the assignment:

| Assignment requirement | AGENTS.md v3 section |
|---|---|
| Tech stack and versions | §2, including Prisma 7 and Next.js 16 specifics the model's training data lacks |
| Architecture and folder structure | §3 |
| Naming and coding standards | §4 |
| Testing strategy | §6: red → green → refactor, test locations, 80% coverage target |
| PRD, mockups, UI components, and user flows | §1 and §5, with `DESIGN.md` as the visual spec |
| Branches, commits, PRs, and issue references | §7, with a backlog map of issues #1–#13 |
| Do's and don'ts, dependencies, security, accessibility | §0 boundaries, §2 approved dependencies, §8 libraries to prefer and avoid, §9 security, §10 accessibility |
| How the AI should work | §11, rules R0–R7: plan first, test-first gate, verify, summarize |

## 4. Before/after test (summary)

**Feature:** Issue #1, "Set up Prisma with PostgreSQL schema for users, projects, and tasks."

**Method:** both runs used the same prompt and model (`auto`) in a new chat, each starting from its own git worktree at the same scaffold commit. Only the rules differed. Copilot's session logs confirm whether `AGENTS.md` was loaded.

| | No rules (run 5) | AGENTS.md v3 (run 6) |
|---|---|---|
| Acceptance criteria met | 4 / 6 | **6 / 6** |
| New unit tests | 0 | **9** |
| Failing-test commit first | No | **Yes** (`6bb4763` → `901ebb4`) |
| `src/server/db.ts` | Throws on import (no Prisma 7 driver adapter) | Works (`@prisma/adapter-pg`) |
| Migration verified against Postgres | No | Yes |
| Branch and commit conventions | Partly | Yes |

The full tables, code snippets, threats to validity, and the history of the two discarded rounds are in the [comparison](https://github.com/stone-coding/team-task-board-copilot/blob/sarna-rules-experiment/docs/hw3/sarna-rules-comparison.md).

## 5. Reflection and iteration

The rules went through three versions, v1 → v2 → v3. Each version was driven by a failed or contaminated experiment round, and v3 was then merged with my partner's rules into the shared v4. What worked, what didn't, and the plan for Sprint 2 are in the [reflection](https://github.com/stone-coding/team-task-board-copilot/blob/sarna-rules-experiment/docs/hw3/sarna-reflection.md).
