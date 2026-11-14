# Sprint 1 — Review

Sprint 1 ended Mon Nov 2, 2026, the "Sprint 1" milestone's due date. All times are Pacific.

## Delivered

All 6 planned issues are closed, and so is #14. That is **14 of 14 points**: 10 merged by Nov 2, and 4 (#2 and #3) merged on the morning of Nov 3.

| Issue | Pts | Owner | PR | Red → green | Review | Merged |
|---|---|---|---|---|---|---|
| #14 Shared AGENTS.md | — | Both | none (`2dfacec` committed directly to `main`) | — | Teams call on Oct 28 (per Slack) | Oct 28 |
| #1 Prisma + PostgreSQL schema | 2 | Tyler | #15 | `4abc66b` → `415ced2` | Haomiao requested changes, then approved | Oct 31 |
| #6 Three-column board (mock data) | 2 | Haomiao | #16 | `903d838` → `0fccc96` | Tyler requested changes, then approved | Oct 31 |
| #4 Registration and login with JWT | 3 | Tyler | #17 | `dd967bc` → `3e04319` | Haomiao requested changes, then approved | Nov 2 |
| #5 Projects API + list page | 3 | Tyler | #18 | `720a5d8` → `ed15b89` | Haomiao approved | Nov 2 |
| #2 CI pipeline | 2 | Haomiao | #20 | `75c8a8b` (CI red) → `891120d` (CI green) | None before merge; Tyler posted a post-merge review on Nov 4 | **Nov 3** |
| #3 Vercel + Neon + health check | 2 | Haomiao | #21 | `bfdf711` → `b19bb40` | None before merge; Tyler posted a post-merge review on Nov 4 | **Nov 3** |

After #2 and #3 merged:
- CI on `main` was green ([run 41660146656](https://github.com/stone-coding/team-task-board-copilot/actions/runs/41660146656) on `c7b9dba`).
- Production was live on Vercel, and `/api/v1/health` returned `{"status":"ok","database":"ok"}`. Tyler checked this in his Nov 4 review of PR #21.

## Not delivered

- **No planned issue is still open.** But #2 and #3 finished one day after the sprint ended (PRs #20 and #21 merged on Nov 3).
- **#2 and #3 were merged without a partner review**, which AGENTS.md §7 requires. Tyler pointed this out in his Nov 4 post-merge reviews.
- **New work found during the sprint:** Tyler filed #19 on Nov 2 (POST /projects returns 500 for a deleted user's token). It moved to Sprint 2.
- **Tyler's Nov 4 follow-ups were not filed as issues:**
  - CI `cancel-in-progress` also cancels pushes to `main`;
  - CI workflow `permissions` should be least-privilege;
  - the health check needs a timeout for a hung database;
  - `vercel-build.mjs` needs hardening;
  - ADRs are needed for Neon and for migrate-on-deploy.

## Demo

- **[TO VERIFY]** GitHub and the Slack screenshots record no Sprint 1 demo or review meeting. If one happened, add the date, attendees and what was shown. Otherwise, keep this note.
- What a user could do by the end of the sprint:
  - register and log in (#4);
  - create, list and delete projects (#5);
  - view the board with mock data and change a task's status (#6);
  - reach the production deployment and its health check (#3).
