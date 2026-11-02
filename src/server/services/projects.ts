import type { CreateProjectInput } from "@/lib/project-schemas";
import type { Project } from "@/lib/projects";
import { prisma } from "@/server/db";

const PROJECT_SELECT = { id: true, name: true, createdAt: true } as const;

type ProjectRow = { id: string; name: string; createdAt: Date };

function toProject(row: ProjectRow): Project {
  return { id: row.id, name: row.name, createdAt: row.createdAt.toISOString() };
}

// Every query filters on ownerId, so another user's project behaves exactly like a missing one.

export async function listProjects(ownerId: string): Promise<Project[]> {
  const rows = await prisma.project.findMany({
    where: { ownerId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: PROJECT_SELECT,
  });
  return rows.map(toProject);
}

export async function createProject(ownerId: string, input: CreateProjectInput): Promise<Project> {
  return toProject(await prisma.project.create({ data: { ownerId, name: input.name }, select: PROJECT_SELECT }));
}

export async function findProject(ownerId: string, projectId: string): Promise<Project | null> {
  const row = await prisma.project.findFirst({ where: { id: projectId, ownerId }, select: PROJECT_SELECT });
  return row ? toProject(row) : null;
}

/** Deletes the project and, by cascade, its tasks. Returns false when the caller owns no such project. */
export async function deleteProject(ownerId: string, projectId: string): Promise<boolean> {
  const { count } = await prisma.project.deleteMany({ where: { id: projectId, ownerId } });
  return count > 0;
}
