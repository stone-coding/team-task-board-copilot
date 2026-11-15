import { describe, expect, it } from "vitest";
import { DEFAULT_PRIORITY, isTaskPriority, PRIORITY_LABELS, sortByPriority, TASK_PRIORITIES } from "@/lib/task-priority";
import type { Task, TaskPriority } from "@/lib/tasks";

function task(id: string, priority: TaskPriority): Task {
  return { id, projectId: "p", title: id, status: "TODO", priority };
}

describe("task priorities", () => {
  it("lists the priorities from lowest to highest with their labels", () => {
    expect(TASK_PRIORITIES).toEqual(["LOW", "MEDIUM", "HIGH"]);
    expect(TASK_PRIORITIES.map((priority) => PRIORITY_LABELS[priority])).toEqual(["Low", "Medium", "High"]);
  });

  it("defaults to Medium", () => {
    expect(DEFAULT_PRIORITY).toBe("MEDIUM");
  });

  it("recognizes only the three priorities", () => {
    expect(isTaskPriority("HIGH")).toBe(true);
    expect(isTaskPriority("high")).toBe(false);
    expect(isTaskPriority("URGENT")).toBe(false);
  });
});

describe("sortByPriority", () => {
  it("puts High first, then Medium, then Low", () => {
    const sorted = sortByPriority([task("low", "LOW"), task("high", "HIGH"), task("medium", "MEDIUM")]);

    expect(sorted.map((t) => t.id)).toEqual(["high", "medium", "low"]);
  });

  it("keeps the existing order for equal priorities", () => {
    const sorted = sortByPriority([task("m1", "MEDIUM"), task("h1", "HIGH"), task("m2", "MEDIUM"), task("h2", "HIGH")]);

    expect(sorted.map((t) => t.id)).toEqual(["h1", "h2", "m1", "m2"]);
  });

  it("does not mutate its input and handles an empty list", () => {
    const input = [task("low", "LOW"), task("high", "HIGH")];
    sortByPriority(input);

    expect(input.map((t) => t.id)).toEqual(["low", "high"]);
    expect(sortByPriority([])).toEqual([]);
  });
});
