import { describe, expect, it } from "vitest";
import { summarizeTasks } from "@/lib/project-stats";
import type { Task, TaskStatus } from "@/lib/tasks";

function tasksWith(...statuses: TaskStatus[]): Task[] {
  return statuses.map((status, index) => ({ id: `t${index}`, projectId: "p", title: `Task ${index}`, status }));
}

describe("summarizeTasks", () => {
  it("counts total, in-progress, and completed tasks", () => {
    const stats = summarizeTasks(tasksWith("TODO", "IN_PROGRESS", "IN_PROGRESS", "DONE", "TODO"));

    expect(stats).toEqual({ total: 5, inProgress: 2, completed: 1, completionRate: 20 });
  });

  it("returns zeros for an empty project", () => {
    expect(summarizeTasks([])).toEqual({ total: 0, inProgress: 0, completed: 0, completionRate: 0 });
  });

  it("rounds the completion rate to a whole percentage", () => {
    expect(summarizeTasks(tasksWith("DONE", "TODO", "TODO")).completionRate).toBe(33);
    expect(summarizeTasks(tasksWith("DONE", "DONE", "TODO")).completionRate).toBe(67);
  });

  it("reports 100% when every task is done", () => {
    expect(summarizeTasks(tasksWith("DONE", "DONE")).completionRate).toBe(100);
  });
});
