import { describe, expect, it } from "vitest";
import { createProjectSchema, PROJECT_NAME_MAX_LENGTH } from "@/lib/project-schemas";

function firstMessage(input: unknown) {
  const result = createProjectSchema.safeParse(input);
  return result.success ? null : result.error.issues[0]?.message;
}

describe("createProjectSchema", () => {
  it("allows names up to 80 characters", () => {
    expect(PROJECT_NAME_MAX_LENGTH).toBe(80);
    expect(createProjectSchema.parse({ name: "a".repeat(80) })).toEqual({ name: "a".repeat(80) });
  });

  it("trims the name", () => {
    expect(createProjectSchema.parse({ name: "  Roadmap \n" })).toEqual({ name: "Roadmap" });
  });

  it("strips unknown fields such as ownerId", () => {
    expect(createProjectSchema.parse({ name: "Roadmap", ownerId: "someone-else" })).toEqual({ name: "Roadmap" });
  });

  it.each([[{ name: "" }], [{ name: "   " }], [{}], [{ name: null }], [undefined]])(
    "requires a name (%j)",
    (input) => {
      expect(firstMessage(input)).toBe("Project name is required");
    },
  );

  it("rejects names over 80 characters after trimming", () => {
    expect(firstMessage({ name: "a".repeat(81) })).toBe("Project name must be at most 80 characters");
    expect(firstMessage({ name: ` ${"a".repeat(80)} ` })).toBeNull();
  });
});
