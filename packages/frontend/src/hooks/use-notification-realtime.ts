import { useEffect } from "react";
import { useRealtimeClient } from "@/components/providers/realtime-provider";
import { queryClient } from "@/lib/query-client";
import { queryKeys } from "@/lib/query-keys";
import { toast } from "sonner";

export function useNotificationRealtime() {
  const client = useRealtimeClient();

  useEffect(() => {
    if (!client) return;

    const handler = (data: unknown) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
      queryClient.invalidateQueries({
        queryKey: queryKeys.notificationUnreadCount,
      });
      const notification = data as { title?: string } | undefined;
      if (notification?.title) {
        toast(notification.title, { duration: 4000 });
      }
    };

    client.on("notification_new", handler);

    return () => {
      client.off("notification_new", handler);
    };
  }, [client]);
}
