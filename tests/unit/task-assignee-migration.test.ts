import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migrationsDir = join(process.cwd(), "prisma/migrations");

function assigneeMigration() {
  const dir = readdirSync(migrationsDir, { withFileTypes: true }).find(
    (entry) => entry.isDirectory() && entry.name.endsWith("_add_task_assignee"),
  );
  if (!dir) {
    throw new Error("Expected a prisma/migrations/<timestamp>_add_task_assignee migration");
  }
  return readFileSync(join(migrationsDir, dir.name, "migration.sql"), "utf8");
}

describe("task assignee migration", () => {
  it("adds a nullable assigneeId column, so existing tasks stay unassigned", () => {
    expect(assigneeMigration()).toMatch(/ALTER TABLE "Task" ADD COLUMN\s+"assigneeId" TEXT;/);
  });

  it("indexes tasks by project and assignee", () => {
    expect(assigneeMigration()).toMatch(/CREATE INDEX "Task_projectId_assigneeId_idx" ON "Task"\("projectId", "assigneeId"\)/);
  });

  it("clears the assignee when the user is deleted", () => {
    expect(assigneeMigration()).toMatch(/FOREIGN KEY \("assigneeId"\) REFERENCES "User"\("id"\) ON DELETE SET NULL/);
  });

  it("is additive: it drops, deletes, updates, or renames nothing", () => {
    const statements = assigneeMigration().replace(/\bON (DELETE|UPDATE) (CASCADE|SET NULL|RESTRICT|NO ACTION)\b/g, "");
    expect(statements).not.toMatch(/\b(DROP|DELETE|TRUNCATE|UPDATE|RENAME)\b/i);
  });
});
