import { NextResponse, type NextRequest } from "next/server";
import { createTaskSchema } from "@/lib/task-schemas";
import { getAuthenticatedUserId } from "@/server/auth/session";
import { notFoundError, readJson, unauthenticated, validationError, withErrorHandling } from "@/server/http";
import { createTask, listTasks } from "@/server/services/tasks";

type Context = RouteContext<"/api/v1/projects/[projectId]/tasks">;

const PROJECT_NOT_FOUND = "Project not found";

export const GET = withErrorHandling(async (request: NextRequest, context: Context) => {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) {
    return unauthenticated();
  }

  const { projectId } = await context.params;
  const tasks = await listTasks(userId, projectId);
  if (!tasks) {
    return notFoundError(PROJECT_NOT_FOUND);
  }
  return NextResponse.json({ tasks });
});

export const POST = withErrorHandling(async (request: NextRequest, context: Context) => {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) {
    return unauthenticated();
  }

  const parsed = createTaskSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return validationError(parsed.error);
  }

  const { projectId } = await context.params;
  const task = await createTask(userId, projectId, parsed.data);
  if (!task) {
    return notFoundError(PROJECT_NOT_FOUND);
  }
  return NextResponse.json({ task }, { status: 201 });
});
