import { useEffect, useRef, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { Layers, Repeat2, Spline, UserRound, type LucideIcon } from "lucide-react";
import { cn } from "@versado/ui";
import { SyncStatusIndicator } from "@/components/shared/SyncStatusIndicator";
import { UpdatePrompt } from "@/components/shared/UpdatePrompt";
import { OfflineBanner } from "@/components/shared/OfflineBanner";
import { EmailVerificationBanner } from "@/components/shared/EmailVerificationBanner";
import { useAuth } from "@/hooks/useAuth";
import { useTrack } from "@/hooks/useTrack";
import { useTheme, type ThemePreference } from "@/contexts/ThemeContext";
import { profileApi } from "@/lib/profile-api";
import { learningApi } from "@/lib/learning-api";
import { TIER_LIMITS } from "@/lib/feature-limits";
import type { UserTier } from "@versado/core/entities";
import i18n from "@/i18n";

type NavKey = "learn" | "review" | "flashcards" | "profile";

const FLASHCARD_PATHS = ["/flashcards", "/decks", "/discover", "/community", "/history", "/stats", "/billing", "/fluent"];

function getActiveKey(pathname: string): NavKey {
  if (pathname.startsWith("/review")) return "review";
  if (pathname.startsWith("/profile")) return "profile";
  if (FLASHCARD_PATHS.some((p) => pathname.startsWith(p))) return "flashcards";
  return "learn";
}

export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { initFromPreferences } = useTrack();
  const { setDarkMode, setThemePreference } = useTheme();
  const { t } = useTranslation(["common", "learn"]);
  const hasSyncedPrefs = useRef(false);
  const [dueCount, setDueCount] = useState(0);

  const showSync = user?.tier && TIER_LIMITS[user.tier as UserTier]?.canUseOffline;

  useEffect(() => {
    if (!user || hasSyncedPrefs.current) return;
    hasSyncedPrefs.current = true;
    profileApi
      .getPreferences()
      .then((prefs) => {
        if (prefs.themePreference) {
          setThemePreference(prefs.themePreference as ThemePreference);
        } else {
          setDarkMode(prefs.darkMode);
        }
        if (prefs.nativeLanguage && prefs.nativeLanguage !== i18n.language) {
          i18n.changeLanguage(prefs.nativeLanguage);
        }
        // Legacy flashcard tracks are folded into "custom".
        initFromPreferences("custom");
        if (!prefs.activeLearningTrackId && !prefs.onboardingCompleted) {
          navigate("/select-track", { replace: true });
        }
      })
      .catch(() => {});
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Refresh the due-check count when moving between tabs.
  useEffect(() => {
    if (!user) return;
    learningApi
      .listDueReviews()
      .then((r) => setDueCount(r.length))
      .catch(() => {});
  }, [user?.id, location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const items: { key: NavKey; label: string; href: string; icon: LucideIcon; badge?: number }[] = [
    { key: "learn", label: t("learn:nav.learn"), href: "/", icon: Spline },
    { key: "review", label: t("learn:nav.review"), href: "/review", icon: Repeat2, badge: dueCount },
    { key: "flashcards", label: t("learn:nav.flashcards"), href: "/flashcards", icon: Layers },
    { key: "profile", label: t("common:nav.profile"), href: "/profile", icon: UserRound },
  ];
  const active = getActiveKey(location.pathname);

  return (
    <div className="min-h-screen bg-gb-ground">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-gb-panel focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-gb-ink"
      >
        {t("common:skipToContent")}
      </a>
      <UpdatePrompt />
      <OfflineBanner />
      <EmailVerificationBanner />
      {showSync && active === "flashcards" && (
        <div className="flex justify-end px-4 pt-2">
          <SyncStatusIndicator />
        </div>
      )}
      <main id="main-content" className="pb-20">
        <Outlet />
      </main>

      <nav
        aria-label={t("learn:nav.label")}
        className="gb-surface fixed inset-x-0 bottom-0 z-50 border-t border-gb-seam bg-gb-panel pb-[env(safe-area-inset-bottom)]"
      >
        <ul className="mx-auto flex h-16 max-w-md">
          {items.map(({ key, label, href, icon: Icon, badge }) => {
            const on = key === active;
            return (
              <li key={key} className="flex-1">
                <button
                  type="button"
                  onClick={() => navigate(href)}
                  aria-current={on ? "page" : undefined}
                  className={cn(
                    "relative flex h-full w-full flex-col items-center justify-center gap-1 text-[11px] transition-colors",
                    on ? "font-bold text-gb-ink" : "font-semibold text-gb-mute hover:text-gb-ink"
                  )}
                >
                  <Icon className="h-[22px] w-[22px]" strokeWidth={on ? 2.4 : 1.9} aria-hidden />
                  <span>{label}</span>
                  {/* The active tab is marked by a red peg, the board's only colour in the chrome */}
                  <span
                    aria-hidden
                    className={cn(
                      "absolute top-1.5 h-1.5 w-1.5 rounded-full transition-opacity",
                      on ? "bg-band-red opacity-100" : "opacity-0"
                    )}
                  />
                  {badge ? (
                    <span className="absolute right-[calc(50%-22px)] top-2 min-w-[18px] rounded-full border-2 border-gb-panel bg-band-blue px-1 text-[10px] font-bold leading-[14px] text-gb-panel tabular-nums">
                      {badge}
                      <span className="sr-only"> {t("learn:nav.due")}</span>
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
