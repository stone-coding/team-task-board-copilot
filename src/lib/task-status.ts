import type { TaskStatus } from "./tasks";

export const TASK_STATUSES: readonly TaskStatus[] = ["TODO", "IN_PROGRESS", "DONE"];

export const STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
};

export function isTaskStatus(value: string): value is TaskStatus {
  return TASK_STATUSES.some((status) => status === value);
}
