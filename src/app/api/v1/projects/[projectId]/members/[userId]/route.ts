import { NextResponse, type NextRequest } from "next/server";
import { getAuthenticatedUserId } from "@/server/auth/session";
import { conflictError, forbiddenError, notFoundError, unauthenticated, withErrorHandling } from "@/server/http";
import { removeMember } from "@/server/services/members";

type Context = RouteContext<"/api/v1/projects/[projectId]/members/[userId]">;

/** The owner removes a member; a member removes themselves to leave the project. */
export const DELETE = withErrorHandling(async (request: NextRequest, context: Context) => {
  const actorId = await getAuthenticatedUserId(request);
  if (!actorId) {
    return unauthenticated();
  }

  const { projectId, userId } = await context.params;
  switch (await removeMember(actorId, projectId, userId)) {
    case "not_found":
      return notFoundError("Project not found");
    case "forbidden":
      return forbiddenError("Only the project owner can manage members");
    case "no_member":
      return notFoundError("Member not found");
    case "owner":
      return conflictError("The project owner cannot be removed");
    case "removed":
      return new NextResponse(null, { status: 204 });
  }
});
