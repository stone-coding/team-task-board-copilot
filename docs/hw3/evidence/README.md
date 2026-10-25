# Evidence for the HW3 before/after experiment (GitHub Copilot Chat)

| Path | Contents |
|---|---|
| `prompt.txt` | The identical prompt pasted into both runs |
| `run-*/eval/` | Output of the evaluation script (branch `hw3-eval`), run on each run's committed code: metrics, hidden acceptance results, lint/type/test/build logs, and board screenshots at 1280px and 375px |
| `run-*/copilot-screenshots/` | Screenshots of the Copilot Chat session, taken by the student |
| `run-*/copilot-export/` | Chat exports. GitHub Copilot Chat **wrote these itself** when asked to export the conversation after the run (the session debug log held only a `session_start` record). Treat them as the assistant's own summary, not a raw log; the screenshots are the primary record |
| `run-*/uncommitted-formatting.diff` | Formatting-only edits left uncommitted in each workspace after the run (line wrapping and a trailing newline). They were **excluded** from scoring, which used the committed code |
| `excerpts/` | Crops of the screenshots used in the report |
