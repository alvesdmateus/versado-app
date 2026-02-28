import { useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Check,
  Sparkles,
  Globe,
  Palette,
  GraduationCap,
  ChevronRight,
  Layers,
  Brain,
  RotateCcw,
  Monitor,
  Sun,
  Moon,
  FlaskConical,
  Calculator,
  Landmark,
  MapPin,
  Code,
  Stethoscope,
  Scale,
  Music,
  Brush,
  BookText,
  Lightbulb,
  TrendingUp,
  Briefcase,
  UtensilsCrossed,
} from "lucide-react";
import { Button } from "@versado/ui";
import { useAuth } from "@/hooks/useAuth";
import { profileApi } from "@/lib/profile-api";
import { useTheme, type ThemePreference } from "@/contexts/ThemeContext";
import { CARD_THEMES, getCardTheme } from "@/lib/card-themes";
import { socialApi } from "@/lib/social-api";
import { SUPPORTED_LANGUAGES } from "@/i18n/supported-languages";

/* ───────────── Constants ───────────── */

const TOPICS = [
  { key: "languages", icon: Globe },
  { key: "science", icon: FlaskConical },
  { key: "math", icon: Calculator },
  { key: "history", icon: Landmark },
  { key: "geography", icon: MapPin },
  { key: "programming", icon: Code },
  { key: "medicine", icon: Stethoscope },
  { key: "law", icon: Scale },
  { key: "music", icon: Music },
  { key: "art", icon: Brush },
  { key: "literature", icon: BookText },
  { key: "philosophy", icon: Lightbulb },
  { key: "psychology", icon: Brain },
  { key: "economics", icon: TrendingUp },
  { key: "business", icon: Briefcase },
  { key: "cooking", icon: UtensilsCrossed },
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

  const prev = useCallback(() => {
    const prevStep = STEPS[currentIndex - 1];
    if (prevStep) setStep(prevStep);
  }, [currentIndex]);

  const totalSteps = STEPS.length;
  const stepNumber = currentIndex + 1;
  const progressPercent = Math.round((stepNumber / totalSteps) * 100);

  const toggleTopic = useCallback((topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic],
    );
  }, []);

  function handleLanguageSelect(code: string) {
    setNativeLanguage(code);
    i18n.changeLanguage(code);
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
      <h1 className="mt-6 text-2xl font-bold text-neutral-900">
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
        <h1 className="mt-4 text-xl font-bold text-neutral-900">
          {t("language.heading")}
        </h1>
        <p className="mt-2 max-w-xs text-sm text-neutral-500">
          {t("language.subheading")}
        </p>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-2 overflow-y-auto flex-1 pb-4">
        {SUPPORTED_LANGUAGES.map(({ code, label }) => (
          <button
            key={code}
            type="button"
            onClick={() => handleLanguageSelect(code)}
            className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left text-sm font-medium transition-all ${
              nativeLanguage === code
                ? "border-primary-500 bg-primary-50 text-primary-700"
                : "border-neutral-200 text-neutral-700 bg-neutral-0"
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
      <div className="pt-4">
        <h1 className="text-xl font-bold text-neutral-900">
          {t("topics.heading")}
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          {t("topics.subheading")}
        </p>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 overflow-y-auto flex-1 pb-4">
        {TOPICS.map(({ key, icon: Icon }) => {
          const selected = selectedTopics.includes(key);
          return (
            <button
              key={key}
              type="button"
              onClick={() => toggleTopic(key)}
              className={`relative flex flex-col items-start gap-2 rounded-xl border-2 p-4 text-left transition-all ${
                selected
                  ? "border-primary-500 bg-primary-50"
                  : "border-neutral-200 bg-neutral-0"
              }`}
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                  selected
                    ? "bg-primary-100 text-primary-600"
                    : "bg-neutral-100 text-neutral-400"
                }`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <span
                className={`text-sm font-medium ${
                  selected ? "text-primary-700" : "text-neutral-700"
                }`}
              >
                {t(`topics.${key}`)}
              </span>
              {selected && (
                <div className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary-500">
                  <Check className="h-3 w-3 text-white" />
                </div>
              )}
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
    <div className="flex flex-1 flex-col">
      <div className="pt-4">
        <h1 className="text-xl font-bold text-neutral-900">
          {t("goal.heading")}
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          {t("goal.subheading")}
        </p>
      </div>

      {/* Large number display */}
      <div className="mt-8 flex flex-col items-center">
        <span className="text-5xl font-bold text-primary-500">{dailyGoal}</span>
        <span className="mt-1 text-xs font-semibold uppercase tracking-widest text-neutral-400">
          {t("goal.cardsPerDay")}
        </span>
      </div>

      {/* 2x2 preset grid */}
      <div className="mt-8 grid grid-cols-2 gap-3">
        {GOAL_PRESETS.map(({ value, labelKey }) => (
          <button
            key={value}
            type="button"
            onClick={() => setDailyGoal(value)}
            className={`flex flex-col items-center gap-1 rounded-xl border-2 py-4 transition-all ${
              dailyGoal === value
                ? "border-primary-500 bg-primary-50"
                : "border-neutral-200 bg-neutral-0"
            }`}
          >
            <span
              className={`text-[10px] font-bold uppercase tracking-wider ${
                dailyGoal === value ? "text-primary-600" : "text-neutral-400"
              }`}
            >
              {t(`goal.${labelKey}`)}
            </span>
            <span
              className={`text-xl font-bold ${
                dailyGoal === value ? "text-primary-700" : "text-neutral-700"
              }`}
            >
              {value}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-auto pt-6 pb-4">
        <Button fullWidth onClick={next}>
          {t("topics.continueDefault")}
        </Button>
      </div>
    </div>
  );

  const renderAppearance = () => {
    const activeTheme = getCardTheme(selectedCardTheme);

    const themeOptions: { pref: ThemePreference; labelKey: string; icon: React.ReactNode }[] = [
      { pref: "system", labelKey: "appearance.themeSystem", icon: <Monitor className="h-5 w-5" /> },
      { pref: "light", labelKey: "appearance.themeLight", icon: <Sun className="h-5 w-5" /> },
      { pref: "dark", labelKey: "appearance.themeDark", icon: <Moon className="h-5 w-5" /> },
    ];

    return (
      <div className="flex flex-1 flex-col">
        <div className="flex flex-col items-center text-center pt-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-100">
            <Palette className="h-7 w-7 text-primary-500" />
          </div>
          <h1 className="mt-4 text-xl font-bold text-neutral-900">
            {t("appearance.heading")}
          </h1>
          <p className="mt-2 max-w-xs text-sm text-neutral-500">
            {t("appearance.subheading")}
          </p>
        </div>

        {/* Theme mode selector */}
        <div className="mt-6 grid grid-cols-3 gap-2">
          {themeOptions.map(({ pref, labelKey, icon }) => (
            <button
              key={pref}
              type="button"
              onClick={() => setThemePreference(pref)}
              className={`flex flex-col items-center gap-2 rounded-xl border-2 px-3 py-4 transition-all ${
                themePreference === pref
                  ? "border-primary-500 bg-primary-50 text-primary-700"
                  : "border-neutral-200 text-neutral-600 bg-neutral-0"
              }`}
            >
              {icon}
              <span className="text-xs font-medium">{t(labelKey)}</span>
            </button>
          ))}
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
                    ? "ring-2 ring-primary-500 ring-offset-2"
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
        <h1 className="mt-4 text-xl font-bold text-neutral-900">
          {t("tutorial.heading")}
        </h1>
        <p className="mt-2 max-w-xs text-sm text-neutral-500">
          {t("tutorial.subheading")}
        </p>
        <div className="mt-8 flex w-full flex-col gap-4">
          {tutorialCards.map((card, i) => (
            <div
              key={i}
              className="flex items-start gap-4 rounded-xl border border-neutral-200 bg-neutral-0 p-4 text-left"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-500">
                {card.icon}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-neutral-900">
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
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-neutral-50 px-6">
      {/* Header: back arrow + step title */}
      <div className="relative flex items-center justify-center pt-6 pb-4">
        {currentIndex > 0 && (
          <button
            type="button"
            onClick={prev}
            className="absolute left-0 flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-neutral-100"
          >
            <ArrowLeft className="h-5 w-5 text-neutral-700" />
          </button>
        )}
        <h2 className="text-base font-bold text-neutral-900">
          {t(`steps.${step}`)}
        </h2>
      </div>

      {/* Step indicator + progress bar */}
      <div className="pb-4">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
            {t("stepOf", { current: stepNumber, total: totalSteps })}
          </span>
          <span className="text-[11px] font-semibold text-primary-500">
            {progressPercent}%
          </span>
        </div>
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-neutral-200">
          <div
            className="h-full rounded-full bg-primary-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="flex flex-1 flex-col">{stepRenderers[step]()}</div>
    </div>
  );
}
