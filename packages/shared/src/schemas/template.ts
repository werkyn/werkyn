import { z } from "zod";

export const CreateTemplateSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  statusId: z.string().optional(),
  dueOffset: z.number().int().min(0).optional(),
  assigneeIds: z.array(z.string()).default([]),
  labelIds: z.array(z.string()).default([]),
  subtasks: z.array(z.object({ title: z.string().min(1).max(255) })).default([]),
});
export type CreateTemplateInput = z.infer<typeof CreateTemplateSchema>;

export const UpdateTemplateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  title: z.string().min(1).max(255).optional(),
  description: z.string().nullable().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  statusId: z.string().nullable().optional(),
  dueOffset: z.number().int().min(0).nullable().optional(),
  assigneeIds: z.array(z.string()).optional(),
  labelIds: z.array(z.string()).optional(),
  subtasks: z.array(z.object({ title: z.string().min(1).max(255) })).optional(),
});
export type UpdateTemplateInput = z.infer<typeof UpdateTemplateSchema>;

export const InstantiateTemplateSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  statusId: z.string().optional(),
  assigneeIds: z.array(z.string()).optional(),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD format")
    .optional(),
});
export type InstantiateTemplateInput = z.infer<typeof InstantiateTemplateSchema>;
