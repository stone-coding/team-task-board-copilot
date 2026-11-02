import { jwtVerify, SignJWT } from "jose";

const ALGORITHM = "HS256";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set; add it to .env (see .env.example)");
  }
  return new TextEncoder().encode(secret);
}

export async function signToken(userId: string) {
  return new SignJWT({})
    .setProtectedHeader({ alg: ALGORITHM })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getSecret());
}

/** Returns the user id for a valid token, or null for any invalid, expired, or foreign token. */
export async function verifyToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: [ALGORITHM] });
    return payload.sub ?? null;
  } catch {
    return null;
  }
}
