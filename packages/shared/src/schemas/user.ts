import { z } from "zod";

export const UpdateUserSchema = z.object({
  displayName: z
    .string()
    .min(1, "Display name is required")
    .max(100, "Display name must be 100 characters or less")
    .optional(),
  avatarUrl: z.string().min(1).nullable().optional(),
  jobTitle: z.string().max(100).nullable().optional(),
  phone: z.string().max(30).nullable().optional(),
  timezone: z.string().max(50).nullable().optional(),
});
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
