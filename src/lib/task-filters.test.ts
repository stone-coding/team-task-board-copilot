import { describe, expect, it } from "vitest";
import { EMPTY_FILTERS, filterTasks, hasActiveFilters } from "@/lib/task-filters";
import type { Task } from "@/lib/tasks";

const tasks: Task[] = [
  { id: "a", projectId: "p", title: "Write release notes", description: "Summarize changes", status: "TODO", priority: "HIGH", assignee: { userId: "u1", name: "Olivia" } },
  { id: "b", projectId: "p", title: "Collect design feedback", status: "TODO", priority: "LOW" },
  { id: "c", projectId: "p", title: "Set up repository", description: "Branch protection", status: "IN_PROGRESS", priority: "MEDIUM", assignee: { userId: "u2", name: "Mason" } },
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
    expect(ids(filterTasks(tasks, { query: "RELEASE", status: "ALL", priority: "ALL", assignee: "ALL" }))).toEqual(["a"]);
  });

  it("matches the description", () => {
    expect(ids(filterTasks(tasks, { query: "protection", status: "ALL", priority: "ALL", assignee: "ALL" }))).toEqual(["c"]);
  });

  it("ignores surrounding spaces and treats a blank query as no search", () => {
    expect(ids(filterTasks(tasks, { query: "  design ", status: "ALL", priority: "ALL", assignee: "ALL" }))).toEqual(["b"]);
    expect(filterTasks(tasks, { query: "   ", status: "ALL", priority: "ALL", assignee: "ALL" })).toEqual(tasks);
  });

  it("keeps only tasks with the selected status", () => {
    expect(ids(filterTasks(tasks, { query: "", status: "TODO", priority: "ALL", assignee: "ALL" }))).toEqual(["a", "b"]);
  });

  it("combines the search and the status filter", () => {
    expect(ids(filterTasks(tasks, { query: "e", status: "IN_PROGRESS", priority: "ALL", assignee: "ALL" }))).toEqual(["c"]);
    expect(filterTasks(tasks, { query: "release", status: "DONE", priority: "ALL", assignee: "ALL" })).toEqual([]);
  });

  it("returns an empty list when nothing matches or there are no tasks", () => {
    expect(filterTasks(tasks, { query: "nothing like this", status: "ALL", priority: "ALL", assignee: "ALL" })).toEqual([]);
    expect(filterTasks([], { query: "a", status: "TODO", priority: "ALL", assignee: "ALL" })).toEqual([]);
  });
});

describe("filterTasks: priority", () => {
  it("keeps only tasks with the selected priority", () => {
    expect(ids(filterTasks(tasks, { query: "", status: "ALL", priority: "HIGH", assignee: "ALL" }))).toEqual(["a", "d"]);
    expect(ids(filterTasks(tasks, { query: "", status: "ALL", priority: "LOW", assignee: "ALL" }))).toEqual(["b"]);
  });

  it("combines priority with status and search", () => {
    expect(ids(filterTasks(tasks, { query: "", status: "TODO", priority: "HIGH", assignee: "ALL" }))).toEqual(["a"]);
    expect(ids(filterTasks(tasks, { query: "configure", status: "ALL", priority: "HIGH", assignee: "ALL" }))).toEqual(["d"]);
    expect(filterTasks(tasks, { query: "release", status: "TODO", priority: "LOW", assignee: "ALL" })).toEqual([]);
  });
});

describe("filterTasks: assignee", () => {
  it("keeps tasks assigned to the selected member", () => {
    expect(ids(filterTasks(tasks, { query: "", status: "ALL", priority: "ALL", assignee: "u2" }))).toEqual(["c"]);
  });

  it("keeps only unassigned tasks for UNASSIGNED", () => {
    expect(ids(filterTasks(tasks, { query: "", status: "ALL", priority: "ALL", assignee: "UNASSIGNED" }))).toEqual(["b", "d"]);
  });

  it("combines the assignee with search, status, and priority", () => {
    expect(ids(filterTasks(tasks, { query: "release", status: "TODO", priority: "HIGH", assignee: "u1" }))).toEqual(["a"]);
    expect(filterTasks(tasks, { query: "", status: "DONE", priority: "ALL", assignee: "u1" })).toEqual([]);
  });
});

describe("hasActiveFilters", () => {
  it("is false for empty filters and a blank query", () => {
    expect(hasActiveFilters(EMPTY_FILTERS)).toBe(false);
    expect(hasActiveFilters({ query: "  ", status: "ALL", priority: "ALL", assignee: "ALL" })).toBe(false);
  });

  it("is true for a query or a status", () => {
    expect(hasActiveFilters({ query: "a", status: "ALL", priority: "ALL", assignee: "ALL" })).toBe(true);
    expect(hasActiveFilters({ query: "", status: "DONE", priority: "ALL", assignee: "ALL" })).toBe(true);
    expect(hasActiveFilters({ query: "", status: "ALL", priority: "LOW", assignee: "ALL" })).toBe(true);
    expect(hasActiveFilters({ query: "", status: "ALL", priority: "ALL", assignee: "UNASSIGNED" })).toBe(true);
  });
});
