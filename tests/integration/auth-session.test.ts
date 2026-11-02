// @vitest-environment node
import { jsonRequest, TEST_PASSWORD } from "./helpers/test-db";
import { NextRequest } from "next/server";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { POST as login } from "@/app/api/v1/auth/login/route";
import { POST as logout } from "@/app/api/v1/auth/logout/route";
import { GET as me } from "@/app/api/v1/auth/me/route";
import { POST as register } from "@/app/api/v1/auth/register/route";
import { prisma } from "@/server/db";

const USER = { email: "ada@session.test", name: "Ada Lovelace", password: TEST_PASSWORD };
const ME_URL = "http://localhost/api/v1/auth/me";

async function loginAs(email = USER.email, password = USER.password) {
  return login(jsonRequest("/api/v1/auth/login", { email, password }));
}

function sessionCookie(response: Response) {
  const header = response.headers.get("set-cookie") ?? "";
  return header.split(";")[0] ?? "";
}

describe("login, session, and logout", () => {
  beforeEach(async () => {
    await prisma.user.deleteMany({ where: { email: { endsWith: "@session.test" } } });
    await register(jsonRequest("/api/v1/auth/register", USER));
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("issues a JWT in an httpOnly, Secure, SameSite=Lax cookie on login", async () => {
    const response = await loginAs();
    expect(response.status).toBe(200);
    const cookie = response.headers.get("set-cookie") ?? "";
    expect(cookie).toMatch(/^session=[\w-]+\.[\w-]+\.[\w-]+;/);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/Secure/i);
    expect(cookie).toMatch(/SameSite=lax/i);
    expect(cookie).toMatch(/Path=\//i);
  });

  it("returns the user and the token for API clients", async () => {
    const response = await loginAs("  ADA@session.test ");
    const body = await response.json();
    expect(body).toEqual({
      user: { id: expect.any(String), email: USER.email, name: USER.name },
      token: expect.any(String),
    });
  });

  it("rejects a wrong password with 401", async () => {
    const response = await loginAs(USER.email, "wrong-password");
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: { code: "INVALID_CREDENTIALS", message: "Email or password is incorrect" },
    });
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("rejects an unknown email with the same 401 message", async () => {
    const response = await loginAs("nobody@session.test");
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: { code: "INVALID_CREDENTIALS", message: "Email or password is incorrect" },
    });
  });

  it("rejects an invalid login body with 400", async () => {
    const response = await login(jsonRequest("/api/v1/auth/login", { email: "nope" }));
    expect(response.status).toBe(400);
  });

  it("accepts a Bearer token from API clients", async () => {
    const { token } = await (await loginAs()).json();
    const response = await me(new NextRequest(ME_URL, { headers: { authorization: `Bearer ${token}` } }));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      user: { id: expect.any(String), email: USER.email, name: USER.name },
    });
  });

  it("accepts the session cookie", async () => {
    const cookie = sessionCookie(await loginAs());
    const response = await me(new NextRequest(ME_URL, { headers: { cookie } }));
    expect(response.status).toBe(200);
  });

  it("returns 401 to an unauthenticated API request", async () => {
    const response = await me(new NextRequest(ME_URL));
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: { code: "UNAUTHENTICATED", message: "Authentication required" },
    });
  });

  it("returns 401 when the token's user no longer exists", async () => {
    const { token } = await (await loginAs()).json();
    await prisma.user.deleteMany({ where: { email: { endsWith: "@session.test" } } });
    const response = await me(new NextRequest(ME_URL, { headers: { authorization: `Bearer ${token}` } }));
    expect(response.status).toBe(401);
  });

  it("clears the session cookie on logout", async () => {
    const response = await logout();
    expect(response.status).toBe(204);
    const cookie = response.headers.get("set-cookie") ?? "";
    expect(cookie).toMatch(/^session=;/);
    expect(cookie).toMatch(/Max-Age=0|Expires=Thu, 01 Jan 1970/i);
  });
});
