import { z } from "zod";
import { emailSchema } from "@/lib/auth-schemas";

export const addMemberSchema = z.object({ email: emailSchema }, { error: "Email is required" });

export type AddMemberInput = z.infer<typeof addMemberSchema>;
