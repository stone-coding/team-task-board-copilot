# HW3 Reflection: Context Engineering for Team Task Board

**Author:** Tyler Sarna · **Course:** CS6983 · **Tool:** VS Code + GitHub Copilot Chat · **Date:** October 29, 2026

The evidence for the points below is in [`sarna-rules-comparison.md`](sarna-rules-comparison.md). Under matched conditions on Issue #1, the run with no rules met 4 of 6 acceptance criteria and the AGENTS.md v3 run met 6 of 6.

## 1. How the rules file bridges the PRD and mockups to implementation

Our PRD and mockups were written in Claude Web. The IDE agent never saw that conversation, so AGENTS.md has to carry that context into every chat. It does this in three ways.

**It points to the sources instead of copying them.** §1 sends the agent to `docs/prd.md` for user stories and the data model, to `DESIGN.md` for tokens and components, and to `docs/mockups/` at both breakpoints. If the model cannot view images, it reads `board.html` instead. The file loads on every request, so a pointer costs a few tokens and a pasted spec would cost thousands.

**It turns our intent into rules an agent can check.** A mockup shows three columns; the rules say *three `<section>` columns in `TASK_STATUSES` order, each `<h2>` holding only the title, a count pill beside it, "No tasks yet" when empty, and a native `<select>` named "Status for {task title}"*. These are things a test can query by role and name. Statuses come only from `src/lib/task-status.ts`, so the UI, the API, and the schema cannot drift apart.

**It names the one source of acceptance criteria.** This was the most important lesson. v2's backlog map sent Issue #1 to PRD §6. The PRD describes the schema but not the docker-compose file, `db.ts`, or the migration, so the v2 run met only 3 of 6 criteria. The run with no rules read the issue directly and did better. v3 makes the issue body the source of criteria and the PRD the background, and that change recovered three criteria. This was a useful experiment, because it let us know that bad information is worse than no information. 

The rules also fill in facts the model cannot infer from its training data. Prisma 7 needs a driver adapter, and its generator is `prisma-client`, not `prisma-client-js`. Without that rule, the agent wrote a `db.ts` that typechecks but throws on first import. With it, the agent wrote the adapter and a test that would have caught the crash.

**A limit:** Issue #1 is a database issue, so my experiment exercised the PRD and stack rules but not the mockup rules. Whether `DESIGN.md` really transfers the mockup intent is still untested. My partner's experiment on the board UI (#6) covered that side, using hidden Playwright acceptance tests.

## 2. How the GitHub Scrum setup organizes AI-assisted development

The Scrum setup is not just our project-management tool, but also how the agent gets its context.

- **One issue = one chat = one branch.** Each issue has an action-oriented title, an acceptance-criteria checklist, labels, a milestone, an estimate, and dependencies. That makes it a complete, bounded prompt. "Let's come up with a plan to implement Issue 1" was the entire prompt in both runs, and both agents read the issue body and planned from its checklist.
- **The checklist doubles as the test plan.** R0 makes the agent map each criterion to a test before editing anything, and R3 makes the failing test the first commit. The result for #1 was nine tests and a red commit (`6bb4763`) before the green one (`901ebb4`). That gives a reviewer something to verify against rather than just a diff. 
- **Issue numbers tie the trail together.** Branch `feature/<N>-<slug>`, commits `type(#N): …` with `Refs #N`, PR `Closes #N`, and temporary code `// TODO(#N)` link every artifact back to the issue that justified it. The rules run followed all of these. The run with no rules used `chore(#1)` but created its branch only at commit time and left out `Refs #1`.
- **Milestones and the board scope the agent.** The backlog map and the Sprint 1/Sprint 2 milestones tell the agent what is out of scope. The approved-dependency list is keyed by issue number, so the agent may install `zod` for #4 but not for #1. Sprint 1 issues sit in Sprint Todo, so the next unit of work is always obvious.
- **The pair process runs through the same system.** When my partner and I wrote different rules files (their v2, my v3), we opened Issue #14 and merged the two into a shared v4 on `main`. Changing the rules file now goes through the same issue → PR → review loop as code.

## 3. What worked, what didn't, and how I iterated

| Round | What I learned | What I changed |
|---|---|---|
| 1 (v1) | Both runs shared a chat, and `chat.useAgentsMdFile` was off, so the "rules" run never loaded the rules. The code came out byte-identical. | Updated method: a new chat per run and the VS Code setting turned on and verified in Copilot's session log. |
| 2 (v2) | The "no-rules" run was contaminated by v2 and by old commits. The clean v2 run met 3 of 6 criteria. | Updated method: a separate git worktree per run. The rules: v3 (issue body as source of criteria, plan-only R0, hard R3 gate, Prisma 7 facts). |
| 3 (v3) | Matched runs: 4 of 6 without rules, 6 of 6 with v3. | Kept v3; merged with my partner's v2 into the shared v4. |

**What worked:** concrete facts the model could not know, and gates with an observable action ("end with 'Waiting for approval.'", "the first commit is `test(#N)`"). The rules run followed every one of these.

**What didn't work:** soft wording ("follow §6") was skipped. Ask-first rules were bent: the v3 agent started Docker and pulled a Postgres image without asking. The agent also weakened one test expectation after the red commit, and read the other run's branch as "prior art". The experiment itself needed as much debugging as the rules did. Two of three rounds were invalid because of setup, not because of the rules.

## 4. What I would add or change for Sprint 2

1. **Close the gaps the experiment found.** List Docker and image pulls explicitly under ask-first. Forbid editing a test's expectations after the red commit unless the plan is re-approved. Add `npx prisma generate` to setup and the definition of done.
2. **Fix the API contract before #7 starts.** v4 already has the API rules: the error shape, zod at the boundary, owner-scoped queries returning 404, and OpenAPI updated in the same PR. But #7, #8, and #11 all depend on one contract, so I would have my partner and me agree on `docs/api/openapi.yaml` first and point the rules at it as the source of truth.
3. **Keep the file short.** v4 is 172 lines. Going into Sprint 2, each rule should replace a weaker one or link to a doc, so the file stays under about 200 lines and is reviewed at each retro.

**Conclusion:** A rules file should add what the agent is missing. It became useful only after I tested it, read where the agent went wrong, and rewrote the rules to fix those failures. It is very likely that I will continue to run into shortcomings of the existing file and need to change or update it as the project goes on. For example, after we merged our files into v4, I reimplemented Issue 1 and noticed a couple of key performance regressions on the single run of it that I tried. I may need to experiment with it again and try alternate phrasings of our file to see if those can get the agent to follow the rules as it is supposed to. This may have something to do with the VScode Github harness or possibly the exact models being used though, because when I ran the experiment as a test in Claude Code, that model followed the rules precisely. 
