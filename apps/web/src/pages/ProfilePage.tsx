import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router";
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
import { DeleteAccountModal } from "@/components/profile/DeleteAccountModal";
import { SubscriptionSection } from "@/components/profile/SubscriptionSection";
import { getCardTheme } from "@/lib/card-themes";

const SORTING_LABELS: Record<string, string> = {
  due_first: "Due First",
  random: "Random",
  difficulty: "By Difficulty",
};

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isDark, setDarkMode } = useTheme();
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
      <SettingsSection label="Appearance">
        <SettingRow
          icon={<Moon className="h-5 w-5" />}
          label="Dark Mode"
          rightElement={
            <ToggleSwitch
              checked={isDark}
              onChange={handleDarkModeToggle}
            />
          }
        />
        <SettingRow
          icon={<Palette className="h-5 w-5" />}
          label="Theme Color"
          value={preferences?.themeColor ?? "Sky"}
          onClick={() => setIsThemeColorOpen(true)}
        />
        <SettingRow
          icon={<CreditCard className="h-5 w-5" />}
          label="Card Theme"
          value={getCardTheme(preferences?.cardTheme).name}
          onClick={() => setIsCardThemeOpen(true)}
        />
      </SettingsSection>

      {/* Study Preferences */}
      <SettingsSection label="Study Preferences">
        <SettingRow
          icon={<Target className="h-5 w-5" />}
          label="Daily Goal"
          value={`${preferences?.dailyGoal ?? 50} Cards`}
          onClick={() => setIsDailyGoalOpen(true)}
        />
        <SettingRow
          icon={<Clock className="h-5 w-5" />}
          label="Reminder Times"
          value={
            preferences?.reminderTimes?.length
              ? `${preferences.reminderTimes.length} set`
              : "None"
          }
          onClick={() => setIsReminderTimesOpen(true)}
        />
        <SettingRow
          icon={<ArrowUpDown className="h-5 w-5" />}
          label="Card Sorting Logic"
          value={
            SORTING_LABELS[preferences?.cardSortingLogic ?? "due_first"] ??
            "Due First"
          }
          onClick={() => setIsCardSortingOpen(true)}
        />
      </SettingsSection>

      {/* Notifications */}
      <SettingsSection label="Notifications">
        <SettingRow
          icon={<Bell className="h-5 w-5" />}
          label="Push Alerts"
          rightElement={
            <ToggleSwitch
              checked={preferences?.pushAlerts ?? true}
              onChange={(v) => handleToggle("pushAlerts", v)}
            />
          }
        />
      </SettingsSection>

      {/* Account */}
      <SettingsSection label="Account">
        <SettingRow
          icon={<Lock className="h-5 w-5" />}
          label="Change Password"
          onClick={() => setIsPasswordOpen(true)}
        />
        <SettingRow
          icon={<Download className="h-5 w-5" />}
          label="Export Data"
          onClick={() => setIsExportOpen(true)}
        />
        <SettingRow
          icon={<Trash2 className="h-5 w-5" />}
          label="Delete Account"
          danger
          onClick={() => setIsDeleteOpen(true)}
        />
        <SettingRow
          icon={<LogOut className="h-5 w-5" />}
          label="Log Out"
          danger
          onClick={handleLogout}
        />
      </SettingsSection>

      {/* Footer */}
      <div className="mt-8 mb-2 flex flex-col items-center gap-1 px-5">
        <p className="text-xs text-neutral-400">Versado v2.0.0</p>
        <div className="flex gap-3">
          <Link to="/terms" className="text-xs text-neutral-400 hover:text-neutral-600">Terms</Link>
          <Link to="/privacy" className="text-xs text-neutral-400 hover:text-neutral-600">Privacy</Link>
          <button className="text-xs text-neutral-400 hover:text-neutral-600">Support</button>
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
