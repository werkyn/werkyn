import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import type { Task } from "@/features/tasks/api";

interface MyTask extends Task {
  project: { id: string; name: string; color: string | null };
}

export function useMyTasks(wid: string) {
  return useQuery({
    queryKey: queryKeys.myTasks(wid),
    queryFn: () =>
      api
        .get(`workspaces/${wid}/my-tasks`)
        .json<{ data: MyTask[] }>(),
    enabled: !!wid,
    staleTime: 0,
    refetchOnMount: "always",
  });
}

export type { MyTask };
