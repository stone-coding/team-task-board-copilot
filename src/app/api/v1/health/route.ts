import { NextResponse } from "next/server";
import { prisma } from "@/server/db";

/** Public liveness check used after deployments: confirms the app runs and can reach the database. */
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok", database: "ok" });
  } catch (error) {
    console.error("Health check failed", error);
    return NextResponse.json({ status: "error", database: "unreachable" }, { status: 503 });
  }
}
