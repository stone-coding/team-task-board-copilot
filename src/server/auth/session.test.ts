// @vitest-environment node
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getAuthenticatedUserId, getTokenFromRequest, SESSION_COOKIE } from "@/server/auth/session";
import { signToken } from "@/server/auth/token";

const URL = "http://localhost/api/v1/auth/me";

describe("reading the session from a request", () => {
  beforeEach(() => vi.stubEnv("JWT_SECRET", "unit-test-secret-at-least-32-characters-long"));
  afterEach(() => vi.unstubAllEnvs());

  it("reads a Bearer token from the Authorization header", () => {
    const request = new NextRequest(URL, { headers: { authorization: "Bearer abc.def.ghi" } });
    expect(getTokenFromRequest(request)).toBe("abc.def.ghi");
  });

  it("reads the token from the session cookie", () => {
    const request = new NextRequest(URL, { headers: { cookie: `${SESSION_COOKIE}=abc.def.ghi` } });
    expect(getTokenFromRequest(request)).toBe("abc.def.ghi");
  });

  it("returns null when neither is present", () => {
    expect(getTokenFromRequest(new NextRequest(URL))).toBeNull();
  });

  it("resolves the user id from a valid token", async () => {
    const token = await signToken("user_123");
    const request = new NextRequest(URL, { headers: { authorization: `Bearer ${token}` } });
    await expect(getAuthenticatedUserId(request)).resolves.toBe("user_123");
  });

  it("resolves null for an invalid token", async () => {
    const request = new NextRequest(URL, { headers: { authorization: "Bearer not-a-jwt" } });
    await expect(getAuthenticatedUserId(request)).resolves.toBeNull();
  });
});
