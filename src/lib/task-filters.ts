import { isTaskStatus } from "./task-status";
import type { Task, TaskStatus } from "./tasks";

export type StatusFilter = TaskStatus | "ALL";

export type TaskFilterValues = { query: string; status: StatusFilter };

export const EMPTY_FILTERS: TaskFilterValues = { query: "", status: "ALL" };

export function isStatusFilter(value: string): value is StatusFilter {
  return value === "ALL" || isTaskStatus(value);
}

export function hasActiveFilters({ query, status }: TaskFilterValues): boolean {
  return query.trim() !== "" || status !== "ALL";
}

/** Tasks whose title or description contains the query (case-insensitive) and whose status matches. */
export function filterTasks(tasks: readonly Task[], { query, status }: TaskFilterValues): Task[] {
  const needle = query.trim().toLowerCase();
  return tasks.filter(
    (task) =>
      (status === "ALL" || task.status === status) &&
      (needle === "" || `${task.title}\n${task.description ?? ""}`.toLowerCase().includes(needle)),
  );
}
