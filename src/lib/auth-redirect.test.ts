import { describe, expect, it } from "vitest";
import { safeNextPath } from "@/lib/auth-redirect";

describe("safeNextPath", () => {
  it("keeps a same-site path with its query", () => {
    expect(safeNextPath("/projects/demo?tab=1")).toBe("/projects/demo?tab=1");
  });

  it.each([undefined, "", "https://evil.example", "//evil.example", "/\\evil.example", "projects", ["/a", "/b"]])(
    "falls back to / for %j to prevent open redirects",
    (value) => {
      expect(safeNextPath(value)).toBe("/");
    },
  );
});
