import type { CreateTaskInput, UpdateTaskInput } from "@/lib/task-schemas";
import type { Task, TaskPriority, TaskStatus } from "@/lib/tasks";
import { prisma } from "@/server/db";
import { getRole, memberOf } from "@/server/services/memberships";

const TASK_SELECT = { id: true, projectId: true, title: true, description: true, status: true, priority: true } as const;

type TaskRow = {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
};

function toTask({ description, ...task }: TaskRow): Task {
  return description === null ? task : { ...task, description };
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
  const row = await prisma.task.create({
    data: { projectId, title: input.title, description: input.description, priority: input.priority },
    select: TASK_SELECT,
  });
  return toTask(row);
}

/** Returns null when no such task is in a project the caller belongs to. */
export async function updateTask(userId: string, taskId: string, input: UpdateTaskInput): Promise<Task | null> {
  const { count } = await prisma.task.updateMany({ where: memberTask(userId, taskId), data: input });
  if (count === 0) {
    return null;
  }
  const row = await prisma.task.findUnique({ where: { id: taskId }, select: TASK_SELECT });
  return row ? toTask(row) : null;
}

/** Returns false when no such task is in a project the caller belongs to. */
export async function deleteTask(userId: string, taskId: string): Promise<boolean> {
  const { count } = await prisma.task.deleteMany({ where: memberTask(userId, taskId) });
  return count > 0;
}
