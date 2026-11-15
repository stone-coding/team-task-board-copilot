// @vitest-environment node
import { TEST_PASSWORD } from "./helpers/test-db";
import { NextRequest } from "next/server";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { DELETE as removeMemberRoute } from "@/app/api/v1/projects/[projectId]/members/[userId]/route";
import { POST as addMemberRoute } from "@/app/api/v1/projects/[projectId]/members/route";
import { GET as listTasksRoute, POST as createTaskRoute } from "@/app/api/v1/projects/[projectId]/tasks/route";
import { POST as createProjectRoute } from "@/app/api/v1/projects/route";
import { PATCH as updateTaskRoute } from "@/app/api/v1/tasks/[taskId]/route";
import { signToken } from "@/server/auth/token";
import { prisma } from "@/server/db";
import { createUser } from "@/server/services/users";

const EMAIL_DOMAIN = "@assign.test";
const BASE_URL = "http://localhost/api/v1";

type Auth = { token: string; userId: string; email: string };

async function signUp(name: string): Promise<Auth> {
  const email = `${name.toLowerCase()}${EMAIL_DOMAIN}`;
  const user = await createUser({ email, name, password: TEST_PASSWORD });
  return { userId: user.id, token: await signToken(user.id), email };
}

function request(path: string, { auth, method = "GET", body }: { auth: Auth; method?: string; body?: unknown }) {
  const headers = { "content-type": "application/json", authorization: `Bearer ${auth.token}` };
  return new NextRequest(`${BASE_URL}${path}`, body === undefined ? { method, headers } : { method, headers, body: JSON.stringify(body) });
}

const projectCtx = (projectId: string) => ({ params: Promise.resolve({ projectId }) });

const api = {
  createProject: async (auth: Auth, name: string): Promise<string> =>
    (await (await createProjectRoute(request("/projects", { auth, method: "POST", body: { name } }))).json()).project.id,
  addMember: (auth: Auth, projectId: string, email: string) =>
    addMemberRoute(request(`/projects/${projectId}/members`, { auth, method: "POST", body: { email } }), projectCtx(projectId)),
  removeMember: (auth: Auth, projectId: string, userId: string) =>
    removeMemberRoute(request(`/projects/${projectId}/members/${userId}`, { auth, method: "DELETE" }), {
      params: Promise.resolve({ projectId, userId }),
    }),
  createTask: (auth: Auth, projectId: string, body: unknown) =>
    createTaskRoute(request(`/projects/${projectId}/tasks`, { auth, method: "POST", body }), projectCtx(projectId)),
  listTasks: (auth: Auth, projectId: string) => listTasksRoute(request(`/projects/${projectId}/tasks`, { auth }), projectCtx(projectId)),
  updateTask: (auth: Auth, taskId: string, body: unknown) =>
    updateTaskRoute(request(`/tasks/${taskId}`, { auth, method: "PATCH", body }), { params: Promise.resolve({ taskId }) }),
};

const NOT_A_MEMBER = { error: { code: "VALIDATION_ERROR", message: "Assignee must be a member of this project" } };

describe("task assignment", () => {
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
    projectId = await api.createProject(owner, "Launch");
    expect((await api.addMember(owner, projectId, member.email)).status).toBe(201);
    taskId = (await (await api.createTask(owner, projectId, { title: "Write copy" })).json()).task.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { endsWith: EMAIL_DOMAIN } } });
    await prisma.$disconnect();
  });

  it("leaves a new task unassigned and omits assignee from the response", async () => {
    const tasks = (await (await api.listTasks(owner, projectId)).json()).tasks;
    expect(tasks[0]).not.toHaveProperty("assignee");
    await expect(prisma.task.findUnique({ where: { id: taskId } })).resolves.toMatchObject({ assigneeId: null });
  });

  it("creates a task assigned to a member", async () => {
    const response = await api.createTask(owner, projectId, { title: "Book venue", assigneeId: member.userId });
    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      task: { title: "Book venue", assignee: { userId: member.userId, name: "Mason" } },
    });
  });

  it("lets a member assign a task to the owner, then unassign it with null", async () => {
    const assigned = await api.updateTask(member, taskId, { assigneeId: owner.userId });
    expect(assigned.status).toBe(200);
    await expect(assigned.json()).resolves.toMatchObject({ task: { assignee: { userId: owner.userId, name: "Olivia" } } });
    const listed = (await (await api.listTasks(member, projectId)).json()).tasks;
    expect(listed[0].assignee).toEqual({ userId: owner.userId, name: "Olivia" });

    const cleared = await api.updateTask(member, taskId, { assigneeId: null });
    expect(cleared.status).toBe(200);
    expect((await cleared.json()).task).not.toHaveProperty("assignee");
    await expect(prisma.task.findUnique({ where: { id: taskId } })).resolves.toMatchObject({ assigneeId: null });
  });

  it("rejects assigning a nonmember or an unknown user with 400 and changes nothing", async () => {
    for (const assigneeId of [outsider.userId, "no-such-user"]) {
      const updated = await api.updateTask(owner, taskId, { assigneeId, title: "Renamed" });
      expect(updated.status).toBe(400);
      await expect(updated.json()).resolves.toEqual(NOT_A_MEMBER);
      const created = await api.createTask(owner, projectId, { title: "Intrusion", assigneeId });
      expect(created.status).toBe(400);
      await expect(created.json()).resolves.toEqual(NOT_A_MEMBER);
    }
    await expect(prisma.task.findUnique({ where: { id: taskId } })).resolves.toMatchObject({ title: "Write copy", assigneeId: null });
    await expect(prisma.task.count({ where: { projectId } })).resolves.toBe(1);
  });

  it("does not let a member of another project be assigned here", async () => {
    const otherProject = await api.createProject(outsider, "Elsewhere");
    expect(otherProject).toBeTruthy();
    const response = await api.updateTask(owner, taskId, { assigneeId: outsider.userId });
    expect(response.status).toBe(400);
  });

  it("returns 404 to a nonmember who tries to assign, before validating the assignee", async () => {
    const response = await api.updateTask(outsider, taskId, { assigneeId: outsider.userId });
    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: { code: "NOT_FOUND", message: "Task not found" } });
  });

  it("unassigns a removed member's tasks in that project", async () => {
    await api.updateTask(owner, taskId, { assigneeId: member.userId });
    const otherProject = await api.createProject(member, "Mason's own");
    const ownTask = (await (await api.createTask(member, otherProject, { title: "Mine", assigneeId: member.userId })).json()).task.id;

    expect((await api.removeMember(owner, projectId, member.userId)).status).toBe(204);

    await expect(prisma.task.findUnique({ where: { id: taskId } })).resolves.toMatchObject({ assigneeId: null });
    await expect(prisma.task.findUnique({ where: { id: ownTask } })).resolves.toMatchObject({ assigneeId: member.userId });
  });

  it("unassigns a member's tasks when they leave", async () => {
    await api.updateTask(owner, taskId, { assigneeId: member.userId });
    expect((await api.removeMember(member, projectId, member.userId)).status).toBe(204);
    await expect(prisma.task.findUnique({ where: { id: taskId } })).resolves.toMatchObject({ assigneeId: null });
  });
});
