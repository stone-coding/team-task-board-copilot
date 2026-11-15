import { NextResponse, type NextRequest } from "next/server";
import { createCommentSchema } from "@/lib/comment-schemas";
import { getAuthenticatedUserId } from "@/server/auth/session";
import { jsonError, notFoundError, readJson, unauthenticated, validationError, withErrorHandling } from "@/server/http";
import { addComment, listComments } from "@/server/services/comments";

type Context = RouteContext<"/api/v1/tasks/[taskId]/comments">;

const TASK_NOT_FOUND = "Task not found";

export const GET = withErrorHandling(async (request: NextRequest, context: Context) => {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) {
    return unauthenticated();
  }

  const { taskId } = await context.params;
  const comments = await listComments(userId, taskId);
  if (!comments) {
    return notFoundError(TASK_NOT_FOUND);
  }
  return NextResponse.json({ comments });
});

export const POST = withErrorHandling(async (request: NextRequest, context: Context) => {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) {
    return unauthenticated();
  }

  const { taskId } = await context.params;
  const parsed = createCommentSchema.safeParse(await readJson(request));
  const result = await addComment(userId, taskId, parsed.success ? parsed.data.body : null);
  switch (result.kind) {
    case "not_found":
      return notFoundError(TASK_NOT_FOUND);
    case "invalid":
      return parsed.success ? jsonError(400, "VALIDATION_ERROR", "Invalid request body") : validationError(parsed.error);
    case "added":
      return NextResponse.json({ comment: result.comment }, { status: 201 });
  }
});
