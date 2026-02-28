import { createFileRoute } from "@tanstack/react-router";
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center">
          <img
            src="/werkyn_logo.svg"
            alt="Werkyn"
            className="h-8 w-auto dark:brightness-0 dark:invert"
          />
        </div>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-heading">Forgot password</CardTitle>
            <CardDescription>
              Enter your email to receive a reset link
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ForgotPasswordForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
