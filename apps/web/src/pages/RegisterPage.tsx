import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { Eye, EyeOff } from "lucide-react";
import { Turnstile } from "@marsidev/react-turnstile";
import { useTranslation, Trans } from "react-i18next";
import { registerSchema } from "@versado/validation";
import { Button, Input, Logo, Divider, SocialButton } from "@versado/ui";
import { useAuth } from "@/hooks/useAuth";
import { ApiError } from "@/lib/api-client";
import { authApi } from "@/lib/auth-api";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z"
        fill="#EA4335"
      />
    </svg>
  );
}

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;

interface FormErrors {
  displayName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

export function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { t } = useTranslation("auth");

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  async function handleGoogleSignIn() {
    setIsGoogleLoading(true);
    try {
      const { url } = await authApi.getGoogleAuthUrl();
      window.location.href = url;
    } catch {
      setErrors({ general: t("register.googleUnavailable") });
      setIsGoogleLoading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const result = registerSchema.safeParse({ email, password, displayName });
    if (!result.success) {
      const fieldErrors: FormErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof FormErrors;
        if (!fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    if (password !== confirmPassword) {
      setErrors({ confirmPassword: t("register.passwordsMismatch") });
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      await register(result.data.email, result.data.password, result.data.displayName, turnstileToken ?? undefined);
      navigate("/onboarding");
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors({ general: err.message });
      } else {
        setErrors({ general: t("register.genericError") });
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col items-center">
      <Logo size="lg" className="mb-4" />

      <h1 className="text-2xl font-bold text-neutral-900">{t("register.heading")}</h1>
      <p className="mt-1 text-sm text-neutral-500">
        {t("register.subheading")}
      </p>

      {errors.general && (
        <div className="mt-4 w-full rounded-lg bg-error-50 px-4 py-3 text-sm text-error-600">
          {errors.general}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 w-full space-y-5">
        <Input
          label={t("register.displayNameLabel")}
          type="text"
          placeholder={t("register.displayNamePlaceholder")}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          error={errors.displayName}
          autoComplete="name"
        />

        <Input
          label={t("register.emailLabel")}
          type="email"
          placeholder={t("register.emailPlaceholder")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          autoComplete="email"
        />

        <Input
          label={t("register.passwordLabel")}
          type={showPassword ? "text" : "password"}
          placeholder={t("register.passwordPlaceholder")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          autoComplete="new-password"
          rightElement={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-neutral-400 hover:text-neutral-600 transition-colors"
              tabIndex={-1}
              aria-label={showPassword ? t("login.hidePassword") : t("login.showPassword")}
            >
              {showPassword ? (
                <EyeOff className="h-4.5 w-4.5" />
              ) : (
                <Eye className="h-4.5 w-4.5" />
              )}
            </button>
          }
        />

        <Input
          label={t("register.confirmPasswordLabel")}
          type={showPassword ? "text" : "password"}
          placeholder={t("register.confirmPasswordPlaceholder")}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={errors.confirmPassword}
          autoComplete="new-password"
        />

        {TURNSTILE_SITE_KEY && (
          <Turnstile
            siteKey={TURNSTILE_SITE_KEY}
            onSuccess={(token) => setTurnstileToken(token)}
            onExpire={() => setTurnstileToken(null)}
          />
        )}

        <p className="text-xs text-center text-neutral-400">
          <Trans
            i18nKey="register.termsAgreement"
            ns="auth"
            components={{
              terms: <Link to="/terms" className="text-primary-500 hover:text-primary-600 underline" />,
              privacy: <Link to="/privacy" className="text-primary-500 hover:text-primary-600 underline" />,
            }}
          />
        </p>

        <Button type="submit" variant="primary" size="lg" fullWidth disabled={isSubmitting}>
          {isSubmitting ? t("register.creatingAccount") : t("register.createAccount")}
        </Button>
      </form>

      <Divider label={t("register.orContinueWith")} className="my-6 w-full" />
      <SocialButton
        icon={<GoogleIcon />}
        onClick={handleGoogleSignIn}
        disabled={isGoogleLoading || isSubmitting}
      >
        {isGoogleLoading ? t("register.redirecting") : t("register.signUpGoogle")}
      </SocialButton>

      <div className="self-stretch -mx-8 -mb-8 mt-8 rounded-b-2xl border-t border-neutral-200 bg-neutral-50 px-8 py-5 text-center">
        <p className="text-sm text-neutral-500">
          {t("register.alreadyHaveAccount")}{" "}
          <Link
            to="/auth/login"
            className="font-medium text-primary-500 hover:text-primary-600"
          >
            {t("register.signIn")}
          </Link>
        </p>
      </div>
    </div>
  );
}
