# AI-assisted development workflow

How AI tools were used to build Team Task Board, and the evidence for each claim. Every link points to a commit, PR, review, or CI run in this repository.

## Tools actually used

| Period | Who | Tool | Work |
|---|---|---|---|
| HW3 rules experiments (before Sprint 1) | Haomiao, Tyler | VS Code + GitHub Copilot Chat (Agent mode) | Branches `experiment-a-no-rules`, `experiment-b-with-rules`, `hw3/run1…run6`, `sarna-rules-experiment` |
| Sprint 1 | Tyler | VS Code + GitHub Copilot Chat; GitHub Copilot Chat to test PR #18 | PRs #15, #17, #18 (AI-usage notes in each PR) |
| Sprint 1 – Sprint 2 | Haomiao | VS Code + GitHub Copilot Chat (Agent mode) | PRs #16, #20–#31 |
| Final documentation and polish (Nov 14–15) | Haomiao | GitHub Copilot Chat (terminal agent) | PR #23 final sprint-record edits, PRs #42 (#40) and #43 (#41), this document |

**Antigravity was not used.** The course suggests it as the IDE harness, but the AGENTS.md workflow had already been built and tested with VS Code and Copilot Chat in HW3, so we kept the same environment to reuse those rules and keep development continuous. For the final days, Haomiao switched to GitHub Copilot Chat; it worked from the same AGENTS.md, issues, and checks.

## Shared rules file: AGENTS.md

