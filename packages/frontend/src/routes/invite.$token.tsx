import { createFileRoute, Link } from "@tanstack/react-router";
import { useInviteDetails, useAcceptInvite } from "@/features/workspaces/api";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ApiError } from "@/lib/api-client";

export const Route = createFileRoute("/invite/$token")({
  component: InvitePage,
});

function InvitePage() {
  const { token } = Route.useParams();
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, isError, error } = useInviteDetails(token);
  const acceptInvite = useAcceptInvite();

  const invite = data?.data;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-8">
            <div className="space-y-3 animate-pulse">
              <div className="h-6 w-48 bg-muted rounded mx-auto" />
              <div className="h-4 w-32 bg-muted rounded mx-auto" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError) {
    const apiError = error instanceof ApiError ? error : null;
    const isExpired = apiError?.statusCode === 410;

    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">
              {isExpired ? "Invite expired" : "Invalid invite"}
            </CardTitle>
            <CardDescription>
              {isExpired
                ? "This invite link has expired or reached its usage limit."
                : "This invite link is invalid or has been revoked."}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link to="/">
              <Button variant="outline">Go home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invite) return null;

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">
            Join {invite.workspace.name}
          </CardTitle>
          <CardDescription>
            You&apos;ve been invited to join as{" "}
            <span className="font-medium">{invite.role.toLowerCase()}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {user ? (
            <>
              <p className="text-sm text-center text-muted-foreground">
                Signed in as {user.email}
              </p>
              <Button
                className="w-full"
                onClick={() => acceptInvite.mutate(token)}
                disabled={acceptInvite.isPending}
              >
                {acceptInvite.isPending ? "Joining..." : "Accept invite"}
              </Button>
              {acceptInvite.isError && (
                <p className="text-sm text-center text-destructive">
                  {acceptInvite.error instanceof ApiError
                    ? acceptInvite.error.message
                    : "Failed to accept invite"}
                </p>
              )}
            </>
          ) : (
            <div className="space-y-2">
              <Link
                to="/login"
                search={{ inviteToken: token }}
                className="block"
              >
                <Button className="w-full">Log in to accept</Button>
              </Link>
              <Link
                to="/register"
                search={{ inviteToken: token }}
                className="block"
              >
                <Button variant="outline" className="w-full">
                  Create an account
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
