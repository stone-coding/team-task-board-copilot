import { NextResponse } from "next/server";
import { loginSchema } from "@/lib/auth-schemas";
import { setSessionCookie } from "@/server/auth/session";
import { signToken } from "@/server/auth/token";
import { jsonError, readJson, validationError } from "@/server/http";
import { authenticate } from "@/server/services/users";

export async function POST(request: Request) {
  const parsed = loginSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return validationError(parsed.error);
  }

  const user = await authenticate(parsed.data);
  if (!user) {
    return jsonError(401, "INVALID_CREDENTIALS", "Email or password is incorrect");
  }

  // The token is also returned in the body so API clients can send it as a Bearer header.
  const token = await signToken(user.id);
  const response = NextResponse.json({ user, token });
  setSessionCookie(response, token);
  return response;
}
