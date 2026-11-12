// @vitest-environment node
import { TEST_PASSWORD } from "./helpers/test-db";
import { NextRequest } from "next/server";
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET as listRoute, POST as createRoute } from "@/app/api/v1/projects/[projectId]/tasks/route";
import { DELETE as deleteRoute, PATCH as updateRoute } from "@/app/api/v1/tasks/[taskId]/route";
import { signToken } from "@/server/auth/token";
import { prisma } from "@/server/db";
import { createUser } from "@/server/services/users";

const EMAIL_DOMAIN = "@tasks.test";
const BASE_URL = "http://localhost/api/v1";

type Auth = { token: string; userId: string };

async function signUp(name: string): Promise<Auth> {
  const user = await createUser({ email: `${name.toLowerCase()}${EMAIL_DOMAIN}`, name, password: TEST_PASSWORD });
  return { userId: user.id, token: await signToken(user.id) };
}

function request(path: string, { auth, method = "GET", body }: { auth?: Auth; method?: string; body?: unknown } = {}) {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (auth) {
    headers.authorization = `Bearer ${auth.token}`;
  }
  const init = body === undefined ? { method, headers } : { method, headers, body: typeof body === "string" ? body : JSON.stringify(body) };
  return new NextRequest(`${BASE_URL}${path}`, init);
}

function projectParams(projectId: string) {
  return { params: Promise.resolve({ projectId }) };
}

function taskParams(taskId: string) {
  return { params: Promise.resolve({ taskId }) };
}

function listTasks(auth: Auth | undefined, projectId: string) {
  return listRoute(request(`/projects/${projectId}/tasks`, { auth }), projectParams(projectId));
}

function createTask(auth: Auth | undefined, projectId: string, body: unknown) {
  return createRoute(request(`/projects/${projectId}/tasks`, { auth, method: "POST", body }), projectParams(projectId));
}

function updateTask(auth: Auth | undefined, taskId: string, body: unknown) {
  return updateRoute(request(`/tasks/${taskId}`, { auth, method: "PATCH", body }), taskParams(taskId));
}

function deleteTask(auth: Auth | undefined, taskId: string) {
  return deleteRoute(request(`/tasks/${taskId}`, { auth, method: "DELETE" }), taskParams(taskId));
}

function seedProject(ownerId: string, name = "Board") {
  return prisma.project.create({ data: { ownerId, name } });
}

function seedTask(projectId: string, title: string, extra: { description?: string; status?: "TODO" | "IN_PROGRESS" | "DONE"; createdAt?: Date } = {}) {
  return prisma.task.create({ data: { projectId, title, ...extra } });
}

const PROJECT_NOT_FOUND = { error: { code: "NOT_FOUND", message: "Project not found" } };
const TASK_NOT_FOUND = { error: { code: "NOT_FOUND", message: "Task not found" } };

