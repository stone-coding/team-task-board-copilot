import type { Task } from "./tasks";

export type ProjectStats = {
  total: number;
  inProgress: number;
  completed: number;
  /** Percentage of tasks that are Done, rounded to a whole number; 0 for an empty project. */
  completionRate: number;
};

export function summarizeTasks(tasks: readonly Task[]): ProjectStats {
  const total = tasks.length;
  const inProgress = tasks.filter((task) => task.status === "IN_PROGRESS").length;
  const completed = tasks.filter((task) => task.status === "DONE").length;
  const completionRate = total === 0 ? 0 : Math.round((completed / total) * 100);
  return { total, inProgress, completed, completionRate };
}
