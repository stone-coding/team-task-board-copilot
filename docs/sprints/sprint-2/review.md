# Sprint 2 — Review

Sprint 2 ran from Nov 3 to Nov 13, 2026, with the internal Sprint 2 deadline at 11:30 PM PST on Nov 13 (AGENTS.md v6). Separately, the official Canvas Project 2 deadline is Sun Nov 15, 2026, 11:59 PM PST (Mon Nov 16, 2:59 AM EST). Haomiao Shi did all of the Sprint 2 work, solo with Professor Guerra's approval of Nov 8. Times are Pacific.

This review has two parts. Section 1 is the snapshot at the Nov 13 internal deadline (11 of 16 points). Section 2 is the Nov 14 snapshot (16 of 16 points).

## 1. Snapshot at the internal deadline (Fri Nov 13, 11:30 PM PST)

### Delivered by the internal deadline (merged to `main`)

**11 of 16 points delivered.** All five issues below were merged on Nov 11.

| Issue | Pts | PR | Red → green | CI | Merged |
|---|---|---|---|---|---|
| #7 Tasks CRUD API, owner-scoped | 3 | #24 | `4d319be` → `a3d0e11` | [43127067488](https://github.com/stone-coding/team-task-board-copilot/actions/runs/43127067488) | Nov 11, 4:32 PM |
| #19 401 for a deleted user's token | 1 | #25 | `a883632` → `a1953c4` | [43129157975](https://github.com/stone-coding/team-task-board-copilot/actions/runs/43129157975) | Nov 11, 7:45 PM |
| #8 Board ↔ tasks API, optimistic updates | 3 | #26 | `81410a8` → `182ad8f` | [43129857977](https://github.com/stone-coding/team-task-board-copilot/actions/runs/43129857977) | Nov 11, 7:46 PM |
| #9 Task create/edit/delete UI | 2 | #29 | `1d142b9` → `6d30332` | [43132358249](https://github.com/stone-coding/team-task-board-copilot/actions/runs/43132358249) | Nov 11, 7:47 PM |
| #12 Core journey E2E | 2 | #30 | `2dd8105` → `f613d19` | [43132666750](https://github.com/stone-coding/team-task-board-copilot/actions/runs/43132666750), 5 of 5 attempts green | Nov 11, 8:18 PM |

- The last CI run on `main` before the internal deadline passed: [run 43153941669](https://github.com/stone-coding/team-task-board-copilot/actions/runs/43153941669) on `4b01336`.
- Vercel deployed each merge to production.
- PR #22 (AGENTS.md v6, a process document) also merged on Nov 11.

### Not delivered by the internal deadline (PR open, not merged)

**5 points not delivered by the internal deadline.** All three PRs were opened on Nov 11 with CI green and a working Vercel preview. #31's preview needed a redeploy after the Nov 11 Neon fix.

| Issue | Pts | PR | Red → green | PR CI |
|---|---|---|---|---|
| #10 CodeQL, npm audit, Dependabot | 1 | #27 | `92e26c3` (CI red, [run 43131387809](https://github.com/stone-coding/team-task-board-copilot/actions/runs/43131387809)) → `46ac947` | [43131661036](https://github.com/stone-coding/team-task-board-copilot/actions/runs/43131661036); CodeQL [43131661084](https://github.com/stone-coding/team-task-board-copilot/actions/runs/43131661084), 0 alerts |
| #11 OpenAPI docs at `/api/docs` | 2 | #28 | `2255f8e` → `7c76ab8`, then docs `08dd98f` | [43131474172](https://github.com/stone-coding/team-task-board-copilot/actions/runs/43131474172) |
| #13 README, diagrams, setup/deployment guide | 2 | #31 | docs-only `50e9208` | [43133020573](https://github.com/stone-coding/team-task-board-copilot/actions/runs/43133020573) |

Other work not done by the internal deadline:
- **Sprint records (PR #23):** this file is part of it.
- **The stretch idea from Nov 5,** a distinctive feature: not started.
- **The Sprint 1 follow-ups from Tyler's Nov 4 comments:** see the Sprint 1 retro.

## 2. Snapshot on Sat Nov 14 (after the internal deadline)

Haomiao merged the three remaining PRs on Nov 14, about 12 hours 40 minutes after the internal deadline and before the official Canvas deadline (Nov 15, 11:59 PM PST). No commits were added to them after Nov 11; they were merged at the heads listed above.

| Issue | Pts | PR | Merged (Nov 14) | Merge commit | Issue closed |
|---|---|---|---|---|---|
| #10 | 1 | #27 | 12:12 PM | `ebca59c` | 12:12 PM |
| #11 | 2 | #28 | 12:13 PM | `e694900` | 12:13 PM |
| #13 | 2 | #31 | 12:13 PM | `07bc43d` | 12:13 PM |

- **All 16 committed points are now merged:** 11 by the internal deadline and 5 on Nov 14, all before the Canvas deadline.
- **CI on `main`:**
  - [Run 43636387548](https://github.com/stone-coding/team-task-board-copilot/actions/runs/43636387548) on `07bc43d` passed all four jobs, including the new Dependency audit.
  - The CI runs for `ebca59c` (43636232491) and `e694900` (43636314486) were cancelled by `cancel-in-progress` when the next merge was pushed.
  - CodeQL passed on all three merge commits.
- **Production:** Vercel deployed each of the three merge commits to production, and all three are READY. On Nov 14 `/api/v1/health` returned `{"status":"ok","database":"ok"}` and `/api/docs` returned HTTP 200.
- **Dependabot** (enabled by #10) opened PRs #32–#39 on Nov 14. They are not part of the Sprint 2 scope and have not been triaged.
- **Milestones:** all 9 Sprint 2 issues are closed. The "Sprint 2" milestone is still open because PR #23 is assigned to it. The "Sprint 1" milestone is also still open, with no open items.

## Demo

- **Not documented.** No Sprint 2 review meeting or recorded demo exists.
- **What works on production after the merges:**
  - register and log in;
  - create a project and open its board;
  - add, edit and delete tasks;
  - change a task's status, which saves to the API and survives a reload;
  - read the API reference at `/api/docs` (#11).
- **The core journey is automated** in `e2e/core-journey.spec.ts` (#12).
