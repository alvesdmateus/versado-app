import { useEffect, useRef } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { BottomNav, type BottomNavItem } from "@versado/ui";
import { SyncStatusIndicator } from "@/components/shared/SyncStatusIndicator";
import { UpdatePrompt } from "@/components/shared/UpdatePrompt";
import { OfflineBanner } from "@/components/shared/OfflineBanner";
import { EmailVerificationBanner } from "@/components/shared/EmailVerificationBanner";
import { useAuth } from "@/hooks/useAuth";
import { useTrack } from "@/hooks/useTrack";
import { useTheme, type ThemePreference } from "@/contexts/ThemeContext";
import { profileApi } from "@/lib/profile-api";
import { TIER_LIMITS } from "@/lib/feature-limits";
import type { UserTier } from "@versado/core/entities";
import i18n from "@/i18n";

function HomeIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.47 3.84a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 1-1.06 1.06l-.97-.97V19.5a.75.75 0 0 1-.75.75h-4.5a.75.75 0 0 1-.75-.75v-3.75h-3V19.5a.75.75 0 0 1-.75.75h-4.5a.75.75 0 0 1-.75-.75v-6.88l-.97.97a.75.75 0 0 1-1.06-1.06l8.69-8.69Z" />
    </svg>
  );
}

function DecksIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
      <rect x="4" y="8" width="14" height="11" rx="2" opacity="0.4" />
      <rect x="6" y="5" width="14" height="11" rx="2" opacity="0.7" />
      <rect x="3" y="11" width="14" height="11" rx="2" transform="rotate(-10 10 16.5)" />
    </svg>
  );
}

function DiscoverIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM15.61 8.39a.75.75 0 0 1 .194.63l-1.5 6a.75.75 0 0 1-.554.554l-6 1.5a.75.75 0 0 1-.824-.824l1.5-6a.75.75 0 0 1 .554-.554l6-1.5a.75.75 0 0 1 .63.194ZM12 12.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function CommunityIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8.25 6.75a3.75 3.75 0 1 1 7.5 0 3.75 3.75 0 0 1-7.5 0ZM15.75 9.75a3 3 0 1 1 6 0 3 3 0 0 1-6 0ZM2.25 9.75a3 3 0 1 1 6 0 3 3 0 0 1-6 0ZM6.31 19.827a7.5 7.5 0 0 1 11.38 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695c0-.484.058-.965.169-1.432.11-.464.254-.91.39-1.346ZM2.816 18.966a.75.75 0 0 1-.455-.682 5.25 5.25 0 0 1 4.884-3.534 7.47 7.47 0 0 0-1.595 2.349c-.232.532-.42 1.077-.58 1.617a18.678 18.678 0 0 1-2.254.25ZM21.184 18.966a18.678 18.678 0 0 1-2.254-.25c-.16-.54-.348-1.085-.58-1.617a7.47 7.47 0 0 0-1.595-2.349 5.25 5.25 0 0 1 4.884 3.534.75.75 0 0 1-.455.682Z" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
      <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" />
    </svg>
  );
}

function getActiveKey(pathname: string): string {
  if (pathname.startsWith("/decks")) return "decks";
  if (pathname.startsWith("/discover")) return "discover";
  if (pathname.startsWith("/community")) return "community";
  if (pathname.startsWith("/profile")) return "profile";
  return "home";
}

export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { track, initFromPreferences } = useTrack();
  const { setDarkMode, setThemePreference } = useTheme();
  const { t } = useTranslation("common");
  const hasSyncedPrefs = useRef(false);

  const showSync =
    user?.tier && TIER_LIMITS[user.tier as UserTier]?.canUseOffline;

  const allNavItems: BottomNavItem[] = [
    { key: "home", label: t("nav.home"), icon: <HomeIcon />, href: "/" },
    { key: "decks", label: t("nav.decks"), icon: <DecksIcon />, href: "/decks" },
    { key: "discover", label: t("nav.discover"), icon: <DiscoverIcon />, href: "/discover" },
    { key: "community", label: t("nav.community"), icon: <CommunityIcon />, href: "/community" },
    { key: "profile", label: t("nav.profile"), icon: <ProfileIcon />, href: "/profile" },
  ];

  const navItems = track?.hideNavItems.length
    ? allNavItems.filter((item) => !track.hideNavItems.includes(item.key))
    : allNavItems;

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
        // Sync language preference
        if (prefs.nativeLanguage && prefs.nativeLanguage !== i18n.language) {
          i18n.changeLanguage(prefs.nativeLanguage);
        }
        initFromPreferences(prefs.activeTrackId);
        if (!prefs.onboardingCompleted) {
          navigate("/onboarding", { replace: true });
        } else if (!prefs.activeTrackId) {
          navigate("/select-track", { replace: true });
        }
      })
      .catch(() => {});
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-neutral-50">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-600 focus:shadow-md"
      >
        {t("skipToContent")}
      </a>
      <UpdatePrompt />
      <OfflineBanner />
      <EmailVerificationBanner />
      {showSync && (
        <div className="flex justify-end px-4 pt-2">
          <SyncStatusIndicator />
        </div>
      )}
      <main id="main-content" className="pb-20">
        <Outlet />
      </main>
      <BottomNav
        items={navItems}
        activeKey={getActiveKey(location.pathname)}
        onNavigate={(href) => navigate(href)}
      />
    </div>
  );
}
