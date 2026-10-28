# HW3 Before/After: Issue #1 with and without AGENTS.md

**Author:** Tyler Sarna · **Tool:** GitHub Copilot Chat (agent, model `auto`), VS Code · **Date:** Oct 27–28, 2026
**Feature:** Issue #1, "Set up Prisma with PostgreSQL schema for users, projects, and tasks" (Sprint 1, labels `chore`, `priority:high`)

| | Without rules | With rules (AGENTS.md v3) |
|---|---|---|
| Branch | `hw3/run5-no-rules-valid` | `hw3/run6-rules-v3-valid` |
| Commits | `adc7056` | `6bb4763` (red test), `901ebb4` (green) |
| Rules file | none | `AGENTS.md` v3, commit `749a5cb` on `sarna-rules-experiment` |

## 1. Methodology

Every run has its own branch, named `hw3/run<N>-<rules-vX|no-rules>-<valid|contaminated>` in the order the runs happened. "Contaminated" means the run saw rules or earlier answers it should not have.

| Run | Branch | Condition | Outcome |
|---|---|---|---|
| 1 | `hw3/run1-no-rules-valid` | No rules (Oct 27) | Shared a chat with run 2 afterwards |
| 2 | `hw3/run2-rules-v1-contaminated` | AGENTS.md v1, same chat as run 1, setting off | Same code as run 1 |
| 3 | `hw3/run3-no-rules-contaminated` | Meant as no rules, but v2 was loaded and it read old commits | Discarded |
| 4 | `hw3/run4-rules-v2-valid` | AGENTS.md v2, clean worktree | 3/6 criteria; led to v3 |
| 5 | `hw3/run5-no-rules-valid` | No rules, clean worktree | 4/6 criteria |
| 6 | `hw3/run6-rules-v3-valid` | AGENTS.md v3, clean worktree | 6/6 criteria |

Runs 5 and 6 are the matched pair compared below.

It took three rounds to get a clean comparison. Rounds 1 and 2 were flawed, and fixing those flaws is part of the iteration story (§5).

**Final round (the one compared below):**

| Condition | No rules | Rules |
|---|---|---|
| Start point | New git worktree at scaffold `4b438ae` | New git worktree at scaffold `4b438ae` |
| Rules input | No AGENTS.md; `"chat.useAgentsMdFile": false` | AGENTS.md v3 (uncommitted); `"chat.useAgentsMdFile": true` |
| Chat | Brand-new chat in that folder | Brand-new chat in that folder |
| Mode and model | Plan mode, `auto` | Plan mode, `auto` |
| Prompt | "Lets come up with a plan to implement Issue 1" | identical |
| Follow-ups | Approve plan; "commit this to github" | Approve plan; "Add the AGENTS.md file to tracking and commit to Github" |
| Verified | Copilot's session log shows no AGENTS.md text in the instructions | Session log shows v3 text in the instructions ("R3 Test-first gate") |

Afterwards I re-ran every check on both branches with Node 22.23.4. I also checked the acceptance criteria against the GitHub issue body, which both agents read.

**Earlier rounds (discarded):**

| Round | Branches | Why it was discarded |
|---|---|---|
| 1 (Oct 27) | `hw3/run1-no-rules-valid` vs `hw3/run2-rules-v1-contaminated` | Both runs were in one chat, and `chat.useAgentsMdFile` was still `false` for the rules run. The Prisma code came out byte-identical. |
| 2 (Oct 28) | `hw3/run3-no-rules-contaminated` vs `hw3/run4-rules-v2-valid` | The "no-rules" chat began with AGENTS.md v2 loaded and read the round-1 commits. The v2 rules run was clean, but met only 3/6 criteria. Its failures shaped v3. |

## 2. Results against Issue #1's acceptance criteria

| Acceptance criterion (from the issue) | No rules | Rules v3 |
|---|---|---|
| Prisma installed; schema matches PRD §6 | ✅ | ✅ |
| Project→User and Task→Project cascade; `(projectId, status)` index | ✅ | ✅ |
| Initial migration committed; `npx prisma migrate dev` works with `docker-compose.yml` | ⚠️ Files committed but never run (it found Docker unavailable and gave up) | ✅ Applied to a Compose PostgreSQL; `migrate status`: "Database schema is up to date!" |
| `src/server/db.ts` exports a hot-reload-safe PrismaClient singleton | ❌ Throws on import: "PrismaClient requires a driver adapter" (Prisma 7) | ✅ Uses `@prisma/adapter-pg`; constructs without a database |
| `.env.example` documents `DATABASE_URL`; `.env` ignored | ✅ | ✅ |
| `npm run lint`, `typecheck`, `test` pass | ✅ | ✅ |
| **Criteria met** | **4 / 6** | **6 / 6** |

The `db.ts` result comes from a one-off test that imports the module on each branch. Typecheck does not catch the no-rules crash, because the constructor's types accept an empty options object.

## 3. Measured differences

