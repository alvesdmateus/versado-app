import { useTranslation } from "react-i18next";
import type { WireModule } from "@/lib/learning-api";

export const SESSION_MINUTES = 15;

function isToday(iso: string | null | undefined) {
  if (!iso) return false;
  const d = new Date(iso);
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}

/** Minutes spent today: completed modules at their length, one minute per review check. */
export function minutesToday(modules: WireModule[]) {
  return modules.reduce((sum, m) => {
    const p = m.progress;
    if (!p) return sum;
    return sum + (isToday(p.completedAt) ? m.estimatedMinutes : 0) + (isToday(p.lastReviewedAt) ? 1 : 0);
  }, 0);
}

/** Today's minutes against one short session: sessions are timed to fit. */
export function SessionMeter({ minutes }: { minutes: number }) {
  const { t } = useTranslation("learn");
  const pct = Math.min(100, (minutes / SESSION_MINUTES) * 100);
  return (
    <span className="flex items-center gap-2 text-[13px] font-semibold tabular-nums" aria-label={t("home.session", { minutes, total: SESSION_MINUTES })}>
      <span aria-hidden>
        {minutes} / {SESSION_MINUTES} min
      </span>
      <span className="relative block h-1 w-16 overflow-hidden rounded-full bg-gb-seam" aria-hidden>
        <span className="absolute inset-y-0 left-0 bg-gb-ink" style={{ width: `${pct}%` }} />
      </span>
    </span>
  );
}

/** The skill-track header: wordmark left, today's session right. */
export function LearnHeader({ minutes }: { minutes: number }) {
  return (
    <header className="mx-auto flex h-14 max-w-xl items-center justify-between border-b border-gb-seam px-5">
      <span className="flex items-center gap-2 text-[19px] font-extrabold tracking-tight">
        <img src="/favicon.svg" alt="" className="h-6 w-6" />
        Versado
      </span>
      <SessionMeter minutes={minutes} />
    </header>
  );
}
