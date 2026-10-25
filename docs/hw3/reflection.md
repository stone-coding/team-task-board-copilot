# HW3 Reflection: Context Engineering for Team Task Board

Haomiao Shi · CS6983 · October 25, 2026

## How the rules file connects the PRD and mockup to code

The PRD defines what the board must do, and the mockup defines how it looks. Neither says how the code should be organized or tested, or what the installed framework version will reject. My `AGENTS.md` fills that gap:
- It maps each mockup element to a component, an HTML element, and an accessible name.
- It records constraints the model cannot infer. For example, Next.js 16 with `cacheComponents` fails the production build when a page reads route parameters outside `<Suspense>`.
- It ties AI output to our workflow: issue branches, `test(#N)` commits before `feat(#N)` commits, and a summary that checks off each acceptance criterion.

In Visual Studio Code, GitHub Copilot Chat loads the file automatically once `chat.useAgentsMdFile` is enabled.

## What the experiment showed

I implemented Sprint 1 issue #6 twice with Copilot Chat in Agent mode, from the same commit and prompt, with the same model (GPT-5.6 Luna). Run A had no rules; run B had `AGENTS.md` v1. A hidden acceptance suite was committed before either run.

**Both runs passed all 10 hidden tests and the accessibility scan.** Run A, without rules, was even closer to the mockup visually, because it copied the mockup's CSS. So the PRD and mockup alone were enough for the visible feature.

**The rules changed how the code was built:**
- Run B split the board into the documented components, used Tailwind and shared status labels, referenced the issue in its commit, and added two end-to-end tests.
- Run A hit the Next.js build failure and worked around it with `generateStaticParams`, which only works for ids known at build time. Run B used the documented Suspense pattern and never hit the error.
- Run A rendered each column heading so that the screen-reader name became "To Do3", then wrote tests that expect that name. Run B hid the count from the name.

These differences don't change what a user sees today. They decide whether the board can move to real project data in Sprint 2, and whether accessibility defects get caught or locked in by tests.

## What did not work, and why I revised the rules

Run B followed the rules that applied while it was writing code, and skipped the ones about process and file placement:
- It wrote failing tests first and ran them red, but committed everything in one commit. The history therefore shows no TDD evidence.
- It stayed on the checkout branch instead of creating `feature/6-…`.
- It kept its tests in `tests/unit/` and its state logic inside the component, although v1 asks for co-located tests and pure functions in `src/lib/`.

My reading is that v1 stated these rules, but nothing in the work forced the agent to act on them.

Version 2 makes them concrete steps instead of guidelines:
- create the branch first
- commit the failing tests on their own, and treat a single-commit feature as a violation
- a structure checklist that is part of the definition of done
- a summary that must list the branch and every commit SHA

It also adds three fixes for problems B hit: where the count badge goes, how to quote paths in zsh, and which search tools are available.

I have not yet run v2, so its effect is a hypothesis, not a measured result.

The limitations are real:
- Each condition ran once.
- Run A's agent read Copilot's memory, whose contents I could not see.
- Run B's chat began with an unrelated `pwd` turn.

## How the GitHub Scrum setup supports collaboration

The shared Project board moves work through Backlog, Sprint Todo, In Progress, In Review, and Done. Milestones cover Sprint 1 (October 26 to November 2) and Sprint 2 (November 3 to November 10). Each of the 13 issues has acceptance criteria, labels, an estimate, and dependencies, which makes it a bounded task for an AI assistant:
- the criteria become the first tests;
- the issue number carries into branches, commits, and pull requests;
- the In Review column keeps AI-generated work waiting for a human reviewer.

Issues stay unassigned so that my partner and I can choose ownership together at sprint planning.

## What should improve in Sprint 2

- Run the same issue with `AGENTS.md` v2 to check whether the commit and structure rules are now followed.
- Merge my partner's rules and mine into one shared `AGENTS.md` that we both review.
- Add rules for the API layer: input validation, a consistent error format, and owner-scoped queries.
- Enforce the git rules in continuous integration (for example, reject a pull request without a `test(#N)` commit), since the experiment showed that Copilot skipped them even when they were written down.
