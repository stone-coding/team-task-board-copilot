# Sprint 2 — Review

Sprint 2 ran from Nov 3 to Nov 13, 2026, with the deadline at 11:30 PM PST on Nov 13. Haomiao Shi did all of the Sprint 2 work, solo from Nov 11 onward. Status below is as of **Nov 14, 2026**. Times are Pacific.

## Delivered (merged to `main`)

**11 of 16 points delivered.** All five issues below were merged on Nov 11.

| Issue | Pts | PR | Red → green | CI | Merged |
|---|---|---|---|---|---|
| #7 Tasks CRUD API, owner-scoped | 3 | #24 | `4d319be` → `a3d0e11` | [43127067488](https://github.com/stone-coding/team-task-board-copilot/actions/runs/43127067488) | 4:32 PM |
| #19 401 for a deleted user's token | 1 | #25 | `a883632` → `a1953c4` | [43129157975](https://github.com/stone-coding/team-task-board-copilot/actions/runs/43129157975) | 7:45 PM |
| #8 Board ↔ tasks API, optimistic updates | 3 | #26 | `81410a8` → `182ad8f` | [43129857977](https://github.com/stone-coding/team-task-board-copilot/actions/runs/43129857977) | 7:46 PM |
| #9 Task create/edit/delete UI | 2 | #29 | `1d142b9` → `6d30332` | [43132358249](https://github.com/stone-coding/team-task-board-copilot/actions/runs/43132358249) | 7:47 PM |
| #12 Core journey E2E | 2 | #30 | `2dd8105` → `f613d19` | [43132666750](https://github.com/stone-coding/team-task-board-copilot/actions/runs/43132666750), 5 of 5 attempts green | 8:18 PM |

- The latest CI run on `main` passed: [run 43153941669](https://github.com/stone-coding/team-task-board-copilot/actions/runs/43153941669) on `4b01336`.
- Vercel deployed each merge to production.
- PR #22 (AGENTS.md v6, a process document) also merged on Nov 11.

## Not delivered (PR open, not merged by the deadline)

**5 points not delivered.** All three PRs were opened on Nov 11 with CI green and a working Vercel preview. #31's preview needed a redeploy after the Nov 11 Neon fix.

| Issue | Pts | PR | Red → green | CI |
|---|---|---|---|---|
| #10 CodeQL, npm audit, Dependabot | 1 | #27 | `92e26c3` (CI red) → `46ac947` | [43131661036](https://github.com/stone-coding/team-task-board-copilot/actions/runs/43131661036); CodeQL 0 alerts |
| #11 OpenAPI docs at `/api/docs` | 2 | #28 | `2255f8e` → `7c76ab8` | [43131474172](https://github.com/stone-coding/team-task-board-copilot/actions/runs/43131474172) |
| #13 README, diagrams, setup/deployment guide | 2 | #31 | docs-only `50e9208` | [43133020573](https://github.com/stone-coding/team-task-board-copilot/actions/runs/43133020573) |

Other work that was not delivered:
- **Sprint records (PR #23):** this file is part of it.
- **The stretch idea from Nov 5,** a distinctive feature: not started.
- **The Sprint 1 follow-ups from Tyler's Nov 4 reviews:** see the Sprint 1 retro.

## Demo

- **[TO VERIFY]** There was no Sprint 2 review meeting. If you recorded a demo, add it here (video link or date).
- **What works on production after the Nov 11 merges:**
  - register and log in;
  - create a project and open its board;
  - add, edit and delete tasks;
  - change a task's status, which saves to the API and survives a reload.
- **The same journey is automated** in `e2e/core-journey.spec.ts` (#12).
