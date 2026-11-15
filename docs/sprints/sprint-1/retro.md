# Sprint 1 — Retrospective

The Oct 26 plan called for a retrospective with feedback from both partners. **A retrospective meeting is not documented:** neither GitHub nor the Slack screenshots record one.

- Section 1 is Haomiao's own reflection.
- Section 2 is the evidence from the PRs, reviews and Slack posts.
- Tyler's feedback is quoted only from his own written reviews, PR comments and Slack posts. No separate retrospective from Tyler is documented.

## 1. Haomiao's retrospective

**What went well:** Tyler and I established the shared project structure and completed the core foundation, including authentication, database integration, CI/CD, and the initial Kanban board. Our GitHub PR reviews and Slack discussions helped identify and resolve accessibility, responsive design, and authentication security issues.

**What could improve:** Some changes were merged without partner reviews, and our shared development rules were not always followed consistently. We also needed more structured standup records.

**Action items:** Require reviews before merging whenever feasible, maintain clearer progress updates, and consistently verify tests and acceptance criteria before closing issues.

## 2. Supporting evidence

### What went well

- **The split kept us from blocking each other.**
  - Tyler took the #1 → #4 → #5 dependency chain.
  - Haomiao took #6, which had no dependencies, plus #2 and #3.
  - Tyler worked on #5 locally while #4 waited for review (Slack, Nov 2).
- **TDD history stayed intact on every feature PR.**
  - Each has a `test(#N)` commit before its `feat`/`fix` commit.
  - Review fixes also started from a red test: `ff2708b`, `712e271`, `c02b9c5`, `f5bf73c`.
- **Partner reviews found real defects before merge:**
  - #15: Prisma 7's `migrate dev` doesn't generate the client.
  - #16 (accessibility, responsive layout): the 768px breakpoint was untested, and the count pill had no screen-reader context. Fixed and approved the same afternoon (Slack thread, Oct 31).
  - #17 (authentication security): an open redirect in `safeNextPath`, and a missing test-database migration step. Fixed with a red test first, then approved (Slack thread, Nov 1; PR #17).
- **The rules were agreed early.** The Oct 28 Teams call produced one shared AGENTS.md before most feature work started.

### What to improve

- **Partner review was skipped on two PRs.** #20 and #21 were merged without review, against AGENTS.md §7. Tyler, Nov 4: "Going forward, please wait for an approval. I'd also like branch protection to **require 1 approving review**."
- **Rule changes went in through a feature PR.** Tyler: "AGENTS.md was rewritten inside a feature PR". That rewrite switched Supabase to Neon and turned on migrate-on-deploy without an ADR. Tyler asked for ADRs in `docs/decisions/`.
- **The shared AGENTS.md (`2dfacec`) was committed directly to `main`**, not through a PR.
- **Sprint 1 spilled into the next day.** #2 and #3 merged one day after the sprint ended.
- **The AI tooling slowed us down.**
  - Tyler had to push Copilot in VS Code to follow the Definition of Done (Oct 31).
  - He ran low on Copilot tokens (Nov 1).
- **Standups were informal.** They were ad hoc Slack updates, not the `Date · Yesterday · Today · Blockers` format.

### Action items

| Action | Source | Status (checked Nov 14) |
|---|---|---|
| Wait for approval before merging; require 1 approving review | Tyler, PR #20 comment | Superseded. From Sprint 2 the work was solo, and AGENTS.md v6 (#22) replaced partner review with a recorded self-review plus green CI. |
| Apply `cancel-in-progress` to PRs only | Tyler, PR #20 comment | Not done. Pushes to `main` were cancelled on Nov 11 (runs 43127961226, 43150322186, 43150450992) and Nov 14 (43636232491, 43636314486). |
| Add top-level `permissions: { contents: read }` to CI | Tyler, PR #20 comment | Not done; `ci.yml` on `main` has no `permissions` key |
| Time out the health check when the database hangs | Tyler, PR #21 comment | Not tracked as an issue |
| Write ADRs for Neon hosting and migrate-on-deploy | Tyler, PR #21 comment | Not written |
| Post standups in the agreed format | AGENTS.md §7 | See the Sprint 2 standups |
