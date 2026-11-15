import type { ProjectRole } from "@/lib/projects";
import { prisma } from "@/server/db";

/** The caller's role in the project, or null when they are not a member (or the project does not exist). */
export async function getRole(userId: string, projectId: string): Promise<ProjectRole | null> {
  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
    select: { role: true },
  });
  return membership?.role ?? null;
}

/** Prisma filter for rows inside a project the user belongs to. */
export function memberOf(userId: string) {
  return { members: { some: { userId } } };
}
