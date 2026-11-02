// @vitest-environment node
import { SignJWT } from "jose";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { signToken, verifyToken } from "@/server/auth/token";

const SECRET = "unit-test-secret-at-least-32-characters-long";

describe("JWT tokens", () => {
  beforeEach(() => vi.stubEnv("JWT_SECRET", SECRET));
  afterEach(() => vi.unstubAllEnvs());

  it("round-trips the user id", async () => {
    const token = await signToken("user_123");
    await expect(verifyToken(token)).resolves.toBe("user_123");
  });

  it("rejects a tampered token", async () => {
    const token = await signToken("user_123");
    const tampered = `${token.slice(0, -2)}xx`;
    await expect(verifyToken(tampered)).resolves.toBeNull();
  });

  it("rejects a token signed with another secret", async () => {
    const token = await new SignJWT({})
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("user_123")
      .setExpirationTime("1h")
      .sign(new TextEncoder().encode("a-different-secret-that-is-long-enough"));
    await expect(verifyToken(token)).resolves.toBeNull();
  });

  it("rejects an expired token", async () => {
    const token = await new SignJWT({})
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("user_123")
      .setExpirationTime(Math.floor(Date.now() / 1000) - 60)
      .sign(new TextEncoder().encode(SECRET));
    await expect(verifyToken(token)).resolves.toBeNull();
  });

  it("refuses to sign without JWT_SECRET", async () => {
    vi.stubEnv("JWT_SECRET", "");
    await expect(signToken("user_123")).rejects.toThrow("JWT_SECRET");
  });
});
