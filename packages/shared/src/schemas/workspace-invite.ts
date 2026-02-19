import { z } from "zod";
import { WorkspaceRoleEnum } from "./workspace-member.js";

export const CreateInviteSchema = z.object({
  email: z.string().email("Invalid email address").optional(),
  role: WorkspaceRoleEnum.default("MEMBER"),
  expiresAt: z.string().datetime().optional(),
  maxUses: z.number().int().min(1).nullable().optional(),
});
export type CreateInviteInput = z.infer<typeof CreateInviteSchema>;
