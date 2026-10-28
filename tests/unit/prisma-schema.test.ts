import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const schemaPath = resolve(root, "prisma/schema.prisma");
const migrationsPath = resolve(root, "prisma/migrations");
const schema = existsSync(schemaPath) ? readFileSync(schemaPath, "utf8") : "";

function readFileOrEmpty(path: string): string {
  const absolutePath = resolve(root, path);
  return existsSync(absolutePath) ? readFileSync(absolutePath, "utf8") : "";
}

function getBlock(source: string, type: string, name: string): string {
  const match = source.match(
    new RegExp(`${type}\\s+${name}\\s*\\{([\\s\\S]*?)\\n\\}`),
  );
  return match?.[1] ?? "";
}

function getTableDefinition(source: string, name: string): string {
  const match = source.match(
    new RegExp(`CREATE TABLE "${name}" \\(([\\s\\S]*?)\\n\\);`),
  );
  return match?.[1] ?? "";
}

function getInitialMigration(): string {
  if (!existsSync(migrationsPath)) {
    return "";
  }

  const initialMigration = readdirSync(migrationsPath, {
    withFileTypes: true,
  }).find((entry) => entry.isDirectory() && entry.name.endsWith("_init"));

  if (!initialMigration) {
    return "";
  }

  return readFileOrEmpty(
    join("prisma/migrations", initialMigration.name, "migration.sql"),
  );
}

