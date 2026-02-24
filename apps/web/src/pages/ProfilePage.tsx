import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import {
  Moon,
  Palette,
  CreditCard,
  Target,
  Clock,
  ArrowUpDown,
  Bell,
  Lock,
  Download,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { profileApi, type UserPreferences } from "@/lib/profile-api";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { UserInfoCard } from "@/components/profile/UserInfoCard";
import { UpgradeBanner } from "@/components/profile/UpgradeBanner";
import { SettingsSection } from "@/components/profile/SettingsSection";
import { SettingRow } from "@/components/profile/SettingRow";
import { ToggleSwitch } from "@/components/profile/ToggleSwitch";
import { DailyGoalModal } from "@/components/profile/DailyGoalModal";
import { ThemeColorModal } from "@/components/profile/ThemeColorModal";
import { CardSortingModal } from "@/components/profile/CardSortingModal";
import { ReminderTimesModal } from "@/components/profile/ReminderTimesModal";
import { ChangePasswordModal } from "@/components/profile/ChangePasswordModal";
import { ExportDataModal } from "@/components/profile/ExportDataModal";
import { CardThemeModal } from "@/components/profile/CardThemeModal";
import { SubscriptionSection } from "@/components/profile/SubscriptionSection";
import { getCardTheme } from "@/lib/card-themes";

export function ProfilePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { isDark, setDarkMode } = useTheme();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);

  const SORTING_LABELS: Record<string, string> = {
    due_first: t("profile.sortingDueFirst"),
    random: t("profile.sortingRandom"),
    difficulty: t("profile.sortingDifficulty"),
  };

  // Modal states
  const [isDailyGoalOpen, setIsDailyGoalOpen] = useState(false);
  const [isThemeColorOpen, setIsThemeColorOpen] = useState(false);
  const [isCardThemeOpen, setIsCardThemeOpen] = useState(false);
  const [isCardSortingOpen, setIsCardSortingOpen] = useState(false);
  const [isReminderTimesOpen, setIsReminderTimesOpen] = useState(false);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  useEffect(() => {
    profileApi.getPreferences().then((prefs) => {
      setPreferences(prefs);
      if (!localStorage.getItem("theme") && prefs.darkMode) {
        setDarkMode(true);
      }
    }).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleDarkModeToggle(value: boolean) {
    setDarkMode(value);
    setPreferences((prev) => (prev ? { ...prev, darkMode: value } : prev));
    try {
      await profileApi.updatePreferences({ darkMode: value });
    } catch {
      setDarkMode(!value);
      setPreferences((prev) => (prev ? { ...prev, darkMode: !value } : prev));
    }
  }

  async function handleToggle(
    key: keyof Pick<UserPreferences, "pushAlerts">,
    value: boolean
  ) {
    setPreferences((prev) => (prev ? { ...prev, [key]: value } : prev));
    try {
      await profileApi.updatePreferences({ [key]: value });
    } catch {
      setPreferences((prev) => (prev ? { ...prev, [key]: !value } : prev));
    }
  }

  async function handleLogout() {
    await logout();
    navigate("/auth/login");
  }

  return (
    <div className="pb-4">
      <ProfileHeader />

      <UserInfoCard
        displayName={user?.displayName ?? ""}
        email={user?.email ?? ""}
        avatarUrl={user?.avatarUrl ?? null}
        tier={user?.tier ?? "free"}
      />

      {user?.tier === "free" && <UpgradeBanner />}
      {user?.tier === "fluent" && <SubscriptionSection />}

      {/* Appearance */}
      <SettingsSection label={t("profile.appearance")}>
        <SettingRow
          icon={<Moon className="h-5 w-5" />}
          label={t("profile.darkMode")}
          rightElement={
            <ToggleSwitch
              checked={isDark}
              onChange={handleDarkModeToggle}
            />
          }
        />
        <SettingRow
          icon={<Palette className="h-5 w-5" />}
          label={t("profile.themeColor")}
          value={preferences?.themeColor ?? "Sky"}
          onClick={() => setIsThemeColorOpen(true)}
        />
        <SettingRow
          icon={<CreditCard className="h-5 w-5" />}
          label={t("profile.cardTheme")}
          value={getCardTheme(preferences?.cardTheme).name}
          onClick={() => setIsCardThemeOpen(true)}
        />
      </SettingsSection>

      {/* Study Preferences */}
      <SettingsSection label={t("profile.studyPreferences")}>
        <SettingRow
          icon={<Target className="h-5 w-5" />}
          label={t("profile.dailyGoal")}
          value={`${preferences?.dailyGoal ?? 50} Cards`}
          onClick={() => setIsDailyGoalOpen(true)}
        />
        <SettingRow
          icon={<Clock className="h-5 w-5" />}
          label={t("profile.reminderTimes")}
          value={
            preferences?.reminderTimes?.length
              ? `${preferences.reminderTimes.length} set`
              : "None"
          }
          onClick={() => setIsReminderTimesOpen(true)}
        />
        <SettingRow
          icon={<ArrowUpDown className="h-5 w-5" />}
          label={t("profile.cardSorting")}
          value={
            SORTING_LABELS[preferences?.cardSortingLogic ?? "due_first"] ??
            t("profile.sortingDueFirst")
          }
          onClick={() => setIsCardSortingOpen(true)}
        />
      </SettingsSection>

      {/* Notifications */}
      <SettingsSection label={t("profile.notifications")}>
        <SettingRow
          icon={<Bell className="h-5 w-5" />}
          label={t("profile.pushAlerts")}
          rightElement={
            <ToggleSwitch
              checked={preferences?.pushAlerts ?? true}
              onChange={(v) => handleToggle("pushAlerts", v)}
            />
          }
        />
      </SettingsSection>

      {/* Account */}
      <SettingsSection label={t("profile.account")}>
        <SettingRow
          icon={<Lock className="h-5 w-5" />}
          label={t("profile.changePassword")}
          onClick={() => setIsPasswordOpen(true)}
        />
        <SettingRow
          icon={<Download className="h-5 w-5" />}
          label={t("profile.exportData")}
          onClick={() => setIsExportOpen(true)}
        />
        <SettingRow
          icon={<LogOut className="h-5 w-5" />}
          label={t("profile.logout")}
          danger
          onClick={handleLogout}
        />
      </SettingsSection>

      {/* Footer */}
      <div className="mt-8 mb-2 flex flex-col items-center gap-1 px-5">
        <p className="text-xs text-neutral-400">{t("profile.version")}</p>
        <div className="flex gap-3">
          <button className="text-xs text-neutral-400 hover:text-neutral-600">{t("profile.terms")}</button>
          <button className="text-xs text-neutral-400 hover:text-neutral-600">{t("profile.privacy")}</button>
          <button className="text-xs text-neutral-400 hover:text-neutral-600">{t("profile.support")}</button>
        </div>
      </div>

      {/* Modals */}
      <DailyGoalModal
        isOpen={isDailyGoalOpen}
        onClose={() => setIsDailyGoalOpen(false)}
        currentGoal={preferences?.dailyGoal ?? 50}
        onSaved={(goal) =>
          setPreferences((prev) => (prev ? { ...prev, dailyGoal: goal } : prev))
        }
      />
      <ThemeColorModal
        isOpen={isThemeColorOpen}
        onClose={() => setIsThemeColorOpen(false)}
        currentColor={preferences?.themeColor ?? "sky"}
        onSaved={(color) =>
          setPreferences((prev) =>
            prev ? { ...prev, themeColor: color } : prev
          )
        }
      />
      <CardSortingModal
        isOpen={isCardSortingOpen}
        onClose={() => setIsCardSortingOpen(false)}
        currentSorting={preferences?.cardSortingLogic ?? "due_first"}
        onSaved={(sorting) =>
          setPreferences((prev) =>
            prev ? { ...prev, cardSortingLogic: sorting as UserPreferences["cardSortingLogic"] } : prev
          )
        }
      />
      <ReminderTimesModal
        isOpen={isReminderTimesOpen}
        onClose={() => setIsReminderTimesOpen(false)}
        currentTimes={preferences?.reminderTimes ?? []}
        onSaved={(times) =>
          setPreferences((prev) =>
            prev ? { ...prev, reminderTimes: times } : prev
          )
        }
      />
      <CardThemeModal
        isOpen={isCardThemeOpen}
        onClose={() => setIsCardThemeOpen(false)}
        currentTheme={preferences?.cardTheme ?? "classic"}
        onSaved={(theme) =>
          setPreferences((prev) =>
            prev ? { ...prev, cardTheme: theme } : prev
          )
        }
      />
      <ChangePasswordModal
        isOpen={isPasswordOpen}
        onClose={() => setIsPasswordOpen(false)}
      />
      <ExportDataModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
      />
    </div>
  );
}
