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
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Reset password</CardTitle>
          <CardDescription>Enter your new password</CardDescription>
        </CardHeader>
        <CardContent>
          <ResetPasswordForm token={token} />
        </CardContent>
      </Card>
    </div>
  );
}
