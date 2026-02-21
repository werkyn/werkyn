type EventHandler = (data: unknown) => void;

interface WebSocketClientOptions {
  url: string;
  getToken: () => string | null;
  onReconnect?: () => void;
}

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private getToken: () => string | null;
  private onReconnect?: () => void;
  private handlers = new Map<string, Set<EventHandler>>();
  private reconnectAttempts = 0;
  private maxReconnectDelay = 30_000;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private subscriptions = new Set<string>();
  private workspaceSubscriptions = new Set<string>();
  private channelSubscriptions = new Set<string>();
  private connected = false;
  private destroyed = false;

  constructor(options: WebSocketClientOptions) {
    this.url = options.url;
    this.getToken = options.getToken;
    this.onReconnect = options.onReconnect;

    // Reconnect on tab focus
    this.handleVisibility = this.handleVisibility.bind(this);
    document.addEventListener("visibilitychange", this.handleVisibility);
  }

  connect(): void {
    if (this.destroyed || this.ws) return;

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        const token = this.getToken();
        if (token) {
          this.ws?.send(JSON.stringify({ type: "auth", token }));
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.event === "authenticated") {
            this.connected = true;
            this.reconnectAttempts = 0;
            // Re-subscribe to all channels
            for (const projectId of this.subscriptions) {
              this.ws?.send(JSON.stringify({ type: "subscribe", projectId }));
            }
            for (const workspaceId of this.workspaceSubscriptions) {
              this.ws?.send(JSON.stringify({ type: "subscribe_workspace", workspaceId }));
            }
            for (const channelId of this.channelSubscriptions) {
              this.ws?.send(JSON.stringify({ type: "subscribe_channel", channelId }));
            }
            return;
          }

          if (msg.event === "pong") return;

          // Dispatch to handlers
          const eventHandlers = this.handlers.get(msg.event);
          if (eventHandlers) {
            for (const handler of eventHandlers) {
              handler(msg);
            }
          }

          // Also dispatch to wildcard handlers
          const wildcardHandlers = this.handlers.get("*");
          if (wildcardHandlers) {
            for (const handler of wildcardHandlers) {
              handler(msg);
            }
          }
        } catch {
          // Ignore parse errors
        }
      };

      this.ws.onclose = () => {
        this.ws = null;
        this.connected = false;
        if (!this.destroyed) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = () => {
        // onclose will be called after onerror
      };
    } catch {
      this.scheduleReconnect();
    }
  }

  disconnect(): void {
    this.destroyed = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connected = false;
    this.handlers.clear();
    this.subscriptions.clear();
    this.workspaceSubscriptions.clear();
    this.channelSubscriptions.clear();
    document.removeEventListener("visibilitychange", this.handleVisibility);
  }

  subscribe(projectId: string): void {
    this.subscriptions.add(projectId);
    if (this.connected && this.ws) {
      this.ws.send(JSON.stringify({ type: "subscribe", projectId }));
    }
  }

  unsubscribe(projectId: string): void {
    this.subscriptions.delete(projectId);
    if (this.connected && this.ws) {
      this.ws.send(JSON.stringify({ type: "unsubscribe", projectId }));
    }
  }

  subscribeWorkspace(workspaceId: string): void {
    this.workspaceSubscriptions.add(workspaceId);
    if (this.connected && this.ws) {
      this.ws.send(JSON.stringify({ type: "subscribe_workspace", workspaceId }));
    }
  }

  unsubscribeWorkspace(workspaceId: string): void {
    this.workspaceSubscriptions.delete(workspaceId);
    if (this.connected && this.ws) {
      this.ws.send(JSON.stringify({ type: "unsubscribe_workspace", workspaceId }));
    }
  }

  subscribeChannel(channelId: string): void {
    this.channelSubscriptions.add(channelId);
    if (this.connected && this.ws) {
      this.ws.send(JSON.stringify({ type: "subscribe_channel", channelId }));
    }
  }

  unsubscribeChannel(channelId: string): void {
    this.channelSubscriptions.delete(channelId);
    if (this.connected && this.ws) {
      this.ws.send(JSON.stringify({ type: "unsubscribe_channel", channelId }));
    }
  }

  on(event: string, handler: EventHandler): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);
  }

  off(event: string, handler: EventHandler): void {
    this.handlers.get(event)?.delete(handler);
  }

  private scheduleReconnect(): void {
    if (this.destroyed || this.reconnectTimer) return;

    const delay = Math.min(
      1000 * Math.pow(2, this.reconnectAttempts),
      this.maxReconnectDelay,
    );
    this.reconnectAttempts++;

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
      this.onReconnect?.();
    }, delay);
  }

  private handleVisibility(): void {
    if (document.visibilityState === "visible" && !this.connected && !this.destroyed) {
      // Clear existing reconnect timer and reconnect immediately
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
      this.reconnectAttempts = 0;
      this.connect();
      this.onReconnect?.();
    }
  }
}
