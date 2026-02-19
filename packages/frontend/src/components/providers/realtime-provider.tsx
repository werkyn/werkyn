import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { WebSocketClient } from "@/lib/websocket-client";
import { useAuthStore } from "@/stores/auth-store";
import { queryClient } from "@/lib/query-client";

const RealtimeContext = createContext<WebSocketClient | null>(null);

export function useRealtimeClient(): WebSocketClient | null {
  return useContext(RealtimeContext);
}

interface RealtimeProviderProps {
  children: ReactNode;
}

function getWsUrl(): string {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = window.location.host;
  const basePath = import.meta.env.VITE_API_BASE_URL || "/api";

  // If basePath is a full URL, extract host
  if (basePath.startsWith("http")) {
    const url = new URL(basePath);
    return `${url.protocol === "https:" ? "wss:" : "ws:"}//${url.host}${url.pathname}/ws`;
  }

  return `${protocol}//${host}${basePath}/ws`;
}

export function RealtimeProvider({ children }: RealtimeProviderProps) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [client, setClient] = useState<WebSocketClient | null>(null);

  useEffect(() => {
    if (!accessToken) {
      setClient((prev) => {
        prev?.disconnect();
        return null;
      });
      return;
    }

    const wsClient = new WebSocketClient({
      url: getWsUrl(),
      getToken: () => useAuthStore.getState().accessToken,
      onReconnect: () => {
        // Invalidate all queries to catch missed events
        queryClient.invalidateQueries();
      },
    });

    setClient(wsClient);
    wsClient.connect();

    return () => {
      wsClient.disconnect();
      setClient(null);
    };
  }, [accessToken]);

  return (
    <RealtimeContext.Provider value={client}>
      {children}
    </RealtimeContext.Provider>
  );
}
