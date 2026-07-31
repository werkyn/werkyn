import { z } from "zod";

export const UpdateEmailConfigSchema = z.object({
  host: z.string().max(255).optional(),
  port: z.coerce.number().int().min(1).max(65535).optional(),
  secure: z.boolean().optional(),
  user: z.string().max(255).optional(),
  pass: z.string().max(500).optional(),
  fromAddress: z.string().max(255).optional(),
});

export type UpdateEmailConfigInput = z.infer<typeof UpdateEmailConfigSchema>;
