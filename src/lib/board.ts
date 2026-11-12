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

export type BoardState = { tasks: Task[]; error: string | null };

export type BoardAction =
  | { type: "statusChangeStarted"; taskId: string; status: TaskStatus }
  | { type: "statusChangeSucceeded"; task: Task }
  | { type: "statusChangeFailed"; taskId: string; status: TaskStatus; previousStatus: TaskStatus; message: string };

/** Optimistic board state: a status change moves the card at once and is rolled back if saving fails. */
export function boardReducer(state: BoardState, action: BoardAction): BoardState {
  switch (action.type) {
    case "statusChangeStarted":
      return { tasks: moveTask(state.tasks, action.taskId, action.status), error: null };
    case "statusChangeSucceeded":
      return { ...state, tasks: state.tasks.map((task) => (task.id === action.task.id ? action.task : task)) };
    case "statusChangeFailed": {
      // Roll back only if no newer change has moved the card since this request started.
      const current = state.tasks.find((task) => task.id === action.taskId);
      const tasks =
        current?.status === action.status ? moveTask(state.tasks, action.taskId, action.previousStatus) : state.tasks;
      return { tasks, error: action.message };
    }
  }
}
