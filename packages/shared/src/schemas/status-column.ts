import { z } from "zod";

export const CreateStatusColumnSchema = z.object({
  name: z
    .string()
    .min(1, "Status name is required")
    .max(100, "Status name must be 100 characters or less"),
  color: z.string().optional(),
  isCompletion: z.boolean().default(false),
});
export type CreateStatusColumnInput = z.infer<typeof CreateStatusColumnSchema>;

export const UpdateStatusColumnSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  color: z.string().optional(),
  isCompletion: z.boolean().optional(),
});
export type UpdateStatusColumnInput = z.infer<typeof UpdateStatusColumnSchema>;

export const ReorderSchema = z.object({
  orderedIds: z.array(z.string().min(1)).min(1),
});
export type ReorderInput = z.infer<typeof ReorderSchema>;
