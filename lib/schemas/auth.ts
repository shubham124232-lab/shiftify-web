import { z } from "zod";

// The backend accepts email, phone, or username in one `identifier` field.
export const loginSchema = z.object({
  identifier: z.string().min(1, "Enter your email, phone, or username"),
  password: z.string().min(1, "Password is required"),
});
export type LoginInput = z.infer<typeof loginSchema>;

// Self-registration — at least one of email / phone / username required.
export const registerSchema = z
  .object({
    name:     z.string().min(2, "Full name must be at least 2 characters"),
    email:    z.string().email("Enter a valid email address").or(z.literal("")).optional(),
    phone:    z
      .string()
      .regex(/^\+?[0-9]{5,20}$/, "Enter a valid phone number (digits, optional + prefix)")
      .or(z.literal(""))
      .optional(),
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(40)
      .regex(/^[a-zA-Z0-9._-]+$/, "Letters, numbers, dot, dash, underscore only")
      .or(z.literal(""))
      .optional(),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((d) => Boolean(d.email || d.phone || d.username), {
    message: "Provide at least one of email, phone, or username",
    path: ["email"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;
