// Applies prisma/migrations to the integration-test database (TEST_DATABASE_URL), never the dev database.
// Run with `npm run db:test:migrate`; `--env-file-if-exists=.env` loads .env, and existing env vars win (CI).
import { execFileSync } from "node:child_process";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
if (!testDatabaseUrl) {
  throw new Error("TEST_DATABASE_URL is not set; copy .env.example to .env");
}

execFileSync("npx", ["prisma", "migrate", "deploy"], {
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL: testDatabaseUrl },
});
