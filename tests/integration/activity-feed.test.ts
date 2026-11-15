// @vitest-environment node
import { TEST_PASSWORD } from "./helpers/test-db";
import { NextRequest } from "next/server";
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DELETE as deleteCommentRoute } from "@/app/api/v1/comments/[commentId]/route";
import { GET as activityRoute } from "@/app/api/v1/projects/[projectId]/activity/route";
import { DELETE as removeMemberRoute } from "@/app/api/v1/projects/[projectId]/members/[userId]/route";
import { POST as addMemberRoute } from "@/app/api/v1/projects/[projectId]/members/route";
import { POST as createTaskRoute } from "@/app/api/v1/projects/[projectId]/tasks/route";
import { POST as createProjectRoute } from "@/app/api/v1/projects/route";
import { POST as addCommentRoute } from "@/app/api/v1/tasks/[taskId]/comments/route";
import { DELETE as deleteTaskRoute, PATCH as updateTaskRoute } from "@/app/api/v1/tasks/[taskId]/route";
import { signToken } from "@/server/auth/token";
import { prisma } from "@/server/db";
import { createUser } from "@/server/services/users";

const EMAIL_DOMAIN = "@activity.test";
const BASE_URL = "http://localhost/api/v1";

type Auth = { token: string; userId: string; email: string };

async function signUp(name: string): Promise<Auth> {
  const email = `${name.toLowerCase()}${EMAIL_DOMAIN}`;
  const user = await createUser({ email, name, password: TEST_PASSWORD });
  return { userId: user.id, token: await signToken(user.id), email };
}

function request(path: string, { auth, method = "GET", body }: { auth?: Auth; method?: string; body?: unknown }) {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (auth) {
    headers.authorization = `Bearer ${auth.token}`;
  }
  return new NextRequest(`${BASE_URL}${path}`, body === undefined ? { method, headers } : { method, headers, body: JSON.stringify(body) });
}

const projectCtx = (projectId: string) => ({ params: Promise.resolve({ projectId }) });
const taskCtx = (taskId: string) => ({ params: Promise.resolve({ taskId }) });

const api = {
  createProject: async (auth: Auth) =>
    (await (await createProjectRoute(request("/projects", { auth, method: "POST", body: { name: "Launch" } }))).json()).project.id as string,
  addMember: (auth: Auth, projectId: string, email: string) =>
    addMemberRoute(request(`/projects/${projectId}/members`, { auth, method: "POST", body: { email } }), projectCtx(projectId)),
  removeMember: (auth: Auth, projectId: string, userId: string) =>
    removeMemberRoute(request(`/projects/${projectId}/members/${userId}`, { auth, method: "DELETE" }), {
      params: Promise.resolve({ projectId, userId }),
    }),
  createTask: (auth: Auth, projectId: string, title: string) =>
    createTaskRoute(request(`/projects/${projectId}/tasks`, { auth, method: "POST", body: { title } }), projectCtx(projectId)),
  updateTask: (auth: Auth, taskId: string, body: unknown) =>
    updateTaskRoute(request(`/tasks/${taskId}`, { auth, method: "PATCH", body }), taskCtx(taskId)),
  deleteTask: (auth: Auth, taskId: string) => deleteTaskRoute(request(`/tasks/${taskId}`, { auth, method: "DELETE" }), taskCtx(taskId)),
  addComment: (auth: Auth, taskId: string, body: string) =>
    addCommentRoute(request(`/tasks/${taskId}/comments`, { auth, method: "POST", body: { body } }), taskCtx(taskId)),
  deleteComment: (auth: Auth, commentId: string) =>
    deleteCommentRoute(request(`/comments/${commentId}`, { auth, method: "DELETE" }), { params: Promise.resolve({ commentId }) }),
  activity: (auth: Auth | undefined, projectId: string) => activityRoute(request(`/projects/${projectId}/activity`, { auth }), projectCtx(projectId)),
};

type Event = { type: string; actor: { name: string }; taskTitle?: string; fromStatus?: string; toStatus?: string; subjectName?: string };

async function events(auth: Auth, projectId: string): Promise<Event[]> {
  const response = await api.activity(auth, projectId);
  expect(response.status).toBe(200);
  return (await response.json()).activity;
}

