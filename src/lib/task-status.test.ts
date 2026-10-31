import { describe, expect, it } from "vitest";
import { STATUS_LABELS, TASK_STATUSES, isTaskStatus } from "@/lib/task-status";

describe("task statuses", () => {
  it("orders the statuses To Do, In Progress, Done", () => {
    expect(TASK_STATUSES).toEqual(["TODO", "IN_PROGRESS", "DONE"]);
    expect(TASK_STATUSES.map((status) => STATUS_LABELS[status])).toEqual([
      "To Do",
      "In Progress",
      "Done",
    ]);
  });

  it("accepts every known status", () => {
    for (const status of TASK_STATUSES) {
      expect(isTaskStatus(status)).toBe(true);
    }
  });

  it("rejects unknown, empty, and differently cased values", () => {
    expect(isTaskStatus("ARCHIVED")).toBe(false);
    expect(isTaskStatus("")).toBe(false);
    expect(isTaskStatus("done")).toBe(false);
  });
});
