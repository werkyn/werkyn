import { z } from "zod";

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type PaginationInput = z.infer<typeof PaginationSchema>;

export const IdParamSchema = z.object({
  id: z.string().min(1),
});
export type IdParam = z.infer<typeof IdParamSchema>;

export const SearchSchema = z.object({
  search: z.string().optional(),
});
export type SearchInput = z.infer<typeof SearchSchema>;

export const WorkspaceSearchSchema = z.object({
  q: z.string().min(1).max(200),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
export type WorkspaceSearchInput = z.infer<typeof WorkspaceSearchSchema>;
