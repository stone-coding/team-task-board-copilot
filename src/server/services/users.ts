import { Prisma } from "@/generated/prisma/client";
import type { LoginInput, RegisterInput } from "@/lib/auth-schemas";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import { prisma } from "@/server/db";

export type PublicUser = { id: string; email: string; name: string };

const PUBLIC_USER_SELECT = { id: true, email: true, name: true } as const;

// Compared against when the email is unknown, so both failure paths take the same time.
let dummyHash: Promise<string> | undefined;
function getDummyHash() {
  dummyHash ??= hashPassword("timing-equalizer-not-a-real-password");
  return dummyHash;
}

export class EmailTakenError extends Error {
  constructor() {
    super("An account with this email already exists");
  }
}

export async function createUser(input: RegisterInput): Promise<PublicUser> {
  try {
    return await prisma.user.create({
      data: { email: input.email, name: input.name, passwordHash: await hashPassword(input.password) },
      select: PUBLIC_USER_SELECT,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new EmailTakenError();
    }
    throw error;
  }
}

/** Returns the user for valid credentials, or null without revealing which part was wrong. */
export async function authenticate(input: LoginInput): Promise<PublicUser | null> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  const passwordMatches = await verifyPassword(input.password, user?.passwordHash ?? (await getDummyHash()));
  if (!user || !passwordMatches) {
    return null;
  }
  return { id: user.id, email: user.email, name: user.name };
}

export function findUserById(id: string): Promise<PublicUser | null> {
  return prisma.user.findUnique({ where: { id }, select: PUBLIC_USER_SELECT });
}
