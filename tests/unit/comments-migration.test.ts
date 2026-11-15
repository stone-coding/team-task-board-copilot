import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migrationsDir = join(process.cwd(), "prisma/migrations");

function commentsMigration() {
  const dir = readdirSync(migrationsDir, { withFileTypes: true }).find(
    (entry) => entry.isDirectory() && entry.name.endsWith("_add_comments"),
  );
  if (!dir) {
    throw new Error("Expected a prisma/migrations/<timestamp>_add_comments migration");
  }
  return readFileSync(join(migrationsDir, dir.name, "migration.sql"), "utf8");
}

describe("comments migration", () => {
  it("creates the Comment table and its (taskId, createdAt) index", () => {
    const sql = commentsMigration();
    expect(sql).toMatch(/CREATE TABLE "Comment"/);
    expect(sql).toMatch(/CREATE INDEX "Comment_taskId_createdAt_idx" ON "Comment"\("taskId", "createdAt"\)/);
  });

  it("cascades deletes from the task and the author", () => {
    const sql = commentsMigration();
    expect(sql).toMatch(/FOREIGN KEY \("taskId"\) REFERENCES "Task"\("id"\) ON DELETE CASCADE/);
    expect(sql).toMatch(/FOREIGN KEY \("authorId"\) REFERENCES "User"\("id"\) ON DELETE CASCADE/);
  });

  it("is additive: it drops, deletes, updates, or renames nothing", () => {
    const statements = commentsMigration().replace(/\bON (DELETE|UPDATE) (CASCADE|SET NULL|RESTRICT|NO ACTION)\b/g, "");
    expect(statements).not.toMatch(/\b(DROP|DELETE|TRUNCATE|UPDATE|RENAME)\b/i);
  });
});
