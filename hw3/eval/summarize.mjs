// Collects the raw outputs written by evaluate.sh into metrics.json + metrics.md.
import fs from "node:fs";
import path from "node:path";

const [out, anyCount, inlineStyles, testIds, fireEvents, dangerousHtml, hardcodedLabels, srcFiles, testFiles, componentFiles] =
  process.argv.slice(2);
const read = (f) => (fs.existsSync(path.join(out, f)) ? fs.readFileSync(path.join(out, f), "utf8") : "");
const json = (f) => { try { return JSON.parse(read(f)); } catch { return null; } };

const eslint = json("eslint.json") ?? [];
const vitest = json("vitest.json");
const acc = json("acceptance.json");
const axe = json("axe.json") ?? [];

const accTests = [];
const walk = (suite) => {
  for (const s of suite.suites ?? []) walk(s);
  for (const spec of suite.specs ?? []) accTests.push({ title: spec.title, ok: spec.ok });
};
for (const s of acc?.suites ?? []) walk(s);
const scored = accTests.filter((t) => !t.title.startsWith("Evidence"));
const commits = read("commits.txt").trim().split("\n").filter(Boolean);
const conventional = commits.filter((c) => /^\w+ (feat|fix|test|refactor|docs|chore|ci)(\([^)]*\))?: /.test(c));
const withIssue = commits.filter((c) => /^\w+ \w+\(#\d+\)/.test(c));
const deps = (f) => { const p = json(f) ?? {}; return new Set([...Object.keys(p.dependencies ?? {}), ...Object.keys(p.devDependencies ?? {})]); };
const baseDeps = deps("package.base.json");
const addedDeps = [...deps("package.run.json")].filter((d) => !baseDeps.has(d));

const m = {
  build: read("build.exit").trim() === "0" ? "pass" : "FAIL",
  serverModeForAcceptance: read("server-mode.txt").trim(),
  hiddenAcceptancePassed: `${scored.filter((t) => t.ok).length}/${scored.length}`,
  hiddenAcceptance: Object.fromEntries(scored.map((t) => [t.title, t.ok ? "pass" : "FAIL"])),
  eslintErrors: eslint.reduce((s, f) => s + f.errorCount, 0),
  eslintWarnings: eslint.reduce((s, f) => s + f.warningCount, 0),
  typecheck: read("typecheck.exit").trim() === "0" ? "pass" : "FAIL",
  typeErrors: (read("typecheck.txt").match(/error TS\d+/g) ?? []).length,
  unitTestsTotal: vitest?.numTotalTests ?? null,
  unitTestsPassed: vitest?.numPassedTests ?? null,
  unitTestsFailed: vitest?.numFailedTests ?? null,
  newTestFiles: Number(testFiles),
  newSourceFiles: Number(srcFiles),
  sourceFilesUnderSrcComponents: Number(componentFiles),
  axeViolations: axe.map((v) => `${v.id} (${v.impact}, ${v.nodes} nodes)`),
  newDependencies: addedDeps,
  explicitAnyTypes: Number(anyCount),
  inlineStyleObjects: Number(inlineStyles),
  testIdUsage: Number(testIds),
  fireEventUsage: Number(fireEvents),
  dangerouslySetInnerHTML: Number(dangerousHtml),
  hardcodedStatusLabelsInComponents: Number(hardcodedLabels),
  commits: commits.length,
  conventionalCommits: `${conventional.length}/${commits.length}`,
  commitsWithIssueRef: `${withIssue.length}/${commits.length}`,
};
fs.writeFileSync(path.join(out, "metrics.json"), JSON.stringify(m, null, 2));
const lines = Object.entries(m).map(([k, v]) => `| ${k} | ${typeof v === "object" ? JSON.stringify(v) : v} |`);
fs.writeFileSync(path.join(out, "metrics.md"), `| Metric | Value |\n|---|---|\n${lines.join("\n")}\n`);
console.log(JSON.stringify(m, null, 2));
