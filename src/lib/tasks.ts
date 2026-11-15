// Shared task domain types. The Prisma schema mirrors these.

export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

export type TaskAssignee = { userId: string; name: string };

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  /** Omitted when the task is unassigned. */
  assignee?: TaskAssignee;
}
