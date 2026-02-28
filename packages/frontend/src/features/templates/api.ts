import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { queryClient } from "@/lib/query-client";
import { queryKeys } from "@/lib/query-keys";
import { toast } from "sonner";
import type { CreateTemplateInput, UpdateTemplateInput, InstantiateTemplateInput } from "@pm/shared";

export interface TaskTemplate {
  id: string;
  projectId: string;
  name: string;
  title: string;
  description: string | null;
  priority: "NONE" | "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  statusId: string | null;
  dueOffset: number | null;
  assigneeIds: string[];
  labelIds: string[];
  subtasks: Array<{ title: string }>;
  createdAt: string;
  updatedAt: string;
}

export function useTemplates(pid: string) {
  return useQuery({
    queryKey: queryKeys.templates(pid),
    queryFn: () =>
      api.get(`projects/${pid}/templates`).json<{ data: TaskTemplate[] }>(),
    enabled: !!pid,
  });
}

export function useCreateTemplate(pid: string) {
  return useMutation({
    mutationFn: (data: CreateTemplateInput) =>
      api
        .post(`projects/${pid}/templates`, { json: data })
        .json<{ data: TaskTemplate }>(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.templates(pid) });
      toast.success("Template created");
    },
    onError: () => {
      toast.error("Failed to create template");
    },
  });
}

export function useUpdateTemplate(pid: string) {
  return useMutation({
    mutationFn: ({ id, ...data }: UpdateTemplateInput & { id: string }) =>
      api
        .patch(`projects/${pid}/templates/${id}`, { json: data })
        .json<{ data: TaskTemplate }>(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.templates(pid) });
      toast.success("Template updated");
    },
    onError: () => {
      toast.error("Failed to update template");
    },
  });
}

export function useDeleteTemplate(pid: string) {
  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`projects/${pid}/templates/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.templates(pid) });
      toast.success("Template deleted");
    },
    onError: () => {
      toast.error("Failed to delete template");
    },
  });
}

export function useCreateTaskFromTemplate(pid: string) {
  return useMutation({
    mutationFn: ({
      templateId,
      ...data
    }: InstantiateTemplateInput & { templateId: string }) =>
      api
        .post(`projects/${pid}/templates/${templateId}/create-task`, { json: data })
        .json(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.tasks(pid),
        exact: false,
      });
      queryClient.invalidateQueries({ queryKey: ["my-tasks"] });
      toast.success("Task created from template");
    },
    onError: () => {
      toast.error("Failed to create task from template");
    },
  });
}
