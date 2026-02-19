import { createFileRoute, Link } from "@tanstack/react-router";
import { useVerifyEmail } from "@/features/auth/api";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/verify-email/$token")({
  component: VerifyEmailPage,
});

function VerifyEmailPage() {
  const { token } = Route.useParams();
  const verifyEmail = useVerifyEmail();

  useEffect(() => {
    verifyEmail.mutate({ token });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (verifyEmail.isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-sm text-muted-foreground">
            Verifying your email...
          </p>
        </div>
      </div>
    );
  }

  if (verifyEmail.isError) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-3">
          <h1 className="text-2xl font-bold">Verification failed</h1>
          <p className="text-sm text-muted-foreground">
            This link may be expired or invalid.
          </p>
          <Button asChild>
            <Link to="/">Go to dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-3">
        <h1 className="text-2xl font-bold">Email verified</h1>
        <p className="text-sm text-muted-foreground">
          Your email has been verified successfully.
        </p>
        <Button asChild>
          <Link to="/">Go to dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
