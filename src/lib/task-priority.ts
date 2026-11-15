import type { Task, TaskPriority } from "./tasks";

/** Lowest to highest, matching the Prisma enum. */
export const TASK_PRIORITIES = ["LOW", "MEDIUM", "HIGH"] as const satisfies readonly TaskPriority[];

/** Highest first: the order of select options and of cards within a column. */
export const PRIORITIES_HIGH_FIRST: readonly TaskPriority[] = [...TASK_PRIORITIES].reverse();

export const DEFAULT_PRIORITY: TaskPriority = "MEDIUM";

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
};

export function isTaskPriority(value: string): value is TaskPriority {
  return TASK_PRIORITIES.some((priority) => priority === value);
}

/** High, then Medium, then Low; tasks with the same priority keep their order (Array.prototype.sort is stable). */
export function sortByPriority(tasks: readonly Task[]): Task[] {
  return [...tasks].sort((a, b) => TASK_PRIORITIES.indexOf(b.priority) - TASK_PRIORITIES.indexOf(a.priority));
}
