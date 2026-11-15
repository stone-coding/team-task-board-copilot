import { describe, expect, it } from "vitest";
import { EMPTY_FILTERS, filterTasks, hasActiveFilters } from "@/lib/task-filters";
import type { Task } from "@/lib/tasks";

const tasks: Task[] = [
  { id: "a", projectId: "p", title: "Write release notes", description: "Summarize changes", status: "TODO" },
  { id: "b", projectId: "p", title: "Collect design feedback", status: "TODO" },
  { id: "c", projectId: "p", title: "Set up repository", description: "Branch protection", status: "IN_PROGRESS" },
  { id: "d", projectId: "p", title: "Configure CI", status: "DONE" },
];

function ids(result: Task[]) {
  return result.map((task) => task.id);
}

describe("filterTasks", () => {
  it("returns every task when no filter is set", () => {
    expect(filterTasks(tasks, EMPTY_FILTERS)).toEqual(tasks);
  });

  it("matches the title case-insensitively", () => {
    expect(ids(filterTasks(tasks, { query: "RELEASE", status: "ALL" }))).toEqual(["a"]);
  });

  it("matches the description", () => {
    expect(ids(filterTasks(tasks, { query: "protection", status: "ALL" }))).toEqual(["c"]);
  });

  it("ignores surrounding spaces and treats a blank query as no search", () => {
    expect(ids(filterTasks(tasks, { query: "  design ", status: "ALL" }))).toEqual(["b"]);
    expect(filterTasks(tasks, { query: "   ", status: "ALL" })).toEqual(tasks);
  });

  it("keeps only tasks with the selected status", () => {
    expect(ids(filterTasks(tasks, { query: "", status: "TODO" }))).toEqual(["a", "b"]);
  });

  it("combines the search and the status filter", () => {
    expect(ids(filterTasks(tasks, { query: "e", status: "IN_PROGRESS" }))).toEqual(["c"]);
    expect(filterTasks(tasks, { query: "release", status: "DONE" })).toEqual([]);
  });

  it("returns an empty list when nothing matches or there are no tasks", () => {
    expect(filterTasks(tasks, { query: "nothing like this", status: "ALL" })).toEqual([]);
    expect(filterTasks([], { query: "a", status: "TODO" })).toEqual([]);
  });
});

describe("hasActiveFilters", () => {
  it("is false for empty filters and a blank query", () => {
    expect(hasActiveFilters(EMPTY_FILTERS)).toBe(false);
    expect(hasActiveFilters({ query: "  ", status: "ALL" })).toBe(false);
  });

  it("is true for a query or a status", () => {
    expect(hasActiveFilters({ query: "a", status: "ALL" })).toBe(true);
    expect(hasActiveFilters({ query: "", status: "DONE" })).toBe(true);
  });
});
