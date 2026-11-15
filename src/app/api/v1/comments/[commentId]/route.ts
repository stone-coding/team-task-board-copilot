import { NextResponse, type NextRequest } from "next/server";
import { getAuthenticatedUserId } from "@/server/auth/session";
import { forbiddenError, notFoundError, unauthenticated, withErrorHandling } from "@/server/http";
import { deleteComment } from "@/server/services/comments";

type Context = RouteContext<"/api/v1/comments/[commentId]">;

export const DELETE = withErrorHandling(async (request: NextRequest, context: Context) => {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) {
    return unauthenticated();
  }

  const { commentId } = await context.params;
  switch (await deleteComment(userId, commentId)) {
    case "not_found":
      return notFoundError("Comment not found");
    case "forbidden":
      return forbiddenError("Only the author or the project owner can delete a comment");
    case "deleted":
      return new NextResponse(null, { status: 204 });
  }
});
