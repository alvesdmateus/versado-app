import { useState, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";
import { BottomNav, type BottomNavItem } from "@versado/ui";
import { SyncStatusIndicator } from "@/components/shared/SyncStatusIndicator";
import { UpdatePrompt } from "@/components/shared/UpdatePrompt";
import { OfflineBanner } from "@/components/shared/OfflineBanner";
import { profileApi } from "@/lib/profile-api";
import { useTranslation } from "react-i18next";
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

function MarketIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
      <path fillRule="evenodd" d="M7.5 6v.75H5.513c-.96 0-1.764.724-1.865 1.679l-1.263 12A1.875 1.875 0 0 0 4.25 22.5h15.5a1.875 1.875 0 0 0 1.865-2.071l-1.263-12a1.875 1.875 0 0 0-1.865-1.679H16.5V6a4.5 4.5 0 1 0-9 0ZM12 3a3 3 0 0 0-3 3v.75h6V6a3 3 0 0 0-3-3Zm-3 8.25a3 3 0 1 0 6 0v-.75a.75.75 0 0 1 1.5 0v.75a4.5 4.5 0 1 1-9 0v-.75a.75.75 0 0 1 1.5 0v.75Z" clipRule="evenodd" />
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
  if (pathname.startsWith("/market")) return "market";
  if (pathname.startsWith("/profile")) return "profile";
  return "home";
}

export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [onboardingChecked, setOnboardingChecked] = useState(false);

  const NAV_ITEMS: BottomNavItem[] = [
    { key: "home", label: t("nav.home"), icon: <HomeIcon />, href: "/" },
    { key: "decks", label: t("nav.decks"), icon: <DecksIcon />, href: "/decks" },
    { key: "market", label: t("nav.market"), icon: <MarketIcon />, href: "/market" },
    { key: "profile", label: t("nav.profile"), icon: <ProfileIcon />, href: "/profile" },
  ];

  useEffect(() => {
    profileApi
      .getPreferences()
      .then((prefs) => {
        if (prefs.nativeLanguage) {
          i18n.changeLanguage(prefs.nativeLanguage);
          document.documentElement.dir = prefs.nativeLanguage === "ar" ? "rtl" : "ltr";
        }
        if (!prefs.hasCompletedOnboarding) {
          navigate("/onboard", { replace: true });
        } else {
          setOnboardingChecked(true);
        }
      })
      .catch(() => {
        setOnboardingChecked(true);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!onboardingChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50">
        <p className="text-sm text-neutral-400">{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <UpdatePrompt />
      <OfflineBanner />
      <div className="flex justify-end px-4 pt-2">
        <SyncStatusIndicator />
      </div>
      <main className="pb-20">
        <Outlet />
      </main>
      <BottomNav
        items={NAV_ITEMS}
        activeKey={getActiveKey(location.pathname)}
        onNavigate={(href) => navigate(href)}
      />
    </div>
  );
}
