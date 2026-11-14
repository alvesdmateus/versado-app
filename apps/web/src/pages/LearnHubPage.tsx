import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { ChevronRight } from "lucide-react";
import type { LearningDomain, TrackSummary } from "@versado/core";
import { learningApi, type WireModule } from "@/lib/learning-api";
import { profileApi } from "@/lib/profile-api";
import { bandColor } from "@/components/learning/bands";
import { LearnHeader, minutesToday } from "@/components/learning/session";
import { PegDivider, PrimaryButton, ProgressCaption, ProgressRail as Progress, Spinner, TrackGlyph } from "@/components/learning/ui";
import { lessonPath, trackPath } from "@/lib/learn-routes";

/** Domains in the order the product introduces them; empty ones show as "on the way". */
const DOMAINS: LearningDomain[] = ["mathematics", "software", "science"];

type Loaded = { tracks: TrackSummary[]; modules: Map<string, WireModule[]>; activeId: string | null; due: number };
type State = { kind: "loading" } | { kind: "error" } | { kind: "ready"; data: Loaded };

/** Learn tab: every track, grouped by domain; the one in progress opens into a Continue panel. */
export function LearnHubPage() {
  const { t } = useTranslation("learn");
  const navigate = useNavigate();
  const [state, setState] = useState<State>({ kind: "loading" });
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let alive = true;
    setState({ kind: "loading" });
    (async () => {
      const [tracks, prefs, due] = await Promise.all([
        learningApi.listTracks(),
        profileApi.getPreferences().catch(() => null),
        learningApi.listDueReviews().catch(() => []),
      ]);
      const details = await Promise.all(tracks.map((tr) => learningApi.getTrack(tr.id).catch(() => null)));
      const modules = new Map<string, WireModule[]>();
      details.forEach((d, i) => d && modules.set(tracks[i]!.id, d.modules));
      const activeId = tracks.find((tr) => tr.id === prefs?.activeLearningTrackId)?.id ?? null;
      if (alive) setState({ kind: "ready", data: { tracks, modules, activeId, due: due.length } });
    })().catch(() => alive && setState({ kind: "error" }));
    return () => {
      alive = false;
    };
  }, [reload]);

  const minutes = useMemo(
    () => (state.kind === "ready" ? [...state.data.modules.values()].reduce((s, m) => s + minutesToday(m), 0) : 0),
    [state]
  );

  const openTrack = (trackId: string) => {
    // Opening a track makes it the one "Continue" returns to.
    profileApi.updatePreferences({ activeLearningTrackId: trackId }).catch(() => {});
  };

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
            <h1 className="text-2xl font-extrabold">{t("hub.error.title")}</h1>
            <p className="text-gb-mute">{t("home.error.body")}</p>
            <PrimaryButton onClick={() => setReload((r) => r + 1)}>{t("home.error.retry")}</PrimaryButton>
          </section>
        )}

        {state.kind === "ready" && (
          <HubContent
            data={state.data}
            onOpen={openTrack}
            onContinue={(track) => {
              openTrack(track.id);
              const next = state.data.modules.get(track.id)?.find((m) => m.id === track.nextModuleId);
              navigate(next ? lessonPath(next) : trackPath(track.id));
            }}
          />
        )}
      </div>
    </div>
  );
}

