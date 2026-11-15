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

  it("defines the task priorities from lowest to highest", () => {
    const schema = readFileSync(schemaPath, "utf8");

    expect(getBlock(schema, "enum", "TaskPriority")).toEqual(["LOW", "MEDIUM", "HIGH"]);
  });

  it("defines the project roles", () => {
    const schema = readFileSync(schemaPath, "utf8");

    expect(getBlock(schema, "enum", "ProjectRole")).toEqual(["OWNER", "MEMBER"]);
  });

  it("defines ProjectMember with a composite key, cascading relations, and a user index", () => {
    const fields = getBlock(readFileSync(schemaPath, "utf8"), "model", "ProjectMember");

    expectDeclaration(fields, "projectId String");
    expectDeclaration(fields, "userId String");
    expectDeclaration(fields, "role ProjectRole @default(MEMBER)");
    expectDeclaration(fields, "createdAt DateTime @default(now())");
    expectDeclaration(fields, "project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)");
    expectDeclaration(fields, "user User @relation(fields: [userId], references: [id], onDelete: Cascade)");
    expectDeclaration(fields, "@@id([projectId, userId])");
    expectDeclaration(fields, "@@index([userId])");
  });

  it("links users and projects to their memberships", () => {
    const schema = readFileSync(schemaPath, "utf8");

    expectDeclaration(getBlock(schema, "model", "User"), "memberships ProjectMember[]");
    expectDeclaration(getBlock(schema, "model", "User"), "assignedTasks Task[]");
  });

  it("defines Comment with cascading task and author relations and a (taskId, createdAt) index", () => {
    const schema = readFileSync(schemaPath, "utf8");
    const fields = getBlock(schema, "model", "Comment");

    expectDeclaration(fields, "id String @id @default(cuid())");
    expectDeclaration(fields, "taskId String");
    expectDeclaration(fields, "authorId String");
    expectDeclaration(fields, "body String");
    expectDeclaration(fields, "createdAt DateTime @default(now())");
    expectDeclaration(fields, "task Task @relation(fields: [taskId], references: [id], onDelete: Cascade)");
    expectDeclaration(fields, "author User @relation(fields: [authorId], references: [id], onDelete: Cascade)");
    expectDeclaration(fields, "@@index([taskId, createdAt])");
    expectDeclaration(getBlock(schema, "model", "Task"), "comments Comment[]");
    expectDeclaration(getBlock(schema, "model", "User"), "comments Comment[]");
  });

  it("defines the activity types", () => {
    expect(getBlock(readFileSync(schemaPath, "utf8"), "enum", "ActivityType")).toEqual([
      "TASK_CREATED",
      "TASK_UPDATED",
      "TASK_MOVED",
      "TASK_ASSIGNED",
      "TASK_DELETED",
      "COMMENT_ADDED",
      "COMMENT_DELETED",
      "MEMBER_ADDED",
      "MEMBER_REMOVED",
      "MEMBER_LEFT",
    ]);
  });

  it("defines Activity with actor, optional task details, cascades, and a (projectId, createdAt) index", () => {
    const schema = readFileSync(schemaPath, "utf8");
    const fields = getBlock(schema, "model", "Activity");

    expectDeclaration(fields, "id String @id @default(cuid())");
    expectDeclaration(fields, "projectId String");
    expectDeclaration(fields, "actorId String");
    expectDeclaration(fields, "type ActivityType");
    expectDeclaration(fields, "taskId String?");
    expectDeclaration(fields, "taskTitle String?");
    expectDeclaration(fields, "fromStatus TaskStatus?");
    expectDeclaration(fields, "toStatus TaskStatus?");
    expectDeclaration(fields, "subjectName String?");
    expectDeclaration(fields, "createdAt DateTime @default(now())");
    expectDeclaration(fields, "project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)");
    expectDeclaration(fields, "actor User @relation(fields: [actorId], references: [id], onDelete: Cascade)");
    expectDeclaration(fields, "@@index([projectId, createdAt])");
    expectDeclaration(getBlock(schema, "model", "Project"), "activity Activity[]");
    expectDeclaration(getBlock(schema, "model", "User"), "activity Activity[]");
    expectDeclaration(getBlock(schema, "model", "Project"), "members ProjectMember[]");
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
    expectDeclaration(fields, "priority TaskPriority @default(MEDIUM)");
    expectDeclaration(fields, "assigneeId String?");
    expectDeclaration(fields, "assignee User? @relation(fields: [assigneeId], references: [id], onDelete: SetNull)");
    expectDeclaration(fields, "@@index([projectId, assigneeId])");
    expectDeclaration(fields, "createdAt DateTime @default(now())");
    expectDeclaration(fields, "updatedAt DateTime @updatedAt");
    expectDeclaration(
      fields,
      "project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)",
    );
    expectDeclaration(fields, "@@index([projectId, status])");
  });
});
