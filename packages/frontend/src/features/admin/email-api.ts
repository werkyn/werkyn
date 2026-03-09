import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import type { UpdateEmailConfigInput } from "@pm/shared";

export interface EmailConfig {
  id: string;
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromAddress: string;
  createdAt: string;
  updatedAt: string;
}

export function useEmailConfig() {
  return useQuery({
    queryKey: queryKeys.emailConfig,
    queryFn: () =>
      api.get("admin/email/config").json<{ data: EmailConfig }>(),
  });
}

export function useUpdateEmailConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateEmailConfigInput) =>
      api
        .patch("admin/email/config", { json: data })
        .json<{ data: EmailConfig }>(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.emailConfig });
    },
  });
}

export function useSendTestEmail() {
  return useMutation({
    mutationFn: () =>
      api
        .post("admin/email/test")
        .json<{ data: { message: string } }>(),
  });
}
