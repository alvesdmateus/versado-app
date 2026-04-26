import {
  createContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { type TrackId, type TrackConfig, TRACKS, isValidTrackId } from "@versado/core";
import { profileApi } from "@/lib/profile-api";

export interface TrackContextValue {
  trackId: TrackId | null;
  track: TrackConfig | null;
  setTrack: (id: TrackId) => Promise<void>;
  initFromPreferences: (activeTrackId?: string) => void;
}

export const TrackContext = createContext<TrackContextValue | null>(null);

export function TrackProvider({ children }: { children: ReactNode }) {
  const [trackId, setTrackId] = useState<TrackId | null>(null);

  const track = trackId ? TRACKS[trackId] : null;

  const initFromPreferences = useCallback((activeTrackId?: string) => {
    if (activeTrackId && isValidTrackId(activeTrackId)) {
      setTrackId(activeTrackId);
    }
  }, []);

  const setTrack = useCallback(async (id: TrackId) => {
    setTrackId(id);
    await profileApi.updatePreferences({ activeTrackId: id });
  }, []);

  return (
    <TrackContext.Provider value={{ trackId, track, setTrack, initFromPreferences }}>
      {children}
    </TrackContext.Provider>
  );
}
