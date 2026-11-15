import { STATUS_LABELS } from "./task-status";
import type { TaskStatus } from "./tasks";

export type ActivityType =
  | "TASK_CREATED"
  | "TASK_UPDATED"
  | "TASK_MOVED"
  | "TASK_ASSIGNED"
  | "TASK_DELETED"
  | "COMMENT_ADDED"
  | "COMMENT_DELETED"
  | "MEMBER_ADDED"
  | "MEMBER_REMOVED"
  | "MEMBER_LEFT";

// One activity event as returned by the API; optional fields are omitted when empty. `createdAt` is ISO 8601.
export type ActivityItem = {
  id: string;
  type: ActivityType;
  createdAt: string;
  actor: { userId: string; name: string };
  taskId?: string;
  taskTitle?: string;
  fromStatus?: TaskStatus;
  toStatus?: TaskStatus;
  subjectName?: string;
};

/** The event as a sentence without the actor, for example `moved "Write copy" from To Do to Done`. */
export function describeActivity(item: ActivityItem): string {
  const task = `"${item.taskTitle ?? "a task"}"`;
  switch (item.type) {
    case "TASK_CREATED":
      return `created ${task}`;
    case "TASK_UPDATED":
      return `edited ${task}`;
    case "TASK_MOVED":
      return item.fromStatus && item.toStatus
        ? `moved ${task} from ${STATUS_LABELS[item.fromStatus]} to ${STATUS_LABELS[item.toStatus]}`
        : `moved ${task}`;
    case "TASK_ASSIGNED":
      return item.subjectName ? `assigned ${task} to ${item.subjectName}` : `unassigned ${task}`;
    case "TASK_DELETED":
      return `deleted ${task}`;
    case "COMMENT_ADDED":
      return `commented on ${task}`;
    case "COMMENT_DELETED":
      return `deleted a comment on ${task}`;
    case "MEMBER_ADDED":
      return `added ${item.subjectName} to the project`;
    case "MEMBER_REMOVED":
      return `removed ${item.subjectName} from the project`;
    case "MEMBER_LEFT":
      return "left the project";
  }
}
