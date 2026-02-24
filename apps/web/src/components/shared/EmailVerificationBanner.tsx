import { useState } from "react";
import { Mail, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/contexts/ToastContext";
import { authApi } from "@/lib/auth-api";

export function EmailVerificationBanner() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [dismissed, setDismissed] = useState(false);
  const [resending, setResending] = useState(false);

  if (!user || user.emailVerified || dismissed) return null;

  async function handleResend() {
    setResending(true);
    try {
      await authApi.resendVerification(user!.email);
      showToast("Verification email sent!");
    } catch {
      showToast("Failed to send email", "error");
    } finally {
      setResending(false);
    }
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-3 bg-amber-50 px-4 py-2.5 text-sm text-amber-800 border-b border-amber-200"
    >
      <Mail className="h-4 w-4 shrink-0" />
      <span className="flex-1">
        Please verify your email address.
      </span>
      <button
        onClick={handleResend}
        disabled={resending}
        className="shrink-0 font-medium text-amber-700 hover:text-amber-900 disabled:opacity-50"
      >
        {resending ? "Sending..." : "Resend"}
      </button>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss verification banner"
        className="shrink-0 rounded p-0.5 text-amber-400 hover:text-amber-600"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
