export function LoadingScreen() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-neutral-50 dark:bg-slate-900">
      <svg
        width="80"
        height="80"
        viewBox="0 0 512 512"
        xmlns="http://www.w3.org/2000/svg"
        className="animate-pulse"
      >
        <defs>
          <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#4a8af4" />
            <stop offset="100%" stopColor="#6da4f7" />
          </linearGradient>
        </defs>
        <rect width="512" height="512" rx="96" fill="url(#lg)" />
        <text
          x="256"
          y="350"
          fontFamily="system-ui, sans-serif"
          fontSize="340"
          fontWeight="700"
          fill="white"
          textAnchor="middle"
        >
          V
        </text>
      </svg>
    </div>
  );
}
