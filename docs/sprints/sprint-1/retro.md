# Sprint 1 — Retrospective

**[TO VERIFY]** The Oct 26 plan called for a retrospective with feedback from both partners, but neither GitHub nor the Slack screenshots record a retrospective meeting. The points below come from the PRs, reviews and Slack posts. Tyler's feedback is quoted from his own written reviews; nothing is attributed to him beyond that.

## What went well

- **The split kept us from blocking each other.**
  - Tyler took the #1 → #4 → #5 dependency chain.
  - Haomiao took #6, which had no dependencies, plus #2 and #3.
  - Tyler worked on #5 locally while #4 waited for review (Slack, Nov 2).
- **TDD history stayed intact on every feature PR.**
  - Each has a `test(#N)` commit before its `feat`/`fix` commit.
  - Review fixes also started from a red test: `ff2708b`, `712e271`, `c02b9c5`, `f5bf73c`.
- **Partner reviews found real defects before merge:**
  - #15: Prisma 7's `migrate dev` doesn't generate the client.
  - #16: the 768px breakpoint was untested, and the count pill had no screen-reader context.
  - #17: an open redirect in `safeNextPath`, and a missing test-database migration step.
- **The rules were agreed early.** The Oct 28 Teams call produced one shared AGENTS.md before most feature work started.

## What to improve

- **Partner review was skipped on two PRs.** #20 and #21 were merged without review, against AGENTS.md §7. Tyler, Nov 4: "Going forward, please wait for an approval. I'd also like branch protection to **require 1 approving review**."
- **Rule changes went in through a feature PR.** Tyler: "AGENTS.md was rewritten inside a feature PR". That rewrite switched Supabase to Neon and turned on migrate-on-deploy without an ADR. Tyler asked for ADRs in `docs/decisions/`.
- **The shared AGENTS.md (`2dfacec`) was committed directly to `main`**, not through a PR.
- **Sprint 1 spilled into the next day.** #2 and #3 merged one day after the sprint ended.
- **The AI tooling slowed us down.**
  - Tyler had to push Copilot in VS Code to follow the Definition of Done (Oct 31).
  - He ran low on Copilot tokens (Nov 1).
- **Standups were informal.** They were ad hoc Slack updates, not the `Date · Yesterday · Today · Blockers` format.

## Action items

| Action | Source | Status (checked Nov 14) |
|---|---|---|
| Wait for approval before merging; require 1 approving review | Tyler, PR #20 review | Superseded. From Sprint 2 the work was solo, and AGENTS.md v6 (#22) replaced partner review with a recorded self-review plus green CI. |
| Apply `cancel-in-progress` to PRs only | Tyler, PR #20 review | Not done. Nov 11 pushes to `main` were cancelled (runs 43127961226, 43150322186, 43150450992). |
| Add top-level `permissions: { contents: read }` to CI | Tyler, PR #20 review | Not done; `ci.yml` on `main` and on PR #27 has no `permissions` key |
| Time out the health check when the database hangs | Tyler, PR #21 review | Not tracked as an issue |
| Write ADRs for Neon hosting and migrate-on-deploy | Tyler, PR #21 review | Not written |
| Post standups in the agreed format | AGENTS.md §7 | See the Sprint 2 standups |

**[TO VERIFY]** Add your own reflections, and any feedback Tyler gave outside these PR reviews.
