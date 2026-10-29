import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const schemaPath = join(process.cwd(), "prisma/schema.prisma");

function getBlock(schema: string, type: "enum" | "model", name: string) {
  const match = schema.match(
    new RegExp(`\\b${type}\\s+${name}\\s*\\{([\\s\\S]*?)\\}`),
  );

  if (!match) {
    throw new Error(`Expected schema to define ${type} ${name}`);
  }

  return match[1]
    .split("\n")
    .map((line) => line.trim().replace(/\s+/g, " "))
    .filter(Boolean);
}

function expectDeclaration(
  declarations: string[],
  declaration: string,
) {
  expect(declarations).toContain(declaration);
}

describe("Prisma PostgreSQL schema", () => {
  it("uses PostgreSQL and generates the client into the shared generated directory", () => {
    const schema = readFileSync(schemaPath, "utf8");

    expect(schema).toContain('provider = "postgresql"');
    expect(schema).toContain('provider = "prisma-client"');
    expect(schema).toMatch(/output\s*=\s*"\.\.\/src\/generated\/prisma"/);
  });

  it("defines the supported task statuses", () => {
    const schema = readFileSync(schemaPath, "utf8");

    expect(getBlock(schema, "enum", "TaskStatus")).toEqual([
      "TODO",
      "IN_PROGRESS",
      "DONE",
    ]);
  });

  it("defines every User field and its unique email constraint", () => {
    const fields = getBlock(
      readFileSync(schemaPath, "utf8"),
      "model",
      "User",
    );

    expectDeclaration(fields, "id String @id @default(cuid())");
    expectDeclaration(fields, "email String @unique");
    expectDeclaration(fields, "name String");
    expectDeclaration(fields, "passwordHash String");
    expectDeclaration(fields, "createdAt DateTime @default(now())");
    expectDeclaration(fields, "projects Project[]");
  });

  it("defines every Project field and cascades deletion from its owner", () => {
    const fields = getBlock(
      readFileSync(schemaPath, "utf8"),
      "model",
      "Project",
    );

    expectDeclaration(fields, "id String @id @default(cuid())");
    expectDeclaration(fields, "name String");
    expectDeclaration(fields, "ownerId String");
    expectDeclaration(fields, "createdAt DateTime @default(now())");
    expectDeclaration(
      fields,
      "owner User @relation(fields: [ownerId], references: [id], onDelete: Cascade)",
    );
    expectDeclaration(fields, "tasks Task[]");
  });

  it("defines every Task field, cascades project deletion, and indexes project status", () => {
    const fields = getBlock(
      readFileSync(schemaPath, "utf8"),
      "model",
      "Task",
    );

    expectDeclaration(fields, "id String @id @default(cuid())");
    expectDeclaration(fields, "projectId String");
    expectDeclaration(fields, "title String");
    expectDeclaration(fields, "description String?");
    expectDeclaration(fields, "status TaskStatus @default(TODO)");
    expectDeclaration(fields, "createdAt DateTime @default(now())");
    expectDeclaration(fields, "updatedAt DateTime @updatedAt");
    expectDeclaration(
      fields,
      "project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)",
    );
    expectDeclaration(fields, "@@index([projectId, status])");
  });
});
