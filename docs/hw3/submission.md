# HW3 Submission: Context Engineering, Rules & Process

**Student:** Haomiao Shi · **Course:** CS6983 AI Coding · **Project:** Team Task Board (P2, pair project) · **Date:** October 25, 2026

HW3 is individual. The repository, Project board, milestones, issues, PRD, and mockup belong to the shared P2 project. My rules file, experiment, and reflection are my own and are on branch `hw3-haomiao`. Development uses Visual Studio Code with GitHub Copilot Chat.

## 1. Links

| Item | Link |
|---|---|
| Repository | [stone-coding/team-task-board-copilot](https://github.com/stone-coding/team-task-board-copilot) |
| GitHub Project (board view) | [Team Task Board, Sprint Board](https://github.com/users/stone-coding/projects/3/views/2) |
| Milestones | [Sprint 1 and Sprint 2](https://github.com/stone-coding/team-task-board-copilot/milestones) |
| Issues (13) | [Issue list](https://github.com/stone-coding/team-task-board-copilot/issues) |
| My HW3 branch (root `AGENTS.md`) | [`hw3-haomiao`](https://github.com/stone-coding/team-task-board-copilot/tree/hw3-haomiao) |
| `AGENTS.md` (v2) | [AGENTS.md](https://github.com/stone-coding/team-task-board-copilot/blob/hw3-haomiao/AGENTS.md) |
| `AGENTS.md` v1 → v2 diff | [Compare rules-v1…rules-v2](https://github.com/stone-coding/team-task-board-copilot/compare/rules-v1...rules-v2) |
| PRD | [docs/prd.md](https://github.com/stone-coding/team-task-board-copilot/blob/main/docs/prd.md) |
| Mockup (desktop, 375px, HTML source) | [docs/mockups](https://github.com/stone-coding/team-task-board-copilot/tree/main/docs/mockups) |
| Experiment report | [experiment.md](https://github.com/stone-coding/team-task-board-copilot/blob/hw3-haomiao/docs/hw3/experiment.md) |
| Experiment evidence | [docs/hw3/evidence](https://github.com/stone-coding/team-task-board-copilot/tree/hw3-haomiao/docs/hw3/evidence) |
| Run A code (no rules) | [`experiment-a-no-rules`](https://github.com/stone-coding/team-task-board-copilot/tree/experiment-a-no-rules) |
| Run B code (`AGENTS.md` v1) | [`experiment-b-with-rules`](https://github.com/stone-coding/team-task-board-copilot/tree/experiment-b-with-rules) |
| Evaluation, committed before the runs | [`hw3-eval`: hw3/eval](https://github.com/stone-coding/team-task-board-copilot/tree/hw3-eval/hw3/eval) |

## 2. Scrum setup

- **Board:** a GitHub Project with Status columns Backlog → Sprint Todo → In Progress → In Review → Done. The "Sprint Board" view uses the board layout grouped by Status, and an `Estimate` field holds story points.
- **Milestones:**
  - Sprint 1: October 26 – November 2, 2026 (due November 2), 6 issues
  - Sprint 2: November 3 – November 10, 2026 (due November 10), 7 issues
- **Issues:** 13, derived from the PRD's user stories (US1–US5) and the P2 technical requirements. Each has:
  - an action-oriented title
  - a user story or technical objective
  - an acceptance-criteria checklist
  - a type label (`feature`, `chore`, `docs`, or `test`) and a priority label
  - a milestone, dependencies, and an estimate
- **Board placement:** Sprint 1 issues (#1–#6) are in Sprint Todo; Sprint 2 issues (#7–#13) are in Backlog.
- **Ownership:** no issue is assigned yet. Ownership will be decided with my partner at Sprint 1 planning.

## 3. Rules file

[`AGENTS.md`](https://github.com/stone-coding/team-task-board-copilot/blob/hw3-haomiao/AGENTS.md) is at the repository root of `hw3-haomiao`. GitHub Copilot Chat in Visual Studio Code loads it automatically through the workspace setting `chat.useAgentsMdFile`, and the file asks the assistant to name the applicable rules before coding. Sections:

1. Project overview, with links to the PRD, mockup, and backlog
2. Tech stack with installed versions, plus Next.js 16 specifics (`cacheComponents`, the Suspense pattern, `notFound()` behavior)
3. Architecture, directory structure, and key patterns
4. Naming conventions and coding standards
5. UI components, expected behavior, mockup design tokens, and user flows
6. Testing strategy: red → green → refactor as separate commits, coverage goal, end-to-end policy, definition of done, structure checklist
7. Branch, commit, and pull-request workflow; issue references; backlog map
8. Preferred and avoided libraries
9. Security
10. Accessibility (WCAG 2.1 AA)
11. Rules for AI-assisted implementation, including how Copilot Chat receives the rules
12. Changelog (v1 → v2)

## 4. Before/after experiment: summary

Two Copilot Chat sessions (Agent mode, same model) started from the same commit with the same prompt, PRD, and mockup:
- **Run A:** no rules.
- **Run B:** `AGENTS.md` v1, loaded automatically.

Run B's first message listed the applicable `AGENTS.md` rules by number, which confirms the rules were loaded. A hidden acceptance suite was committed before either run.

Both runs passed all 10 hidden acceptance tests and the accessibility scan. Run A matched the mockup slightly more closely. The rules changed how the feature was built:
- **Structure:** B used the documented components, Tailwind, shared status labels, and an issue-referencing commit.
- **Framework pattern:** B used the correct Next.js 16 route pattern on the first attempt. A needed a build failure first, then used a workaround limited to known ids.
- **Accessibility:** B kept the column names clean ("To Do"). A's tests locked in a flawed name ("To Do3").
- **Tests:** B added 2 end-to-end tests. A added none.
- **Rules not followed:** B ran its failing tests first but committed once, on the checkout branch, with tests in `tests/unit/`. These gaps drove the v2 revision.

The method, full results, code comparisons, and screenshots follow in the experiment report.

## 5. Iteration and reflection

- **Iteration:** `AGENTS.md` v1 (tag `rules-v1`) was revised to v2 (tag `rules-v2`). Each change is tied to an observation from run B (experiment report §5; changelog in `AGENTS.md`).
- **Reflection:** included at the end of this document.
