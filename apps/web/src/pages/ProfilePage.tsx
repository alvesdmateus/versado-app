import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router";
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
  Trash2,
  LogOut,
  Languages,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme, type ThemePreference } from "@/contexts/ThemeContext";
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
import { DeleteAccountModal } from "@/components/profile/DeleteAccountModal";
import { SubscriptionSection } from "@/components/profile/SubscriptionSection";
import { getCardTheme } from "@/lib/card-themes";
import { useErrorNotification } from "@/contexts/ErrorNotificationContext";
import { useToast } from "@/contexts/ToastContext";
import { subscribeToPush, unsubscribeFromPush } from "@/lib/push-manager";

const SUPPORTED_LANGUAGES = ["en", "pt", "es", "fr", "de"] as const;
const LANGUAGE_LABELS: Record<string, string> = {
  en: "English",
  pt: "Português",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
};

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { themePreference, setThemePreference } = useTheme();
  const { showErrorNotification } = useErrorNotification();
  const { showToast } = useToast();
  const { t, i18n } = useTranslation("profile");
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);

  // Modal states
  const [isDailyGoalOpen, setIsDailyGoalOpen] = useState(false);
  const [isThemeColorOpen, setIsThemeColorOpen] = useState(false);
  const [isCardThemeOpen, setIsCardThemeOpen] = useState(false);
  const [isCardSortingOpen, setIsCardSortingOpen] = useState(false);
  const [isReminderTimesOpen, setIsReminderTimesOpen] = useState(false);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  useEffect(() => {
    profileApi.getPreferences().then((prefs) => {
      setPreferences(prefs);
    }).catch((err) => showErrorNotification(err));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleThemePreferenceChange(pref: ThemePreference) {
    const prev = themePreference;
    setThemePreference(pref);
    setPreferences((p) => (p ? { ...p, themePreference: pref } : p));
    try {
      await profileApi.updatePreferences({ themePreference: pref });
    } catch {
      setThemePreference(prev);
      setPreferences((p) => (p ? { ...p, themePreference: prev } : p));
    }
  }

  async function handleLanguageChange() {
    const currentIdx = SUPPORTED_LANGUAGES.indexOf(i18n.language as typeof SUPPORTED_LANGUAGES[number]);
    const newLang = SUPPORTED_LANGUAGES[(currentIdx + 1) % SUPPORTED_LANGUAGES.length];
    const prevLang = i18n.language;
    i18n.changeLanguage(newLang);
    try {
      await profileApi.updatePreferences({ nativeLanguage: newLang });
      setPreferences((p) => (p ? { ...p, nativeLanguage: newLang } : p));
    } catch {
      i18n.changeLanguage(prevLang);
    }
  }

  async function handlePushToggle(value: boolean) {
    setPreferences((prev) => (prev ? { ...prev, pushAlerts: value } : prev));
    try {
      if (value) {
        const success = await subscribeToPush();
        if (!success) {
          setPreferences((prev) =>
            prev ? { ...prev, pushAlerts: false } : prev
          );
          showToast(t("settings.pushDenied"), "error");
          return;
        }
      } else {
        await unsubscribeFromPush();
      }
      await profileApi.updatePreferences({ pushAlerts: value });
    } catch {
      setPreferences((prev) =>
        prev ? { ...prev, pushAlerts: !value } : prev
      );
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
      <SettingsSection label={t("sections.appearance")}>
        <SettingRow
          icon={<Moon className="h-5 w-5" />}
          label={t("settings.theme")}
          rightElement={
            <div className="flex rounded-lg bg-neutral-100 p-0.5 gap-0.5">
              {(["system", "light", "dark"] as ThemePreference[]).map((pref) => (
                <button
                  key={pref}
                  type="button"
                  onClick={() => handleThemePreferenceChange(pref)}
                  className={`rounded-md px-3 py-1 text-xs font-medium capitalize transition-all ${
                    (preferences?.themePreference ?? themePreference) === pref
                      ? "bg-neutral-0 text-neutral-900 shadow-sm"
                      : "text-neutral-500 hover:text-neutral-700"
                  }`}
                >
                  {t(`settings.${pref}`)}
                </button>
              ))}
            </div>
          }
        />
        <SettingRow
          icon={<Palette className="h-5 w-5" />}
          label={t("settings.themeColor")}
          value={preferences?.themeColor ?? "Sky"}
          onClick={() => setIsThemeColorOpen(true)}
        />
        <SettingRow
          icon={<CreditCard className="h-5 w-5" />}
          label={t("settings.cardTheme")}
          value={getCardTheme(preferences?.cardTheme).name}
          onClick={() => setIsCardThemeOpen(true)}
        />
        <SettingRow
          icon={<Languages className="h-5 w-5" />}
          label={t("settings.language")}
          value={LANGUAGE_LABELS[i18n.language] ?? i18n.language}
          onClick={handleLanguageChange}
        />
      </SettingsSection>

      {/* Study Preferences */}
      <SettingsSection label={t("sections.studyPreferences")}>
        <SettingRow
          icon={<Target className="h-5 w-5" />}
          label={t("settings.dailyGoal")}
          value={t("settings.cards", { count: preferences?.dailyGoal ?? 50 })}
          onClick={() => setIsDailyGoalOpen(true)}
        />
        <SettingRow
          icon={<Clock className="h-5 w-5" />}
          label={t("settings.reminderTimes")}
          value={
            preferences?.reminderTimes?.length
              ? t("settings.remindersSet", { count: preferences.reminderTimes.length })
              : t("settings.remindersNone")
          }
          onClick={() => setIsReminderTimesOpen(true)}
        />
        <SettingRow
          icon={<ArrowUpDown className="h-5 w-5" />}
          label={t("settings.cardSorting")}
          value={
            t(`sorting.${
              preferences?.cardSortingLogic === "random"
                ? "random"
                : preferences?.cardSortingLogic === "difficulty"
                  ? "byDifficulty"
                  : "dueFirst"
            }`)
          }
          onClick={() => setIsCardSortingOpen(true)}
        />
      </SettingsSection>

      {/* Notifications */}
      <SettingsSection label={t("sections.notifications")}>
        <SettingRow
          icon={<Bell className="h-5 w-5" />}
          label={t("settings.pushAlerts")}
          rightElement={
            <ToggleSwitch
              checked={preferences?.pushAlerts ?? true}
              onChange={(v) => handlePushToggle(v)}
            />
          }
        />
      </SettingsSection>

      {/* Account */}
      <SettingsSection label={t("sections.account")}>
        <SettingRow
          icon={<Lock className="h-5 w-5" />}
          label={t("settings.changePassword")}
          onClick={() => setIsPasswordOpen(true)}
        />
        <SettingRow
          icon={<Download className="h-5 w-5" />}
          label={t("settings.exportData")}
          onClick={() => setIsExportOpen(true)}
        />
        <SettingRow
          icon={<Trash2 className="h-5 w-5" />}
          label={t("settings.deleteAccount")}
          danger
          onClick={() => setIsDeleteOpen(true)}
        />
        <SettingRow
          icon={<LogOut className="h-5 w-5" />}
          label={t("settings.logOut")}
          danger
          onClick={handleLogout}
        />
      </SettingsSection>

      {/* Footer */}
      <div className="mt-8 mb-2 flex flex-col items-center gap-1 px-5">
        <p className="text-xs text-neutral-400">Versado v2.0.0</p>
        <div className="flex gap-3">
          <Link to="/terms" className="text-xs text-neutral-400 hover:text-neutral-600">{t("footer.terms")}</Link>
          <Link to="/privacy" className="text-xs text-neutral-400 hover:text-neutral-600">{t("footer.privacy")}</Link>
          <button className="text-xs text-neutral-400 hover:text-neutral-600">{t("footer.support")}</button>
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
      <DeleteAccountModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
      />
    </div>
  );
}
