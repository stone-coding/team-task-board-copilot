import type { Prisma } from "@/generated/prisma/client";
import type { ActivityItem, ActivityType } from "@/lib/activity";
import type { TaskStatus } from "@/lib/tasks";
import { prisma } from "@/server/db";
import { getRole } from "@/server/services/memberships";

export const ACTIVITY_LIMIT = 50;

export type ActivityEvent = {
  projectId: string;
  actorId: string;
  type: ActivityType;
  taskId?: string;
  taskTitle?: string;
  fromStatus?: TaskStatus;
  toStatus?: TaskStatus;
  subjectName?: string;
};

/** Records an event with the same transaction client as the change it describes, so both commit or neither does. */
export async function recordActivity(tx: Prisma.TransactionClient, event: ActivityEvent) {
  await tx.activity.create({ data: event });
}

type ActivityRow = {
  id: string;
  type: ActivityType;
  createdAt: Date;
  actor: { id: string; name: string };
  taskId: string | null;
  taskTitle: string | null;
  fromStatus: TaskStatus | null;
  toStatus: TaskStatus | null;
  subjectName: string | null;
};

function toItem(row: ActivityRow): ActivityItem {
  const item: ActivityItem = { id: row.id, type: row.type, createdAt: row.createdAt.toISOString(), actor: { userId: row.actor.id, name: row.actor.name } };
  if (row.taskId !== null) {
    item.taskId = row.taskId;
  }
  if (row.taskTitle !== null) {
    item.taskTitle = row.taskTitle;
  }
  if (row.fromStatus !== null) {
    item.fromStatus = row.fromStatus;
  }
  if (row.toStatus !== null) {
    item.toStatus = row.toStatus;
  }
  if (row.subjectName !== null) {
    item.subjectName = row.subjectName;
  }
  return item;
}

/** The newest events, newest first. Null when the caller is not a member of the project. */
export async function listActivity(userId: string, projectId: string): Promise<ActivityItem[] | null> {
  if (!(await getRole(userId, projectId))) {
    return null;
  }
  const rows = await prisma.activity.findMany({
    where: { projectId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: ACTIVITY_LIMIT,
    select: {
      id: true,
      type: true,
      createdAt: true,
      actor: { select: { id: true, name: true } },
      taskId: true,
      taskTitle: true,
      fromStatus: true,
      toStatus: true,
      subjectName: true,
    },
  });
  return rows.map(toItem);
}
