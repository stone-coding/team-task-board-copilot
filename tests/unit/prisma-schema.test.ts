import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const schemaPath = resolve(process.cwd(), "prisma/schema.prisma");
const migrationPath = resolve(
  process.cwd(),
  "prisma/migrations/20261027195700_init/migration.sql",
);

function readIfPresent(path: string): string {
  return existsSync(path) ? readFileSync(path, "utf8") : "";
}

describe("Prisma PostgreSQL schema", () => {
  const schema = readIfPresent(schemaPath);

  it("defines the PRD models with CUID identifiers and required fields", () => {
    expect(schema).toMatch(/model User\s*\{/);
    expect(schema).toMatch(/id\s+String\s+@id\s+@default\(cuid\(\)\)/);
    expect(schema).toMatch(/email\s+String\s+@unique/);
    expect(schema).toMatch(/passwordHash\s+String/);

    expect(schema).toMatch(/model Project\s*\{/);
    expect(schema).toMatch(/ownerId\s+String/);

    expect(schema).toMatch(/model Task\s*\{/);
    expect(schema).toMatch(/description\s+String\?/);
    expect(schema).toMatch(/updatedAt\s+DateTime\s+@updatedAt/);
  });

  it("defines the three task statuses and defaults new tasks to TODO", () => {
    expect(schema).toMatch(/enum TaskStatus\s*\{\s*TODO\s+IN_PROGRESS\s+DONE\s*\}/);
    expect(schema).toMatch(/status\s+TaskStatus\s+@default\(TODO\)/);
  });

  it("cascades project ownership deletions and indexes tasks by project and status", () => {
    expect(schema).toMatch(/owner\s+User\s+@relation\([^)]*onDelete:\s+Cascade/);
    expect(schema).toMatch(/project\s+Project\s+@relation\([^)]*onDelete:\s+Cascade/);
    expect(schema).toMatch(/@@index\(\[projectId,\s*status\]\)/);
  });

  it("includes the PostgreSQL migration for the schema", () => {
    const migration = readIfPresent(migrationPath);

    expect(migration).toContain('CREATE TYPE "TaskStatus" AS ENUM');
    expect(migration).toContain('CREATE TABLE "User"');
    expect(migration).toContain('CREATE TABLE "Project"');
    expect(migration).toContain('CREATE TABLE "Task"');
    expect(migration).toContain('"User_email_key"');
    expect(migration).toContain('"Task_projectId_status_idx"');
    expect(migration).toContain("ON DELETE CASCADE");
  });
});
