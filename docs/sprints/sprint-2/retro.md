# Sprint 2 — Retrospective

This is a solo retrospective by Haomiao Shi. Every point below is drawn from the Sprint 2 PRs, CI runs and Slack records.

**[TO VERIFY]** Add your own reflections. These points are a starting draft.

## What went well

- **Every Sprint 2 code PR kept a red `test(#N)` commit before its implementation.**
  - #10's red commit was proven in CI with a failed run (43131387809).
  - #12's red commit was proven on `main` before #8 and #9 existed: it failed because the board still used mock data and showed "not found" for a real project.
- **Dependent issues were stacked so work didn't wait on reviews:** #8 → #9 → #12 → #13. Each PR stated its merge order, and the merges went through in that order on Nov 11.
- **The core journey has an automated E2E test** (#12): register → log in → create project → add task → change status → reload. It passed on 5 of 5 CI attempts.
- **The Vercel preview failure was diagnosed from evidence, not guessed.** "Resource provisioning failed" happened before any build log, and Vercel lists the Neon branch step as a required preview action. The fix was confirmed by redeploying after deleting stale branches.

## What to improve

- **Losing the partner was absorbed late.**
  - Nov 5 planning had no confirmation, and Tyler left on Nov 6.
  - No Sprint 2 code was written until Nov 11, after the Nov 8 approval and the v6 rules.
  - That left the issues for two days before the deadline, and three PRs (#27, #28, #31) were not merged by Nov 13.
- **Self-review is weaker than partner review.**
  - In Sprint 1, partner reviews found real bugs (an open redirect, untested breakpoints).
  - In Sprint 2, PRs #24 and #22 merged about 8–13 minutes after they were opened.
- **Stale Neon preview branches blocked deployments.**
  - Neon deletes a preview branch only when its Vercel deployment is removed, so merged PRs kept their branches.
  - Neon was at 9 of 10 branches after the Nov 11 redeploys.
- **Some pushes to `main` lost their CI results.** Three runs were cancelled by `cancel-in-progress` (43127961226, 43150322186, 43150450992). Tyler flagged this on Nov 4 and it was not fixed.

## Action items

| Action | Owner | Status |
|---|---|---|
| Merge or close PRs #27, #28 and #31 | Haomiao | **[TO VERIFY]** |
| Delete the Neon preview branches of merged PRs; consider a GitHub Action that deletes the branch when a PR closes (needs a Neon API key secret) | Haomiao | Not done |
| Set `cancel-in-progress` to apply only to `pull_request` events | Haomiao | Not done |
| After #27 merges, add "Dependency audit" and CodeQL to `main`'s required checks | Haomiao | Not done (awaiting decision) |
| Close the Sprint 1 and Sprint 2 milestones once their issues are closed | Haomiao | Not done |
| Before splitting work in a pair project, get the plan confirmed in writing, and decide early what to do if a partner stops responding | Haomiao | For Project 3 |
