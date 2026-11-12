import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import type { TrackSummary } from "@versado/core";
import { learningApi, type WireModule } from "@/lib/learning-api";
import { profileApi } from "@/lib/profile-api";
import { PegPath } from "@/components/learning/PegPath";
import { PrimaryButton, Spinner } from "@/components/learning/ui";

const SESSION_MINUTES = 15;

type State =
  | { kind: "loading" }
  | { kind: "error" }
  | { kind: "empty" }
  | { kind: "ready"; track: TrackSummary; modules: WireModule[]; dueIds: Set<string> };

function isToday(iso: string | null | undefined) {
  if (!iso) return false;
  const d = new Date(iso);
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}

/** Learn tab: the active track drawn as a band across a peg board. */
export function LearnHomePage() {
  const { trackId: routeTrackId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation("learn");
  const [state, setState] = useState<State>({ kind: "loading" });
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let alive = true;
    setState({ kind: "loading" });
    (async () => {
      const [tracks, prefs, due] = await Promise.all([
        learningApi.listTracks(),
        routeTrackId ? Promise.resolve(null) : profileApi.getPreferences().catch(() => null),
        learningApi.listDueReviews().catch(() => []),
      ]);
      const chosen = routeTrackId ?? prefs?.activeLearningTrackId;
      const summary = tracks.find((tr) => tr.id === chosen) ?? tracks[0];
      if (!summary) return alive && setState({ kind: "empty" });
      const { track, modules } = await learningApi.getTrack(summary.id);
      if (alive) setState({ kind: "ready", track, modules, dueIds: new Set(due.map((d) => d.module.id)) });
    })().catch(() => alive && setState({ kind: "error" }));
    return () => {
      alive = false;
    };
  }, [routeTrackId, reload]);

  const minutesToday = useMemo(() => {
    if (state.kind !== "ready") return 0;
    return state.modules.reduce((sum, m) => {
      const p = m.progress;
      if (!p) return sum;
      return sum + (isToday(p.completedAt) ? m.estimatedMinutes : 0) + (isToday(p.lastReviewedAt) ? 1 : 0);
    }, 0);
  }, [state]);

  return (
    <div className="gb-surface min-h-full">
      <header className="mx-auto flex h-14 max-w-xl items-center justify-between border-b border-gb-seam px-5">
        <span className="flex items-center gap-2 text-[19px] font-extrabold tracking-tight">
          <img src="/favicon.svg" alt="" className="h-6 w-6" />
          Versado
        </span>
        <SessionMeter minutes={minutesToday} />
      </header>

      <div className="mx-auto max-w-xl">
      {state.kind === "loading" && (
        <div className="flex h-64 items-center justify-center">
          <Spinner />
        </div>
      )}

      {state.kind === "error" && (
        <section className="flex flex-col gap-4 px-5 py-10">
          <h1 className="text-2xl font-extrabold">{t("home.error.title")}</h1>
          <p className="text-gb-mute">{t("home.error.body")}</p>
          <PrimaryButton onClick={() => setReload((r) => r + 1)}>{t("home.error.retry")}</PrimaryButton>
        </section>
      )}

      {state.kind === "empty" && (
        <section className="flex flex-col gap-3 px-5 py-10">
          <h1 className="text-2xl font-extrabold">{t("home.empty.title")}</h1>
          <p className="text-gb-mute">{t("home.empty.body")}</p>
        </section>
      )}

      {state.kind === "ready" && (
        <>
          <section className="px-5 pb-4 pt-6">
            <h1 className="text-[28px] font-extrabold leading-[1.08] tracking-tight text-balance">{state.track.title}</h1>
            <p className="mt-2 text-sm text-gb-mute">
              {t(`domain.${state.track.domain}`)} · {t("home.progress", { done: state.track.completedCount, total: state.track.moduleCount })}
              {state.dueIds.size > 0 && (
                <>
                  {" · "}
                  <Link to="/review" className="font-semibold text-band-blue underline-offset-4 hover:underline">
                    {t("home.due", { count: state.dueIds.size })}
                  </Link>
                </>
              )}
            </p>
          </section>
          <section className="px-5 pb-28">
            <div className="rounded-[6px] border border-gb-seam">
              <PegPath modules={state.modules} dueIds={state.dueIds} onContinue={(id) => navigate(`/learn/${id}`)} />
            </div>
            {state.track.completedCount === state.track.moduleCount && (
              <p className="mt-4 text-sm text-gb-mute">{t("home.trackDone")}</p>
            )}
            <Link
              to="/select-track"
              className="mt-5 inline-block text-sm font-semibold text-gb-mute underline-offset-4 hover:text-gb-ink hover:underline"
            >
              {t("home.changeTrack")}
            </Link>
          </section>
        </>
      )}
      </div>
    </div>
  );
}

/** Today's minutes against one short session: sessions are timed to fit. */
function SessionMeter({ minutes }: { minutes: number }) {
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
