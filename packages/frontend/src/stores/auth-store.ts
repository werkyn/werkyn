import { create } from "zustand";

interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  jobTitle: string | null;
  phone: string | null;
  timezone: string | null;
  emailVerified: boolean;
}

export interface WorkspaceMembership {
  id: string;
  workspaceId: string;
  role: "ADMIN" | "MEMBER" | "VIEWER";
  workspace: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
  };
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  workspaces: WorkspaceMembership[];
  isHydrated: boolean;
  _refreshPromise: Promise<boolean> | null;

  setAuth: (
    user: User,
    accessToken: string,
    workspaces: WorkspaceMembership[],
  ) => void;
  setWorkspaces: (workspaces: WorkspaceMembership[]) => void;
  logout: () => Promise<void>;
  refresh: () => Promise<boolean>;
  hydrate: () => Promise<void>;
}

// BroadcastChannel for cross-tab sync
const channel =
  typeof BroadcastChannel !== "undefined"
    ? new BroadcastChannel("pm-auth")
    : null;

let lastRefreshTime = 0;

export const useAuthStore = create<AuthState>((set, get) => {
  // Listen for cross-tab messages
  channel?.addEventListener("message", (event) => {
    const { type, data } = event.data;
    if (type === "logout") {
      set({ user: null, accessToken: null, workspaces: [], isHydrated: true });
    } else if (type === "refresh") {
      lastRefreshTime = Date.now();
      set({
        user: data.user,
        accessToken: data.accessToken,
        workspaces: data.workspaces,
      });
    }
  });

  return {
    user: null,
    accessToken: null,
    workspaces: [],
    isHydrated: false,
    _refreshPromise: null,

    setAuth: (user, accessToken, workspaces) => {
      set({ user, accessToken, workspaces });
      channel?.postMessage({
        type: "refresh",
        data: { user, accessToken, workspaces },
      });
    },

    setWorkspaces: (workspaces) => {
      set({ workspaces });
    },

    logout: async () => {
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "include",
          headers: {
            Authorization: `Bearer ${get().accessToken}`,
          },
        });
      } catch {
        // Ignore errors during logout
      }
      set({ user: null, accessToken: null, workspaces: [] });
      channel?.postMessage({ type: "logout" });
    },

    refresh: async () => {
      // If another tab refreshed recently, skip
      if (Date.now() - lastRefreshTime < 5000) {
        return !!get().accessToken;
      }

      // Mutex: reuse existing refresh promise
      const existing = get()._refreshPromise;
      if (existing) return existing;

      const promise = (async () => {
        try {
          const res = await fetch("/api/auth/refresh", {
            method: "POST",
            credentials: "include",
          });

          if (!res.ok) return false;

          const body = await res.json();
          const { user, accessToken, workspaces } = body.data;
          lastRefreshTime = Date.now();
          set({ user, accessToken, workspaces });
          channel?.postMessage({
            type: "refresh",
            data: { user, accessToken, workspaces },
          });
          return true;
        } catch {
          return false;
        } finally {
          set({ _refreshPromise: null });
        }
      })();

      set({ _refreshPromise: promise });
      return promise;
    },

    hydrate: async () => {
      let attempts = 0;
      const maxAttempts = 3;

      while (attempts < maxAttempts) {
        const success = await get().refresh();
        if (success) break;
        attempts++;
        if (attempts < maxAttempts) {
          await new Promise((r) => setTimeout(r, 1000));
        }
      }

      set({ isHydrated: true });
    },
  };
});
