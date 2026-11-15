import { NextResponse, type NextRequest } from "next/server";
import { updateTaskSchema } from "@/lib/task-schemas";
import { getAuthenticatedUserId } from "@/server/auth/session";
import { jsonError, notFoundError, readJson, unauthenticated, validationError, withErrorHandling } from "@/server/http";
import { deleteTask, InvalidAssigneeError, updateTask } from "@/server/services/tasks";

type Context = RouteContext<"/api/v1/tasks/[taskId]">;

const TASK_NOT_FOUND = "Task not found";

export const PATCH = withErrorHandling(async (request: NextRequest, context: Context) => {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) {
    return unauthenticated();
  }

  const parsed = updateTaskSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return validationError(parsed.error);
  }

  const { taskId } = await context.params;
  let task;
  try {
    task = await updateTask(userId, taskId, parsed.data);
  } catch (error) {
    if (error instanceof InvalidAssigneeError) {
      return jsonError(400, "VALIDATION_ERROR", error.message);
    }
    throw error;
  }
  if (!task) {
    return notFoundError(TASK_NOT_FOUND);
  }
  return NextResponse.json({ task });
});

export const DELETE = withErrorHandling(async (request: NextRequest, context: Context) => {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) {
    return unauthenticated();
  }

  const { taskId } = await context.params;
  if (!(await deleteTask(userId, taskId))) {
    return notFoundError(TASK_NOT_FOUND);
  }
  return new NextResponse(null, { status: 204 });
});
