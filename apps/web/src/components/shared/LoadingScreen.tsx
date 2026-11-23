import { Logo } from "@versado/ui";

export function LoadingScreen() {
  return (
    <div
      role="status"
      aria-label="Versado"
      className="flex min-h-dvh items-center justify-center bg-neutral-50 dark:bg-slate-900"
    >
      <Logo size="lg" className="animate-pulse motion-reduce:animate-none" />
    </div>
  );
}
