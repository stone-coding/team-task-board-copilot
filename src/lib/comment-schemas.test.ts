import { describe, expect, it } from "vitest";
import { COMMENT_MAX_LENGTH, createCommentSchema } from "@/lib/comment-schemas";

describe("createCommentSchema", () => {
  it("trims the body", () => {
    expect(createCommentSchema.parse({ body: "  Looks good  " })).toEqual({ body: "Looks good" });
  });

  it("accepts exactly the maximum length", () => {
    expect(COMMENT_MAX_LENGTH).toBe(1000);
    expect(createCommentSchema.safeParse({ body: "a".repeat(1000) }).success).toBe(true);
  });

  it.each([
    ["a missing body", {}, "Comment cannot be empty"],
    ["a blank body", { body: "   " }, "Comment cannot be empty"],
    ["a non-string body", { body: 42 }, "Comment cannot be empty"],
    ["a body over 1000 characters", { body: "a".repeat(1001) }, "Comment must be at most 1000 characters"],
    ["no request body", undefined, "Comment cannot be empty"],
  ])("rejects %s", (_label, input, message) => {
    expect(createCommentSchema.safeParse(input).error?.issues[0]?.message).toBe(message);
  });
});
