// @vitest-environment node
import { jsonRequest, TEST_PASSWORD } from "./helpers/test-db";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { POST as register } from "@/app/api/v1/auth/register/route";
import { prisma } from "@/server/db";

const VALID = { email: "ada@register.test", name: "Ada Lovelace", password: TEST_PASSWORD };

describe("POST /api/v1/auth/register", () => {
  beforeEach(async () => {
    await prisma.user.deleteMany({ where: { email: { endsWith: "@register.test" } } });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("creates a user and returns 201 without the password hash", async () => {
    const response = await register(jsonRequest("/api/v1/auth/register", VALID));
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body).toEqual({ user: { id: expect.any(String), email: VALID.email, name: VALID.name } });
    expect(JSON.stringify(body)).not.toContain("passwordHash");
  });

  it("stores a bcrypt hash, not the plaintext password", async () => {
    await register(jsonRequest("/api/v1/auth/register", VALID));
    const user = await prisma.user.findUniqueOrThrow({ where: { email: VALID.email } });
    expect(user.passwordHash).not.toBe(TEST_PASSWORD);
    expect(user.passwordHash).toMatch(/^\$2[aby]\$/);
  });

  it("does not log the user in (no session cookie)", async () => {
    const response = await register(jsonRequest("/api/v1/auth/register", VALID));
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("rejects a duplicate email with 409 and a clear message", async () => {
    await register(jsonRequest("/api/v1/auth/register", VALID));
    const response = await register(
      jsonRequest("/api/v1/auth/register", { ...VALID, email: "ADA@register.test", name: "Other" }),
    );
    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: { code: "EMAIL_TAKEN", message: "An account with this email already exists" },
    });
  });

  it("rejects a short password with 400", async () => {
    const response = await register(jsonRequest("/api/v1/auth/register", { ...VALID, password: "short" }));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: { code: "VALIDATION_ERROR", message: "Password must be at least 8 characters" },
    });
  });

  it("rejects a body that is not JSON with 400", async () => {
    const response = await register(jsonRequest("/api/v1/auth/register", "{not json"));
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });
});
