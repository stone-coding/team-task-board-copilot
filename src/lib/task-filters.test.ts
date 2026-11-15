import { describe, expect, it } from "vitest";
import { EMPTY_FILTERS, filterTasks, hasActiveFilters } from "@/lib/task-filters";
import type { Task } from "@/lib/tasks";

const tasks: Task[] = [
  { id: "a", projectId: "p", title: "Write release notes", description: "Summarize changes", status: "TODO", priority: "HIGH" },
  { id: "b", projectId: "p", title: "Collect design feedback", status: "TODO", priority: "LOW" },
  { id: "c", projectId: "p", title: "Set up repository", description: "Branch protection", status: "IN_PROGRESS", priority: "MEDIUM" },
  { id: "d", projectId: "p", title: "Configure CI", status: "DONE", priority: "HIGH" },
];

function ids(result: Task[]) {
  return result.map((task) => task.id);
}

describe("filterTasks", () => {
  it("returns every task when no filter is set", () => {
    expect(filterTasks(tasks, EMPTY_FILTERS)).toEqual(tasks);
  });

  it("matches the title case-insensitively", () => {
    expect(ids(filterTasks(tasks, { query: "RELEASE", status: "ALL", priority: "ALL" }))).toEqual(["a"]);
  });

  it("matches the description", () => {
    expect(ids(filterTasks(tasks, { query: "protection", status: "ALL", priority: "ALL" }))).toEqual(["c"]);
  });

  it("ignores surrounding spaces and treats a blank query as no search", () => {
    expect(ids(filterTasks(tasks, { query: "  design ", status: "ALL", priority: "ALL" }))).toEqual(["b"]);
    expect(filterTasks(tasks, { query: "   ", status: "ALL", priority: "ALL" })).toEqual(tasks);
  });

  it("keeps only tasks with the selected status", () => {
    expect(ids(filterTasks(tasks, { query: "", status: "TODO", priority: "ALL" }))).toEqual(["a", "b"]);
  });

  it("combines the search and the status filter", () => {
    expect(ids(filterTasks(tasks, { query: "e", status: "IN_PROGRESS", priority: "ALL" }))).toEqual(["c"]);
    expect(filterTasks(tasks, { query: "release", status: "DONE", priority: "ALL" })).toEqual([]);
  });

  it("returns an empty list when nothing matches or there are no tasks", () => {
    expect(filterTasks(tasks, { query: "nothing like this", status: "ALL", priority: "ALL" })).toEqual([]);
    expect(filterTasks([], { query: "a", status: "TODO", priority: "ALL" })).toEqual([]);
  });
});

describe("filterTasks: priority", () => {
  it("keeps only tasks with the selected priority", () => {
    expect(ids(filterTasks(tasks, { query: "", status: "ALL", priority: "HIGH" }))).toEqual(["a", "d"]);
    expect(ids(filterTasks(tasks, { query: "", status: "ALL", priority: "LOW" }))).toEqual(["b"]);
  });

  it("combines priority with status and search", () => {
    expect(ids(filterTasks(tasks, { query: "", status: "TODO", priority: "HIGH" }))).toEqual(["a"]);
    expect(ids(filterTasks(tasks, { query: "configure", status: "ALL", priority: "HIGH" }))).toEqual(["d"]);
    expect(filterTasks(tasks, { query: "release", status: "TODO", priority: "LOW" })).toEqual([]);
  });
});

describe("hasActiveFilters", () => {
  it("is false for empty filters and a blank query", () => {
    expect(hasActiveFilters(EMPTY_FILTERS)).toBe(false);
    expect(hasActiveFilters({ query: "  ", status: "ALL", priority: "ALL" })).toBe(false);
  });

  it("is true for a query or a status", () => {
    expect(hasActiveFilters({ query: "a", status: "ALL", priority: "ALL" })).toBe(true);
    expect(hasActiveFilters({ query: "", status: "DONE", priority: "ALL" })).toBe(true);
    expect(hasActiveFilters({ query: "", status: "ALL", priority: "LOW" })).toBe(true);
  });
});
