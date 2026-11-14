# Sprint 2 — Standups

Format required by AGENTS.md §7: `Date · Yesterday · Today · Blockers`, with issue numbers, and at least 3 entries per member. From Nov 11, Haomiao is the only member.

**No standups were held in Sprint 2.** Tyler did not attend the Nov 5 planning call and left on Nov 6. The record below is Haomiao's progress log: each entry is backed by a Slack message, a GitHub PR, a commit or a CI run. Nothing has been added for days with no recorded activity.

All times are Pacific.

## Haomiao Shi — progress log

### Nov 3

- **Done:**
  - Finished the Sprint 1 carryover. #2 merged (PR #20, 6:50 AM) and #3 merged (PR #21, 7:04 AM).
  - `main` CI green: [run 41660146656](https://github.com/stone-coding/team-task-board-copilot/actions/runs/41660146656).
- **Next:** Sprint 2 planning with Tyler.
- **Blockers:** none recorded.

### Nov 4–5

- **Done:**
  - Nov 4: joined Canvas P2 Group 5 and submitted the P2 proposal (Slack DM, 1:14 PM).
  - Nov 4: sent the Teams invite for Sprint 2 planning (3:06 PM).
  - Nov 5: attended the planning call from 7:02 PM.
  - Nov 5: posted the proposed #7–#13 / #19 split at 7:15 PM.
- **Next:** wait for Tyler's reply on the split.
- **Blockers:** Tyler did not join the call or reply to the split.

### Nov 6–8

- **Done:**
  - Nov 6, 8:03 AM: a Slack message posted from Tyler's account on his behalf said he was leaving the university ([Slack](https://aicodingneusj.slack.com/archives/D0C0L550ENR/p1793981007745939)).
  - Nov 6, 12:04 PM: emailed Professor Guerra (cc Arvind Parekh) about the change and asked to continue the project alone.
  - Nov 8, 6:26 PM: Professor Guerra replied by email: "Yes it is ok to continue working on your own."
- **Next:** continue Sprint 2 solo.
- **Blockers:** waiting for the professor's reply until Nov 8.

### Nov 9–10

- **Not documented.** No commits, PRs, Slack messages or emails are recorded for these days.

### Nov 11

- **Done, all opened as PRs the same evening:**
  - **Setup**
    - PR #22: AGENTS.md v6 (solo arrangement, deadlines); merged 4:31 PM.
    - PR #23: sprint record templates; still open.
    - Assigned all Sprint 2 issues to Haomiao.
  - **#7** (PR #24)
    - Red commit `4d319be`, then green `a3d0e11`.
    - [CI run 43127067488](https://github.com/stone-coding/team-task-board-copilot/actions/runs/43127067488).
    - Merged 4:32 PM.
  - **#19** (PR #25)
    - Red `a883632`, then fix `a1953c4`.
    - [CI run 43129157975](https://github.com/stone-coding/team-task-board-copilot/actions/runs/43129157975).
  - **#8** (PR #26)
    - Red `81410a8`, then green `182ad8f`.
    - [CI run 43129857977](https://github.com/stone-coding/team-task-board-copilot/actions/runs/43129857977).
  - **#11** (PR #28)
    - Red `2255f8e`, then green `7c76ab8`.
    - [CI run 43131474172](https://github.com/stone-coding/team-task-board-copilot/actions/runs/43131474172).
  - **#10** (PR #27)
    - Red `92e26c3` ([failed run 43131387809](https://github.com/stone-coding/team-task-board-copilot/actions/runs/43131387809)), then green `46ac947` ([run 43131661036](https://github.com/stone-coding/team-task-board-copilot/actions/runs/43131661036)).
  - **#9** (PR #29)
    - Red `1d142b9`, then green `6d30332`.
    - [CI run 43132358249](https://github.com/stone-coding/team-task-board-copilot/actions/runs/43132358249).
  - **#12** (PR #30)
    - Red `2dd8105`, then green after merging the #9 branch (`f613d19`).
    - [CI run 43132666750](https://github.com/stone-coding/team-task-board-copilot/actions/runs/43132666750) passed on 5 attempts.
  - **#13** (PR #31)
    - Docs-only commit `50e9208`.
    - [CI run 43133020573](https://github.com/stone-coding/team-task-board-copilot/actions/runs/43133020573).
  - **Merged after self-review, 7:45–8:18 PM:** #25, #26, #29, #30.
- **Blockers:**
  - The Vercel previews for PRs #30 and #31 failed with "Resource provisioning failed".
  - Cause: the Neon Free plan's limit of 10 branches per project.
  - Resolved by deleting the Neon preview branches of merged PRs #21, #22 and #24, then redeploying. Both previews then passed, with health returning `{"status":"ok","database":"ok"}`.

### Nov 12–13

- **Not documented.** No commits, merges or reviews are recorded. PRs #23, #27, #28 and #31 stayed open through the Nov 13 deadline.

### Nov 14 (after the deadline)

- **Done:**
  - Merged PR #27 (#10) at 12:12 PM, PR #28 (#11) at 12:13 PM and PR #31 (#13) at 12:13 PM. Each issue closed with its merge.
  - `main` CI green on `07bc43d`: [run 43636387548](https://github.com/stone-coding/team-task-board-copilot/actions/runs/43636387548). The runs for the two earlier merge commits were cancelled by `cancel-in-progress`.
  - All three production deployments READY; health check `{"status":"ok","database":"ok"}`, `/api/docs` HTTP 200.
  - Finalized the sprint records in PR #23.
- **Next:** triage the Dependabot PRs #32–#39; fix `cancel-in-progress`; add the new checks to branch protection.
- **Blockers:** none recorded.