- **Shared by both partners.** [`2dfacec`](https://github.com/stone-coding/team-task-board-copilot/commit/2dfacec9fe21f8725b2e755e4853739cda014633) (Oct 28) merged Haomiao's HW3 v2 rules and Tyler's v3 rules into one root [AGENTS.md](../AGENTS.md) after a joint Teams call (issue #14, assigned to both, closed by Tyler).
- **Loaded on every request.** [`.vscode/settings.json`](../.vscode/settings.json) turns on `chat.useAgentsMdFile` and turns off nested and other instruction files, so Copilot Chat sees one rules file.
- **Maintained.** The §12 changelog records every version: v4 shared (`2dfacec`) → v5 Neon and migrate-on-deploy (`ec3887e`, #3) → v6 solo Sprint 2 (`56d1c2f`, #22) → v6.1 deadline correction (`a8d5ef7`, #23).
- **Revised from evidence.** v2 came from the HW3 Copilot runs. In run B, Copilot wrote tests first but committed everything at once and kept state logic in the component, so v2 added the separate `test(#N)` commit, the pure `src/lib/board.ts` rule, and the structure checklist. #6 reused the experiment's code, and its commit message lists the changes made by hand ([`0fccc96`](https://github.com/stone-coding/team-task-board-copilot/commit/0fccc96)).

## Context engineering

AGENTS.md §11 tells the assistant what to read and how to work:

- **R0 Plan, then stop:** the first reply lists acceptance criteria, tests, and files, then waits for approval.
- **R1 Scope / R4 Dependencies:** one issue, no unrelated changes, no packages outside §2.
- **R2 Read first:** the issue body (the source of acceptance criteria), the PRD section, DESIGN.md for UI, and the shared types in `src/lib/`.
- **R3 Test-first gate:** the first commit is `test(#N)` after showing it fail.
- **R5 Verify:** run lint, typecheck, unit/integration tests, build, and E2E, and report the real output.

Supporting context lives in versioned files: [docs/prd.md](prd.md) (user stories), [DESIGN.md](../DESIGN.md) (visual spec), [docs/api/openapi.yaml](api/openapi.yaml), and the acceptance criteria in each GitHub issue.

## AI-assisted TDD in the git history

Every feature, fix, and infrastructure issue has a failing `test(#N)` commit before its implementation:

| Issue | Red | Green |
|---|---|---|
| #1 Prisma schema | [`4abc66b`](https://github.com/stone-coding/team-task-board-copilot/commit/4abc66b910d50328b5b22c9e63663ca959e06913) | [`415ced2`](https://github.com/stone-coding/team-task-board-copilot/commit/415ced2) (both co-authored by Copilot) |
| #4 Auth with JWT | [`dd967bc`](https://github.com/stone-coding/team-task-board-copilot/commit/dd967bcee8cbeecbf8e0e21d0f10a0d210de8639) | [`3e04319`](https://github.com/stone-coding/team-task-board-copilot/commit/3e04319ab1c966a5b2f20b15c717d0b34e918b3c) |
| #7 Tasks API | [`4d319be`](https://github.com/stone-coding/team-task-board-copilot/commit/4d319be) | [`a3d0e11`](https://github.com/stone-coding/team-task-board-copilot/commit/a3d0e11) |
| #8 Optimistic board | [`81410a8`](https://github.com/stone-coding/team-task-board-copilot/commit/81410a8) | [`182ad8f`](https://github.com/stone-coding/team-task-board-copilot/commit/182ad8f) |
| #40 Project overview | [`1022f00`](https://github.com/stone-coding/team-task-board-copilot/commit/1022f00c7443433830e14f977b77f8414ad26a1b) | [`1a1ebbb`](https://github.com/stone-coding/team-task-board-copilot/commit/1a1ebbb534b6b98e1c6acc2c4f8c1b20558ec379) |

For CI and infrastructure issues the red step is a failing CI run: #2 [run 41648143893](https://github.com/stone-coding/team-task-board-copilot/actions/runs/41648143893), #10 [run 43131387809](https://github.com/stone-coding/team-task-board-copilot/actions/runs/43131387809). For the others, checking out the red commit and running `npm test` reproduces the failure.

## Human oversight

- **Partner review caught AI mistakes (Sprint 1).**
  - PR [#17](https://github.com/stone-coding/team-task-board-copilot/pull/17) (#4): Haomiao's review requested changes for an open redirect in `safeNextPath` and a missing test-database step. Tyler fixed it test-first ([`c02b9c5`](https://github.com/stone-coding/team-task-board-copilot/commit/c02b9c5beb608069209fc29659bf038fd5cab080) → [`98e2cb7`](https://github.com/stone-coding/team-task-board-copilot/commit/98e2cb75d160887d6c94ef1e7eb788e6608cf589)) before approval.
  - PR [#16](https://github.com/stone-coding/team-task-board-copilot/pull/16) (#6): Tyler's review found an untested 768px breakpoint and a count pill without screen-reader context; fixed test-first ([`712e271`](https://github.com/stone-coding/team-task-board-copilot/commit/712e27129b3da3d4713b756515147c9180dc0e84) → [`803ad0a`](https://github.com/stone-coding/team-task-board-copilot/commit/803ad0af4ce99626e86e6441a7b4f002f035f174)).
  - PR [#18](https://github.com/stone-coding/team-task-board-copilot/pull/18) (#5): Tyler checked Copilot's work with Claude Code, which found a regression; fixed test-first ([`f5bf73c`](https://github.com/stone-coding/team-task-board-copilot/commit/f5bf73c9e6a9c2ccb2c848fd49bf4c37f5d04d2c) → [`49efbdf`](https://github.com/stone-coding/team-task-board-copilot/commit/49efbdf39341a718243b8b9b10e595f67ad7639b)).
- **Self-review after the project went solo.** Tyler left on Nov 6; Professor Guerra approved solo work on Nov 8 (see [Sprint 2 planning](sprints/sprint-2/planning.md)). AGENTS.md v6 §7 replaced partner review with a recorded self-review plus green CI; each Sprint 2 PR has a Review checklist.
- **Scope decisions stayed human.** For the final polish, the plan was approved per item: #40 and #41 were built, priority and due dates were deferred, and a password-reset feature was declined before the deadline.

## End-to-end example: #40 Project overview

| Step | Evidence |
|---|---|
| Issue and acceptance criteria | [#40](https://github.com/stone-coding/team-task-board-copilot/issues/40): user story and six acceptance criteria |
| Failing tests | [`1022f00`](https://github.com/stone-coding/team-task-board-copilot/commit/1022f00c7443433830e14f977b77f8414ad26a1b) `test(#40)`: unit, component, Board, and E2E tests; they fail because `summarizeTasks` and `ProjectOverview` do not exist |
| Implementation | [`1a1ebbb`](https://github.com/stone-coding/team-task-board-copilot/commit/1a1ebbb534b6b98e1c6acc2c4f8c1b20558ec379) `feat(#40)`: pure `summarizeTasks()` in `src/lib/` and the `ProjectOverview` component |
| CI | PR [#42](https://github.com/stone-coding/team-task-board-copilot/pull/42): [run 43728078510](https://github.com/stone-coding/team-task-board-copilot/actions/runs/43728078510) (dependency audit, lint and typecheck, unit and integration, build and E2E), CodeQL, and a Vercel preview, all green |
| Review and merge | Self-review checklist in PR #42; merged as [`5036c30`](https://github.com/stone-coding/team-task-board-copilot/commit/5036c30afd9320af0982bc3a02655e3b78478ca1). `main` CI green on [`83678f5`](https://github.com/stone-coding/team-task-board-copilot/commit/83678f5034ddb719e8e02c05dd023c72f0afa5a2) ([run 43729557607](https://github.com/stone-coding/team-task-board-copilot/actions/runs/43729557607)) and deployed to production by Vercel |

## Limits of this evidence

- Chat transcripts are not stored in the repository, so R0 plans and R5 summaries are not independently verifiable.
- AI-usage notes are in Tyler's PRs (#15, #17, #18) but missing from Haomiao's PRs; this document records the tools for those PRs instead.
- After Nov 6 there was no partner review; self-review and CI are the substitute approved in AGENTS.md v6.
