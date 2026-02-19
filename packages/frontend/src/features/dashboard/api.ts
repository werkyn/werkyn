import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

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
