import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import type { TrackSummary } from "@versado/core";
import { learningApi, type WireChapter, type WireModule } from "@/lib/learning-api";
import { LearnHeader, minutesToday } from "@/components/learning/session";
import { ChevronLeft } from "lucide-react";
import { PegPath } from "@/components/learning/PegPath";
import { PrimaryButton, Spinner } from "@/components/learning/ui";

type State =
  | { kind: "loading" }
  | { kind: "error" }
  | { kind: "empty" }
  | { kind: "ready"; track: TrackSummary; modules: WireModule[]; chapters: WireChapter[]; dueIds: Set<string> };

/** One track (course) drawn as a band across a peg board, chapter by chapter. */
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
      if (!routeTrackId) return alive && setState({ kind: "empty" });
      const [tracks, due] = await Promise.all([learningApi.listTracks(), learningApi.listDueReviews().catch(() => [])]);
      const summary = tracks.find((tr) => tr.id === routeTrackId);
      if (!summary) return alive && setState({ kind: "empty" });
      const { track, modules, chapters } = await learningApi.getTrack(summary.id);
      if (alive) setState({ kind: "ready", track, modules, chapters, dueIds: new Set(due.map((d) => d.module.id)) });
    })().catch(() => alive && setState({ kind: "error" }));
    return () => {
      alive = false;
    };
  }, [routeTrackId, reload]);

  const minutes = useMemo(() => (state.kind === "ready" ? minutesToday(state.modules) : 0), [state]);

  return (
    <div className="gb-surface min-h-full">
      <LearnHeader minutes={minutes} />

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
          <section className="px-5 pb-4 pt-4">
            <Link
              to="/"
              className="-ml-1 mb-3 inline-flex items-center gap-1 text-sm font-semibold text-gb-mute underline-offset-4 hover:text-gb-ink hover:underline"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
              {t("hub.allTracks")}
            </Link>
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
            <div className="space-y-8">
              {state.chapters.map((chapter) => (
                <section key={chapter.id} aria-labelledby={`chapter-${chapter.id}`}>
                  <h2 id={`chapter-${chapter.id}`} className="text-lg font-extrabold leading-tight text-gb-ink">
                    {chapter.title}
                  </h2>
                  {chapter.subtitle && <p className="mt-2 text-sm text-gb-mute">{chapter.subtitle}</p>}
                  <div className="mt-4 rounded-[6px] border border-gb-seam">
                    <PegPath modules={chapter.modules} dueIds={state.dueIds} onContinue={(id) => navigate(`/learn/${id}`)} />
                  </div>
                </section>
              ))}
            </div>
            {state.track.completedCount === state.track.moduleCount && (
              <p className="mt-4 text-sm text-gb-mute">{t("home.trackDone")}</p>
            )}
          </section>
        </>
      )}
      </div>
    </div>
  );
}
