import { useState } from "react";
import { useNavigate } from "react-router";
import { Shield, Terminal, Layers } from "lucide-react";
import { type TrackId, TRACKS } from "@versado/core";
import { useTrack } from "@/hooks/useTrack";
import { onboardingApi } from "@/lib/onboarding-api";
import { profileApi } from "@/lib/profile-api";

const TRACK_CARDS: {
  id: TrackId;
  icon: typeof Shield;
  gradient: string;
  iconBg: string;
}[] = [
  {
    id: "cka",
    icon: Shield,
    gradient: "from-blue-600 to-indigo-700",
    iconBg: "bg-blue-500/20",
  },
  {
    id: "devops",
    icon: Terminal,
    gradient: "from-emerald-600 to-teal-700",
    iconBg: "bg-emerald-500/20",
  },
  {
    id: "custom",
    icon: Layers,
    gradient: "from-neutral-600 to-neutral-700",
    iconBg: "bg-neutral-500/20",
  },
];

export function TrackSelectionPage() {
  const navigate = useNavigate();
  const { setTrack } = useTrack();
  const [loading, setLoading] = useState<TrackId | null>(null);

  const handleSelect = async (trackId: TrackId) => {
    setLoading(trackId);
    try {
      await setTrack(trackId);

      const track = TRACKS[trackId];
      if (track.tagFilter.length > 0) {
        await onboardingApi
          .claimStarterDecks(track.tagFilter)
          .catch(() => {});
      }

      const prefs = await profileApi.getPreferences();
      if (prefs.onboardingCompleted) {
        navigate("/", { replace: true });
      } else {
        navigate("/onboarding", { replace: true });
      }
    } catch {
      setLoading(null);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50 px-5 py-8">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-neutral-900">
            What do you want to learn?
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            Pick a learning track to get started. You can change this later.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {TRACK_CARDS.map(({ id, icon: Icon, gradient, iconBg }) => {
            const track = TRACKS[id];
            const isLoading = loading === id;
            const isDisabled = loading !== null && !isLoading;

            return (
              <button
                key={id}
                onClick={() => handleSelect(id)}
                disabled={isDisabled || isLoading}
                className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-6 text-left text-white shadow-lg transition-all active:scale-[0.98] disabled:opacity-60`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconBg}`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-bold">{track.name}</h2>
                    <p className="mt-1 text-sm text-white/80">
                      {track.description}
                    </p>
                  </div>
                </div>
                {isLoading && (
                  <div className="mt-4 flex justify-center">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
