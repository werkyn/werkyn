import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import type { Notification } from "@/features/notifications/api";

export interface DashboardProject {
  id: string;
  name: string;
  color: string | null;
  archived: boolean;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
}

export function useDashboard(wid: string) {
  return useQuery({
    queryKey: queryKeys.dashboard(wid),
    queryFn: () =>
      api
        .get(`workspaces/${wid}/dashboard`)
        .json<{ data: DashboardProject[] }>(),
    enabled: !!wid,
  });
}

// ─── Workspace Activity ────────────────────────────────

export interface WorkspaceActivityEntry {
  id: string;
  taskId: string;
  action: string;
  details: Record<string, unknown> | null;
  createdAt: string;
  actor: { id: string; displayName: string; avatarUrl: string | null } | null;
  task: {
    id: string;
    title: string;
    project: { id: string; name: string; color: string | null };
  };
}

export function useWorkspaceActivity(wid: string) {
  return useQuery({
    queryKey: queryKeys.workspaceActivity(wid),
    queryFn: () =>
      api
        .get(`workspaces/${wid}/activity`, {
          searchParams: { limit: "30" },
        })
        .json<{
          data: WorkspaceActivityEntry[];
          pagination: { page: number; limit: number; total: number; totalPages: number };
        }>(),
    enabled: !!wid,
  });
}

// ─── Mention Notifications ────────────────────────────

export function useMentionNotifications() {
  return useQuery({
    queryKey: queryKeys.mentionNotifications,
    queryFn: () =>
      api
        .get("notifications", {
          searchParams: {
            type: "CHAT_MENTION,COMMENT_MENTION",
            limit: "10",
          },
        })
        .json<{ data: Notification[]; nextCursor?: string }>(),
    select: (res) => res.data,
  });
}
