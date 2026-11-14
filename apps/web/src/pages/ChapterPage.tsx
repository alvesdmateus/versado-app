import { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { ChevronRight } from "lucide-react";
import { chapterPath, lessonPath, trackPath } from "@/lib/learn-routes";
import { useTrackData } from "@/hooks/useTrackData";
import { LearnHeader, minutesToday } from "@/components/learning/session";
import { BackLink, ErrorBlock, LoadingBlock, MetaLine, MissingBlock } from "@/components/learning/page-kit";
import { PegPath } from "@/components/learning/PegPath";

/** One chapter of a course, drawn as a band across a peg board. */
export function ChapterPage() {
  const { trackId, chapterId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation("learn");
  const { state, retry } = useTrackData(trackId);
  const minutes = useMemo(() => (state.kind === "ready" ? minutesToday(state.modules) : 0), [state]);

  const index = state.kind === "ready" ? state.chapters.findIndex((c) => c.id === chapterId) : -1;
  const chapter = state.kind === "ready" ? state.chapters[index] : undefined;
  const nextChapter = state.kind === "ready" ? state.chapters[index + 1] : undefined;

  return (
    <div className="gb-surface min-h-full">
      <LearnHeader minutes={minutes} />
      <div className="mx-auto max-w-xl">
        {state.kind === "loading" && <LoadingBlock />}
        {state.kind === "error" && <ErrorBlock title={t("home.error.title")} onRetry={retry} />}
        {state.kind === "missing" && (
          <MissingBlock title={t("track.missing.title")} body={t("track.missing.body")} back="/" backLabel={t("hub.allTracks")} />
        )}
        {state.kind === "ready" && !chapter && (
          <MissingBlock
            title={t("chapter.missing.title")}
            body={t("chapter.missing.body")}
            back={trackPath(state.track.id)}
            backLabel={state.track.title}
          />
        )}

        {state.kind === "ready" && chapter && (
          <>
            <section className="px-5 pb-4 pt-4">
              <BackLink to={trackPath(state.track.id)}>{state.track.title}</BackLink>
              <h1 className="text-[28px] font-extrabold leading-[1.08] tracking-tight text-balance">{chapter.title}</h1>
              <MetaLine
                parts={[t("track.chapter", { n: index + 1 }), t("home.progress", { done: chapter.completedCount, total: chapter.moduleCount })]}
                due={chapter.modules.filter((m) => state.dueIds.has(m.id)).length}
              />
              {chapter.subtitle && <p className="mt-3 text-sm text-gb-mute">{chapter.subtitle}</p>}
            </section>
            <section className="px-5 pb-28">
              <div className="overflow-hidden rounded-[6px] border border-gb-seam">
                <PegPath
                  modules={chapter.modules}
                  dueIds={state.dueIds}
                  allModules={state.modules}
                  onContinue={(id) => {
                    const m = chapter.modules.find((x) => x.id === id);
                    if (m) navigate(lessonPath(m));
                  }}
                />
              </div>
              {nextChapter && chapter.completedCount >= chapter.moduleCount && (
                <Link
                  to={chapterPath(state.track.id, nextChapter.id)}
                  className="group mt-5 flex items-center justify-between gap-4 border-y border-gb-seam py-4"
                >
                  <span className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-gb-mute">{t("chapter.next")}</span>
                    <span className="text-base font-extrabold leading-tight group-hover:underline group-hover:underline-offset-4">
                      {nextChapter.title}
                    </span>
                  </span>
                  <ChevronRight className="h-5 w-5 shrink-0 text-gb-mute transition-colors group-hover:text-gb-ink" aria-hidden />
                </Link>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
