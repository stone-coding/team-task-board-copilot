import { describe, expect, it } from "vitest";
import { boardReducer, groupTasksByStatus, moveTask, type BoardState } from "@/lib/board";
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

describe("boardReducer", () => {
  const initial: BoardState = { tasks, error: null };

  it("moves the card as soon as a status change starts and clears an old error", () => {
    const state = boardReducer(
      { tasks, error: "Old error" },
      { type: "statusChangeStarted", taskId: "a", status: "DONE" },
    );

    expect(state.tasks.find((task) => task.id === "a")?.status).toBe("DONE");
    expect(state.error).toBeNull();
  });

  it("keeps the moved card and takes the saved task from the server on success", () => {
    const started = boardReducer(initial, { type: "statusChangeStarted", taskId: "a", status: "DONE" });
    const saved = { id: "a", projectId: "p", title: "A (saved)", status: "DONE" as const };
    const state = boardReducer(started, { type: "statusChangeSucceeded", task: saved });

    expect(state.tasks[0]).toEqual(saved);
    expect(state.tasks).toHaveLength(3);
    expect(state.error).toBeNull();
  });

  it("moves the card back to its previous column and records the error on failure", () => {
    const started = boardReducer(initial, { type: "statusChangeStarted", taskId: "a", status: "DONE" });
    const state = boardReducer(started, {
      type: "statusChangeFailed",
      taskId: "a",
      status: "DONE",
      previousStatus: "TODO",
      message: "Could not save",
    });

    expect(state.tasks).toEqual(tasks);
    expect(state.error).toBe("Could not save");
  });

  it("does not undo a newer change when an older request fails", () => {
    const first = boardReducer(initial, { type: "statusChangeStarted", taskId: "a", status: "IN_PROGRESS" });
    const second = boardReducer(first, { type: "statusChangeStarted", taskId: "a", status: "DONE" });
    const state = boardReducer(second, {
      type: "statusChangeFailed",
      taskId: "a",
      status: "IN_PROGRESS",
      previousStatus: "TODO",
      message: "Could not save",
    });

    expect(state.tasks[0].status).toBe("DONE");
    expect(state.error).toBe("Could not save");
  });

  it("does not mutate the previous state", () => {
    boardReducer(initial, { type: "statusChangeStarted", taskId: "a", status: "DONE" });

    expect(initial.tasks[0].status).toBe("TODO");
  });
});

describe("boardReducer: creating, editing, and deleting tasks", () => {
  const initial: BoardState = { tasks, error: "Old error" };

  it("adds a created task at the end and clears the error", () => {
    const created: Task = { id: "d", projectId: "p", title: "D", status: "TODO" };
    const state = boardReducer(initial, { type: "taskAdded", task: created });

    expect(state.tasks.map((task) => task.id)).toEqual(["a", "b", "c", "d"]);
    expect(state.error).toBeNull();
  });

  it("replaces an edited task in place", () => {
    const edited: Task = { id: "b", projectId: "p", title: "B renamed", description: "Notes", status: "IN_PROGRESS" };
    const state = boardReducer(initial, { type: "taskUpdated", task: edited });

    expect(state.tasks).toEqual([tasks[0], edited, tasks[2]]);
    expect(state.error).toBeNull();
  });

  it("removes a deleted task", () => {
    const state = boardReducer(initial, { type: "taskRemoved", taskId: "a" });

    expect(state.tasks.map((task) => task.id)).toEqual(["b", "c"]);
    expect(state.error).toBeNull();
  });
});
