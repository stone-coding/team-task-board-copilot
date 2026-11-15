import { describe, expect, it } from "vitest";
import { addMemberSchema } from "@/lib/member-schemas";

describe("addMemberSchema", () => {
  it("trims and lowercases the email", () => {
    expect(addMemberSchema.parse({ email: "  Bob@Example.COM " })).toEqual({ email: "bob@example.com" });
  });

  it.each([
    ["a missing email", {}, "Email is required"],
    ["a malformed email", { email: "not-an-email" }, "Enter a valid email address"],
    ["no body", undefined, "Email is required"],
  ])("rejects %s", (_label, body, message) => {
    expect(addMemberSchema.safeParse(body).error?.issues[0]?.message).toBe(message);
  });
});
