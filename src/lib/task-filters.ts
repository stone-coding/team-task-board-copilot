import { isTaskPriority } from "./task-priority";
import { isTaskStatus } from "./task-status";
import type { Task, TaskPriority, TaskStatus } from "./tasks";

export type StatusFilter = TaskStatus | "ALL";

export type PriorityFilter = TaskPriority | "ALL";

export type TaskFilterValues = { query: string; status: StatusFilter; priority: PriorityFilter };

export const EMPTY_FILTERS: TaskFilterValues = { query: "", status: "ALL", priority: "ALL" };

export function isStatusFilter(value: string): value is StatusFilter {
  return value === "ALL" || isTaskStatus(value);
}

export function isPriorityFilter(value: string): value is PriorityFilter {
  return value === "ALL" || isTaskPriority(value);
}

export function hasActiveFilters({ query, status, priority }: TaskFilterValues): boolean {
  return query.trim() !== "" || status !== "ALL" || priority !== "ALL";
}

/** Tasks whose title or description contains the query (case-insensitive) and whose status and priority match. */
export function filterTasks(tasks: readonly Task[], { query, status, priority }: TaskFilterValues): Task[] {
  const needle = query.trim().toLowerCase();
  return tasks.filter(
    (task) =>
      (status === "ALL" || task.status === status) &&
      (priority === "ALL" || task.priority === priority) &&
      (needle === "" || `${task.title}\n${task.description ?? ""}`.toLowerCase().includes(needle)),
  );
}
