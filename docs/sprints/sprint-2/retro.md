# Sprint 2 — Retrospective

This is a solo retrospective by Haomiao Shi. No retrospective meeting was held, because Tyler had left the project on Nov 6. Section 1 is Haomiao's own reflection. Section 2 lists the evidence from the Sprint 2 PRs, CI runs, Slack and email that supports it.

## 1. Haomiao's retrospective

**What went well:** After my teammate became unavailable, I adapted the Sprint 2 plan and continued development independently with the professor's approval. I completed the remaining feature, testing, security, API documentation, and deployment-related work using issue-based branches, TDD, and CI checks.

**What could improve:** The unexpected transition reduced opportunities for pair programming, partner standups, and peer reviews. Several PRs were merged after the internal Sprint 2 milestone deadline, and documentation needed additional consolidation.

**Action items:** Maintain smaller, independently testable tasks, track progress more consistently, verify production deployment after merges, and document changes to project scope and team availability promptly.

## 2. Supporting evidence

### What went well

- **The plan was adapted with written approval.** Haomiao emailed Professor Guerra on Nov 6, and the professor replied on Nov 8 that continuing alone was fine. AGENTS.md v6 (#22, Nov 11) recorded the solo process.
- **Every Sprint 2 code PR kept a red `test(#N)` commit before its implementation.**
  - #10's red commit was proven in CI with a failed run (43131387809).
  - #12's red commit was proven on `main` before #8 and #9 existed: it failed because the board still used mock data and showed "not found" for a real project.
- **Dependent issues were stacked so work didn't wait on reviews:** #8 → #9 → #12 → #13. Each PR stated its merge order, and the merges kept that order.
- **The core journey has an automated E2E test** (#12): register → log in → create project → add task → change status → reload. It passed on 5 of 5 CI attempts.
- **The Vercel preview failure was diagnosed from evidence, not guessed.** "Resource provisioning failed" happened before any build log, and Vercel lists the Neon branch step as a required preview action. The fix was confirmed by redeploying after deleting stale branches.
- **Production was checked after the Nov 14 merges.** All three production deployments were READY, the health check returned `database: ok`, and `/api/docs` returned 200.

### What could improve

- **Losing the partner was absorbed late.**
  - Nov 5 planning had no confirmation, and Tyler left on Nov 6.
  - No Sprint 2 code was written until Nov 11, three days after the Nov 8 approval.
  - That left two days before the internal deadline. PRs #27, #28 and #31 (5 points) were not merged by Nov 13; they were merged on Nov 14, before the Canvas deadline of Nov 15.
- **Self-review is weaker than partner review.**
  - In Sprint 1, partner reviews found real bugs (an open redirect, an untested breakpoint).
  - In Sprint 2, PRs #22 and #24 merged 13 and 8 minutes after they were opened.
- **Stale Neon preview branches blocked deployments.**
  - Neon deletes a preview branch only when its Vercel deployment is removed, so merged PRs kept their branches.
  - Neon was at 9 of 10 branches after the Nov 11 redeploys.
- **Some pushes to `main` lost their CI results.** `cancel-in-progress` cancelled five runs: 43127961226, 43150322186 and 43150450992 on Nov 11, and 43636232491 and 43636314486 on Nov 14. Tyler flagged this on Nov 4 and it is still not fixed.

### Action items

Status checked Nov 14.

| Action | Owner | Status |
|---|---|---|
| Merge or close PRs #27, #28 and #31 | Haomiao | Done. Merged Nov 14, 12:12–12:13 PM: after the internal deadline, before the Canvas deadline. |
| Set `cancel-in-progress` to apply only to `pull_request` events | Haomiao | Not done. It recurred on Nov 14. |
| Add "Dependency audit" and CodeQL to `main`'s required checks | Haomiao | Not done. #27 is merged, but the required checks are still Lint and typecheck, Unit and integration tests, and Build and E2E. |
| Triage the Dependabot PRs #32–#39 | Haomiao | Not done |
| Delete the Neon preview branches of merged PRs; consider a GitHub Action that deletes the branch when a PR closes (needs a Neon API key secret) | Haomiao | Not done as of Nov 11; not rechecked since |
| Close the Sprint 1 and Sprint 2 milestones (Sprint 2 after PR #23 merges) | Haomiao | Not done |
| Before splitting work in a pair project, get the plan confirmed in writing, and decide early what to do if a partner stops responding | Haomiao | For Project 3 |
