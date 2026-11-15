import { NextResponse, type NextRequest } from "next/server";
import { addMemberSchema } from "@/lib/member-schemas";
import { getAuthenticatedUserId } from "@/server/auth/session";
import { conflictError, forbiddenError, jsonError, notFoundError, readJson, unauthenticated, validationError, withErrorHandling } from "@/server/http";
import { addMember, listMembers } from "@/server/services/members";

type Context = RouteContext<"/api/v1/projects/[projectId]/members">;

const PROJECT_NOT_FOUND = "Project not found";

export const GET = withErrorHandling(async (request: NextRequest, context: Context) => {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) {
    return unauthenticated();
  }

  const { projectId } = await context.params;
  const members = await listMembers(userId, projectId);
  if (!members) {
    return notFoundError(PROJECT_NOT_FOUND);
  }
  return NextResponse.json({ members });
});

export const POST = withErrorHandling(async (request: NextRequest, context: Context) => {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) {
    return unauthenticated();
  }

  const { projectId } = await context.params;
  const parsed = addMemberSchema.safeParse(await readJson(request));
  const result = await addMember(userId, projectId, parsed.success ? parsed.data.email : null);
  switch (result.kind) {
    case "not_found":
      return notFoundError(PROJECT_NOT_FOUND);
    case "forbidden":
      return forbiddenError("Only the project owner can manage members");
    case "invalid":
      return parsed.success ? jsonError(400, "VALIDATION_ERROR", "Invalid request body") : validationError(parsed.error);
    case "no_account":
      return notFoundError("No account uses this email");
    case "already_member":
      return conflictError("This user is already a member");
    case "added":
      return NextResponse.json({ member: result.member }, { status: 201 });
  }
});
