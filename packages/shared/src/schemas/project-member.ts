import { z } from "zod";

export const AddProjectMemberSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
});
export type AddProjectMemberInput = z.infer<typeof AddProjectMemberSchema>;
