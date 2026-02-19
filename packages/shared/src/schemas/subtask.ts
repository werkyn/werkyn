import { z } from "zod";

export const CreateSubtaskSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(255, "Title must be 255 characters or less"),
  assigneeId: z.string().optional(),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD format")
    .optional(),
});
export type CreateSubtaskInput = z.infer<typeof CreateSubtaskSchema>;

export const UpdateSubtaskSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  assigneeId: z.string().nullable().optional(),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
});
export type UpdateSubtaskInput = z.infer<typeof UpdateSubtaskSchema>;
