import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Logo } from "@versado/ui";
import { authApi } from "@/lib/auth-api";
import { useAuth } from "@/hooks/useAuth";

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const { refreshUser } = useAuth();

  const [status, setStatus] = useState<"verifying" | "success" | "error">(
    token ? "verifying" : "error"
  );
  const [errorMessage, setErrorMessage] = useState(
    token ? "" : "No verification token provided."
  );

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    async function verify() {
      try {
        await authApi.verifyEmail(token!);
        if (!cancelled) {
          setStatus("success");
          refreshUser().catch(() => {});
        }
      } catch {
        if (!cancelled) {
          setStatus("error");
          setErrorMessage(
            "This verification link is invalid or has expired."
          );
        }
      }
    }

    verify();
    return () => {
      cancelled = true;
    };
  }, [token, refreshUser]);

  return (
    <div className="flex flex-col items-center text-center">
      <Logo size="lg" className="mb-4" />

      {status === "verifying" && (
        <>
          <Loader2 className="mb-4 h-10 w-10 animate-spin text-primary-500" />
          <h1 className="text-2xl font-bold text-neutral-900">
            Verifying Email...
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            Please wait while we verify your email address.
          </p>
        </>
      )}

      {status === "success" && (
        <>
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success-50">
            <CheckCircle className="h-8 w-8 text-success-500" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900">
            Email Verified!
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            Your email has been verified successfully.
          </p>
          <Link
            to="/"
            className="mt-6 text-sm font-medium text-primary-500 hover:text-primary-600"
          >
            Continue to App
          </Link>
        </>
      )}

      {status === "error" && (
        <>
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-error-50">
            <XCircle className="h-8 w-8 text-error-500" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900">
            Verification Failed
          </h1>
          <p className="mt-2 text-sm text-neutral-500">{errorMessage}</p>
          <Link
            to="/auth/login"
            className="mt-6 text-sm font-medium text-primary-500 hover:text-primary-600"
          >
            Go to Login
          </Link>
        </>
      )}
    </div>
  );
}
