import type { TaskComment } from "@/lib/comments";
import { prisma } from "@/server/db";
import { recordActivity } from "@/server/services/activity";
import { getRole, memberOf } from "@/server/services/memberships";

const COMMENT_SELECT = {
  id: true,
  taskId: true,
  body: true,
  createdAt: true,
  author: { select: { id: true, name: true } },
} as const;

type CommentRow = { id: string; taskId: string; body: string; createdAt: Date; author: { id: string; name: string } };

function toComment(row: CommentRow): TaskComment {
  return {
    id: row.id,
    taskId: row.taskId,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
    author: { userId: row.author.id, name: row.author.name },
  };
}

// Comments are reached only through a task in a project the caller is a member of; anything else is "not found".
function findMemberTask(userId: string, taskId: string) {
  return prisma.task.findFirst({ where: { id: taskId, project: memberOf(userId) }, select: { projectId: true, title: true } });
}

/** Oldest first. Null when the task is not in a project the caller belongs to. */
export async function listComments(userId: string, taskId: string): Promise<TaskComment[] | null> {
  if (!(await findMemberTask(userId, taskId))) {
    return null;
  }
  const rows = await prisma.comment.findMany({ where: { taskId }, orderBy: [{ createdAt: "asc" }, { id: "asc" }], select: COMMENT_SELECT });
  return rows.map(toComment);
}

export type AddCommentResult = { kind: "added"; comment: TaskComment } | { kind: "not_found" | "invalid" };

/** Access is checked before validation, so a nonmember learns nothing from a 400. A null body is invalid input. */
export async function addComment(userId: string, taskId: string, body: string | null): Promise<AddCommentResult> {
  const task = await findMemberTask(userId, taskId);
  if (!task) {
    return { kind: "not_found" };
  }
  if (body === null) {
    return { kind: "invalid" };
  }
  return prisma.$transaction(async (tx) => {
    const row = await tx.comment.create({ data: { taskId, authorId: userId, body }, select: COMMENT_SELECT });
    await recordActivity(tx, { projectId: task.projectId, actorId: userId, type: "COMMENT_ADDED", taskId, taskTitle: task.title });
    return { kind: "added", comment: toComment(row) };
  });
}

export type DeleteCommentResult = "deleted" | "not_found" | "forbidden";

/** The author may delete their own comment; the project OWNER may delete any comment in the project. */
export async function deleteComment(userId: string, commentId: string): Promise<DeleteCommentResult> {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { authorId: true, taskId: true, task: { select: { projectId: true, title: true } } },
  });
  const role = comment ? await getRole(userId, comment.task.projectId) : null;
  if (!comment || !role) {
    return "not_found";
  }
  if (comment.authorId !== userId && role !== "OWNER") {
    return "forbidden";
  }
  await prisma.$transaction(async (tx) => {
    await tx.comment.delete({ where: { id: commentId } });
    await recordActivity(tx, {
      projectId: comment.task.projectId,
      actorId: userId,
      type: "COMMENT_DELETED",
      taskId: comment.taskId,
      taskTitle: comment.task.title,
    });
  });
  return "deleted";
}
