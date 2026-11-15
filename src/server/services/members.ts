import { Prisma } from "@/generated/prisma/client";
import type { ProjectMemberInfo } from "@/lib/projects";
import { prisma } from "@/server/db";
import { getRole } from "@/server/services/memberships";

const MEMBER_SELECT = { role: true, user: { select: { id: true, name: true, email: true } } } as const;

type MemberRow = { role: ProjectMemberInfo["role"]; user: { id: string; name: string; email: string } };

function toMember({ role, user }: MemberRow): ProjectMemberInfo {
  return { userId: user.id, name: user.name, email: user.email, role };
}

/** Members, owner first, then by join date. Null when the caller is not a member. */
export async function listMembers(userId: string, projectId: string): Promise<ProjectMemberInfo[] | null> {
  if (!(await getRole(userId, projectId))) {
    return null;
  }
  const rows = await prisma.projectMember.findMany({
    where: { projectId },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }, { userId: "asc" }],
    select: MEMBER_SELECT,
  });
  return rows.map(toMember);
}

export type AddMemberResult =
  | { kind: "added"; member: ProjectMemberInfo }
  | { kind: "not_found" | "forbidden" | "invalid" | "no_account" | "already_member" };

/** Authorization comes first, so a nonmember or member learns nothing from validation. A null email is invalid input. */
export async function addMember(actorId: string, projectId: string, email: string | null): Promise<AddMemberResult> {
  const role = await getRole(actorId, projectId);
  if (!role) {
    return { kind: "not_found" };
  }
  if (role !== "OWNER") {
    return { kind: "forbidden" };
  }
  if (email === null) {
    return { kind: "invalid" };
  }
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) {
    return { kind: "no_account" };
  }
  try {
    const row = await prisma.projectMember.create({ data: { projectId, userId: user.id, role: "MEMBER" }, select: MEMBER_SELECT });
    return { kind: "added", member: toMember(row) };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { kind: "already_member" };
    }
    throw error;
  }
}

export type RemoveMemberResult = "removed" | "not_found" | "forbidden" | "owner" | "no_member";

/** The OWNER removes anyone but themselves; a MEMBER may only remove themselves (leave). */
export async function removeMember(actorId: string, projectId: string, targetUserId: string): Promise<RemoveMemberResult> {
  const role = await getRole(actorId, projectId);
  if (!role) {
    return "not_found";
  }
  if (role !== "OWNER" && actorId !== targetUserId) {
    return "forbidden";
  }
  const target = await getRole(targetUserId, projectId);
  if (!target) {
    return "no_member";
  }
  if (target === "OWNER") {
    return "owner";
  }
  await prisma.projectMember.delete({ where: { projectId_userId: { projectId, userId: targetUserId } } });
  return "removed";
}
