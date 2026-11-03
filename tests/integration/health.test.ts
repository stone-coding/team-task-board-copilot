// @vitest-environment node
import "./helpers/test-db";
import { afterAll, afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/v1/health/route";
import { prisma } from "@/server/db";

describe("GET /api/v1/health", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("returns 200 with the database reachable", async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok", database: "ok" });
  });

  it("returns 503 without leaking details when the database is down", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.spyOn(prisma, "$queryRaw").mockRejectedValueOnce(new Error("connect ECONNREFUSED password=hunter2"));

    const response = await GET();

    expect(response.status).toBe(503);
    const text = await response.text();
    expect(JSON.parse(text)).toEqual({ status: "error", database: "unreachable" });
    expect(text).not.toContain("hunter2");
  });
});
