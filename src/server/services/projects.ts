import { Prisma } from "@/generated/prisma/client";
import type { CreateProjectInput } from "@/lib/project-schemas";
import type { Project, ProjectRole } from "@/lib/projects";
import { prisma } from "@/server/db";
import { getRole } from "@/server/services/memberships";

const PROJECT_SELECT = { id: true, name: true, createdAt: true } as const;

type ProjectRow = { id: string; name: string; createdAt: Date };

function toProject(row: ProjectRow, role: ProjectRole): Project {
  return { id: row.id, name: row.name, createdAt: row.createdAt.toISOString(), role };
}

// Access comes from ProjectMember rows: a project the caller does not belong to behaves exactly like a missing one.

export async function listProjects(userId: string): Promise<Project[]> {
  const memberships = await prisma.projectMember.findMany({
    where: { userId },
    orderBy: [{ project: { createdAt: "desc" } }, { projectId: "desc" }],
    select: { role: true, project: { select: PROJECT_SELECT } },
  });
  return memberships.map(({ role, project }) => toProject(project, role));
}

/** The token was valid but its user no longer exists, so the owner foreign key rejected the insert. */
export class OwnerNotFoundError extends Error {
  constructor() {
    super("The project owner no longer exists");
  }
}

/** Creates the project and the creator's OWNER membership in one statement. */
export async function createProject(ownerId: string, input: CreateProjectInput): Promise<Project> {
  try {
    const row = await prisma.project.create({
      data: { ownerId, name: input.name, members: { create: { userId: ownerId, role: "OWNER" } } },
      select: PROJECT_SELECT,
    });
    return toProject(row, "OWNER");
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      throw new OwnerNotFoundError();
    }
    throw error;
  }
}

export async function findProject(userId: string, projectId: string): Promise<Project | null> {
  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
    select: { role: true, project: { select: PROJECT_SELECT } },
  });
  return membership ? toProject(membership.project, membership.role) : null;
}

export type DeleteProjectResult = "deleted" | "forbidden" | "not_found";

/** Only the OWNER may delete; the cascade removes tasks and memberships. */
export async function deleteProject(userId: string, projectId: string): Promise<DeleteProjectResult> {
  const role = await getRole(userId, projectId);
  if (!role) {
    return "not_found";
  }
  if (role !== "OWNER") {
    return "forbidden";
  }
  const { count } = await prisma.project.deleteMany({ where: { id: projectId, members: { some: { userId, role: "OWNER" } } } });
  return count > 0 ? "deleted" : "not_found";
}
