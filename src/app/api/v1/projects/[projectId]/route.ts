import { NextResponse, type NextRequest } from "next/server";
import { getAuthenticatedUserId } from "@/server/auth/session";
import { forbiddenError, notFoundError, unauthenticated, withErrorHandling } from "@/server/http";
import { deleteProject, findProject } from "@/server/services/projects";

type Context = RouteContext<"/api/v1/projects/[projectId]">;

const PROJECT_NOT_FOUND = "Project not found";

export const GET = withErrorHandling(async (request: NextRequest, context: Context) => {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) {
    return unauthenticated();
  }

  const { projectId } = await context.params;
  const project = await findProject(userId, projectId);
  if (!project) {
    return notFoundError(PROJECT_NOT_FOUND);
  }
  return NextResponse.json({ project });
});

export const DELETE = withErrorHandling(async (request: NextRequest, context: Context) => {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) {
    return unauthenticated();
  }

  const { projectId } = await context.params;
  const result = await deleteProject(userId, projectId);
  if (result === "not_found") {
    return notFoundError(PROJECT_NOT_FOUND);
  }
  if (result === "forbidden") {
    return forbiddenError("Only the project owner can delete the project");
  }
  return new NextResponse(null, { status: 204 });
});
