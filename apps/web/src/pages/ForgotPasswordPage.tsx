import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { Mail, ArrowLeft } from "lucide-react";
import { Turnstile } from "@marsidev/react-turnstile";
import { useTranslation, Trans } from "react-i18next";
import { forgotPasswordSchema } from "@versado/validation";
import { Button, Input, Logo } from "@versado/ui";
import { authApi } from "@/lib/auth-api";
import { ApiError } from "@/lib/api-client";

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;

export function ForgotPasswordPage() {
  const { t } = useTranslation("auth");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const result = forgotPasswordSchema.safeParse({ email });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? t("forgotPassword.invalidEmail"));
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      await authApi.forgotPassword(result.data.email, turnstileToken ?? undefined);
      setIsSubmitted(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(t("forgotPassword.genericError"));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSubmitted) {
    return (
      <div className="flex flex-col items-center text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-50">
          <Mail className="h-8 w-8 text-primary-500" />
        </div>
        <h1 className="text-2xl font-bold text-neutral-900">{t("forgotPassword.checkEmail")}</h1>
        <p className="mt-2 text-sm text-neutral-500">
          <Trans
            i18nKey="forgotPassword.checkEmailDescription"
            ns="auth"
            values={{ email }}
            components={{ strong: <strong /> }}
          />
        </p>
        <Link
          to="/auth/login"
          className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary-500 hover:text-primary-600"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("forgotPassword.backToLogin")}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <Logo size="lg" className="mb-4" />

      <h1 className="text-2xl font-bold text-neutral-900">{t("forgotPassword.heading")}</h1>
      <p className="mt-1 text-sm text-neutral-500">
        {t("forgotPassword.subheading")}
      </p>

      <form onSubmit={handleSubmit} className="mt-8 w-full space-y-5">
        <Input
          label={t("forgotPassword.emailLabel")}
          type="email"
          placeholder={t("forgotPassword.emailPlaceholder")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={error}
          autoComplete="email"
        />

        {TURNSTILE_SITE_KEY && (
          <Turnstile
            siteKey={TURNSTILE_SITE_KEY}
            onSuccess={(token) => setTurnstileToken(token)}
            onExpire={() => setTurnstileToken(null)}
          />
        )}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          disabled={isSubmitting}
        >
          {isSubmitting ? t("forgotPassword.sending") : t("forgotPassword.sendResetLink")}
        </Button>
      </form>

      <Link
        to="/auth/login"
        className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary-500 hover:text-primary-600"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("forgotPassword.backToLogin")}
      </Link>
    </div>
  );
}
