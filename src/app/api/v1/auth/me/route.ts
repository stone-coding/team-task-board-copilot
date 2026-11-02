import { NextResponse, type NextRequest } from "next/server";
import { getAuthenticatedUserId } from "@/server/auth/session";
import { unauthenticated } from "@/server/http";
import { findUserById } from "@/server/services/users";

export async function GET(request: NextRequest) {
  const userId = await getAuthenticatedUserId(request);
  const user = userId ? await findUserById(userId) : null;
  if (!user) {
    return unauthenticated();
  }
  return NextResponse.json({ user });
}
