export function LoadingScreen() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-neutral-50 dark:bg-slate-900">
      <img
        src="/app-icon-v4.png"
        alt="Versado"
        width="80"
        height="80"
        className="animate-pulse"
      />
    </div>
  );
}
