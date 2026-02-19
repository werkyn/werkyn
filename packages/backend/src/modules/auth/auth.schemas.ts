import { z } from "zod";

// Re-export shared schemas for convenience
export {
  LoginSchema,
  RegisterSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
} from "@pm/shared";

// Backend-only param schemas
export const TokenParamSchema = z.object({
  token: z.string().min(1),
});
export type TokenParam = z.infer<typeof TokenParamSchema>;
