// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getCurrentUserId } from "@/server/auth/current-user";
import { SESSION_COOKIE } from "@/server/auth/session";
import { signToken } from "@/server/auth/token";

const cookieJar = new Map<string, string>();
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (cookieJar.has(name) ? { name, value: cookieJar.get(name) } : undefined),
  }),
}));

describe("reading the current user in a server component", () => {
  beforeEach(() => {
    cookieJar.clear();
    vi.stubEnv("JWT_SECRET", "unit-test-secret-at-least-32-characters-long");
  });
  afterEach(() => vi.unstubAllEnvs());

  it("resolves the user id from a valid session cookie", async () => {
    cookieJar.set(SESSION_COOKIE, await signToken("user_123"));
    await expect(getCurrentUserId()).resolves.toBe("user_123");
  });

  it("resolves null without a session cookie", async () => {
    await expect(getCurrentUserId()).resolves.toBeNull();
  });

  it("resolves null for an invalid session cookie", async () => {
    cookieJar.set(SESSION_COOKIE, "not-a-jwt");
    await expect(getCurrentUserId()).resolves.toBeNull();
  });
});
