// @vitest-environment node
import { TEST_PASSWORD } from "./helpers/test-db";
import { NextRequest } from "next/server";
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET as listRoute, POST as createRoute } from "@/app/api/v1/projects/route";
import { DELETE as deleteRoute, GET as getRoute } from "@/app/api/v1/projects/[projectId]/route";
import { SESSION_COOKIE } from "@/server/auth/session";
import { signToken } from "@/server/auth/token";
import { prisma } from "@/server/db";
import { createUser } from "@/server/services/users";

const EMAIL_DOMAIN = "@projects.test";
const BASE_URL = "http://localhost/api/v1/projects";

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

function params(projectId: string) {
  return { params: Promise.resolve({ projectId }) };
}

function createProject(auth: Auth, body: unknown) {
  return createRoute(request("", { auth, method: "POST", body }));
}

function seedProject(ownerId: string, name: string, createdAt?: Date) {
  return prisma.project.create({ data: { ownerId, name, createdAt } });
}

describe("projects API", () => {
  let ada: Auth;
  let grace: Auth;

  beforeEach(async () => {
    await prisma.user.deleteMany({ where: { email: { endsWith: EMAIL_DOMAIN } } });
    ada = await signUp("Ada");
    grace = await signUp("Grace");
  });

  afterEach(() => vi.restoreAllMocks());

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { endsWith: EMAIL_DOMAIN } } });
    await prisma.$disconnect();
  });

  describe("authentication", () => {
    it("rejects every endpoint without a session with 401", async () => {
      const project = await seedProject(ada.userId, "Private");
      const responses = await Promise.all([
        listRoute(request("")),
        createRoute(request("", { method: "POST", body: { name: "New" } })),
        getRoute(request(`/${project.id}`), params(project.id)),
        deleteRoute(request(`/${project.id}`, { method: "DELETE" }), params(project.id)),
      ]);
      for (const response of responses) {
        expect(response.status).toBe(401);
        await expect(response.json()).resolves.toEqual({
          error: { code: "UNAUTHENTICATED", message: "Authentication required" },
        });
      }
      await expect(prisma.project.count({ where: { ownerId: ada.userId } })).resolves.toBe(1);
    });

    it("rejects an invalid token with 401", async () => {
      const response = await listRoute(request("", { auth: { token: "not-a-jwt", userId: "" } }));
      expect(response.status).toBe(401);
    });

    it("accepts the session cookie as well as a Bearer token", async () => {
      await seedProject(ada.userId, "Cookie project");
      const response = await listRoute(
        new NextRequest(BASE_URL, { headers: { cookie: `${SESSION_COOKIE}=${ada.token}` } }),
      );
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.projects.map((project: { name: string }) => project.name)).toEqual(["Cookie project"]);
    });
  });

  describe("POST /api/v1/projects", () => {
    it("creates a project owned by the caller and returns 201", async () => {
      const response = await createProject(ada, { name: "Launch plan" });
      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body).toEqual({
        project: { id: expect.any(String), name: "Launch plan", createdAt: expect.any(String) },
      });
      expect(Number.isNaN(Date.parse(body.project.createdAt))).toBe(false);
      const stored = await prisma.project.findUnique({ where: { id: body.project.id } });
      expect(stored?.ownerId).toBe(ada.userId);
    });

    it("trims the project name", async () => {
      const response = await createProject(ada, { name: "  Launch plan  " });
      const body = await response.json();
      expect(body.project.name).toBe("Launch plan");
    });

    it("accepts a name of exactly 80 characters", async () => {
      const response = await createProject(ada, { name: "a".repeat(80) });
      expect(response.status).toBe(201);
    });

    it.each([
      ["an empty name", { name: "" }, "Project name is required"],
      ["a whitespace-only name", { name: "   " }, "Project name is required"],
      ["a missing name", {}, "Project name is required"],
      ["a non-string name", { name: 42 }, "Project name is required"],
      ["a name over 80 characters", { name: "a".repeat(81) }, "Project name must be at most 80 characters"],
      ["a malformed JSON body", "{not json", "Project name is required"],
    ])("rejects %s with 400 VALIDATION_ERROR", async (_label, body, message) => {
      const response = await createProject(ada, body);
      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({ error: { code: "VALIDATION_ERROR", message } });
      await expect(prisma.project.count({ where: { ownerId: ada.userId } })).resolves.toBe(0);
    });

    it("ignores an ownerId in the body", async () => {
      const response = await createProject(ada, { name: "Mine", ownerId: grace.userId });
      const body = await response.json();
      const stored = await prisma.project.findUnique({ where: { id: body.project.id } });
      expect(stored?.ownerId).toBe(ada.userId);
    });
  });

  describe("GET /api/v1/projects", () => {
    it("lists only the caller's projects, newest first", async () => {
      await seedProject(ada.userId, "Oldest", new Date("2026-10-01T00:00:00Z"));
      await seedProject(ada.userId, "Newest", new Date("2026-10-03T00:00:00Z"));
      await seedProject(ada.userId, "Middle", new Date("2026-10-02T00:00:00Z"));
      await seedProject(grace.userId, "Grace's project", new Date("2026-10-04T00:00:00Z"));

      const response = await listRoute(request("", { auth: ada }));
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.projects.map((project: { name: string }) => project.name)).toEqual(["Newest", "Middle", "Oldest"]);
      expect(body.projects[0]).toEqual({ id: expect.any(String), name: "Newest", createdAt: "2026-10-03T00:00:00.000Z" });
    });

    it("returns an empty list when the caller has no projects", async () => {
      const response = await listRoute(request("", { auth: ada }));
      await expect(response.json()).resolves.toEqual({ projects: [] });
    });
  });

  describe("GET /api/v1/projects/:projectId", () => {
    it("returns the caller's project", async () => {
      const project = await seedProject(ada.userId, "Roadmap", new Date("2026-10-05T12:00:00Z"));
      const response = await getRoute(request(`/${project.id}`, { auth: ada }), params(project.id));
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({
        project: { id: project.id, name: "Roadmap", createdAt: "2026-10-05T12:00:00.000Z" },
      });
    });

    it("returns 404 for another user's project without its data", async () => {
      const project = await seedProject(grace.userId, "Secret plans");
      const response = await getRoute(request(`/${project.id}`, { auth: ada }), params(project.id));
      expect(response.status).toBe(404);
      await expect(response.json()).resolves.toEqual({
        error: { code: "NOT_FOUND", message: "Project not found" },
      });
    });

    it("returns 404 for an unknown id", async () => {
      const response = await getRoute(request("/does-not-exist", { auth: ada }), params("does-not-exist"));
      expect(response.status).toBe(404);
    });
  });

  describe("DELETE /api/v1/projects/:projectId", () => {
    it("deletes the caller's project and its tasks, returning 204", async () => {
      const project = await seedProject(ada.userId, "Short-lived");
      await prisma.task.create({ data: { projectId: project.id, title: "Orphan me" } });

      const response = await deleteRoute(request(`/${project.id}`, { auth: ada, method: "DELETE" }), params(project.id));
      expect(response.status).toBe(204);
      await expect(response.text()).resolves.toBe("");
      await expect(prisma.project.findUnique({ where: { id: project.id } })).resolves.toBeNull();
      await expect(prisma.task.count({ where: { projectId: project.id } })).resolves.toBe(0);
    });

    it("returns 404 for another user's project and keeps it", async () => {
      const project = await seedProject(grace.userId, "Not yours");
      const response = await deleteRoute(request(`/${project.id}`, { auth: ada, method: "DELETE" }), params(project.id));
      expect(response.status).toBe(404);
      await expect(response.json()).resolves.toEqual({
        error: { code: "NOT_FOUND", message: "Project not found" },
      });
      await expect(prisma.project.findUnique({ where: { id: project.id } })).resolves.not.toBeNull();
    });

    it("returns 404 for an unknown id", async () => {
      const response = await deleteRoute(
        request("/does-not-exist", { auth: ada, method: "DELETE" }),
        params("does-not-exist"),
      );
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
      expect(text).not.toContain("ECONNREFUSED");
      expect(text).not.toContain("hunter2");
    }

    beforeEach(() => {
      vi.spyOn(console, "error").mockImplementation(() => undefined);
    });

    it("returns 500 INTERNAL_ERROR from the list endpoint", async () => {
      vi.spyOn(prisma.project, "findMany").mockRejectedValueOnce(DB_ERROR);
      await expectInternalError(await listRoute(request("", { auth: ada })));
    });

    it("returns 500 INTERNAL_ERROR from the create endpoint", async () => {
      vi.spyOn(prisma.project, "create").mockRejectedValueOnce(DB_ERROR);
      await expectInternalError(await createProject(ada, { name: "Doomed" }));
    });

    it("returns 500 INTERNAL_ERROR from the get endpoint", async () => {
      vi.spyOn(prisma.project, "findFirst").mockRejectedValueOnce(DB_ERROR);
      await expectInternalError(await getRoute(request("/any", { auth: ada }), params("any")));
    });

    it("returns 500 INTERNAL_ERROR from the delete endpoint", async () => {
      vi.spyOn(prisma.project, "deleteMany").mockRejectedValueOnce(DB_ERROR);
      await expectInternalError(await deleteRoute(request("/any", { auth: ada, method: "DELETE" }), params("any")));
    });
  });
});
