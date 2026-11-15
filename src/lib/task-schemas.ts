import { z } from "zod";
import { TASK_STATUSES } from "@/lib/task-status";

export const TASK_TITLE_MAX_LENGTH = 120;
export const TASK_DESCRIPTION_MAX_LENGTH = 2000;

const TITLE_REQUIRED = "Task title is required";
const NOTHING_TO_UPDATE = "Provide at least one of title, description, or status";

const titleSchema = z
  .string({ error: TITLE_REQUIRED })
  .trim()
  .min(1, { error: TITLE_REQUIRED })
  .max(TASK_TITLE_MAX_LENGTH, { error: `Task title must be at most ${TASK_TITLE_MAX_LENGTH} characters` });

// A blank or null description is stored as "no description".
const descriptionSchema = z
  .string({ error: "Task description must be text" })
  .trim()
  .max(TASK_DESCRIPTION_MAX_LENGTH, {
    error: `Task description must be at most ${TASK_DESCRIPTION_MAX_LENGTH} characters`,
  })
  .nullable()
  .transform((description) => description || null)
  .optional();

const statusSchema = z.enum(TASK_STATUSES, { error: `Status must be one of ${TASK_STATUSES.join(", ")}` });

// New tasks always start in TODO; a status in the body is ignored.
export const createTaskSchema = z.object(
  { title: titleSchema, description: descriptionSchema },
  { error: TITLE_REQUIRED },
);

export const updateTaskSchema = z
  .object(
    { title: titleSchema.optional(), description: descriptionSchema, status: statusSchema.optional() },
    { error: NOTHING_TO_UPDATE },
  )
  .refine((input) => Object.values(input).some((value) => value !== undefined), { error: NOTHING_TO_UPDATE });

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
