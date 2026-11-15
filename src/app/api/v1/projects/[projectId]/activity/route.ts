import { NextResponse, type NextRequest } from "next/server";
import { getAuthenticatedUserId } from "@/server/auth/session";
import { notFoundError, unauthenticated, withErrorHandling } from "@/server/http";
import { listActivity } from "@/server/services/activity";

type Context = RouteContext<"/api/v1/projects/[projectId]/activity">;

export const GET = withErrorHandling(async (request: NextRequest, context: Context) => {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) {
    return unauthenticated();
  }

  const { projectId } = await context.params;
  const activity = await listActivity(userId, projectId);
  if (!activity) {
    return notFoundError("Project not found");
  }
  return NextResponse.json({ activity });
});
