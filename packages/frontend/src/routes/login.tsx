import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { LoginForm } from "@/features/auth/components/login-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const loginSearchSchema = z.object({
  inviteToken: z.string().optional(),
});

export const Route = createFileRoute("/login")({
  validateSearch: loginSearchSchema,
  component: LoginPage,
});

function LoginPage() {
  const { inviteToken } = Route.useSearch();

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <CardDescription>
            {inviteToken
              ? "Sign in to accept your workspace invite"
              : "Sign in to your account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm inviteToken={inviteToken} />
        </CardContent>
      </Card>
    </div>
  );
}
