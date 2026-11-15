# Sprint 1 — Planning

Sprint 1: Mon Oct 26 – Mon Nov 2, 2026 (GitHub milestone "Sprint 1").
Team: Haomiao Shi (`stone-coding`) and Tyler Sarna (`tysarna`).

All times are Pacific. Sources: GitHub issues, PRs and milestones, and the Slack channel
[#kanban-board-project](https://aicodingneusj.slack.com/archives/C0CCB56S87L).
Items marked **Not documented** have no evidence in GitHub or the Slack screenshots.

## Goal

- Milestone description: "DB schema, CI, deploy, auth, projects, board on mock data."
- Slack planning post, Oct 26: "Build the foundation of our full-stack app, including the database, authentication, and core task management functionality."

## Product Owner / Scrum Master

**Not documented.** AGENTS.md v4/v5 §7 says "PO and Scrum Master rotate each sprint", but neither it, GitHub nor the Slack screenshots name who held the roles in Sprint 1.

## Planning discussion

Held asynchronously in Slack #kanban-board-project on Oct 26, 7:00–7:33 PM.

- **7:00 PM, Haomiao, proposed plan:**
  - one branch per issue from `main`;
  - decide ownership from dependencies and workload;
  - 5+ issues in the Sprint 1 milestone, each with estimates and acceptance criteria;
  - TDD, with failing tests committed first;
  - partner review on every PR;
  - 3 standups each;
  - a retrospective with feedback from both partners.
- **7:02 PM, Tyler:**
  - agreed, and proposed taking #1 because it has no dependencies;
  - suggested #6 go to Haomiao, who had built it for HW3;
  - suggested #4 and #5 go to the same person so neither partner blocks the other;
  - flagged the shared AGENTS.md as a blocker, to be tracked as its own issue.
- **7:18 PM, Haomiao:** proposed the split in the table below. Tyler agreed at 7:19 PM.
- **7:25–7:33 PM:**
  - agreed to consolidate both HW3 rule files into one shared AGENTS.md;
  - Haomiao assigned the six Sprint 1 issues on GitHub and opened shared issue #14 (7:32 PM);
  - agreed a Teams call for Wed Oct 28 at 7 PM, which Tyler set up.

## Issues and estimates

Haomiao (`stone-coding`) created the issues on Oct 25. Each estimate is taken from the issue's "Estimate" section.

| Issue | Title | Estimate | Assignee |
|---|---|---|---|
| #1 | Set up Prisma with PostgreSQL schema for users, projects, and tasks | 2 | Tyler Sarna |
| #4 | Implement user registration and login with JWT | 3 | Tyler Sarna |
| #5 | Implement projects API and projects list page | 3 | Tyler Sarna |
| #2 | Add CI pipeline that runs lint, typecheck, unit, and E2E tests on every PR | 2 | Haomiao Shi |
| #3 | Deploy to Vercel with preview deployments and Neon environments | 2 | Haomiao Shi |
| #6 | Build three-column Kanban board with mock data | 2 | Haomiao Shi |
| #14 | Consolidate shared AGENTS.md rules for Project 2 | "TBD jointly" (issue text) | Both |

**Committed:** 14 points (Tyler 8, Haomiao 6), plus #14, which has no estimate.

## Dependencies noted at planning

- **#1 blocks most other work.** Tyler's Oct 29 Slack update: he would wait for #1 to merge before starting other issues.
- **#4 comes before #5**, and both stay with one owner.
- **#14 (the shared AGENTS.md)** was to be agreed before substantial development continued.
