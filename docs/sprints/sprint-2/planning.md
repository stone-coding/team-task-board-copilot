# Sprint 2 — Planning

**Dates:** Tue Nov 3 – Fri Nov 13, 2026.
- The deadline was Nov 10 in AGENTS.md v5. AGENTS.md v6 (#22, merged Nov 11) records Fri Nov 13, 11:30 PM PST as both the internal deadline and the official Canvas deadline.

All times are Pacific. Items marked **[TO VERIFY]** need confirmation or evidence links.

## Goal

No written sprint goal is recorded. The backlog map (AGENTS.md §7) and the "Sprint 2" milestone scope:
- connecting the board to a real tasks API (#7, #8, #9);
- security scanning (#10) and public API docs (#11);
- an end-to-end test of the core journey (#12);
- complete documentation (#13).

**[TO VERIFY]** Replace this with the goal you set, if you wrote one.

## Product Owner / Scrum Master

- **Before Nov 11:** not recorded. AGENTS.md v5 says the roles rotate each sprint. **[TO VERIFY]**
- **From Nov 11:** Haomiao Shi is both PO and Scrum Master (AGENTS.md v6 §7, PR #22).

## What happened at planning

| Date | Event | Evidence |
|---|---|---|
| Nov 4, 1:14 PM | Haomiao asked Tyler on Slack to join Canvas group "P2 Group 5" (the professor wants pairs in a group) and said the P2 proposal was submitted. | Slack DM, Haomiao ↔ Tyler **[TO VERIFY: link]** |
| Nov 4, 2:47 PM | Tyler posted post-merge reviews on PRs #20 and #21 (his last recorded activity in this repo). | PR #20, PR #21 comments |
| Nov 4, 3:06 PM | Haomiao shared the Teams invite "AI Coding Project 2 – Sprint 2 Planning with Tyler". | Slack DM |
| Nov 5, 7:02 PM | Haomiao joined the Sprint 2 planning call on Teams and messaged Tyler that he was in the meeting. | Slack DM |
| Nov 5, 7:15 PM | Tyler did not join. Haomiao waited until 7:15 PM, then posted the proposed split below asynchronously and offered to reschedule. | Slack DM |
| Nov 6, 8:03 AM | Tyler's Slack account posted a message written on his behalf by a family member. It said he would not continue at the university and asked Haomiao to let the professor know. | Slack DM |
| Nov 8 | Professor Guerra approved Haomiao continuing Project 2 solo. | **[TO VERIFY: link to the approval (email, Canvas or Slack)]** |
| Nov 11, 4:18 PM | All eight Sprint 2 issues were assigned to Haomiao. Before this they had no assignee; the Nov 5 split was only proposed. AGENTS.md v6 (#22) recorded the solo arrangement. | Issue timelines; PR #22 |

## Originally proposed split (Nov 5)

Haomiao proposed this split. It was never confirmed, because Tyler did not respond before leaving.

> For Sprint 2, I propose taking Issues #10–#13 … focusing on testing, documentation, and CI/CD, while you take #7–#9 (the three core features) #19 (current JWT issue). … you already worked on JWT authentication, PostgreSQL, and the APIs in Sprint 1.

Stretch idea, not committed: after #10–#13, a small distinctive feature, in response to the professor's feedback that "Task managers are very common, try to make it unique."

## Issues and estimates

Estimates are taken from each issue's "Estimate" section.

| Issue | Title | Estimate | Proposed (Nov 5) | Assignee (from Nov 11) |
|---|---|---|---|---|
| #7 | Implement tasks CRUD API scoped to project owners | 3 | Tyler | Haomiao Shi |
| #8 | Connect board to tasks API with optimistic status updates | 3 | Tyler | Haomiao Shi |
| #9 | Add task create, edit, and delete UI on the board | 2 | Tyler | Haomiao Shi |
| #19 | POST /api/v1/projects returns 500 for a deleted user's token; should return 401 | 1 | Tyler | Haomiao Shi |
| #10 | Add security scanning with CodeQL, npm audit, and Dependabot | 1 | Haomiao | Haomiao Shi |
| #11 | Document the public API with OpenAPI and serve it at /api/docs | 2 | Haomiao | Haomiao Shi |
| #12 | Add E2E test for the core user journey | 2 | Haomiao | Haomiao Shi |
| #13 | Write README, architecture and ER diagrams, and setup/deployment guide | 2 | Haomiao | Haomiao Shi |

**Committed:** 16 points.

## Process changes for solo work (AGENTS.md v6, #22)

- Partner review is replaced by a recorded self-review in each PR plus green CI. PRs are merged in the GitHub UI.
- One issue per PR, with red-then-green commits as before.
