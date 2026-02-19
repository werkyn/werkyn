import { z } from "zod";

export const WorkspaceRoleEnum = z.enum(["ADMIN", "MEMBER", "VIEWER"]);

export const AddWorkspaceMemberSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: WorkspaceRoleEnum.default("MEMBER"),
});
export type AddWorkspaceMemberInput = z.infer<typeof AddWorkspaceMemberSchema>;

export const UpdateWorkspaceMemberSchema = z.object({
  role: WorkspaceRoleEnum,
});
export type UpdateWorkspaceMemberInput = z.infer<
  typeof UpdateWorkspaceMemberSchema
>;
