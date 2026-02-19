import { z } from "zod";

export const CreateAttachmentSchema = z.object({
  entityType: z.enum(["task", "comment"]),
  entityId: z.string().min(1, "Entity ID is required"),
});
export type CreateAttachmentInput = z.infer<typeof CreateAttachmentSchema>;

export const AttachmentQuerySchema = z.object({
  entityType: z.enum(["task", "comment"]),
  entityId: z.string().min(1, "Entity ID is required"),
});
export type AttachmentQueryInput = z.infer<typeof AttachmentQuerySchema>;

export const LinkAttachmentSchema = z.object({
  entityType: z.enum(["task", "comment"]),
  entityId: z.string().min(1, "Entity ID is required"),
  fileId: z.string().min(1, "File ID is required"),
});
export type LinkAttachmentInput = z.infer<typeof LinkAttachmentSchema>;
