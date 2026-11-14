# Sprint 1 — Standups

AGENTS.md §7 asks for standups in the format `Date · Yesterday · Today · Blockers`, with issue numbers, and at least 3 entries per team member.

We did not post standups in that fixed format. This file records what actually exists instead:
- **Section 1:** the status updates each partner posted asynchronously in Slack #kanban-board-project. Each one is summarized from the post; none has been rewritten into Yesterday/Today fields.
- **Section 2:** each partner's progress log, taken from GitHub commits, PRs and reviews.

All times are Pacific.

## 1. Async status updates in Slack

| Date | Who | Update (as posted) | Blocker (as posted) | Issue |
|---|---|---|---|---|
| Oct 28, 7:20 PM | Tyler | Held a Teams meeting to reconcile the AGENTS.md files. Haomiao will make the final edits and move the working version to `main`. | — | #14 |
| Oct 29, 2:56 PM | Tyler | Submitted a PR for `chore/1-prisma-setup`. | #1 blocks later issues, so he is waiting for feedback and the merge before starting other issues. | #1 |
| Oct 31, 2:26 PM | Haomiao | Reviewed #15. | Prisma 7's `migrate dev` doesn't generate the client: add `npx prisma generate` to README step 3, and add `Closes #1` and the test SHAs to the PR body. | #1 |
| Oct 31, 2:47 PM | Tyler | Made the requested changes and resubmitted. Noted that the GitHub Copilot model in VS Code didn't check that its code worked; he had to make it follow the done criteria. | Possibly the Definition of Done in AGENTS.md isn't emphasized enough for VS Code models. | #1, #14 |
| Oct 31, 3:47 PM | Tyler | Reviewed the PR for #6. | Two blocking items: the 768px breakpoint isn't tested, and the count pill has no screen-reader context. | #6 |
| Nov 1, 1:45 PM | Tyler | Implemented the #4 login journey; waiting on review. | Running low on GitHub tokens; used Claude to partly review the work. | #4 |
| Nov 2, 12:24 PM | Tyler | Working locally on #5 while #4 waits for approval, so he can build on a finished auth foundation. | Waiting on the #4 review. | #5 |
| Nov 2, 1:25 PM | Haomiao | Merged #17; #4 is closed. | — | #4 |

**[TO VERIFY]**
- Two threads show only "3 replies" in the screenshots: Oct 31 at 3:47 PM (the #6 review) and Nov 1 at 1:45 PM (#4). Add anything that was decided in them.
- Add any other Sprint 1 updates from the channel that the screenshots don't show.

## 2. Progress logs from GitHub

### Tyler Sarna

| Date | Work | Evidence |
|---|---|---|
| Oct 28 | Closed #14 after shared AGENTS.md v4 landed on `main` | #14 closed 10:34 PM; `2dfacec` |
| Oct 28 | #1: red `4abc66b`, `8950505` → green `415ced2`, `b1a0732`; opened PR #15 | PR #15 opened 11:03 PM |
| Oct 31 | #1: addressed review (`42f1f8e` docs; tests `ff2708b`, `115421d`, `15f58d3`; fix `880dba5`) | PR #15 approved 3:13 PM, merged 3:17 PM |
| Oct 31 | Reviewed PR #16 (#6): changes requested 3:34 PM; approved and merged 4:15 PM | PR #16 reviews |
| Nov 1 | #4: red `dd967bc`, `d71db48` → green `3e04319`; opened PR #17 | PR #17 opened 1:36 PM |
| Nov 1 | #4: addressed review (red `c02b9c5` → fix `98e2cb7`, `ac1cdec`, `5a8288a`) | PR #17 commits around 5:13 PM |
| Nov 2 | #5: red `720a5d8` → green `ed15b89`, plus follow-up red/green pairs; opened PR #18 | PR #18 opened 3:38 PM, merged 4:21 PM |
| Nov 2 | Filed bug #19: POST /projects returns 500 for a deleted user's token | Issue #19, 4:26 PM |

### Haomiao Shi

| Date | Work | Evidence |
|---|---|---|
| Oct 25 | Scaffolded the repo, PRD and mockup; created issues #1–#13 and milestones | `4b438ae`; issues dated Oct 25 |
| Oct 26 | Posted the Sprint 1 plan and split; assigned issues; opened #14 | Slack Oct 26; #14 |
| Oct 28 | Teams call with Tyler on AGENTS.md (per Tyler's Slack post) | Slack Oct 28 |
| Oct 28 | Committed shared AGENTS.md v4 and DESIGN.md | `2dfacec`, 9:15 PM, pushed directly to `main` |
| Oct 28 | #6: red `903d838` → green `0fccc96` | commits at 9:28 and 9:30 PM |
| Oct 31 | Reviewed PR #15: changes requested 2:23 PM; approved 3:13 PM and merged | PR #15 reviews |
| Oct 31 | #6: opened PR #16; addressed Tyler's review (red `712e271` → fix `803ad0a`) | PR #16 |
| Nov 1 | Reviewed PR #17 (#4): changes requested 3:16 PM for an open redirect in `safeNextPath`, a missing test-database migration step, and README setup | PR #17 review |
| Nov 2 | Approved and merged PR #17 (1:25 PM) and PR #18 (4:21 PM) | PR #17, PR #18 |
| Nov 3 | #2: red `75c8a8b` → green `891120d`; PR #20 merged 6:50 AM | CI [red run 41648143893](https://github.com/stone-coding/team-task-board-copilot/actions/runs/41648143893), [green run 41648418888](https://github.com/stone-coding/team-task-board-copilot/actions/runs/41648418888) |
| Nov 3 | #3: red `bfdf711` → green `b19bb40`, Vercel + Neon; PR #21 merged 7:04 AM | [CI run 41658923223](https://github.com/stone-coding/team-task-board-copilot/actions/runs/41658923223) |
