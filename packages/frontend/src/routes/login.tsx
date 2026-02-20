import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { LoginForm } from "@/features/auth/components/login-form";
import { SsoButtons } from "@/features/auth/components/sso-buttons";
import { useSsoInfo } from "@/features/auth/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const loginSearchSchema = z.object({
  inviteToken: z.string().optional(),
  sso_error: z.string().optional(),
});

export const Route = createFileRoute("/login")({
  validateSearch: loginSearchSchema,
  component: LoginPage,
});

function LoginPage() {
  const { inviteToken, sso_error } = Route.useSearch();
  const { data: ssoInfo } = useSsoInfo();

  const ssoEnabled = ssoInfo?.data.enabled && ssoInfo.data.connectors.length > 0;
  const passwordEnabled = ssoInfo?.data.passwordLoginEnabled ?? true;

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
        <CardContent className="space-y-4">
          {sso_error && (
            <p className="text-sm text-destructive text-center">
              {sso_error}
            </p>
          )}

          {ssoEnabled && (
            <SsoButtons connectors={ssoInfo!.data.connectors} />
          )}

          {ssoEnabled && passwordEnabled && (
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Or continue with email
                </span>
              </div>
            </div>
          )}

          {passwordEnabled ? (
            <LoginForm inviteToken={inviteToken} />
          ) : ssoEnabled ? (
            <p className="text-center text-sm text-muted-foreground">
              Password login is disabled. Use SSO to sign in.
            </p>
          ) : (
            <LoginForm inviteToken={inviteToken} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
