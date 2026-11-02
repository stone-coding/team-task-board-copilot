import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/server/auth/session";
import { verifyToken } from "@/server/auth/token";

/** The signed-in user's id for server components, read from the session cookie; null if absent or invalid. */
export async function getCurrentUserId(): Promise<string | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return token ? verifyToken(token) : null;
}
