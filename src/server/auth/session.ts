import type { NextRequest, NextResponse } from "next/server";
import { SESSION_MAX_AGE_SECONDS, verifyToken } from "@/server/auth/token";

export const SESSION_COOKIE = "session";

const COOKIE_OPTIONS = { httpOnly: true, secure: true, sameSite: "lax", path: "/" } as const;

/** Bearer header first (API clients), then the session cookie (browser). */
export function getTokenFromRequest(request: NextRequest): string | null {
  const authorization = request.headers.get("authorization");
  const bearer = authorization?.match(/^Bearer\s+(\S+)$/i)?.[1];
  if (bearer) {
    return bearer;
  }
  return request.cookies.get(SESSION_COOKIE)?.value || null;
}

export async function getAuthenticatedUserId(request: NextRequest): Promise<string | null> {
  const token = getTokenFromRequest(request);
  return token ? verifyToken(token) : null;
}

export function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(SESSION_COOKIE, token, { ...COOKIE_OPTIONS, maxAge: SESSION_MAX_AGE_SECONDS });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, "", { ...COOKIE_OPTIONS, maxAge: 0 });
}
