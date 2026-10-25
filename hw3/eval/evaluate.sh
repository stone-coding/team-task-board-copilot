#!/usr/bin/env bash
# HW3 evaluation: objective metrics for one experiment run.
# Usage: hw3/eval/evaluate.sh <run-checkout-dir> <output-dir>
# Committed before the runs; identical for every condition. Never modifies tracked files.
set -uo pipefail
RUN="$(cd "$1" && pwd)"; OUT="$(mkdir -p "$2" && cd "$2" && pwd)"
EVAL_SRC="$(cd "$(dirname "$0")" && pwd)"
cd "$RUN"
BASE=experiment-baseline

echo "== git"
# Only the run's own commits: skip the setup commit that adds AGENTS.md / .vscode settings.
git log --format='%h %s' "$BASE"..HEAD -- . ':!AGENTS.md' ':!.vscode' > "$OUT/commits.txt"
git diff --stat "$BASE" -- . ':!AGENTS.md' ':!.vscode' > "$OUT/diffstat.txt"
git diff --name-status "$BASE" -- . ':!AGENTS.md' ':!.vscode' > "$OUT/files.txt"
git diff "$BASE" -- package.json > "$OUT/package.diff"
git show "$BASE":package.json > "$OUT/package.base.json"; cp package.json "$OUT/package.run.json"

echo "== lint"
npx eslint -f json . > "$OUT/eslint.json" 2>/dev/null

echo "== typecheck"
npm run -s typecheck > "$OUT/typecheck.txt" 2>&1; echo $? > "$OUT/typecheck.exit"

echo "== unit/component tests"
npx vitest run --reporter=json --outputFile="$OUT/vitest.json" > "$OUT/vitest.txt" 2>&1

echo "== build"
rm -rf .next
npm run -s build > "$OUT/build.txt" 2>&1; BUILD=$?; echo $BUILD > "$OUT/build.exit"
if [ $BUILD -eq 0 ]; then SERVER="npx next start -p 3100"; MODE=production; else rm -rf .next; SERVER="npx next dev -p 3100"; MODE=dev-fallback; fi
echo $MODE > "$OUT/server-mode.txt"

echo "== hidden acceptance ($MODE)"
TMP=".hw3-eval-tmp"; rm -rf "$TMP"; mkdir "$TMP"; cp "$EVAL_SRC"/acceptance.spec.ts "$EVAL_SRC"/playwright.eval.config.ts "$TMP"/
npm i --no-save --silent @axe-core/playwright@4 > /dev/null 2>&1
EVAL_APP_DIR="$RUN" EVAL_OUT="$OUT" EVAL_SERVER_CMD="$SERVER" npx playwright test -c "$TMP/playwright.eval.config.ts" > "$OUT/acceptance.txt" 2>&1
rm -rf "$TMP"; npm i --silent > /dev/null 2>&1   # drop the --no-save axe package again

echo "== static convention checks"
SRC_FILES=$(git diff --name-only --diff-filter=AM "$BASE" -- 'src/**/*.ts' 'src/**/*.tsx' | grep -v '\.test\.' || true)
TEST_FILES=$(git diff --name-only --diff-filter=AM "$BASE" -- '*.test.ts' '*.test.tsx' 'e2e/*.spec.ts' || true)
count() { [ -z "$2" ] && echo 0 || (echo "$2" | xargs grep -E -c "$1" 2>/dev/null | awk -F: '{s+=$NF} END {print s+0}'); }
node "$EVAL_SRC/summarize.mjs" "$OUT" \
  "$(count ': any\b|<any>|as any\b' "$SRC_FILES")" \
  "$(count 'style=\{\{' "$SRC_FILES")" \
  "$(count 'getByTestId|data-testid' "$TEST_FILES $SRC_FILES")" \
  "$(count 'fireEvent' "$TEST_FILES")" \
  "$(count 'dangerouslySetInnerHTML' "$SRC_FILES")" \
  "$(count '"(To Do|In Progress)"' "$(echo "$SRC_FILES" | grep '^src/components' || true)")" \
  "$(echo "$SRC_FILES" | grep -c . || true)" \
  "$(echo "$TEST_FILES" | grep -c . || true)" \
  "$(echo "$SRC_FILES" | grep -c '^src/components/' || true)"
