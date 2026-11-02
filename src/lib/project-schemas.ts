import { z } from "zod";

export const PROJECT_NAME_MAX_LENGTH = 80;

const NAME_REQUIRED = "Project name is required";

export const createProjectSchema = z.object(
  {
    name: z
      .string({ error: NAME_REQUIRED })
      .trim()
      .min(1, { error: NAME_REQUIRED })
      .max(PROJECT_NAME_MAX_LENGTH, { error: `Project name must be at most ${PROJECT_NAME_MAX_LENGTH} characters` }),
  },
  { error: NAME_REQUIRED },
);

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
