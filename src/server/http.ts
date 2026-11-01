import { NextResponse } from "next/server";
import type { ZodError } from "zod";

export function jsonError(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export function unauthenticated() {
  return jsonError(401, "UNAUTHENTICATED", "Authentication required");
}

export function validationError(error: ZodError) {
  return jsonError(400, "VALIDATION_ERROR", error.issues[0]?.message ?? "Invalid request body");
}

/** Parses a JSON body; returns undefined for a missing or malformed body so zod reports it. */
export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
}