describe("Prisma PostgreSQL setup", () => {
  it("uses the Prisma 7 PostgreSQL client generator", () => {
    expect(schema).toMatch(/provider\s*=\s*"prisma-client"/);
    expect(schema).toMatch(/output\s*=\s*"\.\.\/src\/generated\/prisma"/);
    expect(schema).toMatch(/provider\s*=\s*"postgresql"/);
    expect(readFileOrEmpty("prisma.config.ts")).toMatch(
      /import\s+["']dotenv\/config["']/,
    );
    expect(readFileOrEmpty("prisma.config.ts")).toMatch(
      /datasource:\s*\{\s*url:\s*process\.env\.DATABASE_URL/s,
    );
  });

  it("defines every User field and its unique email constraint", () => {
    const user = getBlock(schema, "model", "User");

    expect(user).toMatch(/^\s*id\s+String\s+@id\s+@default\(cuid\(\)\)/m);
    expect(user).toMatch(/^\s*email\s+String\s+@unique/m);
    expect(user).toMatch(/^\s*name\s+String\s*$/m);
    expect(user).toMatch(/^\s*passwordHash\s+String\s*$/m);
    expect(user).toMatch(/^\s*createdAt\s+DateTime\s+@default\(now\(\)\)/m);
    expect(user).toMatch(/^\s*projects\s+Project\[\]\s*$/m);
  });

  it("defines every Project field and its User and Task relations", () => {
    const project = getBlock(schema, "model", "Project");

    expect(project).toMatch(/^\s*id\s+String\s+@id\s+@default\(cuid\(\)\)/m);
    expect(project).toMatch(/^\s*name\s+String\s*$/m);
    expect(project).toMatch(/^\s*ownerId\s+String\s*$/m);
    expect(project).toMatch(/^\s*createdAt\s+DateTime\s+@default\(now\(\)\)/m);
    expect(project).toMatch(
      /^\s*owner\s+User\s+@relation\(fields:\s*\[ownerId\],\s*references:\s*\[id\],\s*onDelete:\s*Cascade\)/m,
    );
    expect(project).toMatch(/^\s*tasks\s+Task\[\]\s*$/m);
  });

  it("defines every Task field, status default, and project relation", () => {
    const task = getBlock(schema, "model", "Task");

    expect(task).toMatch(/^\s*id\s+String\s+@id\s+@default\(cuid\(\)\)/m);
    expect(task).toMatch(/^\s*projectId\s+String\s*$/m);
    expect(task).toMatch(/^\s*title\s+String\s*$/m);
    expect(task).toMatch(/^\s*description\s+String\?\s*$/m);
    expect(task).toMatch(/^\s*status\s+TaskStatus\s+@default\(TODO\)/m);
    expect(task).toMatch(/^\s*createdAt\s+DateTime\s+@default\(now\(\)\)/m);
    expect(task).toMatch(/^\s*updatedAt\s+DateTime\s+@updatedAt\s*$/m);
    expect(task).toMatch(
      /^\s*project\s+Project\s+@relation\(fields:\s*\[projectId\],\s*references:\s*\[id\],\s*onDelete:\s*Cascade\)/m,
    );
    expect(task).toMatch(/^\s*@@index\(\[projectId,\s*status\]\)\s*$/m);
  });

  it("defines exactly the supported task statuses", () => {
    const status = getBlock(schema, "enum", "TaskStatus");

    expect(status.trim().split(/\s+/)).toEqual(["TODO", "IN_PROGRESS", "DONE"]);
  });

  it("creates the matching PostgreSQL tables, constraints, and index", () => {
    const migration = getInitialMigration();
    const user = getTableDefinition(migration, "User");
    const project = getTableDefinition(migration, "Project");
    const task = getTableDefinition(migration, "Task");

    expect(migration).toMatch(
      /CREATE TYPE "TaskStatus" AS ENUM \('TODO', 'IN_PROGRESS', 'DONE'\)/,
    );
    expect(user).toMatch(/"id" TEXT NOT NULL/);
    expect(user).toMatch(/"email" TEXT NOT NULL/);
    expect(user).toMatch(/"name" TEXT NOT NULL/);
    expect(user).toMatch(/"passwordHash" TEXT NOT NULL/);
    expect(user).toMatch(
      /"createdAt" TIMESTAMP\(3\) NOT NULL DEFAULT CURRENT_TIMESTAMP/,
    );
    expect(project).toMatch(/"id" TEXT NOT NULL/);
    expect(project).toMatch(/"name" TEXT NOT NULL/);
    expect(project).toMatch(/"ownerId" TEXT NOT NULL/);
    expect(project).toMatch(
      /"createdAt" TIMESTAMP\(3\) NOT NULL DEFAULT CURRENT_TIMESTAMP/,
    );
    expect(task).toMatch(/"id" TEXT NOT NULL/);
    expect(task).toMatch(/"projectId" TEXT NOT NULL/);
    expect(task).toMatch(/"title" TEXT NOT NULL/);
    expect(task).toMatch(/"description" TEXT/);
    expect(task).toMatch(/"status" "TaskStatus" NOT NULL DEFAULT 'TODO'/);
    expect(task).toMatch(
      /"createdAt" TIMESTAMP\(3\) NOT NULL DEFAULT CURRENT_TIMESTAMP/,
    );
    expect(task).toMatch(/"updatedAt" TIMESTAMP\(3\) NOT NULL/);
    expect(migration).toMatch(
      /CREATE UNIQUE INDEX "User_email_key" ON "User"\("email"\)/,
    );
    expect(migration).toMatch(
      /CREATE INDEX "Task_projectId_status_idx" ON "Task"\("projectId", "status"\)/,
    );
    expect(migration).toMatch(
      /REFERENCES "User"\("id"\) ON DELETE CASCADE ON UPDATE CASCADE/,
    );
    expect(migration).toMatch(
      /REFERENCES "Project"\("id"\) ON DELETE CASCADE ON UPDATE CASCADE/,
    );
  });

  it("documents DATABASE_URL and ignores local environment files", () => {
    expect(readFileOrEmpty(".env.example")).toMatch(
      /^DATABASE_URL=postgresql:\/\/.+$/m,
    );
    expect(readFileOrEmpty(".gitignore")).toMatch(/^\.env\*/m);
  });

  it("provides a local PostgreSQL service for the documented URL", () => {
    const compose = readFileOrEmpty("docker-compose.yml");

    expect(compose).toMatch(/^\s{2}postgres:\s*$/m);
    expect(compose).toMatch(/image:\s*postgres:/);
    expect(compose).toMatch(/POSTGRES_DB:/);
    expect(compose).toMatch(/POSTGRES_USER:/);
    expect(compose).toMatch(/POSTGRES_PASSWORD:/);
    expect(compose).toMatch(/"5432:5432"/);
  });
});
