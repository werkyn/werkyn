import { useInfiniteQuery, useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { queryClient } from "@/lib/query-client";
import { queryKeys } from "@/lib/query-keys";
import { toast } from "sonner";
import type { UpdateNotificationPreferenceInput } from "@pm/shared";

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string | null;
  read: boolean;
  data: Record<string, unknown> | null;
  createdAt: string;
}

export interface NotificationPreference {
  id: string;
  userId: string;
  taskAssigned: boolean;
  taskStatusChanged: boolean;
  taskDueSoon: boolean;
  commentAdded: boolean;
  commentMention: boolean;
  dueDateReminderTiming: string;
  pushEnabled: boolean;
}

interface NotificationsPage {
  data: Notification[];
  nextCursor?: string;
}

export function useNotifications() {
  return useInfiniteQuery({
    queryKey: queryKeys.notifications,
    queryFn: ({ pageParam }) => {
      const searchParams: Record<string, string> = { limit: "20" };
      if (pageParam) searchParams.cursor = pageParam;
      return api
        .get("notifications", { searchParams })
        .json<NotificationsPage>();
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: queryKeys.notificationUnreadCount,
    queryFn: () =>
      api.get("notifications/unread-count").json<{ count: number }>(),
    refetchInterval: 60_000,
  });
}

export function useNotificationPreference() {
  return useQuery({
    queryKey: queryKeys.notificationPreferences,
    queryFn: () =>
      api
        .get("notifications/preferences")
        .json<{ data: NotificationPreference }>(),
    select: (res) => res.data,
  });
}

export function useMarkNotificationsRead() {
  return useMutation({
    mutationFn: (notificationIds: string[]) =>
      api
        .post("notifications/mark-read", { json: { notificationIds } })
        .json(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
      queryClient.invalidateQueries({
        queryKey: queryKeys.notificationUnreadCount,
      });
    },
  });
}

export function useMarkAllRead() {
  return useMutation({
    mutationFn: () => api.post("notifications/mark-all-read").json(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
      queryClient.invalidateQueries({
        queryKey: queryKeys.notificationUnreadCount,
      });
    },
  });
}

export function useUpdateNotificationPreference() {
  return useMutation({
    mutationFn: (data: UpdateNotificationPreferenceInput) =>
      api
        .patch("notifications/preferences", { json: data })
        .json<{ data: NotificationPreference }>(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.notificationPreferences,
      });
      toast.success("Preference updated");
    },
    onError: () => {
      toast.error("Failed to update preference");
    },
  });
}
