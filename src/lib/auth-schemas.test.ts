import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema } from "@/lib/auth-schemas";

const VALID = { email: "ada@example.com", name: "Ada Lovelace", password: "correct-horse" };

describe("registerSchema", () => {
  it("accepts an email, name, and password of 8+ characters", () => {
    expect(registerSchema.safeParse(VALID).success).toBe(true);
  });

  it("normalizes the email to trimmed lowercase", () => {
    const result = registerSchema.parse({ ...VALID, email: "  Ada@Example.COM " });
    expect(result.email).toBe("ada@example.com");
  });

  it("rejects an invalid email", () => {
    expect(registerSchema.safeParse({ ...VALID, email: "not-an-email" }).success).toBe(false);
  });

  it("rejects an empty name", () => {
    expect(registerSchema.safeParse({ ...VALID, name: "   " }).success).toBe(false);
  });

  it("rejects a password shorter than 8 characters with a clear message", () => {
    const result = registerSchema.safeParse({ ...VALID, password: "short7!" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("Password must be at least 8 characters");
  });

  it("accepts a password of exactly 8 characters", () => {
    expect(registerSchema.safeParse({ ...VALID, password: "12345678" }).success).toBe(true);
  });
});

describe("loginSchema", () => {
  it("accepts an email and a non-empty password", () => {
    expect(loginSchema.safeParse({ email: VALID.email, password: "x" }).success).toBe(true);
  });

  it("rejects a missing password", () => {
    expect(loginSchema.safeParse({ email: VALID.email, password: "" }).success).toBe(false);
  });
});
