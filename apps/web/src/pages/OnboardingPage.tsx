import { useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import {
  Check,
  BookOpen,
  Target,
  Sparkles,
  Globe,
  Palette,
  GraduationCap,
  ChevronRight,
  Layers,
  Brain,
  RotateCcw,
} from "lucide-react";
import { Button } from "@versado/ui";
import { useAuth } from "@/hooks/useAuth";
import { profileApi } from "@/lib/profile-api";
import { useTheme } from "@/contexts/ThemeContext";
import { ToggleSwitch } from "@/components/profile/ToggleSwitch";
import { CARD_THEMES, getCardTheme } from "@/lib/card-themes";
import { socialApi } from "@/lib/social-api";

/* ───────────── Constants ───────────── */

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "pt", label: "Português" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "it", label: "Italiano" },
  { code: "ja", label: "日本語" },
  { code: "ko", label: "한국어" },
  { code: "zh", label: "中文" },
  { code: "ru", label: "Русский" },
  { code: "ar", label: "العربية" },
  { code: "hi", label: "हिन्दी" },
] as const;

const TOPIC_KEYS = [
  "languages",
  "science",
  "math",
  "history",
  "geography",
  "programming",
  "medicine",
  "law",
  "music",
  "art",
  "literature",
  "philosophy",
  "psychology",
  "economics",
  "business",
  "cooking",
] as const;

const GOAL_PRESETS = [
  { value: 10, labelKey: "casual", descKey: "casualDesc" },
  { value: 25, labelKey: "regular", descKey: "regularDesc" },
  { value: 50, labelKey: "serious", descKey: "seriousDesc" },
  { value: 100, labelKey: "intense", descKey: "intenseDesc" },
] as const;

const STEPS = [
  "welcome",
  "language",
  "topics",
  "goal",
  "appearance",
  "tutorial",
] as const;
type Step = (typeof STEPS)[number];

/* ───────────── Component ───────────── */

