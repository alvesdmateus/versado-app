import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { Eye, EyeOff } from "lucide-react";
import { loginSchema } from "@flashcard/validation";
import { Button, Input, Logo, Divider, SocialButton } from "@flashcard/ui";
import { useAuth } from "@/hooks/useAuth";
import { ApiError } from "@/lib/api-client";

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

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
      <path d="M14.94 9.88c-.02-2.05 1.67-3.03 1.75-3.08-0.95-1.39-2.43-1.58-2.96-1.6-1.26-.13-2.46.74-3.1.74-.64 0-1.62-.72-2.67-.7-1.37.02-2.64.8-3.34 2.03-1.43 2.47-.36 6.14 1.02 8.15.68.98 1.49 2.09 2.55 2.05 1.02-.04 1.41-.66 2.65-.66 1.23 0 1.58.66 2.65.64 1.1-.02 1.8-.99 2.47-1.98.78-1.14 1.1-2.24 1.12-2.3-.02-.01-2.14-.82-2.16-3.27l.02-.02ZM12.94 3.49c.56-.68.94-1.63.84-2.58-.81.03-1.79.54-2.37 1.22-.52.6-.98 1.56-.85 2.48.9.07 1.82-.46 2.38-1.12Z" />
    </svg>
  );
}

interface FormErrors {
  email?: string;
  password?: string;
}

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const result = loginSchema.safeParse({ email, password });
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

    setErrors({});
    setIsSubmitting(true);

    try {
      await login(result.data.email, result.data.password);
      navigate("/");
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors({ email: err.message });
      } else {
        setErrors({ email: "Something went wrong. Please try again." });
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col items-center">
      {/* Logo */}
      <Logo size="lg" className="mb-4" />

      {/* Heading */}
      <h1 className="text-2xl font-bold text-neutral-900">Welcome Back</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Log in to your premium learning dashboard
      </p>

      {/* Form */}
      <form onSubmit={handleSubmit} className="mt-8 w-full space-y-5">
        <Input
          label="Email Address"
          type="email"
          placeholder="name@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          autoComplete="email"
        />

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-neutral-700"
            >
              Password
            </label>
            <Link
              to="/auth/forgot-password"
              className="text-sm font-medium text-primary-500 hover:text-primary-600"
            >
              Forgot?
            </Link>
          </div>
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            autoComplete="current-password"
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-neutral-400 hover:text-neutral-600 transition-colors"
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4.5 w-4.5" />
                ) : (
                  <Eye className="h-4.5 w-4.5" />
                )}
              </button>
            }
          />
        </div>

        <Button type="submit" variant="primary" size="lg" fullWidth disabled={isSubmitting}>
          {isSubmitting ? "Signing In..." : "Sign In"}
        </Button>
      </form>

      {/* Divider */}
      <Divider label="Or continue with" className="my-6 w-full" />

      {/* Social Buttons */}
      <div className="grid w-full grid-cols-2 gap-3">
        <SocialButton icon={<GoogleIcon />}>Google</SocialButton>
        <SocialButton icon={<AppleIcon />}>Apple</SocialButton>
      </div>

      {/* Register footer */}
      <div className="self-stretch -mx-8 -mb-8 mt-8 rounded-b-2xl border-t border-neutral-200 bg-neutral-50 px-8 py-5 text-center">
        <p className="text-sm text-neutral-500">
          Don't have an account?{" "}
          <Link
            to="/auth/register"
            className="font-medium text-primary-500 hover:text-primary-600"
          >
            Create Account
          </Link>
        </p>
      </div>
    </div>
  );
}
