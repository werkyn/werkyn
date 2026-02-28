import { createFileRoute } from "@tanstack/react-router";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const Route = createFileRoute("/reset-password/$token")({
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { token } = Route.useParams();

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex justify-center">
          <img
            src="/werkyn_logo.svg"
            alt="Werkyn"
            className="h-10 w-auto dark:brightness-0 dark:invert"
          />
        </div>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-heading">Reset password</CardTitle>
            <CardDescription>Enter your new password</CardDescription>
          </CardHeader>
          <CardContent>
            <ResetPasswordForm token={token} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
