import { useEffect } from "react";
import { useRealtimeClient } from "@/components/providers/realtime-provider";
import { queryClient } from "@/lib/query-client";
import { queryKeys } from "@/lib/query-keys";

export function useWorkspaceRealtime(workspaceId: string | undefined) {
  const client = useRealtimeClient();

  useEffect(() => {
    if (!client || !workspaceId) return;

    client.subscribeWorkspace(workspaceId);

    const handler = () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.dashboard(workspaceId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.myTasks(workspaceId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects(workspaceId),
      });
    };

    client.on("task_created", handler);
    client.on("task_updated", handler);
    client.on("task_deleted", handler);
    client.on("task_moved", handler);

    return () => {
      client.unsubscribeWorkspace(workspaceId);
      client.off("task_created", handler);
      client.off("task_updated", handler);
      client.off("task_deleted", handler);
      client.off("task_moved", handler);
    };
  }, [client, workspaceId]);
}
