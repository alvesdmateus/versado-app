import { useContext } from "react";
import { TrackContext, type TrackContextValue } from "@/contexts/TrackContext";

export function useTrack(): TrackContextValue {
  const context = useContext(TrackContext);
  if (!context) {
    throw new Error("useTrack must be used within a TrackProvider");
  }
  return context;
}
