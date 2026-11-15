import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migrationsDir = join(process.cwd(), "prisma/migrations");

function activityMigration() {
  const dir = readdirSync(migrationsDir, { withFileTypes: true }).find(
    (entry) => entry.isDirectory() && entry.name.endsWith("_add_activity"),
  );
  if (!dir) {
    throw new Error("Expected a prisma/migrations/<timestamp>_add_activity migration");
  }
  return readFileSync(join(migrationsDir, dir.name, "migration.sql"), "utf8");
}

describe("activity migration", () => {
  it("creates the ActivityType enum, the Activity table, and its (projectId, createdAt) index", () => {
    const sql = activityMigration();
    expect(sql).toMatch(/CREATE TYPE "ActivityType" AS ENUM \('TASK_CREATED'/);
    expect(sql).toMatch(/CREATE TABLE "Activity"/);
    expect(sql).toMatch(/CREATE INDEX "Activity_projectId_createdAt_idx" ON "Activity"\("projectId", "createdAt"\)/);
  });

  it("cascades deletes from the project and the actor", () => {
    const sql = activityMigration();
    expect(sql).toMatch(/FOREIGN KEY \("projectId"\) REFERENCES "Project"\("id"\) ON DELETE CASCADE/);
    expect(sql).toMatch(/FOREIGN KEY \("actorId"\) REFERENCES "User"\("id"\) ON DELETE CASCADE/);
  });

  it("is additive: it drops, deletes, updates, or renames nothing", () => {
    const statements = activityMigration().replace(/\bON (DELETE|UPDATE) (CASCADE|SET NULL|RESTRICT|NO ACTION)\b/g, "");
    expect(statements).not.toMatch(/\b(DROP|DELETE|TRUNCATE|UPDATE|RENAME)\b/i);
  });
});