/**
 * Runs every interactive transaction with an Activity client that always fails, to prove that each mutation
 * and its activity record commit or roll back together.
 */
function failActivityWrites() {
  const realTransaction = prisma.$transaction.bind(prisma);
  const failing = { create: () => Promise.reject(new Error("activity write failed")) };
  const fake = (arg: unknown) => {
    if (typeof arg !== "function") {
      return realTransaction(arg as Parameters<typeof realTransaction>[0]);
    }
    return realTransaction((tx) => arg(new Proxy(tx, { get: (target, prop) => (prop === "activity" ? failing : Reflect.get(target, prop)) })));
  };
  vi.spyOn(prisma, "$transaction").mockImplementation(fake as typeof prisma.$transaction);
  vi.spyOn(console, "error").mockImplementation(() => undefined);
}

describe("activity feed", () => {
  let owner: Auth;
  let member: Auth;
  let outsider: Auth;
  let projectId: string;

  beforeEach(async () => {
    await prisma.user.deleteMany({ where: { email: { endsWith: EMAIL_DOMAIN } } });
    owner = await signUp("Olivia");
    member = await signUp("Mason");
    outsider = await signUp("Nora");
    projectId = await api.createProject(owner);
  });

  afterEach(() => vi.restoreAllMocks());

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { endsWith: EMAIL_DOMAIN } } });
    await prisma.$disconnect();
  });

  it("records every kind of event with its actor, newest first", async () => {
    expect((await api.addMember(owner, projectId, member.email)).status).toBe(201);
    const taskId = (await (await api.createTask(member, projectId, "Write copy")).json()).task.id;
    await api.updateTask(member, taskId, { status: "IN_PROGRESS" });
    await api.updateTask(owner, taskId, { assigneeId: member.userId });
    await api.updateTask(owner, taskId, { title: "Write final copy" });
    const commentId = (await (await api.addComment(member, taskId, "Ready for review")).json()).comment.id;
    await api.deleteComment(owner, commentId);
    await api.updateTask(owner, taskId, { assigneeId: null });
    await api.deleteTask(owner, taskId);

    const feed = await events(member, projectId);
    expect(feed.map((event) => [event.type, event.actor.name])).toEqual([
      ["TASK_DELETED", "Olivia"],
      ["TASK_ASSIGNED", "Olivia"],
      ["COMMENT_DELETED", "Olivia"],
      ["COMMENT_ADDED", "Mason"],
      ["TASK_UPDATED", "Olivia"],
      ["TASK_ASSIGNED", "Olivia"],
      ["TASK_MOVED", "Mason"],
      ["TASK_CREATED", "Mason"],
      ["MEMBER_ADDED", "Olivia"],
    ]);
    expect(feed[0]).toMatchObject({ taskTitle: "Write final copy" });
    expect(feed[1]).not.toHaveProperty("subjectName");
    expect(feed[5]).toMatchObject({ taskTitle: "Write copy", subjectName: "Mason" });
    expect(feed[6]).toMatchObject({ taskTitle: "Write copy", fromStatus: "TODO", toStatus: "IN_PROGRESS" });
    expect(feed[8]).toMatchObject({ subjectName: "Mason" });
    expect(Number.isNaN(Date.parse((await (await api.activity(owner, projectId)).json()).activity[0].createdAt))).toBe(false);
  });

  it("records an edit only when the title, description, or priority actually changes", async () => {
    const taskId = (await (await api.createTask(owner, projectId, "Same")).json()).task.id;
    await api.updateTask(owner, taskId, { title: "Same", description: "", priority: "MEDIUM" });
    await api.updateTask(owner, taskId, { status: "TODO" });
    expect((await events(owner, projectId)).map((event) => event.type)).toEqual(["TASK_CREATED"]);

    await api.updateTask(owner, taskId, { title: "Same", priority: "HIGH" });
    expect((await events(owner, projectId)).map((event) => event.type)).toEqual(["TASK_UPDATED", "TASK_CREATED"]);
  });

  it("records a member removed by the owner and a member who left", async () => {
    await api.addMember(owner, projectId, member.email);
    await api.addMember(owner, projectId, outsider.email);
    await api.removeMember(owner, projectId, member.userId);
    await api.removeMember(outsider, projectId, outsider.userId);

    const feed = await events(owner, projectId);
    expect(feed.slice(0, 2)).toEqual([
      expect.objectContaining({ type: "MEMBER_LEFT", actor: expect.objectContaining({ name: "Nora" }) }),
      expect.objectContaining({ type: "MEMBER_REMOVED", subjectName: "Mason", actor: expect.objectContaining({ name: "Olivia" }) }),
    ]);
  });

  it("returns at most the 50 newest events", async () => {
    const taskId = (await (await api.createTask(owner, projectId, "Busy")).json()).task.id;
    for (let i = 0; i < 26; i += 1) {
      await api.updateTask(owner, taskId, { status: i % 2 === 0 ? "DONE" : "TODO" });
    }
    await api.addComment(owner, taskId, "Last one");
    const feed = await events(owner, projectId);
    expect(feed).toHaveLength(28);
    for (let i = 0; i < 25; i += 1) {
      await api.addComment(owner, taskId, `Note ${i}`);
    }
    const capped = await events(owner, projectId);
    expect(capped).toHaveLength(50);
    expect(capped[0]).toMatchObject({ type: "COMMENT_ADDED" });
  });

  describe("authorization", () => {
    it("gives a nonmember 404 and a removed member 404 on the next request", async () => {
      await api.addMember(owner, projectId, member.email);
      const outsiderResponse = await api.activity(outsider, projectId);
      expect(outsiderResponse.status).toBe(404);
      await expect(outsiderResponse.json()).resolves.toEqual({ error: { code: "NOT_FOUND", message: "Project not found" } });

      expect((await api.activity(member, projectId)).status).toBe(200);
      await api.removeMember(owner, projectId, member.userId);
      expect((await api.activity(member, projectId)).status).toBe(404);
    });

    it("rejects a request without a session with 401", async () => {
      expect((await api.activity(undefined, projectId)).status).toBe(401);
    });
  });

  describe("atomicity: a failed activity write rolls back the mutation", () => {
    it("does not create the task", async () => {
      failActivityWrites();
      expect((await api.createTask(owner, projectId, "Ghost")).status).toBe(500);
      await expect(prisma.task.count({ where: { projectId } })).resolves.toBe(0);
    });

    it("does not move, rename, or assign the task", async () => {
      await api.addMember(owner, projectId, member.email);
      const taskId = (await (await api.createTask(owner, projectId, "Stable")).json()).task.id;
      failActivityWrites();
      expect((await api.updateTask(owner, taskId, { status: "DONE", title: "Changed", assigneeId: member.userId })).status).toBe(500);
      await expect(prisma.task.findUnique({ where: { id: taskId } })).resolves.toMatchObject({ status: "TODO", title: "Stable", assigneeId: null });
    });

    it("does not delete the task", async () => {
      const taskId = (await (await api.createTask(owner, projectId, "Keep")).json()).task.id;
      failActivityWrites();
      expect((await api.deleteTask(owner, taskId)).status).toBe(500);
      await expect(prisma.task.findUnique({ where: { id: taskId } })).resolves.not.toBeNull();
    });

    it("does not add or delete a comment", async () => {
      const taskId = (await (await api.createTask(owner, projectId, "Talk")).json()).task.id;
      const commentId = (await (await api.addComment(owner, taskId, "Keep me")).json()).comment.id;
      failActivityWrites();
      expect((await api.addComment(owner, taskId, "Lost")).status).toBe(500);
      expect((await api.deleteComment(owner, commentId)).status).toBe(500);
      await expect(prisma.comment.findMany({ where: { taskId }, select: { body: true } })).resolves.toEqual([{ body: "Keep me" }]);
    });

    it("does not add or remove a member, and keeps the removed member's assignments", async () => {
      await api.addMember(owner, projectId, member.email);
      const taskId = (await (await api.createTask(owner, projectId, "Assigned")).json()).task.id;
      await api.updateTask(owner, taskId, { assigneeId: member.userId });
      failActivityWrites();
      expect((await api.addMember(owner, projectId, outsider.email)).status).toBe(500);
      expect((await api.removeMember(owner, projectId, member.userId)).status).toBe(500);
      await expect(prisma.projectMember.count({ where: { projectId } })).resolves.toBe(2);
      await expect(prisma.task.findUnique({ where: { id: taskId } })).resolves.toMatchObject({ assigneeId: member.userId });
    });
  });
});
