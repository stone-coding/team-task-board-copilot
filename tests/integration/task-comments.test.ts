// @vitest-environment node
import { TEST_PASSWORD } from "./helpers/test-db";
import { NextRequest } from "next/server";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { DELETE as deleteCommentRoute } from "@/app/api/v1/comments/[commentId]/route";
import { DELETE as removeMemberRoute } from "@/app/api/v1/projects/[projectId]/members/[userId]/route";
import { POST as addMemberRoute } from "@/app/api/v1/projects/[projectId]/members/route";
import { POST as createTaskRoute } from "@/app/api/v1/projects/[projectId]/tasks/route";
import { POST as createProjectRoute } from "@/app/api/v1/projects/route";
import { GET as listCommentsRoute, POST as addCommentRoute } from "@/app/api/v1/tasks/[taskId]/comments/route";
import { DELETE as deleteTaskRoute } from "@/app/api/v1/tasks/[taskId]/route";
import { signToken } from "@/server/auth/token";
import { prisma } from "@/server/db";
import { createUser } from "@/server/services/users";

const EMAIL_DOMAIN = "@comments.test";
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

const taskCtx = (taskId: string) => ({ params: Promise.resolve({ taskId }) });
const commentCtx = (commentId: string) => ({ params: Promise.resolve({ commentId }) });
const projectCtx = (projectId: string) => ({ params: Promise.resolve({ projectId }) });

const api = {
  createProject: async (auth: Auth) =>
    (await (await createProjectRoute(request("/projects", { auth, method: "POST", body: { name: "Launch" } }))).json()).project.id as string,
  addMember: (auth: Auth, projectId: string, email: string) =>
    addMemberRoute(request(`/projects/${projectId}/members`, { auth, method: "POST", body: { email } }), projectCtx(projectId)),
  removeMember: (auth: Auth, projectId: string, userId: string) =>
    removeMemberRoute(request(`/projects/${projectId}/members/${userId}`, { auth, method: "DELETE" }), {
      params: Promise.resolve({ projectId, userId }),
    }),
  createTask: async (auth: Auth, projectId: string) =>
    (await (await createTaskRoute(request(`/projects/${projectId}/tasks`, { auth, method: "POST", body: { title: "Write copy" } }), projectCtx(projectId))).json())
      .task.id as string,
  deleteTask: (auth: Auth, taskId: string) => deleteTaskRoute(request(`/tasks/${taskId}`, { auth, method: "DELETE" }), taskCtx(taskId)),
  list: (auth: Auth | undefined, taskId: string) => listCommentsRoute(request(`/tasks/${taskId}/comments`, { auth }), taskCtx(taskId)),
  add: (auth: Auth | undefined, taskId: string, body: unknown) =>
    addCommentRoute(request(`/tasks/${taskId}/comments`, { auth, method: "POST", body }), taskCtx(taskId)),
  remove: (auth: Auth | undefined, commentId: string) =>
    deleteCommentRoute(request(`/comments/${commentId}`, { auth, method: "DELETE" }), commentCtx(commentId)),
};

const TASK_NOT_FOUND = { error: { code: "NOT_FOUND", message: "Task not found" } };
const COMMENT_NOT_FOUND = { error: { code: "NOT_FOUND", message: "Comment not found" } };

