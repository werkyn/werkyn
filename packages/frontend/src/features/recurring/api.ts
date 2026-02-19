import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { queryClient } from "@/lib/query-client";
import { queryKeys } from "@/lib/query-keys";
import { toast } from "sonner";
import type { CreateRecurringInput, UpdateRecurringInput } from "@pm/shared";

export interface RecurringConfig {
  id: string;
  projectId: string;
  templateId: string;
  frequency: "DAILY" | "WEEKLY" | "BIWEEKLY" | "MONTHLY";
  dayOfWeek: number | null;
  dayOfMonth: number | null;
  startDate: string;
  endDate: string | null;
  nextRunDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  template: { id: string; name: string; title: string };
}

export function useRecurringConfigs(pid: string) {
  return useQuery({
    queryKey: queryKeys.recurring(pid),
    queryFn: () =>
      api.get(`projects/${pid}/recurring`).json<{ data: RecurringConfig[] }>(),
    enabled: !!pid,
  });
}

export function useCreateRecurring(pid: string) {
  return useMutation({
    mutationFn: (data: CreateRecurringInput) =>
      api
        .post(`projects/${pid}/recurring`, { json: data })
        .json<{ data: RecurringConfig }>(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recurring(pid) });
      toast.success("Recurring config created");
    },
    onError: () => {
      toast.error("Failed to create recurring config");
    },
  });
}

export function useUpdateRecurring(pid: string) {
  return useMutation({
    mutationFn: ({ id, ...data }: UpdateRecurringInput & { id: string }) =>
      api
        .patch(`projects/${pid}/recurring/${id}`, { json: data })
        .json<{ data: RecurringConfig }>(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recurring(pid) });
    },
    onError: () => {
      toast.error("Failed to update recurring config");
    },
  });
}

export function useDeleteRecurring(pid: string) {
  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`projects/${pid}/recurring/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recurring(pid) });
      toast.success("Recurring config deleted");
    },
    onError: () => {
      toast.error("Failed to delete recurring config");
    },
  });
}
