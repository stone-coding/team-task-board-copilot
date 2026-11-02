import { NextResponse, type NextRequest } from "next/server";
import { getAuthenticatedUserId } from "@/server/auth/session";
import { unauthenticated } from "@/server/http";

const PUBLIC_PATHS = new Set([
  "/login",
  "/register",
  "/api/v1/auth/login",
  "/api/v1/auth/register",
  "/api/v1/auth/logout",
  "/api/v1/health",
]);

// Optimistic check only: route handlers verify the session again before touching data.
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (PUBLIC_PATHS.has(pathname) || (await getAuthenticatedUserId(request))) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return unauthenticated();
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", `${pathname}${search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
