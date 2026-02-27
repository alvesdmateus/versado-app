import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { setAccessToken } from "@/lib/api-client";
import { useAuth } from "@/hooks/useAuth";

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const oauthError = searchParams.get("error");
    if (oauthError) {
      setError("Google sign-in failed. Please try again.");
      setTimeout(() => navigate("/auth/login", { replace: true }), 3000);
      return;
    }

    const hash = window.location.hash.slice(1);
    const params = new URLSearchParams(hash);
    const token = params.get("token");

    if (!token) {
      navigate("/auth/login", { replace: true });
      return;
    }

    loginWithToken(token)
      .then(() => navigate("/", { replace: true }))
      .catch(() => {
        setAccessToken(null);
        navigate("/auth/login?error=oauth_failed", { replace: true });
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50">
        <div className="space-y-1 text-center">
          <p className="text-sm text-error-600">{error}</p>
          <p className="text-xs text-neutral-400">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50">
      <p className="text-sm text-neutral-400">Signing you in...</p>
    </div>
  );
}
