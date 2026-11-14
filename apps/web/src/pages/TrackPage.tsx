import { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { ChevronRight } from "lucide-react";
import type { WireChapter } from "@/lib/learning-api";
import { chapterPath, lessonPath } from "@/lib/learn-routes";
import { useTrackData } from "@/hooks/useTrackData";
import { LearnHeader, minutesToday } from "@/components/learning/session";
import { BackLink, ErrorBlock, LoadingBlock, MetaLine, MissingBlock } from "@/components/learning/page-kit";
import { DuePill, PegDivider, PrimaryButton, ProgressRail } from "@/components/learning/ui";

/** A course: its chapters in order, each under its own divider; the current one opens into Continue. */
export function TrackPage() {
  const { trackId } = useParams();
  const { t } = useTranslation("learn");
  const { state, retry } = useTrackData(trackId);
  const minutes = useMemo(() => (state.kind === "ready" ? minutesToday(state.modules) : 0), [state]);

  return (
    <div className="gb-surface min-h-full">
      <LearnHeader minutes={minutes} />
      <div className="mx-auto max-w-xl">
        {state.kind === "loading" && <LoadingBlock />}
        {state.kind === "error" && <ErrorBlock title={t("home.error.title")} onRetry={retry} />}
        {state.kind === "missing" && (
          <MissingBlock title={t("track.missing.title")} body={t("track.missing.body")} back="/" backLabel={t("hub.allTracks")} />
        )}

        {state.kind === "ready" && (
          <>
            <section className="px-5 pb-6 pt-4">
              <BackLink to="/">{t("hub.allTracks")}</BackLink>
              <h1 className="text-[28px] font-extrabold leading-[1.08] tracking-tight text-balance">{state.track.title}</h1>
              <MetaLine
                parts={[t(`domain.${state.track.domain}`), t("home.progress", { done: state.track.completedCount, total: state.track.moduleCount })]}
                due={state.dueIds.size}
              />
            </section>

            <div className="space-y-8 px-5 pb-28">
              {state.chapters.map((chapter, i) => {
                const current = chapter.modules.some((m) => m.id === state.track.nextModuleId);
                const due = chapter.modules.filter((m) => state.dueIds.has(m.id)).length;
                return (
                  <section key={chapter.id} aria-labelledby={`chapter-${chapter.id}`}>
                    <PegDivider id={`chapter-${chapter.id}`} label={t("track.chapter", { n: i + 1 })} />
                    {current ? (
                      <div className="pt-3">
                        <ChapterContinue chapter={chapter} nextId={state.track.nextModuleId} />
                      </div>
                    ) : (
                      <ChapterRow chapter={chapter} due={due} />
                    )}
                  </section>
                );
              })}
              {state.track.completedCount === state.track.moduleCount && <p className="text-sm text-gb-mute">{t("home.trackDone")}</p>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/** The chapter you are in: the next lesson and one action to carry on. */
function ChapterContinue({ chapter, nextId }: { chapter: WireChapter; nextId: string | null }) {
  const { t } = useTranslation("learn");
  const navigate = useNavigate();
  const next = chapter.modules.find((m) => m.id === nextId);
  return (
    <div className="rounded-[6px] border border-gb-ink bg-gb-panel p-4">
      <h3 className="text-lg font-extrabold leading-tight">
        {chapter.title}
        <span className="sr-only"> {t("track.current")}</span>
      </h3>
      {next && (
        <p className="mt-1 truncate text-xs font-semibold text-gb-mute">
          {next.title} · {t("path.minutes", { minutes: next.estimatedMinutes })}
        </p>
      )}
      <ProgressRail done={chapter.completedCount} total={chapter.moduleCount} className="mt-4" />
      {next && (
        <PrimaryButton className="mt-4" onClick={() => navigate(lessonPath(next))}>
          {next.progressStatus === "in_progress" ? t("path.continue") : t("path.start")}
        </PrimaryButton>
      )}
      <Link
        to={chapterPath(chapter.trackId, chapter.id)}
        className="mt-3 block text-center text-sm font-semibold text-gb-mute underline-offset-4 hover:text-gb-ink hover:underline"
      >
        {t("track.seeChapter")}
      </Link>
    </div>
  );
}

function ChapterRow({ chapter, due }: { chapter: WireChapter; due: number }) {
  const { t } = useTranslation("learn");
  const locked = chapter.modules.every((m) => m.progressStatus === "locked");
  const done = chapter.moduleCount > 0 && chapter.completedCount >= chapter.moduleCount;

  const body = (
    <span className="flex min-w-0 flex-1 flex-col gap-1">
      <span className={`text-base font-extrabold leading-tight ${locked ? "text-gb-mute" : "group-hover:underline group-hover:underline-offset-4"}`}>
        {chapter.title}
      </span>
      {chapter.subtitle && <span className="text-sm text-gb-mute">{chapter.subtitle}</span>}
      <span className="flex items-center gap-3 text-xs font-semibold tabular-nums text-gb-mute">
        <span>
          {locked ? t("track.locked") : done ? t("path.done") : t("home.progress", { done: chapter.completedCount, total: chapter.moduleCount })}
        </span>
        {due > 0 && <DuePill>{t("home.due", { count: due })}</DuePill>}
      </span>
      {!locked && <ProgressRail done={chapter.completedCount} total={chapter.moduleCount} className="mt-1" />}
    </span>
  );

  if (locked) {
    return (
      <div className="mt-3 flex items-center gap-4 rounded-[6px] border border-gb-seam px-4 py-4" aria-disabled>
        {body}
      </div>
    );
  }
  return (
    <Link
      to={chapterPath(chapter.trackId, chapter.id)}
      className="group mt-3 flex items-center gap-4 rounded-[6px] border border-gb-seam bg-gb-panel px-4 py-4 transition-colors duration-150 hover:border-gb-mute"
    >
      {body}
      <ChevronRight className="h-5 w-5 shrink-0 text-gb-mute transition-colors group-hover:text-gb-ink" aria-hidden />
    </Link>
  );
}
