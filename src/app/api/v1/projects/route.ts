import { NextResponse, type NextRequest } from "next/server";
import { createProjectSchema } from "@/lib/project-schemas";
import { getAuthenticatedUserId } from "@/server/auth/session";
import { readJson, unauthenticated, validationError, withErrorHandling } from "@/server/http";
import { createProject, listProjects } from "@/server/services/projects";

export const GET = withErrorHandling(async (request: NextRequest) => {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) {
    return unauthenticated();
  }
  return NextResponse.json({ projects: await listProjects(userId) });
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) {
    return unauthenticated();
  }

  const parsed = createProjectSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return validationError(parsed.error);
  }
  return NextResponse.json({ project: await createProject(userId, parsed.data) }, { status: 201 });
});
