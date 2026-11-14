import { useEffect, useState } from "react";
import type { TrackSummary } from "@versado/core";
import { learningApi, type WireChapter, type WireModule } from "@/lib/learning-api";

export type TrackData = { track: TrackSummary; modules: WireModule[]; chapters: WireChapter[]; dueIds: Set<string> };

export type TrackDataState = { kind: "loading" } | { kind: "error" } | { kind: "missing" } | ({ kind: "ready" } & TrackData);

/** A course with its chapters, modules and the user's due checks. */
export function useTrackData(trackId: string | undefined) {
  const [state, setState] = useState<TrackDataState>({ kind: "loading" });
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let alive = true;
    setState({ kind: "loading" });
    (async () => {
      if (!trackId) return alive && setState({ kind: "missing" });
      const [tracks, due] = await Promise.all([learningApi.listTracks(), learningApi.listDueReviews().catch(() => [])]);
      if (!tracks.some((tr) => tr.id === trackId)) return alive && setState({ kind: "missing" });
      const { track, modules, chapters } = await learningApi.getTrack(trackId);
      if (alive) setState({ kind: "ready", track, modules, chapters, dueIds: new Set(due.map((d) => d.module.id)) });
    })().catch(() => alive && setState({ kind: "error" }));
    return () => {
      alive = false;
    };
  }, [trackId, reload]);

  return { state, retry: () => setReload((r) => r + 1) };
}
