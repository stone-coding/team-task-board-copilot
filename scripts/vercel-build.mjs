// Vercel build (vercel.json buildCommand): generate the Prisma client, apply migrations, then build Next.js.
// Migrations use Neon's direct connection (DATABASE_URL_UNPOOLED) because the pooled one cannot hold migration locks.
// Preview deployments run against their own Neon branch; production runs against the production database.
import { execFileSync } from "node:child_process";

function run(command, args, env = process.env) {
  execFileSync(command, args, { stdio: "inherit", env });
}

const migrationUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!migrationUrl) {
  throw new Error("DATABASE_URL is not set; connect the Neon integration to this Vercel environment");
}

run("npx", ["prisma", "generate"]);
run("npx", ["prisma", "migrate", "deploy"], { ...process.env, DATABASE_URL: migrationUrl });
run("npx", ["next", "build"]);
