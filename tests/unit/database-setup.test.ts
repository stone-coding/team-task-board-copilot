// @vitest-environment node
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const migrationsDir = join(root, "prisma/migrations");

function readInitialMigration() {
  const [initial] = readdirSync(migrationsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  if (!initial) {
    throw new Error("Expected at least one migration in prisma/migrations");
  }

  return readFileSync(join(migrationsDir, initial, "migration.sql"), "utf8");
}

function isGitIgnored(path: string) {
  try {
    execFileSync("git", ["check-ignore", "-q", path], { cwd: root });
    return true;
  } catch {
    return false;
  }
}

describe("initial migration", () => {
  it("locks the migration provider to PostgreSQL", () => {
    const lock = readFileSync(join(migrationsDir, "migration_lock.toml"), "utf8");

    expect(lock).toMatch(/provider\s*=\s*"postgresql"/);
  });

  it("creates the TaskStatus enum and the User, Project, and Task tables", () => {
    const sql = readInitialMigration();

    expect(sql).toContain(
      `CREATE TYPE "TaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'DONE');`,
    );
    expect(sql).toContain(`CREATE TABLE "User"`);
    expect(sql).toContain(`CREATE TABLE "Project"`);
    expect(sql).toContain(`CREATE TABLE "Task"`);
    expect(sql).toContain(`CREATE UNIQUE INDEX "User_email_key" ON "User"("email");`);
  });

  it("indexes tasks by project and status", () => {
    expect(readInitialMigration()).toContain(
      `CREATE INDEX "Task_projectId_status_idx" ON "Task"("projectId", "status");`,
    );
  });

  it("cascades deletes from users to projects and from projects to tasks", () => {
    const sql = readInitialMigration();

    expect(sql).toMatch(
      /"Project_ownerId_fkey" FOREIGN KEY \("ownerId"\) REFERENCES "User"\("id"\) ON DELETE CASCADE/,
    );
    expect(sql).toMatch(
      /"Task_projectId_fkey" FOREIGN KEY \("projectId"\) REFERENCES "Project"\("id"\) ON DELETE CASCADE/,
    );
  });
});

describe("local database environment", () => {
  it("provides a PostgreSQL service in docker-compose.yml", () => {
    const compose = readFileSync(join(root, "docker-compose.yml"), "utf8");

    expect(compose).toMatch(/image:\s*postgres:/);
    expect(compose).toContain("5432:5432");
  });

  it("documents DATABASE_URL and a separate TEST_DATABASE_URL in .env.example", () => {
    const example = readFileSync(join(root, ".env.example"), "utf8");
    const databaseUrl = example.match(/^DATABASE_URL="?([^"\n]+)"?$/m)?.[1];
    const testDatabaseUrl = example.match(/^TEST_DATABASE_URL="?([^"\n]+)"?$/m)?.[1];

    expect(databaseUrl).toMatch(/^postgresql:\/\//);
    expect(testDatabaseUrl).toMatch(/^postgresql:\/\//);
    expect(testDatabaseUrl).not.toBe(databaseUrl);
  });

  it("validates the Prisma schema without a DATABASE_URL so a fresh clone can generate the client", () => {
    // child_process drops undefined entries, so DATABASE_URL is unset in the child.
    const env = {
      ...process.env,
      DATABASE_URL: undefined,
      DOTENV_CONFIG_PATH: join(root, "does-not-exist.env"),
    };

    const validate = () =>
      execFileSync(join(root, "node_modules/.bin/prisma"), ["validate"], {
        cwd: root,
        env,
        stdio: "pipe",
      });

    expect(validate).not.toThrow();
  }, 30_000);

  it("commits .env.example while keeping .env gitignored", () => {
    expect(existsSync(join(root, ".env.example"))).toBe(true);
    expect(isGitIgnored(".env.example")).toBe(false);
    expect(isGitIgnored(".env")).toBe(true);
  });
});