export function OnboardingPage() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const { themePreference, setThemePreference } = useTheme();
  const { t, i18n } = useTranslation("onboarding");

  const [step, setStep] = useState<Step>("welcome");
  const [nativeLanguage, setNativeLanguage] = useState("en");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [dailyGoal, setDailyGoal] = useState(25);
  const [selectedCardTheme, setSelectedCardTheme] = useState(
    () => getCardTheme().key,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentIndex = STEPS.indexOf(step);

  const next = useCallback(() => {
    const nextStep = STEPS[currentIndex + 1];
    if (nextStep) setStep(nextStep);
  }, [currentIndex]);

  const toggleTopic = useCallback((topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic],
    );
  }, []);

  function handleLanguageSelect(code: string) {
    setNativeLanguage(code);
    // Switch UI language immediately for supported languages
    if (["en", "pt", "es", "fr", "de"].includes(code)) {
      i18n.changeLanguage(code);
    }
  }

  async function handleFinish() {
    setIsSubmitting(true);
    try {
      // Follow selected topics
      const followPromises = selectedTopics.map((topic) =>
        socialApi.followTag(topic.toLowerCase()).catch(() => {}),
      );
      await Promise.allSettled(followPromises);

      // Save preferences
      await profileApi.updatePreferences({
        dailyGoal,
        nativeLanguage,
        themePreference,
        cardTheme: selectedCardTheme,
        onboardingCompleted: true,
      });

      await refreshUser();
      navigate("/", { replace: true });
    } catch {
      try {
        await profileApi.updatePreferences({ onboardingCompleted: true });
        await refreshUser();
      } catch {
        // Ignore — redirect anyway
      }
      navigate("/", { replace: true });
    } finally {
      setIsSubmitting(false);
    }
  }

  /* ───── Step renderers ───── */

  const renderWelcome = () => (
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-100">
        <Sparkles className="h-8 w-8 text-primary-500" />
      </div>
      <h1 className="mt-6 text-2xl font-bold text-neutral-900 dark:text-neutral-100">
        {t("welcome.heading", { name: user?.displayName ? `, ${user.displayName}` : "" })}
      </h1>
      <p className="mt-3 max-w-xs text-sm leading-relaxed text-neutral-500">
        {t("welcome.subheading")}
      </p>
      <div className="mt-10 w-full">
        <Button fullWidth onClick={next}>
          {t("welcome.getStarted")}
        </Button>
      </div>
    </div>
  );

  const renderLanguage = () => (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-col items-center text-center pt-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-100">
          <Globe className="h-7 w-7 text-primary-500" />
        </div>
        <h1 className="mt-4 text-xl font-bold text-neutral-900 dark:text-neutral-100">
          {t("language.heading")}
        </h1>
        <p className="mt-2 max-w-xs text-sm text-neutral-500">
          {t("language.subheading")}
        </p>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-2 overflow-y-auto flex-1 pb-4">
        {LANGUAGES.map(({ code, label }) => (
          <button
            key={code}
            type="button"
            onClick={() => handleLanguageSelect(code)}
            className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left text-sm font-medium transition-all ${
              nativeLanguage === code
                ? "border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300"
                : "border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-900"
            }`}
          >
            {label}
            {nativeLanguage === code && (
              <Check className="ml-auto h-4 w-4 text-primary-500" />
            )}
          </button>
        ))}
      </div>
      <div className="pt-2 pb-4">
        <Button fullWidth onClick={next}>
          {t("topics.continueDefault")}
        </Button>
      </div>
    </div>
  );

  const renderTopics = () => (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-col items-center text-center pt-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-100">
          <BookOpen className="h-7 w-7 text-primary-500" />
        </div>
        <h1 className="mt-4 text-xl font-bold text-neutral-900 dark:text-neutral-100">
          {t("topics.heading")}
        </h1>
        <p className="mt-2 max-w-xs text-sm text-neutral-500">
          {t("topics.subheading")}
        </p>
      </div>
      <div className="mt-6 flex flex-wrap justify-center gap-2 overflow-y-auto flex-1 pb-4">
        {TOPIC_KEYS.map((key) => {
          const selected = selectedTopics.includes(key);
          return (
            <button
              key={key}
              type="button"
              onClick={() => toggleTopic(key)}
              className={`rounded-full border-2 px-4 py-2 text-sm font-medium transition-all ${
                selected
                  ? "border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300"
                  : "border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 bg-white dark:bg-neutral-900"
              }`}
            >
              {selected && <Check className="mr-1 inline h-3.5 w-3.5" />}
              {t(`topics.${key}`)}
            </button>
          );
        })}
      </div>
      <div className="pt-2 pb-4 flex flex-col gap-2">
        <Button fullWidth onClick={next}>
          {selectedTopics.length > 0
            ? t("topics.continue", { count: selectedTopics.length })
            : t("topics.continueDefault")}
        </Button>
        {selectedTopics.length === 0 && (
          <button
            type="button"
            onClick={next}
            className="text-sm font-medium text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            {t("topics.skip")}
          </button>
        )}
      </div>
    </div>
  );

  const renderGoal = () => (
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-100">
        <Target className="h-7 w-7 text-primary-500" />
      </div>
      <h1 className="mt-4 text-xl font-bold text-neutral-900 dark:text-neutral-100">
        {t("goal.heading")}
      </h1>
      <p className="mt-2 max-w-xs text-sm text-neutral-500">
        {t("goal.subheading")}
      </p>
      <div className="mt-8 flex w-full flex-col gap-3">
        {GOAL_PRESETS.map(({ value, labelKey, descKey }) => (
          <button
            key={value}
            type="button"
            onClick={() => setDailyGoal(value)}
            className={`flex items-center justify-between rounded-xl border-2 px-5 py-4 text-left transition-all ${
              dailyGoal === value
                ? "border-primary-500 bg-primary-50 dark:bg-primary-950"
                : "border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900"
            }`}
          >
            <span className="flex flex-col">
              <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                {t(`goal.${labelKey}`)}
              </span>
              <span className="text-xs text-neutral-500">{t(`goal.${descKey}`)}</span>
            </span>
            {dailyGoal === value && (
              <Check className="h-5 w-5 shrink-0 text-primary-500" />
            )}
          </button>
        ))}
      </div>
      <div className="mt-8 w-full">
        <Button fullWidth onClick={next}>
          {t("topics.continueDefault")}
        </Button>
      </div>
    </div>
  );

  const renderAppearance = () => {
    const isDark = themePreference === "dark";
    const activeTheme = getCardTheme(selectedCardTheme);

    return (
      <div className="flex flex-1 flex-col">
        <div className="flex flex-col items-center text-center pt-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-100">
            <Palette className="h-7 w-7 text-primary-500" />
          </div>
          <h1 className="mt-4 text-xl font-bold text-neutral-900 dark:text-neutral-100">
            {t("appearance.heading")}
          </h1>
          <p className="mt-2 max-w-xs text-sm text-neutral-500">
            {t("appearance.subheading")}
          </p>
        </div>

        {/* Dark mode toggle */}
        <div className="mt-6 flex items-center justify-between rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-4 py-3">
          <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
            {t("appearance.darkMode")}
          </span>
          <ToggleSwitch
            checked={isDark}
            onChange={(val) => setThemePreference(val ? "dark" : "light")}
          />
        </div>

        {/* Card theme grid */}
        <p className="mt-6 text-xs font-medium uppercase tracking-wider text-neutral-400">
          {t("appearance.cardTheme")}
        </p>
        <div className="mt-3 grid grid-cols-4 gap-3 overflow-y-auto flex-1 pb-4">
          {CARD_THEMES.map((theme) => (
            <button
              key={theme.key}
              type="button"
              onClick={() => setSelectedCardTheme(theme.key)}
              className="flex flex-col items-center gap-1.5"
            >
              <div
                className={`h-14 w-full rounded-xl ${theme.previewColor} ${
                  selectedCardTheme === theme.key
                    ? "ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-neutral-950"
                    : ""
                }`}
              />
              <span className="text-[11px] text-neutral-500">{theme.name}</span>
            </button>
          ))}
        </div>

        {/* Card preview */}
        <div
          className={`mt-2 p-4 ${activeTheme.cardClassName} flex flex-col items-center`}
        >
          <span
            className={`text-[10px] font-semibold uppercase tracking-widest ${activeTheme.labelClassName}`}
          >
            {t("appearance.preview")}
          </span>
          <p className={`mt-2 text-center text-lg font-semibold ${activeTheme.textClassName}`}>
            {t("appearance.previewQuestion")}
          </p>
        </div>

        <div className="pt-4 pb-4">
          <Button fullWidth onClick={next}>
            {t("topics.continueDefault")}
          </Button>
        </div>
      </div>
    );
  };

  const renderTutorial = () => {
    const tutorialCards = [
      {
        icon: <Layers className="h-6 w-6" />,
        title: t("tutorial.createDecks"),
        description: t("tutorial.createDecksDesc"),
      },
      {
        icon: <Brain className="h-6 w-6" />,
        title: t("tutorial.studySmart"),
        description: t("tutorial.studySmartDesc"),
      },
      {
        icon: <RotateCcw className="h-6 w-6" />,
        title: t("tutorial.reviewImprove"),
        description: t("tutorial.reviewImproveDesc"),
      },
    ];

    return (
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-100">
          <GraduationCap className="h-7 w-7 text-primary-500" />
        </div>
        <h1 className="mt-4 text-xl font-bold text-neutral-900 dark:text-neutral-100">
          {t("tutorial.heading")}
        </h1>
        <p className="mt-2 max-w-xs text-sm text-neutral-500">
          {t("tutorial.subheading")}
        </p>
        <div className="mt-8 flex w-full flex-col gap-4">
          {tutorialCards.map((card, i) => (
            <div
              key={i}
              className="flex items-start gap-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4 text-left"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-500">
                {card.icon}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  {card.title}
                </span>
                <span className="mt-0.5 text-xs leading-relaxed text-neutral-500">
                  {card.description}
                </span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-10 w-full">
          <Button fullWidth onClick={handleFinish} disabled={isSubmitting}>
            {isSubmitting ? (
              t("tutorial.settingUp")
            ) : (
              <span className="flex items-center justify-center gap-2">
                {t("tutorial.startLearning")} <ChevronRight className="h-4 w-4" />
              </span>
            )}
          </Button>
        </div>
      </div>
    );
  };

  /* ───── Render ───── */

  const stepRenderers: Record<Step, () => React.ReactNode> = {
    welcome: renderWelcome,
    language: renderLanguage,
    topics: renderTopics,
    goal: renderGoal,
    appearance: renderAppearance,
    tutorial: renderTutorial,
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-neutral-50 dark:bg-neutral-950 px-6">
      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2 pt-8 pb-6">
        {STEPS.map((s, i) => (
          <div
            key={s}
            className={`h-1.5 rounded-full transition-all ${
              i === currentIndex
                ? "w-6 bg-primary-500"
                : i < currentIndex
                  ? "w-1.5 bg-primary-300"
                  : "w-1.5 bg-neutral-200 dark:bg-neutral-700"
            }`}
          />
        ))}
      </div>

      <div className="flex flex-1 flex-col">{stepRenderers[step]()}</div>
    </div>
  );
}
