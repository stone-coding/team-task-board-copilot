import { readFile } from "node:fs/promises";
import path from "node:path";

/** The OpenAPI document that /api/docs renders, served unchanged from docs/api/openapi.yaml. */
export async function GET() {
  const spec = await readFile(path.join(process.cwd(), "docs", "api", "openapi.yaml"), "utf8");
  return new Response(spec, { headers: { "content-type": "application/yaml; charset=utf-8" } });
}
