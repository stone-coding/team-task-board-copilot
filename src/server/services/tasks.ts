import type { CreateTaskInput, UpdateTaskInput } from "@/lib/task-schemas";
import type { Task, TaskPriority, TaskStatus } from "@/lib/tasks";
import { prisma } from "@/server/db";
import { recordActivity } from "@/server/services/activity";
import { getRole, memberOf } from "@/server/services/memberships";

const TASK_SELECT = {
  id: true,
  projectId: true,
  title: true,
  description: true,
  status: true,
  priority: true,
  assignee: { select: { id: true, name: true } },
} as const;

type TaskRow = {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: { id: string; name: string } | null;
};

function toTask({ description, assignee, ...fields }: TaskRow): Task {
  const task: Task = { ...fields };
  if (description !== null) {
    task.description = description;
  }
  if (assignee) {
    task.assignee = { userId: assignee.id, name: assignee.name };
  }
  return task;
}

/** The requested assignee is not a member of the task's project. */
export class InvalidAssigneeError extends Error {
  constructor() {
    super("Assignee must be a member of this project");
  }
}

async function assertAssignable(projectId: string, assigneeId: string | null | undefined) {
  if (assigneeId && !(await getRole(assigneeId, projectId))) {
    throw new InvalidAssigneeError();
  }
}

// Tasks are reached only through a project the caller is a member of (OWNER or MEMBER),
// so a task in any other project behaves like a missing one.

async function isMember(userId: string, projectId: string): Promise<boolean> {
  return (await getRole(userId, projectId)) !== null;
}

function memberTask(userId: string, taskId: string) {
  return { id: taskId, project: memberOf(userId) };
}

/** Returns null when the caller is not a member of such a project. */
export async function listTasks(userId: string, projectId: string): Promise<Task[] | null> {
  if (!(await isMember(userId, projectId))) {
    return null;
  }
  const rows = await prisma.task.findMany({
    where: { projectId },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: TASK_SELECT,
  });
  return rows.map(toTask);
}

/** Returns null when the caller is not a member of such a project. */
export async function createTask(userId: string, projectId: string, input: CreateTaskInput): Promise<Task | null> {
  if (!(await isMember(userId, projectId))) {
    return null;
  }
  await assertAssignable(projectId, input.assigneeId);
  return prisma.$transaction(async (tx) => {
    const row = await tx.task.create({
      data: { projectId, title: input.title, description: input.description, priority: input.priority, assigneeId: input.assigneeId },
      select: TASK_SELECT,
    });
    const event = { projectId, actorId: userId, taskId: row.id, taskTitle: row.title };
    await recordActivity(tx, { ...event, type: "TASK_CREATED" });
    if (row.assignee) {
      await recordActivity(tx, { ...event, type: "TASK_ASSIGNED", subjectName: row.assignee.name });
    }
    return toTask(row);
  });
}

/**
 * Returns null when no such task is in a project the caller belongs to; access is checked before the assignee.
 * The change and its activity events (moved, assigned, edited) are written in one transaction.
 */
export async function updateTask(userId: string, taskId: string, input: UpdateTaskInput): Promise<Task | null> {
  return prisma.$transaction(async (tx) => {
    const before = await tx.task.findFirst({ where: memberTask(userId, taskId), select: TASK_SELECT });
    if (!before) {
      return null;
    }
    if (input.assigneeId !== undefined) {
      await assertAssignable(before.projectId, input.assigneeId);
    }
    await tx.task.update({ where: { id: taskId }, data: input });
    const after = await tx.task.findUniqueOrThrow({ where: { id: taskId }, select: TASK_SELECT });

    const event = { projectId: after.projectId, actorId: userId, taskId, taskTitle: after.title };
    if (before.status !== after.status) {
      await recordActivity(tx, { ...event, type: "TASK_MOVED", fromStatus: before.status, toStatus: after.status });
    }
    if (before.assignee?.id !== after.assignee?.id) {
      await recordActivity(tx, { ...event, type: "TASK_ASSIGNED", subjectName: after.assignee?.name });
    }
    if (before.title !== after.title || before.description !== after.description || before.priority !== after.priority) {
      await recordActivity(tx, { ...event, type: "TASK_UPDATED" });
    }
    return toTask(after);
  });
}

/** Returns false when no such task is in a project the caller belongs to. */
export async function deleteTask(userId: string, taskId: string): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const task = await tx.task.findFirst({ where: memberTask(userId, taskId), select: { projectId: true, title: true } });
    if (!task) {
      return false;
    }
    await tx.task.delete({ where: { id: taskId } });
    await recordActivity(tx, { projectId: task.projectId, actorId: userId, type: "TASK_DELETED", taskId, taskTitle: task.title });
    return true;
  });
}
