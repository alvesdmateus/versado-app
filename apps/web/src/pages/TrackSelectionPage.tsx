import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import type { TrackSummary } from "@versado/core";
import { learningApi } from "@/lib/learning-api";
import { profileApi } from "@/lib/profile-api";
import { useTrack } from "@/hooks/useTrack";
import { bandColor } from "@/components/learning/bands";
import { Spinner } from "@/components/learning/ui";

/**
 * Pick a skill track. Flashcards stay available as the "custom" legacy mode;
 * the former flashcard tracks (CKA, AWS, DevOps) are folded into it.
 */
export function TrackSelectionPage() {
  const navigate = useNavigate();
  const { t } = useTranslation("learn");
  const { setTrack } = useTrack();
  const [tracks, setTracks] = useState<TrackSummary[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    learningApi.listTracks().then(setTracks).catch(() => setFailed(true));
  }, []);

  const choose = async (trackId: string | "flashcards") => {
    setBusy(trackId);
    try {
      await setTrack("custom");
      if (trackId === "flashcards") {
        await profileApi.updatePreferences({ onboardingCompleted: true });
        navigate("/flashcards", { replace: true });
      } else {
        await profileApi.updatePreferences({ activeLearningTrackId: trackId, onboardingCompleted: true });
        navigate("/", { replace: true });
      }
    } catch {
      setBusy(null);
    }
  };

  return (
    <div className="gb-surface min-h-dvh">
      <div className="mx-auto flex max-w-md flex-col px-5 py-10">
        <h1 className="text-[28px] font-extrabold leading-tight tracking-tight">{t("select.title")}</h1>
        <p className="mt-2 text-gb-mute">{t("select.body")}</p>

        <ul className="mt-8 flex flex-col divide-y divide-gb-seam border-y border-gb-seam">
          {tracks === null && !failed && (
            <li className="flex h-28 items-center justify-center">
              <Spinner />
            </li>
          )}
          {failed && <li className="py-6 text-gb-mute">{t("select.error")}</li>}
          {tracks?.map((track) => (
            <li key={track.id}>
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => choose(track.id)}
                className="flex w-full items-center gap-4 py-5 text-left disabled:opacity-50"
              >
                <TrackGlyph color={bandColor(track.colorToken)} />
                <span className="flex flex-1 flex-col gap-1">
                  <span className="text-lg font-extrabold leading-tight">{track.title}</span>
                  <span className="text-sm text-gb-mute">{track.subtitle}</span>
                  <span className="text-xs font-semibold text-gb-mute">
                    {t("select.chapters", { count: track.chapterCount })} · {t("select.modules", { count: track.moduleCount })}
                  </span>
                </span>
                {busy === track.id && <Spinner />}
              </button>
            </li>
          ))}
          <li>
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => choose("flashcards")}
              className="flex w-full items-center gap-4 py-5 text-left disabled:opacity-50"
            >
              <TrackGlyph color="var(--color-gb-mute)" dashed />
              <span className="flex flex-1 flex-col gap-1">
                <span className="text-lg font-extrabold leading-tight">{t("select.flashcards.title")}</span>
                <span className="text-sm text-gb-mute">{t("select.flashcards.body")}</span>
              </span>
              {busy === "flashcards" && <Spinner />}
            </button>
          </li>
        </ul>
        <p className="mt-6 text-sm text-gb-mute">{t("select.more")}</p>
      </div>
    </div>
  );
}

function TrackGlyph({ color, dashed }: { color: string; dashed?: boolean }) {
  return (
    <svg viewBox="0 0 48 48" className="h-12 w-12 shrink-0" aria-hidden>
      {[8, 24, 40].map((x) => [8, 24, 40].map((y) => <circle key={`${x}${y}`} cx={x} cy={y} r={2} fill="var(--color-gb-peg)" />))}
      <polyline
        points="8,40 24,8 40,24 8,40"
        fill="none"
        stroke={color}
        strokeWidth={3.5}
        strokeLinejoin="round"
        strokeDasharray={dashed ? "4 4" : undefined}
      />
    </svg>
  );
}
