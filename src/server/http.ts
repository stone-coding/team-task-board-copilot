import { NextResponse } from "next/server";
import type { ZodError } from "zod";

export function jsonError(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export function unauthenticated() {
  return jsonError(401, "UNAUTHENTICATED", "Authentication required");
}

export function notFoundError(message: string) {
  return jsonError(404, "NOT_FOUND", message);
}

/**
 * Wraps a route handler so unexpected failures (for example, the database being down) return a generic 500
 * in the standard error shape instead of leaking details. The error is logged server-side only.
 */
export function withErrorHandling<Args extends unknown[]>(handler: (...args: Args) => Promise<Response>) {
  return async (...args: Args): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (error) {
      console.error("Unhandled API error", error);
      return jsonError(500, "INTERNAL_ERROR", "Something went wrong. Please try again.");
    }
  };
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
