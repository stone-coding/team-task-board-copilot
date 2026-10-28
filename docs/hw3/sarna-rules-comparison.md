# HW3 Before/After: Issue #1 with and without AGENTS.md

**Author:** Tyler Sarna · **Tool:** GitHub Copilot Chat (agent mode, VS Code) · **Date:** Oct 27, 2026

| | Without rules | With rules |
|---|---|---|
| Branch | `sarna-no-rules` | `sarna-rules-experiment` |
| Commits | `f89168d` | `8502947` (AGENTS.md), `e5aa018` (red test), `a6e27d5` (green) |
| Base | `4b438ae` scaffold | `4b438ae` scaffold |

> **Status: preliminary, experiments must be rerun.** This run had two flaws (see §1): both runs shared one Copilot chat, and `.vscode/settings.json` still had `"chat.useAgentsMdFile": false` during the with-rules run, so Copilot did not load AGENTS.md automatically. Both are now fixed (AGENTS.md v2 and the setting set to `true`). Rerun both experiments, each in its own fresh chat, before submitting the final comparison.

Both branches start from the same scaffold commit. The feature is **Issue #1, "Set up Prisma with PostgreSQL schema"** (Sprint 1). Its acceptance criteria come from the data model in PRD §6.

## 1. Methodology

1. **Run A (no rules).** AGENTS.md was removed from the working tree. Copilot got a brief description of Issue #1 and implemented it. The result was committed as `f89168d`.
2. **Reset.** The Prisma changes were reverted so the tree matched the scaffold again.
3. **Run B (rules).** AGENTS.md was added (`8502947`) and Copilot got the same issue. AGENTS.md was the only new input.
4. **Evaluate.** I compared the two branches with `git diff`. I also ran lint, typecheck, and build on the with-rules branch. The application code is identical on both branches (see §2), so those results apply to both.

**Threat to validity (be honest about this).** Copilot's checkpoint refs (`refs/agents/4e805c6f-…/checkpoints/turn/1…11`) show that both runs happened in **one** agent session. Turns 1–5 were Run A, turn 6 reverted it, turn 7 added AGENTS.md, and turns 8–11 were Run B. The assignment asks for a fresh chat for each run. Because the chat was shared, Run B could see Run A's conversation, and that is the most likely reason the Prisma files match byte for byte. That includes the migration folder name `20261027195700_init`, a timestamp from Run A. So this comparison measures **how the rules changed the process**, not two independent implementations. 

