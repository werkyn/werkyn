import { z } from "zod";

export const ActivityLogQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type ActivityLogQueryInput = z.infer<typeof ActivityLogQuerySchema>;
