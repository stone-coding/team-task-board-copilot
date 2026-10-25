import { describe, expect, it } from "vitest";
import { mockTasks } from "@/lib/mock-tasks";

describe("mockTasks", () => {
  it("has unique ids", () => {
    const ids = mockTasks.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("leaves the DONE column empty so the empty state is exercised", () => {
    expect(mockTasks.filter((t) => t.status === "DONE")).toHaveLength(0);
  });
});