function HubContent({
  data,
  onOpen,
  onContinue,
}: {
  data: Loaded;
  onOpen: (trackId: string) => void;
  onContinue: (track: TrackSummary) => void;
}) {
  const { t } = useTranslation("learn");
  const { tracks, modules, activeId, due } = data;

  // The track to continue: the chosen one, else the first one already started.
  const current =
    tracks.find((tr) => tr.id === activeId) ?? tracks.find((tr) => tr.completedCount > 0 && tr.completedCount < tr.moduleCount) ?? null;

  if (tracks.length === 0) {
    return (
      <section className="flex flex-col gap-3 px-5 py-10">
        <h1 className="text-2xl font-extrabold">{t("home.empty.title")}</h1>
        <p className="text-gb-mute">{t("home.empty.body")}</p>
      </section>
    );
  }

  return (
    <>
      <section className="px-5 pb-6 pt-6">
        <h1 className="text-[28px] font-extrabold leading-[1.08] tracking-tight text-balance">{t("hub.title")}</h1>
        <p className="mt-2 text-sm text-gb-mute">
          {t("hub.count", { count: tracks.length })}
          {due > 0 && (
            <>
              {" · "}
              <Link to="/review" className="font-semibold text-band-blue underline-offset-4 hover:underline">
                {t("home.due", { count: due })}
              </Link>
            </>
          )}
        </p>
      </section>

      <div className="space-y-8 px-5 pb-28">
        {DOMAINS.map((domain) => {
          const inDomain = tracks.filter((tr) => tr.domain === domain);
          return (
            <section key={domain} aria-labelledby={`domain-${domain}`}>
              <PegDivider id={`domain-${domain}`} label={t(`domain.${domain}`)} />
              {inDomain.length > 0 ? (
                <ul className="mt-1 divide-y divide-gb-seam">
                  {inDomain.map((track) => (
                    <li key={track.id} className={track.id === current?.id ? "py-3" : undefined}>
                      {track.id === current?.id ? (
                        <ContinuePanel track={track} modules={modules.get(track.id) ?? []} onContinue={() => onContinue(track)} />
                      ) : (
                        <TrackRow track={track} onOpen={() => onOpen(track.id)} />
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex items-center gap-4 py-4 text-gb-mute">
                  <TrackGlyph color="var(--color-gb-mute)" dashed className="h-10 w-10" />
                  <p className="text-sm">{t("hub.soon")}</p>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </>
  );
}

/** The track in progress: where you are and one action to carry on. */
function ContinuePanel({ track, modules, onContinue }: { track: TrackSummary; modules: WireModule[]; onContinue: () => void }) {
  const { t } = useTranslation("learn");
  const next = modules.find((m) => m.id === track.nextModuleId);
  const done = track.completedCount >= track.moduleCount;
  return (
    <div className="rounded-[6px] border border-gb-ink bg-gb-panel px-4 pb-1 pt-4">
      <div className="flex items-start gap-3">
        <TrackGlyph color={bandColor(track.colorToken)} className="h-10 w-10" />
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-extrabold leading-tight">
            {track.title}
            <span className="sr-only"> {t("hub.current")}</span>
          </h3>
          <p className="mt-1 truncate text-xs font-semibold text-gb-mute">
            {done ? t("home.trackDone") : next ? `${next.title} · ${t("path.minutes", { minutes: next.estimatedMinutes })}` : track.subtitle}
          </p>
        </div>
      </div>
      {/* Same progress caption as a track row, so the rail is never the only cue (and screen readers get it) */}
      <TrackProgress track={track} className="mt-4" />
      <Progress done={track.completedCount} total={track.moduleCount} className="mt-2" />
      <PrimaryButton className="mt-4" onClick={onContinue}>
        {done ? t("hub.openTrack") : track.completedCount === 0 ? t("path.start") : t("path.continue")}
      </PrimaryButton>
      <Link
        to={trackPath(track.id)}
        className="mt-1 flex min-h-11 items-center justify-center text-sm font-semibold text-gb-mute underline-offset-4 hover:text-gb-ink hover:underline"
      >
        {t("hub.seePath")}
      </Link>
    </div>
  );
}

function TrackRow({ track, onOpen }: { track: TrackSummary; onOpen: () => void }) {
  return (
    <Link to={trackPath(track.id)} onClick={onOpen} className="group flex items-center gap-4 py-4">
      <TrackGlyph color={bandColor(track.colorToken)} className="h-10 w-10" />
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <h3 className="text-base font-extrabold leading-tight group-hover:underline group-hover:underline-offset-4">{track.title}</h3>
        <span className="truncate text-sm text-gb-mute">{track.subtitle}</span>
        <TrackProgress track={track} />
        <Progress done={track.completedCount} total={track.moduleCount} className="mt-1" />
      </span>
      <ChevronRight className="h-5 w-5 shrink-0 text-gb-mute transition-colors group-hover:text-gb-ink" aria-hidden />
    </Link>
  );
}


function TrackProgress({ track, className }: { track: TrackSummary; className?: string }) {
  const { t } = useTranslation("learn");
  return (
    <ProgressCaption
      label={t("home.progress", { done: track.completedCount, total: track.moduleCount })}
      due={track.dueReviewCount}
      dueLabel={t("home.due", { count: track.dueReviewCount })}
      className={className}
    />
  );
}
