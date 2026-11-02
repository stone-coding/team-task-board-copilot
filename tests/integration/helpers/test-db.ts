import "dotenv/config";

// Must be imported before anything that loads @/server/db, so the client targets the test database.
const testDatabaseUrl = process.env.TEST_DATABASE_URL;
if (!testDatabaseUrl) {
  throw new Error("TEST_DATABASE_URL is not set; copy .env.example to .env");
}
process.env.DATABASE_URL = testDatabaseUrl;
process.env.JWT_SECRET ||= "integration-test-secret-at-least-32-characters";

export const TEST_PASSWORD = "correct-horse";

export function jsonRequest(url: string, body: unknown, headers: Record<string, string> = {}) {
  return new Request(`http://localhost${url}`, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}
