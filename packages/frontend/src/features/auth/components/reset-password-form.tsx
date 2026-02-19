import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ResetPasswordSchema, type ResetPasswordInput } from "@pm/shared";
import { useResetPassword } from "../api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "@tanstack/react-router";
import { ApiError } from "@/lib/api-client";

export function ResetPasswordForm({ token }: { token: string }) {
  const navigate = useNavigate();
  const resetPassword = useResetPassword();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: { password: "" },
  });

  const onSubmit = handleSubmit((data) => {
    resetPassword.mutate(
      { token, password: data.password },
      {
        onSuccess: () => {
          navigate({ to: "/login" });
        },
      },
    );
  });

  if (resetPassword.isSuccess) {
    return (
      <div className="space-y-4 text-center">
        <h2 className="text-lg font-semibold">Password reset</h2>
        <p className="text-sm text-muted-foreground">
          Your password has been reset successfully. You can now log in.
        </p>
        <Link to="/login" className="text-sm text-primary hover:underline">
          Go to login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="password">New Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="At least 8 characters"
          {...register("password")}
        />
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>

      {resetPassword.isError && (
        <p className="text-sm text-destructive">
          {resetPassword.error instanceof ApiError
            ? resetPassword.error.message
            : "Password reset failed"}
        </p>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={resetPassword.isPending}
      >
        {resetPassword.isPending ? "Resetting..." : "Reset password"}
      </Button>
    </form>
  );
}
