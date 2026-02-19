import { createFileRoute } from "@tanstack/react-router";
import { CreateWorkspaceForm } from "@/features/onboarding/components/create-workspace-form";
import { JoinWorkspaceForm } from "@/features/onboarding/components/join-workspace-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const Route = createFileRoute("/_authed/onboarding")({
  component: OnboardingPage,
});

function OnboardingPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Welcome!</CardTitle>
            <CardDescription>
              Create your first workspace to get started.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CreateWorkspaceForm />
          </CardContent>
        </Card>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">or</span>
          </div>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-lg">Join a workspace</CardTitle>
            <CardDescription>
              Have an invite link? Paste it below to join an existing workspace.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <JoinWorkspaceForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
