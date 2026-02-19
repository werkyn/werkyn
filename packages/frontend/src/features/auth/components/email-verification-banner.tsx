import { useAuthStore } from "@/stores/auth-store";
import { useResendVerification } from "../api";
import { Button } from "@/components/ui/button";

export function EmailVerificationBanner() {
  const user = useAuthStore((s) => s.user);
  const resend = useResendVerification();

  if (!user || user.emailVerified) return null;

  return (
    <div className="flex items-center gap-3 border-b bg-amber-50 px-4 py-2 text-sm dark:bg-amber-950/30">
      <span className="text-amber-800 dark:text-amber-200">
        Please verify your email address. Check your inbox for a verification
        link.
      </span>
      <Button
        variant="link"
        size="sm"
        className="ml-auto text-amber-700 dark:text-amber-300"
        onClick={() => resend.mutate()}
        disabled={resend.isPending}
      >
        {resend.isPending ? "Sending..." : "Resend email"}
      </Button>
    </div>
  );
}
