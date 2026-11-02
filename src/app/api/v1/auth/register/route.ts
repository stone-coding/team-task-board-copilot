import { NextResponse } from "next/server";
import { registerSchema } from "@/lib/auth-schemas";
import { jsonError, readJson, validationError } from "@/server/http";
import { createUser, EmailTakenError } from "@/server/services/users";

export async function POST(request: Request) {
  const parsed = registerSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return validationError(parsed.error);
  }

  try {
    const user = await createUser(parsed.data);
    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    if (error instanceof EmailTakenError) {
      return jsonError(409, "EMAIL_TAKEN", error.message);
    }
    throw error;
  }
}