describe("tasks API", () => {
  let ada: Auth;
  let grace: Auth;
  let adaProject: { id: string };
  let graceProject: { id: string };

  beforeEach(async () => {
    await prisma.user.deleteMany({ where: { email: { endsWith: EMAIL_DOMAIN } } });
    ada = await signUp("Ada");
    grace = await signUp("Grace");
    adaProject = await seedProject(ada.userId, "Ada board");
    graceProject = await seedProject(grace.userId, "Grace board");
  });

  afterEach(() => vi.restoreAllMocks());

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { endsWith: EMAIL_DOMAIN } } });
    await prisma.$disconnect();
  });

  describe("authentication", () => {
    it("rejects every endpoint without a session with 401 and changes nothing", async () => {
      const task = await seedTask(adaProject.id, "Keep me");
      const responses = await Promise.all([
        listTasks(undefined, adaProject.id),
        createTask(undefined, adaProject.id, { title: "New" }),
        updateTask(undefined, task.id, { status: "DONE" }),
        deleteTask(undefined, task.id),
      ]);
      for (const response of responses) {
        expect(response.status).toBe(401);
        await expect(response.json()).resolves.toEqual({
          error: { code: "UNAUTHENTICATED", message: "Authentication required" },
        });
      }
      await expect(prisma.task.findUnique({ where: { id: task.id } })).resolves.toMatchObject({
        title: "Keep me",
        status: "TODO",
      });
      await expect(prisma.task.count({ where: { projectId: adaProject.id } })).resolves.toBe(1);
    });
  });

  describe("GET /api/v1/projects/:projectId/tasks", () => {
    it("returns the project's tasks oldest first in the shared Task shape", async () => {
      await seedTask(adaProject.id, "Second", { status: "IN_PROGRESS", createdAt: new Date("2026-11-02T00:00:00Z") });
      await seedTask(adaProject.id, "First", { description: "Has notes", createdAt: new Date("2026-11-01T00:00:00Z") });
      await seedTask(graceProject.id, "Not Ada's");

      const response = await listTasks(ada, adaProject.id);
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({
        tasks: [
          { id: expect.any(String), projectId: adaProject.id, title: "First", description: "Has notes", status: "TODO" },
          { id: expect.any(String), projectId: adaProject.id, title: "Second", status: "IN_PROGRESS" },
        ],
      });
    });

    it("returns an empty list for a project without tasks", async () => {
      const response = await listTasks(ada, adaProject.id);
      await expect(response.json()).resolves.toEqual({ tasks: [] });
    });

    it("returns 404 for another user's project without its tasks", async () => {
      await seedTask(graceProject.id, "Secret task");
      const response = await listTasks(ada, graceProject.id);
      expect(response.status).toBe(404);
      await expect(response.json()).resolves.toEqual(PROJECT_NOT_FOUND);
    });

    it("returns 404 for an unknown project", async () => {
      const response = await listTasks(ada, "does-not-exist");
      expect(response.status).toBe(404);
      await expect(response.json()).resolves.toEqual(PROJECT_NOT_FOUND);
    });
  });

  describe("POST /api/v1/projects/:projectId/tasks", () => {
    it("creates a task with status TODO by default and returns 201", async () => {
      const response = await createTask(ada, adaProject.id, { title: "Write release notes", description: "For v1" });
      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body).toEqual({
        task: { id: expect.any(String), projectId: adaProject.id, title: "Write release notes", description: "For v1", status: "TODO" },
      });
      await expect(prisma.task.findUnique({ where: { id: body.task.id } })).resolves.toMatchObject({
        projectId: adaProject.id,
        status: "TODO",
      });
    });

    it("creates a task without a description", async () => {
      const response = await createTask(ada, adaProject.id, { title: "No notes" });
      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.task).not.toHaveProperty("description");
    });

    it("trims the title and treats a blank description as none", async () => {
      const response = await createTask(ada, adaProject.id, { title: "  Padded  ", description: "   " });
      const body = await response.json();
      expect(body.task.title).toBe("Padded");
      expect(body.task).not.toHaveProperty("description");
      await expect(prisma.task.findUnique({ where: { id: body.task.id } })).resolves.toMatchObject({ description: null });
    });

    it("accepts a title of exactly 120 characters", async () => {
      const response = await createTask(ada, adaProject.id, { title: "a".repeat(120) });
      expect(response.status).toBe(201);
    });

    it("ignores a status in the create body", async () => {
      const response = await createTask(ada, adaProject.id, { title: "Starts in To Do", status: "DONE" });
      const body = await response.json();
      expect(body.task.status).toBe("TODO");
    });

    it.each([
      ["a missing title", {}, "Task title is required"],
      ["an empty title", { title: "" }, "Task title is required"],
      ["a whitespace-only title", { title: "   " }, "Task title is required"],
      ["a non-string title", { title: 42 }, "Task title is required"],
      ["a title over 120 characters", { title: "a".repeat(121) }, "Task title must be at most 120 characters"],
      ["a description over 2000 characters", { title: "Ok", description: "a".repeat(2001) }, "Task description must be at most 2000 characters"],
      ["a malformed JSON body", "{not json", "Task title is required"],
    ])("rejects %s with 400 VALIDATION_ERROR", async (_label, body, message) => {
      const response = await createTask(ada, adaProject.id, body);
      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({ error: { code: "VALIDATION_ERROR", message } });
      await expect(prisma.task.count({ where: { projectId: adaProject.id } })).resolves.toBe(0);
    });

    it("returns 404 for another user's project and creates nothing", async () => {
      const response = await createTask(ada, graceProject.id, { title: "Intrusion" });
      expect(response.status).toBe(404);
      await expect(response.json()).resolves.toEqual(PROJECT_NOT_FOUND);
      await expect(prisma.task.count({ where: { projectId: graceProject.id } })).resolves.toBe(0);
    });
  });

  describe("PATCH /api/v1/tasks/:taskId", () => {
    it("changes the status and returns the updated task", async () => {
      const task = await seedTask(adaProject.id, "Move me");
      const response = await updateTask(ada, task.id, { status: "IN_PROGRESS" });
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({
        task: { id: task.id, projectId: adaProject.id, title: "Move me", status: "IN_PROGRESS" },
      });
      await expect(prisma.task.findUnique({ where: { id: task.id } })).resolves.toMatchObject({ status: "IN_PROGRESS" });
    });

    it("edits the title and description and leaves the status alone", async () => {
      const task = await seedTask(adaProject.id, "Old title", { description: "Old notes", status: "DONE" });
      const response = await updateTask(ada, task.id, { title: "  New title ", description: "New notes" });
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({
        task: { id: task.id, projectId: adaProject.id, title: "New title", description: "New notes", status: "DONE" },
      });
    });

    it.each([
      ["null", null],
      ["an empty string", ""],
    ])("clears the description when it is %s", async (_label, description) => {
      const task = await seedTask(adaProject.id, "Has notes", { description: "Remove me" });
      const response = await updateTask(ada, task.id, { description });
      const body = await response.json();
      expect(body.task).not.toHaveProperty("description");
      await expect(prisma.task.findUnique({ where: { id: task.id } })).resolves.toMatchObject({ description: null });
    });

    it.each([
      ["an empty body", {}, "Provide at least one of title, description, or status"],
      ["an unknown status", { status: "BLOCKED" }, "Status must be one of TODO, IN_PROGRESS, DONE"],
      ["an empty title", { title: " " }, "Task title is required"],
      ["a title over 120 characters", { title: "a".repeat(121) }, "Task title must be at most 120 characters"],
      ["a malformed JSON body", "{not json", "Provide at least one of title, description, or status"],
    ])("rejects %s with 400 VALIDATION_ERROR and keeps the task", async (_label, body, message) => {
      const task = await seedTask(adaProject.id, "Unchanged");
      const response = await updateTask(ada, task.id, body);
      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({ error: { code: "VALIDATION_ERROR", message } });
      await expect(prisma.task.findUnique({ where: { id: task.id } })).resolves.toMatchObject({
        title: "Unchanged",
        status: "TODO",
      });
    });

    it("returns 404 for another user's task and keeps it", async () => {
      const task = await seedTask(graceProject.id, "Grace's task");
      const response = await updateTask(ada, task.id, { status: "DONE", title: "Hijacked" });
      expect(response.status).toBe(404);
      await expect(response.json()).resolves.toEqual(TASK_NOT_FOUND);
      await expect(prisma.task.findUnique({ where: { id: task.id } })).resolves.toMatchObject({
        title: "Grace's task",
        status: "TODO",
      });
    });

    it("returns 404 for an unknown task", async () => {
      const response = await updateTask(ada, "does-not-exist", { status: "DONE" });
      expect(response.status).toBe(404);
      await expect(response.json()).resolves.toEqual(TASK_NOT_FOUND);
    });
  });

  describe("DELETE /api/v1/tasks/:taskId", () => {
    it("deletes the caller's task and returns 204", async () => {
      const task = await seedTask(adaProject.id, "Done with this");
      const response = await deleteTask(ada, task.id);
      expect(response.status).toBe(204);
      await expect(response.text()).resolves.toBe("");
      await expect(prisma.task.findUnique({ where: { id: task.id } })).resolves.toBeNull();
    });

    it("returns 404 for another user's task and keeps it", async () => {
      const task = await seedTask(graceProject.id, "Not yours");
      const response = await deleteTask(ada, task.id);
      expect(response.status).toBe(404);
      await expect(response.json()).resolves.toEqual(TASK_NOT_FOUND);
      await expect(prisma.task.findUnique({ where: { id: task.id } })).resolves.not.toBeNull();
    });

    it("returns 404 for an unknown task", async () => {
      const response = await deleteTask(ada, "does-not-exist");
      expect(response.status).toBe(404);
    });
  });

  describe("when the database is down", () => {
    const DB_ERROR = new Error("connect ECONNREFUSED 127.0.0.1:5432 password=hunter2");

    async function expectInternalError(response: Response) {
      expect(response.status).toBe(500);
      const text = await response.text();
      expect(JSON.parse(text)).toEqual({
        error: { code: "INTERNAL_ERROR", message: "Something went wrong. Please try again." },
      });
      expect(text).not.toContain("hunter2");
    }

    beforeEach(() => {
      vi.spyOn(console, "error").mockImplementation(() => undefined);
    });

    it("returns 500 INTERNAL_ERROR from every endpoint", async () => {
      vi.spyOn(prisma.project, "findFirst").mockRejectedValue(DB_ERROR);
      vi.spyOn(prisma.task, "updateMany").mockRejectedValue(DB_ERROR);
      vi.spyOn(prisma.task, "deleteMany").mockRejectedValue(DB_ERROR);

      await expectInternalError(await listTasks(ada, adaProject.id));
      await expectInternalError(await createTask(ada, adaProject.id, { title: "Doomed" }));
      await expectInternalError(await updateTask(ada, "any", { status: "DONE" }));
      await expectInternalError(await deleteTask(ada, "any"));
    });
  });
});
