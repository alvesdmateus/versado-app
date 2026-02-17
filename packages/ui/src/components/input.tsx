import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "../lib/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  rightElement?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, rightElement, className, id: externalId, ...props }, ref) => {
    const generatedId = useId();
    const id = externalId ?? generatedId;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={id}
            className="mb-1.5 block text-sm font-medium text-neutral-700"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={id}
            className={cn(
              "w-full rounded-lg border bg-neutral-0 px-3.5 py-2.5 text-sm text-neutral-900 outline-none transition-colors",
              "placeholder:text-neutral-400",
              "focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20",
              error
                ? "border-error-500 focus:border-error-500 focus:ring-error-500/20"
                : "border-neutral-300 hover:border-neutral-400",
              rightElement && "pr-10",
              className
            )}
            {...props}
          />
          {rightElement && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              {rightElement}
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1.5 text-sm text-error-500">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
