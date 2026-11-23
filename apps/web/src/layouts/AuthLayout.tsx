import { lazy, Suspense } from "react";
import { Outlet } from "react-router";
import { useTheme } from "@/contexts/ThemeContext";

// three.js stays out of the main bundle; the form never waits for the backdrop.
const LatticeBackdrop = lazy(() => import("@/components/auth/LatticeBackdrop"));

export function AuthLayout() {
  const { isDark } = useTheme();

  return (
    <div className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-neutral-50 px-4 py-8">
      <Suspense fallback={null}>
        <LatticeBackdrop isDark={isDark} />
      </Suspense>
      <div className="relative w-full max-w-md rounded-2xl bg-neutral-0 p-8 shadow-card-lg">
        <Outlet />
      </div>
    </div>
  );
}
