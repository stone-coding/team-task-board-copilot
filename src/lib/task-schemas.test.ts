import { describe, expect, it } from "vitest";
import { createTaskSchema, updateTaskSchema } from "@/lib/task-schemas";

const PRIORITY_ERROR = "Priority must be one of LOW, MEDIUM, HIGH";

describe("createTaskSchema priority", () => {
  it("leaves priority out when it is not sent, so the database default (Medium) applies", () => {
    const parsed = createTaskSchema.parse({ title: "Plan" });

    expect(parsed).not.toHaveProperty("priority");
  });

  it.each(["LOW", "MEDIUM", "HIGH"] as const)("accepts %s", (priority) => {
    expect(createTaskSchema.parse({ title: "Plan", priority }).priority).toBe(priority);
  });

  it("rejects an unknown priority", () => {
    const result = createTaskSchema.safeParse({ title: "Plan", priority: "URGENT" });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(PRIORITY_ERROR);
  });
});

describe("updateTaskSchema priority", () => {
  it("accepts a priority on its own", () => {
    expect(updateTaskSchema.parse({ priority: "HIGH" })).toEqual({ priority: "HIGH" });
  });

  it("rejects an unknown priority", () => {
    expect(updateTaskSchema.safeParse({ priority: "low" }).error?.issues[0]?.message).toBe(PRIORITY_ERROR);
  });

  it("names priority in the message for an empty update", () => {
    expect(updateTaskSchema.safeParse({}).error?.issues[0]?.message).toBe(
      "Provide at least one of title, description, status, priority, or assigneeId",
    );
  });
});

describe("assigneeId", () => {
  it("accepts a user id or null on create and update", () => {
    expect(createTaskSchema.parse({ title: "Plan", assigneeId: "u1" }).assigneeId).toBe("u1");
    expect(createTaskSchema.parse({ title: "Plan", assigneeId: null }).assigneeId).toBeNull();
    expect(updateTaskSchema.parse({ assigneeId: "u2" })).toEqual({ assigneeId: "u2" });
    expect(updateTaskSchema.parse({ assigneeId: null })).toEqual({ assigneeId: null });
  });

  it("leaves assigneeId out when it is not sent", () => {
    expect(createTaskSchema.parse({ title: "Plan" })).not.toHaveProperty("assigneeId");
  });

  it.each([
    ["a number", 42],
    ["an empty string", ""],
  ])("rejects %s", (_label, assigneeId) => {
    expect(updateTaskSchema.safeParse({ assigneeId }).error?.issues[0]?.message).toBe("Assignee must be a user id or null");
  });
});
