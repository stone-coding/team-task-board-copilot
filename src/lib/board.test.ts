import { describe, expect, it } from "vitest";
import { groupTasksByStatus, moveTask } from "@/lib/board";
import type { Task } from "@/lib/tasks";

const tasks: Task[] = [
  { id: "a", projectId: "p", title: "A", status: "TODO" },
  { id: "b", projectId: "p", title: "B", status: "IN_PROGRESS" },
  { id: "c", projectId: "p", title: "C", status: "TODO" },
];

describe("groupTasksByStatus", () => {
  it("groups tasks by status and keeps their order", () => {
    const groups = groupTasksByStatus(tasks);

    expect(groups.TODO.map((task) => task.id)).toEqual(["a", "c"]);
    expect(groups.IN_PROGRESS.map((task) => task.id)).toEqual(["b"]);
    expect(groups.DONE).toEqual([]);
  });

  it("returns an empty group for every status when there are no tasks", () => {
    expect(groupTasksByStatus([])).toEqual({ TODO: [], IN_PROGRESS: [], DONE: [] });
  });
});

describe("moveTask", () => {
  it("changes only the matching task's status", () => {
    const moved = moveTask(tasks, "a", "DONE");

    expect(moved.map((task) => [task.id, task.status])).toEqual([
      ["a", "DONE"],
      ["b", "IN_PROGRESS"],
      ["c", "TODO"],
    ]);
  });

  it("does not mutate the original tasks", () => {
    moveTask(tasks, "a", "DONE");

    expect(tasks[0].status).toBe("TODO");
  });

  it("leaves tasks unchanged for an unknown id", () => {
    expect(moveTask(tasks, "missing", "DONE")).toEqual(tasks);
  });

  it("keeps the same task object when the status does not change", () => {
    expect(moveTask(tasks, "a", "TODO")[0]).toBe(tasks[0]);
  });

  it("returns an empty list for an empty board", () => {
    expect(moveTask([], "a", "DONE")).toEqual([]);
  });
});
