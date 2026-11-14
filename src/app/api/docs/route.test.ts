// @vitest-environment node
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { GET as docsPage } from "@/app/api/docs/route";
import { GET as specFile } from "@/app/api/docs/openapi.yaml/route";

describe("GET /api/docs", () => {
  it("serves a Swagger UI page that loads the spec", async () => {
    const response = await docsPage();
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toMatch(/^text\/html/);
    const html = await response.text();
    expect(html).toContain("<title>Team Task Board API</title>");
    expect(html).toContain('id="swagger-ui"');
    expect(html).toContain('url: "/api/docs/openapi.yaml"');
  });

  it("loads Swagger UI from a pinned CDN version with subresource integrity", async () => {
    const html = await (await docsPage()).text();
    const assets = [...html.matchAll(/(?:src|href)="(https:[^"]+)"/g)].map((match) => match[1]);
    expect(assets).toEqual([
      "https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.33.3/swagger-ui.css",
      "https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.33.3/swagger-ui-bundle.js",
    ]);
    expect(html.match(/integrity="sha384-[A-Za-z0-9+/=]+"/g)).toHaveLength(2);
    expect(html.match(/crossorigin="anonymous"/g)).toHaveLength(2);
  });
});

describe("GET /api/docs/openapi.yaml", () => {
  it("serves docs/api/openapi.yaml as YAML", async () => {
    const response = await specFile();
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toMatch(/^application\/yaml/);
    await expect(response.text()).resolves.toBe(readFileSync(path.join(process.cwd(), "docs/api/openapi.yaml"), "utf8"));
  });
});
