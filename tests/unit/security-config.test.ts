// @vitest-environment node
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function readConfig(relativePath: string) {
  const file = path.join(process.cwd(), relativePath);
  expect(existsSync(file), `${relativePath} exists`).toBe(true);
  return readFileSync(file, "utf8");
}

// Security scanning (#10) only shows in GitHub, so this guards the configuration that drives it.
describe("security scanning configuration", () => {
  it("runs CodeQL for JavaScript/TypeScript on pull requests and pushes to main", () => {
    const workflow = readConfig(".github/workflows/codeql.yml");
    expect(workflow).toMatch(/pull_request:\s*\n\s*branches: \[main\]/);
    expect(workflow).toMatch(/push:\s*\n\s*branches: \[main\]/);
    expect(workflow).toContain("github/codeql-action/init@v4");
    expect(workflow).toContain("github/codeql-action/analyze@v4");
    expect(workflow).toMatch(/languages: javascript-typescript/);
    expect(workflow).toMatch(/security-events: write/);
  });

  it("fails CI on high or critical npm audit findings", () => {
    const workflow = readConfig(".github/workflows/ci.yml");
    expect(workflow).toContain("npm audit --audit-level=high");
  });

  it("has Dependabot check npm and GitHub Actions weekly", () => {
    const config = readConfig(".github/dependabot.yml");
    expect(config).toMatch(/^version: 2$/m);
    for (const ecosystem of ["npm", "github-actions"]) {
      expect(config).toMatch(new RegExp(`package-ecosystem: "${ecosystem}"\\s*\\n\\s*directory: "/"\\s*\\n\\s*schedule:\\s*\\n\\s*interval: "weekly"`));
    }
  });
});
