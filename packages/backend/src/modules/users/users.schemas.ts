import { z } from "zod";

export { UpdateUserSchema, ChangePasswordSchema } from "@pm/shared";

export const UserIdParamSchema = z.object({
  id: z.string().min(1),
});
export type UserIdParam = z.infer<typeof UserIdParamSchema>;
