import { z } from "zod";

export const PASSWORD_MIN_LENGTH = 8;
// bcrypt ignores bytes past 72, so longer passwords would silently collide.
const PASSWORD_MAX_LENGTH = 72;

const emailSchema = z
  .string({ error: "Email is required" })
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: "Enter a valid email address" }));

export const registerSchema = z.object({
  email: emailSchema,
  name: z.string({ error: "Name is required" }).trim().min(1, { error: "Name is required" }).max(100),
  password: z
    .string({ error: "Password is required" })
    .min(PASSWORD_MIN_LENGTH, { error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters` })
    .max(PASSWORD_MAX_LENGTH, { error: `Password must be at most ${PASSWORD_MAX_LENGTH} characters` }),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string({ error: "Password is required" }).min(1, { error: "Password is required" }),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
