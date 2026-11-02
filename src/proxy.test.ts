// @vitest-environment node
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { proxy } from "@/proxy";
import { SESSION_COOKIE } from "@/server/auth/session";
import { signToken } from "@/server/auth/token";

function request(path: string, headers: Record<string, string> = {}) {
  return new NextRequest(`http://localhost${path}`, { headers });
}

describe("auth proxy", () => {
  beforeEach(() => vi.stubEnv("JWT_SECRET", "unit-test-secret-at-least-32-characters-long"));
  afterEach(() => vi.unstubAllEnvs());

  it("redirects an unauthenticated page request to /login with the original path", async () => {
    const response = await proxy(request("/projects/demo"));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/login?next=%2Fprojects%2Fdemo");
  });

  it("returns 401 JSON for an unauthenticated API request", async () => {
    const response = await proxy(request("/api/v1/projects"));
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: { code: "UNAUTHENTICATED", message: "Authentication required" },
    });
  });

  it("treats an invalid token as unauthenticated", async () => {
    const response = await proxy(request("/", { cookie: `${SESSION_COOKIE}=garbage` }));
    expect(response.status).toBe(307);
  });

  it("lets a request with a valid session cookie through", async () => {
    const token = await signToken("user_123");
    const response = await proxy(request("/projects/demo", { cookie: `${SESSION_COOKIE}=${token}` }));
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("lets an API request with a valid Bearer token through", async () => {
    const token = await signToken("user_123");
    const response = await proxy(request("/api/v1/auth/me", { authorization: `Bearer ${token}` }));
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it.each(["/login", "/register", "/api/v1/auth/login", "/api/v1/auth/register", "/api/v1/auth/logout", "/api/v1/health"])(
    "leaves %s public",
    async (path) => {
      const response = await proxy(request(path));
      expect(response.headers.get("x-middleware-next")).toBe("1");
    },
  );
});
