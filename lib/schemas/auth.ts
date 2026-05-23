import { z } from "zod";

// The backend accepts email, phone, or username in one `identifier` field.
export const loginSchema = z.object({
  identifier: z.string().min(1, "Enter your email, phone, or username"),
  password: z.string().min(1, "Password is required"),
});
export type LoginInput = z.infer<typeof loginSchema>;
