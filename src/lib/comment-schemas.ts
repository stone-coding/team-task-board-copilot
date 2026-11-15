import { z } from "zod";

export const COMMENT_MAX_LENGTH = 1000;

const COMMENT_EMPTY = "Comment cannot be empty";

export const createCommentSchema = z.object(
  {
    body: z
      .string({ error: COMMENT_EMPTY })
      .trim()
      .min(1, { error: COMMENT_EMPTY })
      .max(COMMENT_MAX_LENGTH, { error: `Comment must be at most ${COMMENT_MAX_LENGTH} characters` }),
  },
  { error: COMMENT_EMPTY },
);

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
