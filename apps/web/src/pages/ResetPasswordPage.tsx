import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router";
import { Eye, EyeOff, CheckCircle, ArrowLeft } from "lucide-react";
import { resetPasswordSchema } from "@versado/validation";
import { Button, Input, Logo } from "@versado/ui";
import { authApi } from "@/lib/auth-api";
import { ApiError } from "@/lib/api-client";

interface FormErrors {
  newPassword?: string;
  confirmPassword?: string;
}

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [generalError, setGeneralError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!token) {
    return (
      <div className="flex flex-col items-center text-center">
        <Logo size="lg" className="mb-4" />
        <h1 className="text-2xl font-bold text-neutral-900">Invalid Link</h1>
        <p className="mt-2 text-sm text-neutral-500">
          This password reset link is invalid or has expired.
        </p>
        <Link
          to="/auth/forgot-password"
          className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary-500 hover:text-primary-600"
        >
          Request a new reset link
        </Link>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success-50">
          <CheckCircle className="h-8 w-8 text-success-500" />
        </div>
        <h1 className="text-2xl font-bold text-neutral-900">Password Reset!</h1>
        <p className="mt-2 text-sm text-neutral-500">
          Your password has been updated successfully. You can now log in with
          your new password.
        </p>
        <Link
          to="/auth/login"
          className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary-500 hover:text-primary-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Go to Login
        </Link>
      </div>
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const result = resetPasswordSchema.safeParse({
      token,
      newPassword,
      confirmPassword,
    });
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
    setGeneralError("");
    setIsSubmitting(true);

    try {
      await authApi.resetPassword(token!, newPassword, confirmPassword);
      setIsSuccess(true);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === "INVALID_RESET_TOKEN") {
          setGeneralError(
            "This reset link has expired. Please request a new one."
          );
        } else {
          setGeneralError(err.message);
        }
      } else {
        setGeneralError("Something went wrong. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col items-center">
      <Logo size="lg" className="mb-4" />

      <h1 className="text-2xl font-bold text-neutral-900">Set New Password</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Enter your new password below
      </p>

      <form onSubmit={handleSubmit} className="mt-8 w-full space-y-5">
        {generalError && (
          <div className="rounded-lg bg-error-50 px-4 py-3 text-sm text-error-700">
            {generalError}
          </div>
        )}

        <Input
          label="New Password"
          type={showPassword ? "text" : "password"}
          placeholder="Enter new password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          error={errors.newPassword}
          autoComplete="new-password"
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

        <Input
          label="Confirm Password"
          type={showPassword ? "text" : "password"}
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={errors.confirmPassword}
          autoComplete="new-password"
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          disabled={isSubmitting}
        >
          {isSubmitting ? "Resetting..." : "Reset Password"}
        </Button>
      </form>

      <Link
        to="/auth/login"
        className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary-500 hover:text-primary-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Login
      </Link>
    </div>
  );
}
