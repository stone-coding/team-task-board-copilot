import type { Task, TaskStatus } from "./tasks";

export type TasksByStatus = Record<TaskStatus, Task[]>;

export function groupTasksByStatus(tasks: readonly Task[]): TasksByStatus {
  const groups: TasksByStatus = { TODO: [], IN_PROGRESS: [], DONE: [] };
  for (const task of tasks) {
    groups[task.status].push(task);
  }
  return groups;
}

export function moveTask(tasks: readonly Task[], taskId: string, status: TaskStatus): Task[] {
  return tasks.map((task) => (task.id === taskId && task.status !== status ? { ...task, status } : task));
}
