// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@/generated/prisma/client";

const TEST_URL = "postgresql://user:password@localhost:5432/unit_test";

describe("Prisma client singleton", () => {
  beforeEach(() => {
    vi.resetModules();
    globalThis.prisma = undefined;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    globalThis.prisma = undefined;
  });

  it("constructs a PrismaClient from DATABASE_URL", async () => {
    vi.stubEnv("DATABASE_URL", TEST_URL);

    const { prisma } = await import("@/server/db");

    expect(prisma).toBeInstanceOf(PrismaClient);
  });

  it("reuses the cached client across module reloads outside production", async () => {
    vi.stubEnv("DATABASE_URL", TEST_URL);
    vi.stubEnv("NODE_ENV", "development");

    const first = (await import("@/server/db")).prisma;
    vi.resetModules();
    const second = (await import("@/server/db")).prisma;

    expect(second).toBe(first);
    expect(globalThis.prisma).toBe(first);
  });

  it("does not cache the client on globalThis in production", async () => {
    vi.stubEnv("DATABASE_URL", TEST_URL);
    vi.stubEnv("NODE_ENV", "production");

    await import("@/server/db");

    expect(globalThis.prisma).toBeUndefined();
  });

  it("fails with a clear error when DATABASE_URL is missing", async () => {
    vi.stubEnv("DATABASE_URL", "");

    await expect(import("@/server/db")).rejects.toThrow("DATABASE_URL");
  });
});
