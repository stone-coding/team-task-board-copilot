import type { CreateTaskInput, UpdateTaskInput } from "@/lib/task-schemas";
import type { Task, TaskStatus } from "@/lib/tasks";
import { prisma } from "@/server/db";

const TASK_SELECT = { id: true, projectId: true, title: true, description: true, status: true } as const;

type TaskRow = { id: string; projectId: string; title: string; description: string | null; status: TaskStatus };

function toTask({ description, ...task }: TaskRow): Task {
  return description === null ? task : { ...task, description };
}

// Tasks are reached only through a project the caller owns, so another user's task behaves like a missing one.

async function ownsProject(ownerId: string, projectId: string): Promise<boolean> {
  return (await prisma.project.findFirst({ where: { id: projectId, ownerId }, select: { id: true } })) !== null;
}

function ownedTask(ownerId: string, taskId: string) {
  return { id: taskId, project: { ownerId } };
}

/** Returns null when the caller owns no such project. */
export async function listTasks(ownerId: string, projectId: string): Promise<Task[] | null> {
  if (!(await ownsProject(ownerId, projectId))) {
    return null;
  }
  const rows = await prisma.task.findMany({
    where: { projectId },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: TASK_SELECT,
  });
  return rows.map(toTask);
}

/** Returns null when the caller owns no such project. */
export async function createTask(ownerId: string, projectId: string, input: CreateTaskInput): Promise<Task | null> {
  if (!(await ownsProject(ownerId, projectId))) {
    return null;
  }
  const row = await prisma.task.create({
    data: { projectId, title: input.title, description: input.description },
    select: TASK_SELECT,
  });
  return toTask(row);
}

/** Returns null when the caller owns no such task. */
export async function updateTask(ownerId: string, taskId: string, input: UpdateTaskInput): Promise<Task | null> {
  const { count } = await prisma.task.updateMany({ where: ownedTask(ownerId, taskId), data: input });
  if (count === 0) {
    return null;
  }
  const row = await prisma.task.findUnique({ where: { id: taskId }, select: TASK_SELECT });
  return row ? toTask(row) : null;
}

/** Returns false when the caller owns no such task. */
export async function deleteTask(ownerId: string, taskId: string): Promise<boolean> {
  const { count } = await prisma.task.deleteMany({ where: ownedTask(ownerId, taskId) });
  return count > 0;
}
