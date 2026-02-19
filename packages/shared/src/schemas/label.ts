import { z } from "zod";

export const CreateLabelSchema = z.object({
  name: z
    .string()
    .min(1, "Label name is required")
    .max(100, "Label name must be 100 characters or less"),
  color: z.string().min(1, "Color is required"),
});
export type CreateLabelInput = z.infer<typeof CreateLabelSchema>;

export const UpdateLabelSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  color: z.string().optional(),
});
export type UpdateLabelInput = z.infer<typeof UpdateLabelSchema>;
