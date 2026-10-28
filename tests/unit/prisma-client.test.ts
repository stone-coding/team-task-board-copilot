import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.resetModules();
  vi.unstubAllEnvs();
});

describe("Prisma client singleton", () => {
  it("constructs an adapter-backed client and reuses it after a module reload", async () => {
    vi.stubEnv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/team_task_board");
    vi.stubEnv("NODE_ENV", "development");

    const { prisma } = await import("@/server/db");
    const { PrismaClient } = await import("@/generated/prisma/client");

    expect(prisma).toBeInstanceOf(PrismaClient);

    vi.resetModules();
    const reloaded = await import("@/server/db");

    expect(reloaded.prisma).toBe(prisma);
  });
});
