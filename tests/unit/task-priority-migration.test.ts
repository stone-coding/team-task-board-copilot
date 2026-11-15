import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migrationsDir = join(process.cwd(), "prisma/migrations");

function priorityMigration() {
  const dir = readdirSync(migrationsDir, { withFileTypes: true }).find(
    (entry) => entry.isDirectory() && entry.name.endsWith("_add_task_priority"),
  );
  if (!dir) {
    throw new Error("Expected a prisma/migrations/<timestamp>_add_task_priority migration");
  }
  return readFileSync(join(migrationsDir, dir.name, "migration.sql"), "utf8");
}

describe("task priority migration", () => {
  it("creates the TaskPriority enum", () => {
    expect(priorityMigration()).toMatch(/CREATE TYPE "TaskPriority" AS ENUM \('LOW', 'MEDIUM', 'HIGH'\)/);
  });

  it("adds a required priority column that defaults existing and new tasks to MEDIUM", () => {
    expect(priorityMigration()).toMatch(
      /ALTER TABLE "Task" ADD COLUMN\s+"priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM'/,
    );
  });

  it("is additive: it drops, deletes, or rewrites nothing", () => {
    expect(priorityMigration()).not.toMatch(/\b(DROP|DELETE|TRUNCATE|UPDATE|RENAME)\b/i);
  });
});
