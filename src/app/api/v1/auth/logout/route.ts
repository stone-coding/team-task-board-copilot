import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/server/auth/session";

export function POST() {
  const response = new NextResponse(null, { status: 204 });
  clearSessionCookie(response);
  return response;
}