**Second threat: the rules may not have been loaded.** Since the scaffold commit, `.vscode/settings.json` had `"chat.useAgentsMdFile": false`, which is the no-rules setting, and it was never switched for Run B. Unless AGENTS.md was attached by hand with *Add Context* (check the chat export's *References*), Copilot saw AGENTS.md only as an ordinary repository file, not as always-loaded instructions. So "AGENTS.md was the only new input" overstates how controlled the run was.

**Rerun plan.**
1. Run A: set `"chat.useAgentsMdFile": false`, open a fresh chat, start from `4b438ae`, give the same brief prompt for Issue #1, and save the chat export.
2. Run B: set `"chat.useAgentsMdFile": true`, reload the VS Code window, and open a **new** chat from `4b438ae` with AGENTS.md v2 in place. Confirm AGENTS.md appears under *References* and save the chat export.
3. Use Node ≥ 22.12 so `npm test` runs, and record the full definition-of-done output for both branches.

## 2. What is identical

`git diff sarna-no-rules sarna-rules-experiment -- prisma prisma.config.ts package.json package-lock.json .env.example` produces no output. Both branches have the same:

- `prisma/schema.prisma`: `User`, `Project`, and `Task` models with `cuid()` ids, a `TaskStatus` enum (`TODO | IN_PROGRESS | DONE`, default `TODO`), cascade deletes, and `@@index([projectId, status])`. This matches PRD §6 exactly.
- Migration `prisma/migrations/20261027195700_init/migration.sql`, `prisma.config.ts`, `.env.example`, and the dependencies `@prisma/client`, `prisma`, and `dotenv` (^7.10.1 / ^18.0.9).

Schema quality was good in both runs because the PRD's data model was in the repo either way. The rules did not change *what* was built.

## 3. What differs

`git diff --stat sarna-no-rules sarna-rules-experiment` (with the later `.gitignore` housekeeping excluded):

```
 AGENTS.md                        | 233 +++
 README.md                        |   2 +-
 tests/unit/prisma-schema.test.ts |  54 +++
```

| Criterion (from the HW3 rubric) | Without rules | With rules | Rule that drove it |
|---|---|---|---|
| **Tests generated** | 0 tests | 4 tests, 21 assertions in `tests/unit/prisma-schema.test.ts` | §6, R3 |
| **TDD red → green history** | One combined `feat` commit | `test(#1)` commit `e5aa018` before `feat(#1)` commit `a6e27d5` | §6, R3 |
| **Test fails for the right reason** | n/a | Yes. At `e5aa018` there is no `prisma/` folder. `readIfPresent()` returns `""`, so every `toMatch` fails as an assertion instead of crashing on a missing file. | §6 "fail for the right reason" |
| **Test conventions** | n/a | `describe/it/expect` imported from `"vitest"` (globals off). Cross-module test placed in `tests/unit/`. Tests named after behavior ("defines the three task statuses and defaults new tasks to TODO"). | §6 |
| **Commit format** | `feat(#1): …`, but the body contains literal `\n\n` escape text | Conventional Commits with `Refs #1` on real separate lines | §7 |
| **Docs** | README database section | Same section, plus "requires Node.js 20.19 or later" | R5 / setup |
| **Secrets handling** | `.env*` ignored, `!.env.example` added | Same | §9 |
| **Dependency policy** | Added 3 packages without asking (no rule existed) | Added the same 3 packages. AGENTS.md says to ask before adding a dependency ("Ask first"). The chat log should show whether it asked; Issue #1 approves Prisma, but `dotenv` is not on the planned list. | §0, R4 |

### Measured improvement

| Metric | No rules | Rules |
|---|---|---|
| Unit tests for the PRD §6 schema | 0 | 4 (21 assertions) |
| PRD §6 constraints asserted (unique email, enum + default, both cascades, composite index, optional description, `@updatedAt`) | 0 | all |
| PRD §6 fields *not* asserted | all | `User.name`, `Project.name`, `Task.title`, every `createdAt` |
| Separate failing-test commit (graded evidence) | No | Yes (`e5aa018`) |
| Commits that follow §7 formatting | 0 / 1 | 2 / 2 feature commits |
| `npm run lint` | pass (same code) | pass |
| `npm run typecheck` | pass (same code) | pass |
| `npm run build` | pass (same code) | pass |

### Snippet: the new behavior with rules

```ts
// tests/unit/prisma-schema.test.ts (only on sarna-rules-experiment)
it("defines the three task statuses and defaults new tasks to TODO", () => {
  expect(schema).toMatch(/enum TaskStatus\s*\{\s*TODO\s+IN_PROGRESS\s+DONE\s*\}/);
  expect(schema).toMatch(/status\s+TaskStatus\s+@default\(TODO\)/);
});
```

Without rules, nothing checks the schema against the PRD. A later change to the `TaskStatus` enum would pass every check.

## 4. Weaknesses in the with-rules output

- **The tests are regex checks on source text.** They confirm the schema *says* the right thing, not that Prisma accepts it. A stronger test would run `prisma validate`, or check the generated client types.
- **Gaps:** `User.name`, `Project.name`, `Task.title`, and the `createdAt` fields are not checked. The `cuid()` regex matches the first model's `id` line, so it does not prove every model uses `cuid()`.
- **Definition of done not fully verified on this machine.** Locally, `npm test` fails *before running any test*: vitest 5 requires Node ^22.12, but the machine has Node 20.20.2 (`undici ... reading 'bind'`). This is an environment problem and affects both branches the same way. The rules require pasting real check output (R5), and this is exactly the gap that rule is meant to catch.
- **AGENTS.md §7 lists Issue #1's PRD story as "TBD"** and tells the agent to ask before guessing criteria. The agent used PRD §6 instead. That was a sensible choice, but the rules file should name it.

## 5. Changes to AGENTS.md based on this test

All of the changes below, plus the Week 6–8 additions, were applied in AGENTS.md v2 (see its §12 changelog) and the new `DESIGN.md`. `.vscode/settings.json` now sets `"chat.useAgentsMdFile": true`.

1. Map Issue #1 to PRD §6 (and fill in the other TBD rows) so the agent does not have to guess.
2. Add a required Node version (`>=22.12`) to §2 and to `package.json` `engines`, so an old Node fails loudly.
3. Say that schema tests should use `prisma validate` or generated types, not only regex checks on the source.
4. List the approved dependencies for each issue (Prisma, `@prisma/client`, `dotenv` for #1) so "ask first" has a clear answer.
5. Add a methodology note to the experiment instructions: one fresh chat per run.

## 6. Conclusion

With the PRD in the repo, both runs produced the same correct schema. The rules made the difference in **process and verification**: 0 → 4 tests, a graded red → green commit pair, correctly formatted Conventional Commits, and test conventions that match §6. The shared chat session and the disabled `chat.useAgentsMdFile` setting are the biggest weaknesses of this comparison. The result suggests AGENTS.md changed how the agent worked, but it does not show what an independent agent with the rules actually loaded would build. Both experiments will be rerun with AGENTS.md v2 under clean conditions (§1 rerun plan).
