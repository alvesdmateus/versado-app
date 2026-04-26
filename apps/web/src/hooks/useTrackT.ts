import { useTranslation } from "react-i18next";
import { useTrack } from "./useTrack";

export function useTrackT(ns: string) {
  const { t } = useTranslation(ns);
  const { track } = useTrack();

  return (key: string, opts?: Record<string, unknown>) => {
    if (track && track.id !== "custom") {
      const overrideKey = `trackOverrides.${track.id}.${key}`;
      const override = t(overrideKey, { ...opts, defaultValue: "" });
      if (override) return override;
    }
    return t(key, opts);
  };
}