describe("task comments", () => {
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
    projectId = await api.createProject(owner);
    expect((await api.addMember(owner, projectId, member.email)).status).toBe(201);
    taskId = await api.createTask(owner, projectId);
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { endsWith: EMAIL_DOMAIN } } });
    await prisma.$disconnect();
  });

  it("lets members add comments and lists them oldest first with author and time", async () => {
    const first = await api.add(owner, taskId, { body: "  Draft is ready  " });
    expect(first.status).toBe(201);
    await expect(first.json()).resolves.toEqual({
      comment: {
        id: expect.any(String),
        taskId,
        body: "Draft is ready",
        createdAt: expect.any(String),
        author: { userId: owner.userId, name: "Olivia" },
      },
    });
    expect((await api.add(member, taskId, { body: "I'll review it" })).status).toBe(201);

    const response = await api.list(member, taskId);
    expect(response.status).toBe(200);
    const { comments } = await response.json();
    expect(comments.map((comment: { body: string }) => comment.body)).toEqual(["Draft is ready", "I'll review it"]);
    expect(comments[1].author).toEqual({ userId: member.userId, name: "Mason" });
    expect(Number.isNaN(Date.parse(comments[0].createdAt))).toBe(false);
  });

  it("rejects an empty or overlong comment from a member with 400", async () => {
    for (const [body, message] of [
      [{ body: "   " }, "Comment cannot be empty"],
      [{ body: "a".repeat(1001) }, "Comment must be at most 1000 characters"],
    ] as const) {
      const response = await api.add(member, taskId, body);
      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({ error: { code: "VALIDATION_ERROR", message } });
    }
    await expect(prisma.comment.count({ where: { taskId } })).resolves.toBe(0);
  });

  it("lets the author delete their own comment", async () => {
    const { comment } = await (await api.add(member, taskId, { body: "Typo" })).json();
    expect((await api.remove(member, comment.id)).status).toBe(204);
    await expect(prisma.comment.count({ where: { taskId } })).resolves.toBe(0);
  });

  it("lets the owner delete a member's comment (moderation)", async () => {
    const { comment } = await (await api.add(member, taskId, { body: "Off topic" })).json();
    expect((await api.remove(owner, comment.id)).status).toBe(204);
  });

  it("forbids a member from deleting someone else's comment (403) and keeps it", async () => {
    const { comment } = await (await api.add(owner, taskId, { body: "Owner note" })).json();
    const response = await api.remove(member, comment.id);
    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: { code: "FORBIDDEN", message: "Only the author or the project owner can delete a comment" },
    });
    await expect(prisma.comment.findUnique({ where: { id: comment.id } })).resolves.not.toBeNull();
  });

  it("gives a nonmember 404 on every comment endpoint by direct id, even with an invalid body", async () => {
    const { comment } = await (await api.add(owner, taskId, { body: "Private" })).json();
    for (const response of [await api.list(outsider, taskId), await api.add(outsider, taskId, { body: "Hi" }), await api.add(outsider, taskId, {})]) {
      expect(response.status).toBe(404);
      await expect(response.json()).resolves.toEqual(TASK_NOT_FOUND);
    }
    const removed = await api.remove(outsider, comment.id);
    expect(removed.status).toBe(404);
    await expect(removed.json()).resolves.toEqual(COMMENT_NOT_FOUND);
    expect((await api.remove(owner, "no-such-comment")).status).toBe(404);
    await expect(prisma.comment.count({ where: { taskId } })).resolves.toBe(1);
  });

  it("revokes a removed member's access to comments on the next request", async () => {
    const { comment } = await (await api.add(member, taskId, { body: "Mine" })).json();
    expect((await api.removeMember(owner, projectId, member.userId)).status).toBe(204);
    expect((await api.list(member, taskId)).status).toBe(404);
    expect((await api.add(member, taskId, { body: "Still here?" })).status).toBe(404);
    expect((await api.remove(member, comment.id)).status).toBe(404);
  });

  it("deletes a task's comments with the task", async () => {
    await api.add(owner, taskId, { body: "Goes away" });
    expect((await api.deleteTask(owner, taskId)).status).toBe(204);
    await expect(prisma.comment.count({ where: { taskId } })).resolves.toBe(0);
  });

  it("rejects requests without a session with 401", async () => {
    expect((await api.list(undefined, taskId)).status).toBe(401);
    expect((await api.add(undefined, taskId, { body: "x" })).status).toBe(401);
    expect((await api.remove(undefined, "any")).status).toBe(401);
  });
});
