// @vitest-environment node
import { TEST_PASSWORD } from "./helpers/test-db";
import { NextRequest } from "next/server";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { DELETE as removeMemberRoute } from "@/app/api/v1/projects/[projectId]/members/[userId]/route";
import { GET as listMembersRoute, POST as addMemberRoute } from "@/app/api/v1/projects/[projectId]/members/route";
import { DELETE as deleteProjectRoute, GET as getProjectRoute } from "@/app/api/v1/projects/[projectId]/route";
import { GET as listTasksRoute, POST as createTaskRoute } from "@/app/api/v1/projects/[projectId]/tasks/route";
import { GET as listProjectsRoute, POST as createProjectRoute } from "@/app/api/v1/projects/route";
import { DELETE as deleteTaskRoute, PATCH as updateTaskRoute } from "@/app/api/v1/tasks/[taskId]/route";
import { signToken } from "@/server/auth/token";
import { prisma } from "@/server/db";
import { createUser } from "@/server/services/users";

const EMAIL_DOMAIN = "@members.test";
const BASE_URL = "http://localhost/api/v1";

type Auth = { token: string; userId: string; email: string; name: string };

async function signUp(name: string): Promise<Auth> {
  const email = `${name.toLowerCase()}${EMAIL_DOMAIN}`;
  const user = await createUser({ email, name, password: TEST_PASSWORD });
  return { userId: user.id, token: await signToken(user.id), email, name };
}

function request(path: string, { auth, method = "GET", body }: { auth?: Auth; method?: string; body?: unknown } = {}) {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (auth) {
    headers.authorization = `Bearer ${auth.token}`;
  }
  const init = body === undefined ? { method, headers } : { method, headers, body: JSON.stringify(body) };
  return new NextRequest(`${BASE_URL}${path}`, init);
}

const projectCtx = (projectId: string) => ({ params: Promise.resolve({ projectId }) });
const taskCtx = (taskId: string) => ({ params: Promise.resolve({ taskId }) });
const memberCtx = (projectId: string, userId: string) => ({ params: Promise.resolve({ projectId, userId }) });

const api = {
  listProjects: (auth: Auth) => listProjectsRoute(request("/projects", { auth })),
  createProject: (auth: Auth, name: string) => createProjectRoute(request("/projects", { auth, method: "POST", body: { name } })),
  getProject: (auth: Auth | undefined, id: string) => getProjectRoute(request(`/projects/${id}`, { auth }), projectCtx(id)),
  deleteProject: (auth: Auth, id: string) => deleteProjectRoute(request(`/projects/${id}`, { auth, method: "DELETE" }), projectCtx(id)),
  listTasks: (auth: Auth, id: string) => listTasksRoute(request(`/projects/${id}/tasks`, { auth }), projectCtx(id)),
  createTask: (auth: Auth, id: string, title: string) =>
    createTaskRoute(request(`/projects/${id}/tasks`, { auth, method: "POST", body: { title } }), projectCtx(id)),
  updateTask: (auth: Auth, taskId: string, body: unknown) =>
    updateTaskRoute(request(`/tasks/${taskId}`, { auth, method: "PATCH", body }), taskCtx(taskId)),
  deleteTask: (auth: Auth, taskId: string) => deleteTaskRoute(request(`/tasks/${taskId}`, { auth, method: "DELETE" }), taskCtx(taskId)),
  listMembers: (auth: Auth | undefined, id: string) => listMembersRoute(request(`/projects/${id}/members`, { auth }), projectCtx(id)),
  addMember: (auth: Auth | undefined, id: string, body: unknown) =>
    addMemberRoute(request(`/projects/${id}/members`, { auth, method: "POST", body }), projectCtx(id)),
  removeMember: (auth: Auth | undefined, id: string, userId: string) =>
    removeMemberRoute(request(`/projects/${id}/members/${userId}`, { auth, method: "DELETE" }), memberCtx(id, userId)),
};

const PROJECT_NOT_FOUND = { error: { code: "NOT_FOUND", message: "Project not found" } };
const TASK_NOT_FOUND = { error: { code: "NOT_FOUND", message: "Task not found" } };

