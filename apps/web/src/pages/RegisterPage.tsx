import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { Eye, EyeOff } from "lucide-react";
import { registerSchema } from "@flashcard/validation";
import { Button, Input, Logo } from "@flashcard/ui";
import { useAuth } from "@/hooks/useAuth";
import { ApiError } from "@/lib/api-client";

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

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    // Validate with Zod
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

    // Check confirm password
    if (password !== confirmPassword) {
      setErrors({ confirmPassword: "Passwords do not match" });
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      await register(result.data.email, result.data.password, result.data.displayName);
      navigate("/");
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors({ general: err.message });
      } else {
        setErrors({ general: "Something went wrong. Please try again." });
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
      <h1 className="text-2xl font-bold text-neutral-900">Create Account</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Start your learning journey today
      </p>

      {/* General error */}
      {errors.general && (
        <div className="mt-4 w-full rounded-lg bg-error-50 px-4 py-3 text-sm text-error-600">
          {errors.general}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="mt-8 w-full space-y-5">
        <Input
          label="Display Name"
          type="text"
          placeholder="Your name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          error={errors.displayName}
          autoComplete="name"
        />

        <Input
          label="Email Address"
          type="email"
          placeholder="name@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          autoComplete="email"
        />

        <Input
          label="Password"
          type={showPassword ? "text" : "password"}
          placeholder="Create a password"
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
          placeholder="Repeat your password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={errors.confirmPassword}
          autoComplete="new-password"
        />

        <Button type="submit" variant="primary" size="lg" fullWidth disabled={isSubmitting}>
          {isSubmitting ? "Creating Account..." : "Create Account"}
        </Button>
      </form>

      {/* Login footer */}
      <div className="self-stretch -mx-8 -mb-8 mt-8 rounded-b-2xl border-t border-neutral-200 bg-neutral-50 px-8 py-5 text-center">
        <p className="text-sm text-neutral-500">
          Already have an account?{" "}
          <Link
            to="/auth/login"
            className="font-medium text-primary-500 hover:text-primary-600"
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
