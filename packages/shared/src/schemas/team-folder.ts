import { z } from "zod";

export const CreateTeamFolderSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(255, "Name must be 255 characters or less"),
  description: z.string().max(1000).optional(),
  memberIds: z.array(z.string()).optional(),
});
export type CreateTeamFolderInput = z.infer<typeof CreateTeamFolderSchema>;

export const UpdateTeamFolderSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(255, "Name must be 255 characters or less")
    .optional(),
  description: z.string().max(1000).nullable().optional(),
});
export type UpdateTeamFolderInput = z.infer<typeof UpdateTeamFolderSchema>;

export const AddTeamFolderMemberSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
});
export type AddTeamFolderMemberInput = z.infer<typeof AddTeamFolderMemberSchema>;
