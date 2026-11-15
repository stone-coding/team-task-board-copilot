import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migrationsDir = join(process.cwd(), "prisma/migrations");

function membersMigration() {
  const dir = readdirSync(migrationsDir, { withFileTypes: true }).find(
    (entry) => entry.isDirectory() && entry.name.endsWith("_add_project_members"),
  );
  if (!dir) {
    throw new Error("Expected a prisma/migrations/<timestamp>_add_project_members migration");
  }
  return readFileSync(join(migrationsDir, dir.name, "migration.sql"), "utf8");
}

describe("project members migration", () => {
  it("creates the ProjectRole enum and the ProjectMember table with a composite primary key", () => {
    const sql = membersMigration();
    expect(sql).toMatch(/CREATE TYPE "ProjectRole" AS ENUM \('OWNER', 'MEMBER'\)/);
    expect(sql).toMatch(/CREATE TABLE "ProjectMember"/);
    expect(sql).toMatch(/CONSTRAINT "ProjectMember_pkey" PRIMARY KEY \("projectId","userId"\)/);
    expect(sql).toMatch(/CREATE INDEX "ProjectMember_userId_idx" ON "ProjectMember"\("userId"\)/);
  });

  it("cascades deletes from both the project and the user", () => {
    const sql = membersMigration();
    expect(sql).toMatch(/FOREIGN KEY \("projectId"\) REFERENCES "Project"\("id"\) ON DELETE CASCADE/);
    expect(sql).toMatch(/FOREIGN KEY \("userId"\) REFERENCES "User"\("id"\) ON DELETE CASCADE/);
  });

  it("backfills an OWNER membership for every existing project", () => {
    expect(membersMigration()).toMatch(
      /INSERT INTO "ProjectMember" \("projectId", "userId", "role"\)\s+SELECT "id", "ownerId", 'OWNER' FROM "Project"/,
    );
  });

  it("is additive: it drops, deletes, updates, or renames nothing", () => {
    // Foreign-key actions ("ON DELETE CASCADE", "ON UPDATE CASCADE") describe future behavior, not statements.
    const statements = membersMigration().replace(/\bON (DELETE|UPDATE) (CASCADE|SET NULL|RESTRICT|NO ACTION)\b/g, "");
    expect(statements).not.toMatch(/\b(DROP|DELETE|TRUNCATE|UPDATE|RENAME)\b/i);
  });
});
