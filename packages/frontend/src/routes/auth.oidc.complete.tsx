import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { z } from "zod";
import { useAuthStore } from "@/stores/auth-store";

const searchSchema = z.object({
  return_url: z.string().optional(),
});

export const Route = createFileRoute("/auth/oidc/complete")({
  validateSearch: searchSchema,
  component: OidcCompletePage,
});

function OidcCompletePage() {
  const { return_url } = Route.useSearch();
  const navigate = useNavigate();
  const router = useRouter();

  useEffect(() => {
    // The refresh token cookie was set by the backend callback.
    // Call refresh to get the access token + user data.
    useAuthStore
      .getState()
      .refresh()
      .then((success) => {
        if (success) {
          // Force TanStack Router to re-evaluate all beforeLoad hooks
          // so they pick up the freshly-populated auth store.
          router.invalidate();

          // Navigate directly to the workspace if return_url is "/" to
          // avoid a stale-context race through the root redirect chain.
          let target = return_url || "/";
          if (target === "/") {
            const { workspaces } = useAuthStore.getState();
            if (workspaces.length > 0) {
              target = `/${workspaces[0].workspace.slug}`;
            }
          }

          const isSafePath = target.startsWith("/") && !target.startsWith("//");
          navigate({ to: isSafePath ? target : "/" });
        } else {
          navigate({ to: "/login", search: { sso_error: "Failed to complete sign-in" } });
        }
      });
  }, [navigate, return_url, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-3">
        <h1 className="text-lg font-medium">Completing sign-in...</h1>
        <p className="text-sm text-muted-foreground">
          Please wait while we finish setting up your session.
        </p>
      </div>
    </div>
  );
}
