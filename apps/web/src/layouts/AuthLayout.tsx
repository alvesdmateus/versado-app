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
      {/* Translucent so the lattice reads through on phones, where the card covers
          most of the screen; a slight blur keeps the form text clear of the dots. */}
      <div className="relative w-full max-w-md rounded-2xl bg-neutral-0/60 p-8 shadow-card-lg backdrop-blur-[2px]">
        <Outlet />
      </div>
    </div>
  );
}
