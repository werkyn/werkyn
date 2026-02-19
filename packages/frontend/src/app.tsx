import { useEffect, useState } from "react";
import { RouterProvider } from "@tanstack/react-router";
import { QueryProvider } from "@/components/providers/query-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { router } from "@/lib/router";
import { useAuthStore } from "@/stores/auth-store";

function SplashScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

export default function App() {
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    useAuthStore.getState().hydrate().then(() => setReady(true));
  }, []);

  if (!isHydrated || !ready) {
    return <SplashScreen />;
  }

  return (
    <QueryProvider>
      <ThemeProvider>
        <RouterProvider router={router} />
      </ThemeProvider>
    </QueryProvider>
  );
}