describe("shared projects and roles", () => {
  let owner: Auth;
  let member: Auth;
  let outsider: Auth;
  let projectId: string;
  let taskId: string;

  beforeEach(async () => {
    await prisma.user.deleteMany({ where: { email: { endsWith: EMAIL_DOMAIN } } });
    owner = await signUp("Olivia");
    member = await signUp("Mason");
    outsider = await signUp("Nora");
    projectId = (await (await api.createProject(owner, "Launch")).json()).project.id;
    taskId = (await (await api.createTask(owner, projectId, "Write copy")).json()).task.id;
    expect((await api.addMember(owner, projectId, { email: member.email })).status).toBe(201);
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { endsWith: EMAIL_DOMAIN } } });
    await prisma.$disconnect();
  });

  describe("project creation and listing", () => {
    it("makes the creator the OWNER of a new project", async () => {
      const response = await api.createProject(owner, "Another");
      const body = await response.json();
      expect(body.project).toMatchObject({ name: "Another", role: "OWNER" });
      await expect(
        prisma.projectMember.findUnique({ where: { projectId_userId: { projectId: body.project.id, userId: owner.userId } } }),
      ).resolves.toMatchObject({ role: "OWNER" });
    });

    it("lists a shared project for both users with each user's role", async () => {
      const ownerList = await (await api.listProjects(owner)).json();
      const memberList = await (await api.listProjects(member)).json();
      expect(ownerList.projects).toEqual([expect.objectContaining({ id: projectId, name: "Launch", role: "OWNER" })]);
      expect(memberList.projects).toEqual([expect.objectContaining({ id: projectId, name: "Launch", role: "MEMBER" })]);
      await expect((await api.listProjects(outsider)).json()).resolves.toEqual({ projects: [] });
    });
  });

  describe("MEMBER", () => {
    it("reads the project with the MEMBER role", async () => {
      const response = await api.getProject(member, projectId);
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toMatchObject({ project: { id: projectId, role: "MEMBER" } });
    });

    it("lists, creates, edits, moves, and deletes tasks", async () => {
      expect((await (await api.listTasks(member, projectId)).json()).tasks).toHaveLength(1);
      const created = await api.createTask(member, projectId, "Member task");
      expect(created.status).toBe(201);
      const moved = await api.updateTask(member, taskId, { status: "DONE", title: "Write final copy" });
      expect(moved.status).toBe(200);
      await expect(moved.json()).resolves.toMatchObject({ task: { status: "DONE", title: "Write final copy" } });
      expect((await api.deleteTask(member, (await created.json()).task.id)).status).toBe(204);
    });

    it("lists the members, owner first", async () => {
      const response = await api.listMembers(member, projectId);
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({
        members: [
          { userId: owner.userId, name: "Olivia", email: owner.email, role: "OWNER" },
          { userId: member.userId, name: "Mason", email: member.email, role: "MEMBER" },
        ],
      });
    });

    it("cannot delete the project (403) and the project stays", async () => {
      const response = await api.deleteProject(member, projectId);
      expect(response.status).toBe(403);
      await expect(response.json()).resolves.toEqual({
        error: { code: "FORBIDDEN", message: "Only the project owner can delete the project" },
      });
      await expect(prisma.project.findUnique({ where: { id: projectId } })).resolves.not.toBeNull();
    });

    it("cannot add or remove members (403)", async () => {
      const added = await api.addMember(member, projectId, { email: outsider.email });
      expect(added.status).toBe(403);
      await expect(added.json()).resolves.toEqual({
        error: { code: "FORBIDDEN", message: "Only the project owner can manage members" },
      });
      expect((await api.removeMember(member, projectId, owner.userId)).status).toBe(403);
      await expect(prisma.projectMember.count({ where: { projectId } })).resolves.toBe(2);
    });

    it("can leave the project and then loses access", async () => {
      expect((await api.removeMember(member, projectId, member.userId)).status).toBe(204);
      expect((await api.getProject(member, projectId)).status).toBe(404);
      await expect((await api.listProjects(member)).json()).resolves.toEqual({ projects: [] });
    });
  });

  describe("NONMEMBER", () => {
    it("gets 404 from every project, task, and member endpoint, including direct ids", async () => {
      const responses = await Promise.all([
        api.getProject(outsider, projectId),
        api.deleteProject(outsider, projectId),
        api.listTasks(outsider, projectId),
        api.createTask(outsider, projectId, "Intrusion"),
        api.listMembers(outsider, projectId),
        api.addMember(outsider, projectId, { email: outsider.email }),
        api.removeMember(outsider, projectId, member.userId),
      ]);
      for (const response of responses) {
        expect(response.status).toBe(404);
        await expect(response.json()).resolves.toEqual(PROJECT_NOT_FOUND);
      }
      for (const response of [await api.updateTask(outsider, taskId, { status: "DONE" }), await api.deleteTask(outsider, taskId)]) {
        expect(response.status).toBe(404);
        await expect(response.json()).resolves.toEqual(TASK_NOT_FOUND);
      }
      await expect(prisma.task.findUnique({ where: { id: taskId } })).resolves.toMatchObject({ status: "TODO" });
      await expect(prisma.projectMember.count({ where: { projectId } })).resolves.toBe(2);
    });
  });

  describe("OWNER managing members", () => {
    it("adds an existing user by email, ignoring case and spaces", async () => {
      const response = await api.addMember(owner, projectId, { email: `  ${outsider.email.toUpperCase()} ` });
      expect(response.status).toBe(201);
      await expect(response.json()).resolves.toEqual({
        member: { userId: outsider.userId, name: "Nora", email: outsider.email, role: "MEMBER" },
      });
      expect((await api.getProject(outsider, projectId)).status).toBe(200);
    });

    it("rejects an email with no account (404), an existing member (409), and an invalid email (400)", async () => {
      const unknown = await api.addMember(owner, projectId, { email: `ghost${EMAIL_DOMAIN}` });
      expect(unknown.status).toBe(404);
      await expect(unknown.json()).resolves.toEqual({ error: { code: "NOT_FOUND", message: "No account uses this email" } });

      const duplicate = await api.addMember(owner, projectId, { email: member.email });
      expect(duplicate.status).toBe(409);
      await expect(duplicate.json()).resolves.toEqual({ error: { code: "CONFLICT", message: "This user is already a member" } });

      const invalid = await api.addMember(owner, projectId, { email: "nope" });
      expect(invalid.status).toBe(400);
      await expect(invalid.json()).resolves.toEqual({ error: { code: "VALIDATION_ERROR", message: "Enter a valid email address" } });
    });

    it("removes a member, which revokes project, task, and member access on the next request", async () => {
      expect((await api.removeMember(owner, projectId, member.userId)).status).toBe(204);

      expect((await api.getProject(member, projectId)).status).toBe(404);
      expect((await api.listTasks(member, projectId)).status).toBe(404);
      expect((await api.listMembers(member, projectId)).status).toBe(404);
      expect((await api.updateTask(member, taskId, { status: "DONE" })).status).toBe(404);
      await expect((await api.listProjects(member)).json()).resolves.toEqual({ projects: [] });
    });

    it("cannot remove the owner (409) and gets 404 for a user who is not a member", async () => {
      const self = await api.removeMember(owner, projectId, owner.userId);
      expect(self.status).toBe(409);
      await expect(self.json()).resolves.toEqual({ error: { code: "CONFLICT", message: "The project owner cannot be removed" } });

      const stranger = await api.removeMember(owner, projectId, outsider.userId);
      expect(stranger.status).toBe(404);
      await expect(stranger.json()).resolves.toEqual({ error: { code: "NOT_FOUND", message: "Member not found" } });
    });

    it("deletes the project, which removes every membership", async () => {
      expect((await api.deleteProject(owner, projectId)).status).toBe(204);
      await expect(prisma.projectMember.count({ where: { projectId } })).resolves.toBe(0);
      await expect((await api.listProjects(member)).json()).resolves.toEqual({ projects: [] });
    });
  });

  describe("authentication", () => {
    it("rejects the member endpoints without a session with 401", async () => {
      for (const response of [
        await api.listMembers(undefined, projectId),
        await api.addMember(undefined, projectId, { email: outsider.email }),
        await api.removeMember(undefined, projectId, member.userId),
      ]) {
        expect(response.status).toBe(401);
      }
    });
  });
});