| Metric | No rules | Rules v3 |
|---|---|---|
| Acceptance criteria met | 4 / 6 | 6 / 6 |
| New unit tests | 0 | 9 (in `prisma-schema.test.ts` and `prisma-client.test.ts`) |
| Failing-test commit before implementation | No | Yes, `6bb4763`. Re-run: 8 assertion failures plus a missing `@/server/db` module |
| Definition of done run by the agent | lint, typecheck, test | lint, typecheck, test, build, E2E, `prisma validate`, `migrate status` |
| My re-run: lint / typecheck / test / build / E2E | pass ×5 | pass ×5 (after `prisma generate`) |
| Branch created before editing | No (at commit time) | Yes |
| Commit format (§7) | `chore(#1): …`, no `Refs #1` | `test(#1)` and `feat(#1)`, both with `Refs #1` |
| Pushed without being asked to push | n/a | Refused, citing AGENTS.md |
| Files changed | 11 (+1692 / −51) | 13 (+2092 / −44) |
| Time from prompt to "done" | ≈ 4.3 min | ≈ 7.7 min |

### Code snippets: the same file, with and without rules

`src/server/db.ts` **without rules** (crashes in Prisma 7):
```ts
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
```

`src/server/db.ts` **with rules** (AGENTS.md §2 "Prisma 7" told it about the adapter):
```ts
return new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});
```

The test the rules run wrote first, which turns that runtime crash into a failing test:
```ts
// tests/unit/prisma-client.test.ts (hw3/run6-rules-v3-valid)
expect(prisma).toBeTruthy();
expect(typeof prisma.$connect).toBe("function");
```

## 4. Threats to validity

- **The rules run saw earlier work.** The worktrees share one repository's branches. Before writing its tests, the rules agent viewed the no-rules branch's schema, `db.ts`, and config, and the round-2 tests, calling them "prior art". Its decisive choices (the `prisma-client` generator, the driver adapter, testing `db.ts`) appear in AGENTS.md v3 and are absent from the no-rules code. Even so, the run is not fully independent. Next time, use a separate `git clone`.
- **The environment differed.** Docker was not running for the no-rules run, which gave up on it. The rules agent started Docker Desktop itself. That is an agent-behavior difference, but it also gave the rules run an advantage when verifying migrations.
- **Test expectations changed after the red commit.** In `901ebb4` the rules run weakened one assertion (`toBeInstanceOf(PrismaClient)` became truthy plus a `$connect` check), adapted two to its implementation, and added one stricter check. AGENTS.md forbids changing expectations to get a pass.
- **One run per condition.** LLM output varies, so these are single samples, not averages.

## 5. Iteration on AGENTS.md (v1 → v3)

| Version | Trigger | Main changes |
|---|---|---|
| v1 (`8502947`) | Initial | Stack, architecture, TDD, git, security, a11y, R1–R7 |
| v2 (`28cf9b8`) | Round 1, plus course weeks 6–8 | Visual spec moved to `DESIGN.md`; Node ≥ 22.12; plan-first R0; commit-body rule; criteria map; PR self-review; pair/sprint rules; under ~200 lines |
| v3 (`749a5cb`) | Round 2: the v2 rules run met 3/6 | Issue body is the criteria source (v2 had pointed #1 at PRD §6, so the run missed docker-compose, `db.ts`, and the migration). R0 is a plan-only first reply; R3 is a hard test-first gate. Approved #1 packages. Prisma 7 rules: `prisma-client` generator (v2 used `prisma-client-js`, so lint failed), `dotenv/config`, driver adapter, migrations without a database. A test must construct the db client. |

**What worked:** rules that named concrete facts the model could not infer, like the Prisma 7 adapter, the generator name, and where criteria live. They changed the output directly. Rules phrased as a hard gate with an observable action ("your first commit is `test(#N)`", "end with 'Waiting for approval.'") were followed in v3. The softer v2 wording ("follow §6") was skipped.

**What didn't:** a wrong pointer in the rules file was worse than no rule. v2's backlog map sent the agent to the PRD instead of the issue, and the no-rules run (which read the issue) beat it. Ask-first rules about downloads were still bent: v3's run started Docker and pulled a Postgres image without asking.

**Next changes:** list Docker and image pulls under ask-first. Forbid reading other branches during a run. Forbid editing a test's expectations after the red commit unless the plan is re-approved. Add `prisma generate` to the README setup and the definition of done.

## 6. Conclusion

Under matched conditions, AGENTS.md v3 produced a measurable improvement. It met 6/6 acceptance criteria instead of 4/6, added 9 tests instead of 0, kept a verifiable red → green history, ran the full definition of done, and followed the branch, commit, and push rules. The no-rules code looked complete but shipped a database client that crashes on first import. The rules run wrote a test that catches that crash. The improvement came only after two rounds of fixing both the method (separate chats, separate worktrees, the VS Code setting) and the rules file itself. That is the main lesson about context engineering: the rules file is only as good as its last test against a real feature.
