import { createFileRoute, useNavigate } from "@tanstack/react-router";
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

  useEffect(() => {
    // The refresh token cookie was set by the backend callback.
    // Call refresh to get the access token + user data.
    useAuthStore
      .getState()
      .refresh()
      .then((success) => {
        if (success) {
          // Navigate to the return URL or home
          const target = return_url || "/";
          if (target.startsWith("/")) {
            navigate({ to: target });
          } else {
            navigate({ to: "/" });
          }
        } else {
          navigate({ to: "/login", search: { sso_error: "Failed to complete sign-in" } });
        }
      });
  }, [navigate, return_url]);

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
