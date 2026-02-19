import { useInfiniteQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { queryClient } from "@/lib/query-client";
import { queryKeys } from "@/lib/query-keys";
import { toast } from "sonner";
import type { CreateCommentInput, UpdateCommentInput } from "@pm/shared";

export interface Comment {
  id: string;
  taskId: string;
  authorId: string | null;
  body: string;
  createdAt: string;
  updatedAt: string;
  author: { id: string; displayName: string; avatarUrl: string | null } | null;
}

interface CommentsPage {
  data: Comment[];
  nextCursor?: string;
}

export function useComments(tid: string) {
  return useInfiniteQuery({
    queryKey: queryKeys.comments(tid),
    queryFn: ({ pageParam }) => {
      const searchParams: Record<string, string> = { limit: "20" };
      if (pageParam) searchParams.cursor = pageParam;
      return api
        .get(`tasks/${tid}/comments`, { searchParams })
        .json<CommentsPage>();
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !!tid,
  });
}

export function useCreateComment(tid: string) {
  return useMutation({
    mutationFn: (data: CreateCommentInput) =>
      api.post(`tasks/${tid}/comments`, { json: data }).json<{ data: Comment }>(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.comments(tid) });
      queryClient.invalidateQueries({ queryKey: queryKeys.activity(tid) });
    },
    onError: () => {
      toast.error("Failed to post comment");
    },
  });
}

export function useUpdateComment(tid: string) {
  return useMutation({
    mutationFn: ({ id, ...data }: UpdateCommentInput & { id: string }) =>
      api.patch(`comments/${id}`, { json: data }).json<{ data: Comment }>(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.comments(tid) });
    },
    onError: () => {
      toast.error("Failed to update comment");
    },
  });
}

export function useDeleteComment(tid: string) {
  return useMutation({
    mutationFn: (commentId: string) => api.delete(`comments/${commentId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.comments(tid) });
      queryClient.invalidateQueries({ queryKey: queryKeys.activity(tid) });
      toast.success("Comment deleted");
    },
  });
}
