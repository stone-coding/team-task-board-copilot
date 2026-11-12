// @vitest-environment node
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";

const API_DIR = path.join(process.cwd(), "src/app/api/v1");
const SPEC_PATH = path.join(process.cwd(), "docs/api/openapi.yaml");
const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;

type Operation = { security?: unknown[]; responses?: Record<string, unknown> };
type Spec = {
  openapi: string;
  security?: unknown[];
  paths: Record<string, Record<string, Operation>>;
  components: { securitySchemes: Record<string, unknown>; schemas: Record<string, unknown> };
};

/** "projects/[projectId]/tasks/route.ts" → "/projects/{projectId}/tasks" */
function toSpecPath(routeFile: string) {
  const segments = path.dirname(routeFile).split(path.sep).filter((segment) => segment !== ".");
  return `/${segments.map((segment) => segment.replace(/^\[(.+)\]$/, "{$1}")).join("/")}`;
}

function routeOperations(): string[] {
  const files = readdirSync(API_DIR, { recursive: true, encoding: "utf8" }).filter((file) => path.basename(file) === "route.ts");
  return files.flatMap((file) => {
    const source = readFileSync(path.join(API_DIR, file), "utf8");
    return HTTP_METHODS.filter((method) => new RegExp(`export (const|async function|function) ${method}\\b`).test(source)).map(
      (method) => `${method} ${toSpecPath(file)}`,
    );
  });
}

function specOperations(spec: Spec): string[] {
  return Object.entries(spec.paths).flatMap(([specPath, item]) =>
    HTTP_METHODS.filter((method) => method.toLowerCase() in item).map((method) => `${method} ${specPath}`),
  );
}

function missingFrom(expected: string[], actual: string[]) {
  return expected.filter((operation) => !actual.includes(operation)).sort();
}

const spec: Spec = parse(readFileSync(SPEC_PATH, "utf8"));

describe("OpenAPI spec (docs/api/openapi.yaml)", () => {
  it("finds the route handlers it checks", () => {
    expect(routeOperations()).toEqual(expect.arrayContaining(["GET /health", "PATCH /tasks/{taskId}"]));
  });

  it("documents every /api/v1 route handler", () => {
    expect(missingFrom(routeOperations(), specOperations(spec))).toEqual([]);
  });

  it("documents no operation that has no route handler", () => {
    expect(missingFrom(specOperations(spec), routeOperations())).toEqual([]);
  });

  it("reports a route that has no spec entry", () => {
    const withoutTasks: Spec = { ...spec, paths: { ...spec.paths, "/tasks/{taskId}": {} } };
    expect(missingFrom(routeOperations(), specOperations(withoutTasks))).toEqual(["DELETE /tasks/{taskId}", "PATCH /tasks/{taskId}"]);
  });

  it("is OpenAPI 3 with cookie and Bearer auth and the shared error shape", () => {
    expect(spec.openapi).toMatch(/^3\./);
    expect(Object.keys(spec.components.securitySchemes).sort()).toEqual(["bearerAuth", "cookieAuth"]);
    expect(spec.security).toEqual([{ bearerAuth: [] }, { cookieAuth: [] }]);
    expect(spec.components.schemas.Error).toMatchObject({
      required: ["error"],
      properties: { error: { required: ["code", "message"] } },
    });
  });

  it("lists a success response for every operation and 401 for every protected one", () => {
    for (const [specPath, item] of Object.entries(spec.paths)) {
      for (const method of HTTP_METHODS.map((name) => name.toLowerCase()).filter((name) => name in item)) {
        const operation = item[method];
        const statuses = Object.keys(operation.responses ?? {});
        expect(statuses.some((status) => status.startsWith("2")), `${method} ${specPath} success`).toBe(true);
        if (operation.security === undefined) {
          expect(statuses, `${method} ${specPath} 401`).toContain("401");
        }
      }
    }
  });
});
