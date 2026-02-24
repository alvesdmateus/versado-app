import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { Mail, ArrowLeft } from "lucide-react";
import { forgotPasswordSchema } from "@versado/validation";
import { Button, Input, Logo } from "@versado/ui";
import { authApi } from "@/lib/auth-api";
import { ApiError } from "@/lib/api-client";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const result = forgotPasswordSchema.safeParse({ email });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Invalid email");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      await authApi.forgotPassword(result.data.email);
      setIsSubmitted(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Something went wrong. Please try again.");
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
        <h1 className="text-2xl font-bold text-neutral-900">Check Your Email</h1>
        <p className="mt-2 text-sm text-neutral-500">
          If an account exists for <strong>{email}</strong>, we sent a password
          reset link. Check your inbox and spam folder.
        </p>
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

  return (
    <div className="flex flex-col items-center">
      <Logo size="lg" className="mb-4" />

      <h1 className="text-2xl font-bold text-neutral-900">Reset Password</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Enter your email and we'll send you a reset link
      </p>

      <form onSubmit={handleSubmit} className="mt-8 w-full space-y-5">
        <Input
          label="Email Address"
          type="email"
          placeholder="name@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={error}
          autoComplete="email"
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          disabled={isSubmitting}
        >
          {isSubmitting ? "Sending..." : "Send Reset Link"}
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
