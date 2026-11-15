import { isTaskPriority } from "./task-priority";
import { isTaskStatus } from "./task-status";
import type { Task, TaskPriority, TaskStatus } from "./tasks";

export type StatusFilter = TaskStatus | "ALL";

export type PriorityFilter = TaskPriority | "ALL";

/** "ALL", "UNASSIGNED", or a member's user id. */
export type AssigneeFilter = string;

export type TaskFilterValues = { query: string; status: StatusFilter; priority: PriorityFilter; assignee: AssigneeFilter };

export const EMPTY_FILTERS: TaskFilterValues = { query: "", status: "ALL", priority: "ALL", assignee: "ALL" };

export function isStatusFilter(value: string): value is StatusFilter {
  return value === "ALL" || isTaskStatus(value);
}

export function isPriorityFilter(value: string): value is PriorityFilter {
  return value === "ALL" || isTaskPriority(value);
}

export function hasActiveFilters({ query, status, priority, assignee }: TaskFilterValues): boolean {
  return query.trim() !== "" || status !== "ALL" || priority !== "ALL" || assignee !== "ALL";
}

function matchesAssignee(task: Task, assignee: AssigneeFilter): boolean {
  if (assignee === "ALL") {
    return true;
  }
  return assignee === "UNASSIGNED" ? task.assignee === undefined : task.assignee?.userId === assignee;
}

/** Tasks whose title or description contains the query (case-insensitive) and whose status, priority, and assignee match. */
export function filterTasks(tasks: readonly Task[], { query, status, priority, assignee }: TaskFilterValues): Task[] {
  const needle = query.trim().toLowerCase();
  return tasks.filter(
    (task) =>
      (status === "ALL" || task.status === status) &&
      (priority === "ALL" || task.priority === priority) &&
      matchesAssignee(task, assignee) &&
      (needle === "" || `${task.title}\n${task.description ?? ""}`.toLowerCase().includes(needle)),
  );
}
