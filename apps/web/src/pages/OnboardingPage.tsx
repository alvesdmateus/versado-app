import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  User,
  Layers,
  BookOpen,
  Globe,
  Moon,
  FlaskConical,
  Cross,
  Landmark,
  Code2,
  Calculator,
  Scale,
  Music,
  Palette,
  MapPin,
  Brain,
  Lightbulb,
  TrendingUp,
  Coins,
  Library,
  Cog,
  Search,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@versado/ui";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { profileApi } from "@/lib/profile-api";
import { socialApi } from "@/lib/social-api";
import { CARD_THEMES, getCardTheme } from "@/lib/card-themes";
import { ToggleSwitch } from "@/components/profile/ToggleSwitch";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TOTAL_STEPS = 6;

const LANGUAGES: { code: string; labelKey: string; flag: string }[] = [
  { code: "en", labelKey: "onboarding.languages.english", flag: "🇺🇸" },
  { code: "pt", labelKey: "onboarding.languages.portuguese", flag: "🇧🇷" },
  { code: "es", labelKey: "onboarding.languages.spanish", flag: "🇪🇸" },
  { code: "fr", labelKey: "onboarding.languages.french", flag: "🇫🇷" },
  { code: "de", labelKey: "onboarding.languages.german", flag: "🇩🇪" },
  { code: "ja", labelKey: "onboarding.languages.japanese", flag: "🇯🇵" },
  { code: "ko", labelKey: "onboarding.languages.korean", flag: "🇰🇷" },
  { code: "zh", labelKey: "onboarding.languages.chinese", flag: "🇨🇳" },
  { code: "it", labelKey: "onboarding.languages.italian", flag: "🇮🇹" },
  { code: "ar", labelKey: "onboarding.languages.arabic", flag: "🇸🇦" },
  { code: "hi", labelKey: "onboarding.languages.hindi", flag: "🇮🇳" },
  { code: "ru", labelKey: "onboarding.languages.russian", flag: "🇷🇺" },
];

const TOPICS: { tag: string; labelKey: string; icon: LucideIcon }[] = [
  { tag: "languages", labelKey: "onboarding.topics.languages", icon: Globe },
  { tag: "medicine", labelKey: "onboarding.topics.medicine", icon: Cross },
  { tag: "programming", labelKey: "onboarding.topics.programming", icon: Code2 },
  { tag: "history", labelKey: "onboarding.topics.history", icon: Landmark },
  { tag: "science", labelKey: "onboarding.topics.science", icon: FlaskConical },
  { tag: "math", labelKey: "onboarding.topics.math", icon: Calculator },
  { tag: "law", labelKey: "onboarding.topics.law", icon: Scale },
  { tag: "music", labelKey: "onboarding.topics.music", icon: Music },
  { tag: "art", labelKey: "onboarding.topics.art", icon: Palette },
  { tag: "geography", labelKey: "onboarding.topics.geography", icon: MapPin },
  { tag: "psychology", labelKey: "onboarding.topics.psychology", icon: Brain },
  { tag: "philosophy", labelKey: "onboarding.topics.philosophy", icon: Lightbulb },
  { tag: "business", labelKey: "onboarding.topics.business", icon: TrendingUp },
  { tag: "economics", labelKey: "onboarding.topics.economics", icon: Coins },
  { tag: "literature", labelKey: "onboarding.topics.literature", icon: Library },
  { tag: "engineering", labelKey: "onboarding.topics.engineering", icon: Cog },
];

const DAILY_GOAL_OPTIONS: { value: number; labelKey: string }[] = [
  { value: 10, labelKey: "onboarding.language.casual" },
  { value: 25, labelKey: "onboarding.language.steady" },
  { value: 50, labelKey: "onboarding.language.serious" },
  { value: 100, labelKey: "onboarding.language.intense" },
];

const TUTORIAL_CARDS: {
  icon: LucideIcon;
  titleKey: string;
  descriptionKey: string;
  iconBg: string;
  iconColor: string;
}[] = [
  {
    icon: Layers,
    titleKey: "onboarding.tutorial.createDecks",
    descriptionKey: "onboarding.tutorial.createDecksDesc",
    iconBg: "bg-violet-100",
    iconColor: "text-violet-500",
  },
  {
    icon: BookOpen,
    titleKey: "onboarding.tutorial.studySmart",
    descriptionKey: "onboarding.tutorial.studySmartDesc",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-500",
  },
  {
    icon: Globe,
    titleKey: "onboarding.tutorial.explore",
    descriptionKey: "onboarding.tutorial.exploreDesc",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-500",
  },
];

// ---------------------------------------------------------------------------
// OnboardingPage
// ---------------------------------------------------------------------------

export function OnboardingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDark, setDarkMode } = useTheme();
  const { t } = useTranslation();

  const [currentStep, setCurrentStep] = useState(0);

  // Step 2 — Language
  const defaultLang = useMemo(() => {
    const browserLang = navigator.language.split("-")[0];
    return LANGUAGES.find((l) => l.code === browserLang)?.code ?? "en";
  }, []);
  const [selectedLanguage, setSelectedLanguage] = useState(defaultLang);

  // Step 3 — Topics
  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(new Set());

  // Step 4 — Daily goal
  const [dailyGoal, setDailyGoal] = useState(50);

  // Step 5 — Appearance
  const [selectedCardTheme, setSelectedCardTheme] = useState("classic");

  function handleBack() {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  }

  function handleSkip() {
    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleFinish();
    }
  }

  async function handleNext() {
    // Save data for the current step
    try {
      switch (currentStep) {
        case 0:
          // Welcome — nothing to save
          break;
        case 1:
          // Language
          await profileApi.updatePreferences({
            nativeLanguage: selectedLanguage,
          });
          break;
        case 2:
          // Topics — follow all selected tags
          await Promise.all(
            Array.from(selectedTopics).map((tag) => socialApi.followTag(tag))
          );
          break;
        case 3:
          // Daily goal
          await profileApi.updatePreferences({ dailyGoal });
          break;
        case 4:
          // Appearance
          await profileApi.updatePreferences({
            darkMode: isDark,
            cardTheme: selectedCardTheme,
          });
          break;
        case 5:
          // Tutorial — finish
          handleFinish();
          return;
      }
    } catch {
      // Continue even if save fails
    }

    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep(currentStep + 1);
    }
  }

  async function handleFinish() {
    try {
      await profileApi.updatePreferences({ hasCompletedOnboarding: true });
    } catch {
      // Continue anyway
    }
    navigate("/");
  }

  function toggleTopic(tag: string) {
    setSelectedTopics((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) {
        next.delete(tag);
      } else {
        next.add(tag);
      }
      return next;
    });
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-neutral-50">
      {/* Header */}
      <header className="px-5 pt-4 pb-2">
        <div className="flex items-center">
          {currentStep > 0 ? (
            <button
              onClick={handleBack}
              className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          ) : (
            <div className="h-9 w-9" />
          )}

          <span className="flex-1 text-center text-xs font-semibold uppercase tracking-wider text-neutral-400">
            {t("onboarding.step", {
              current: currentStep + 1,
              total: TOTAL_STEPS,
            })}
          </span>

          {currentStep === TOTAL_STEPS - 1 ? (
            <span className="text-xs font-medium text-neutral-400">
              {t("onboarding.complete")}
            </span>
          ) : (
            <div className="h-9 w-9" />
          )}
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-neutral-200">
          <div
            className="h-full rounded-full bg-primary-500 transition-all duration-300"
            style={{
              width: `${((currentStep + 1) / TOTAL_STEPS) * 100}%`,
            }}
          />
        </div>
      </header>

      {/* Step content */}
      <div className="flex flex-1 flex-col px-5 pb-6">
        {currentStep === 0 && (
          <WelcomeStep displayName={user?.displayName ?? "there"} />
        )}
        {currentStep === 1 && (
          <LanguageStep
            selected={selectedLanguage}
            onSelect={(code) => {
              setSelectedLanguage(code);
              i18n.changeLanguage(code);
              document.documentElement.dir = code === "ar" ? "rtl" : "ltr";
            }}
          />
        )}
        {currentStep === 2 && (
          <TopicsStep selected={selectedTopics} onToggle={toggleTopic} />
        )}
        {currentStep === 3 && (
          <DailyGoalStep goal={dailyGoal} onChangeGoal={setDailyGoal} />
        )}
        {currentStep === 4 && (
          <AppearanceStep
            isDark={isDark}
            onToggleDark={setDarkMode}
            cardTheme={selectedCardTheme}
            onSelectTheme={setSelectedCardTheme}
          />
        )}
        {currentStep === 5 && <TutorialStep />}

        {/* CTA */}
        <div className="mt-auto pt-6">
          <Button fullWidth onClick={handleNext}>
            {currentStep === TOTAL_STEPS - 1 ? (
              <>
                {t("onboarding.cta.getStarted")}
                <ArrowRight className="h-4 w-4" />
              </>
            ) : currentStep === 4 ? (
              <>
                {t("onboarding.cta.looksGood")}
                <ArrowRight className="h-4 w-4" />
              </>
            ) : (
              t("onboarding.cta.continue")
            )}
          </Button>
          {currentStep < TOTAL_STEPS - 1 && (
            <button
              onClick={handleSkip}
              className="mt-3 w-full py-2 text-center text-sm font-medium text-neutral-400 transition-colors hover:text-neutral-600"
            >
              {t("onboarding.cta.skipForNow")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step components
// ---------------------------------------------------------------------------

function WelcomeStep({ displayName }: { displayName: string }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-100">
        <User className="h-10 w-10 text-primary-500" />
      </div>
      <h1 className="mt-6 text-3xl font-bold text-neutral-900">
        {t("onboarding.welcome.heading", { name: displayName })}
      </h1>
      <p className="mt-3 text-sm text-neutral-500">
        {t("onboarding.welcome.description")}
      </p>
    </div>
  );
}

function LanguageStep({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (code: string) => void;
}) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");

  const filtered = LANGUAGES.filter((lang) =>
    t(lang.labelKey).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-1 flex-col">
      <div className="mt-6">
        <h1 className="text-2xl font-bold text-neutral-900">
          {t("onboarding.language.heading")}
        </h1>
        <p className="mt-2 text-sm text-neutral-500">
          {t("onboarding.language.description")}
        </p>
      </div>

      {/* Search */}
      <div className="relative mt-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <input
          type="text"
          placeholder={t("onboarding.language.search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-neutral-200 bg-neutral-0 py-3 pl-10 pr-4 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none"
        />
      </div>

      {/* Language list */}
      <div className="mt-4 flex flex-1 flex-col gap-2 overflow-y-auto">
        {filtered.map((lang) => {
          const isSelected = selected === lang.code;
          return (
            <button
              key={lang.code}
              onClick={() => onSelect(lang.code)}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all ${
                isSelected
                  ? "border-primary-500 bg-primary-50"
                  : "border-neutral-200 bg-neutral-0 hover:border-neutral-300"
              }`}
            >
              <span className="text-xl">{lang.flag}</span>
              <span
                className={`text-sm font-medium ${
                  isSelected ? "text-primary-700" : "text-neutral-700"
                }`}
              >
                {t(lang.labelKey)}
              </span>
              {isSelected && (
                <Check className="ml-auto h-4 w-4 text-primary-500" />
              )}
            </button>
          );
        })}
      </div>

      {/* Footer hint */}
      <p className="pt-4 text-center text-xs text-neutral-400">
        {t("onboarding.language.footer")}
      </p>
    </div>
  );
}

function TopicsStep({
  selected,
  onToggle,
}: {
  selected: Set<string>;
  onToggle: (tag: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-1 flex-col">
      <div className="mt-6">
        <h1 className="text-2xl font-bold text-neutral-900">
          {t("onboarding.topics.heading")}
        </h1>
        <p className="mt-2 text-sm text-neutral-500">
          {t("onboarding.topics.description")}
        </p>
      </div>
      <div className="mt-8 grid grid-cols-2 gap-3 overflow-y-auto">
        {TOPICS.map((topic) => {
          const isSelected = selected.has(topic.tag);
          const Icon = topic.icon;
          return (
            <button
              key={topic.tag}
              onClick={() => onToggle(topic.tag)}
              className={`relative flex flex-col items-start gap-3 rounded-2xl border-2 p-4 text-left transition-all ${
                isSelected
                  ? "border-primary-500 bg-primary-50"
                  : "border-neutral-200 bg-neutral-0 hover:border-neutral-300"
              }`}
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                  isSelected ? "bg-primary-100" : "bg-neutral-100"
                }`}
              >
                <Icon
                  className={`h-5 w-5 ${
                    isSelected ? "text-primary-500" : "text-neutral-400"
                  }`}
                />
              </div>
              <span
                className={`text-sm font-medium ${
                  isSelected ? "text-primary-700" : "text-neutral-700"
                }`}
              >
                {t(topic.labelKey)}
              </span>
              {isSelected && (
                <Check className="absolute right-3 bottom-3 h-4 w-4 text-primary-500" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DailyGoalStep({
  goal,
  onChangeGoal,
}: {
  goal: number;
  onChangeGoal: (goal: number) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-1 flex-col items-center">
      <div className="mt-6 text-center">
        <h1 className="text-2xl font-bold text-neutral-900">
          {t("onboarding.dailyGoal.heading")}
        </h1>
        <p className="mt-2 text-sm text-neutral-500">
          {t("onboarding.dailyGoal.description")}
        </p>
      </div>

      {/* Large number display */}
      <div className="mt-10 text-center">
        <p className="text-6xl font-bold text-primary-500">{goal}</p>
        <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">
          {t("onboarding.dailyGoal.cardsPerDay")}
        </p>
      </div>

      {/* Slider */}
      <div className="mt-6 w-full max-w-xs">
        <input
          type="range"
          min={10}
          max={100}
          step={5}
          value={goal}
          onChange={(e) => onChangeGoal(Number(e.target.value))}
          className="w-full accent-primary-500"
        />
      </div>

      {/* 2x2 preset grid */}
      <div className="mt-8 grid w-full grid-cols-2 gap-3">
        {DAILY_GOAL_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => onChangeGoal(option.value)}
            className={`flex flex-col items-center gap-1 rounded-xl border-2 px-4 py-3 transition-all ${
              goal === option.value
                ? "border-primary-500 bg-primary-50"
                : "border-neutral-200 bg-neutral-0 hover:border-neutral-300"
            }`}
          >
            <span
              className={`text-[10px] font-bold uppercase tracking-wider ${
                goal === option.value
                  ? "text-primary-500"
                  : "text-neutral-400"
              }`}
            >
              {t(option.labelKey)}
            </span>
            <span
              className={`text-xl font-bold ${
                goal === option.value
                  ? "text-primary-700"
                  : "text-neutral-700"
              }`}
            >
              {option.value}
            </span>
          </button>
        ))}
      </div>

      {/* Footer hint */}
      <p className="mt-auto pt-4 text-center text-xs text-neutral-400">
        {t("onboarding.dailyGoal.footer")}
      </p>
    </div>
  );
}

function AppearanceStep({
  isDark,
  onToggleDark,
  cardTheme,
  onSelectTheme,
}: {
  isDark: boolean;
  onToggleDark: (value: boolean) => void;
  cardTheme: string;
  onSelectTheme: (theme: string) => void;
}) {
  const { t } = useTranslation();
  const theme = getCardTheme(cardTheme);

  return (
    <div className="flex flex-1 flex-col">
      <div className="mt-6 text-center">
        <h1 className="text-2xl font-bold text-neutral-900">
          {t("onboarding.appearance.heading")}
        </h1>
        <p className="mt-2 text-sm text-neutral-500">
          {t("onboarding.appearance.description")}
        </p>
      </div>

      {/* Flashcard preview */}
      <div
        className={`mx-auto mt-8 flex w-full max-w-xs flex-col items-center gap-3 p-6 ${theme.cardClassName}`}
        style={theme.backgroundStyle}
      >
        <span
          className={`text-xs font-semibold uppercase tracking-wider ${theme.labelClassName}`}
        >
          {t("onboarding.appearance.preview")}
        </span>
        <p className={`text-center text-lg font-bold ${theme.textClassName}`}>
          {t("onboarding.appearance.previewText")}
        </p>
      </div>

      {/* Dark mode */}
      <div className="mt-6 flex items-center justify-between rounded-xl border border-neutral-200 bg-neutral-0 px-4 py-3">
        <div className="flex items-center gap-3">
          <Moon className="h-5 w-5 text-neutral-600" />
          <span className="text-sm font-medium text-neutral-700">
            {t("onboarding.appearance.darkMode")}
          </span>
        </div>
        <ToggleSwitch checked={isDark} onChange={onToggleDark} />
      </div>

      {/* Card theme */}
      <div className="mt-6">
        <p className="mb-3 text-sm font-bold text-neutral-900">
          {t("onboarding.appearance.cardTheme")}
        </p>

        <div className="grid grid-cols-2 gap-3">
          {CARD_THEMES.map((t) => {
            const isSelected = cardTheme === t.key;
            return (
              <button
                key={t.key}
                onClick={() => onSelectTheme(t.key)}
                className={`relative overflow-hidden rounded-2xl ${
                  isSelected ? "ring-2 ring-primary-500 ring-offset-2" : ""
                }`}
              >
                <div
                  className={`flex aspect-square flex-col justify-between p-3 ${t.previewColor}`}
                  style={t.backgroundStyle}
                >
                  <div>
                    {isSelected && (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white shadow">
                        <Check className="h-3.5 w-3.5 text-primary-500" />
                      </div>
                    )}
                    {!isSelected && (
                      <div className="h-6 w-6 rounded-full border-2 border-white/40" />
                    )}
                  </div>
                  <p className="text-xs font-semibold text-white">
                    {t.name}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function TutorialStep() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-1 flex-col items-center">
      {/* Constellation orb */}
      <div className="relative mt-8 flex h-28 w-28 items-center justify-center overflow-hidden rounded-full"
        style={{
          background: "radial-gradient(circle at 40% 40%, #4a3f8a, #1e1b4b 60%, #0f0e2a)",
        }}
      >
        {/* Stars */}
        <div className="absolute top-4 left-6 h-1.5 w-1.5 rounded-full bg-white/80" />
        <div className="absolute top-8 right-5 h-1 w-1 rounded-full bg-white/60" />
        <div className="absolute bottom-6 left-8 h-1 w-1 rounded-full bg-white/50" />
        <div className="absolute top-12 left-14 h-2 w-2 rounded-full bg-blue-300/70" />
        <div className="absolute bottom-10 right-8 h-1.5 w-1.5 rounded-full bg-white/70" />
        <div className="absolute bottom-4 right-12 h-1 w-1 rounded-full bg-blue-200/60" />
        <div className="absolute top-6 left-12 h-1 w-1 rounded-full bg-white/40" />
      </div>

      <h1 className="mt-6 text-2xl font-bold text-neutral-900">
        {t("onboarding.tutorial.heading")}
      </h1>
      <p className="mt-2 text-center text-sm text-neutral-500">
        {t("onboarding.tutorial.description")}
      </p>

      {/* Feature cards */}
      <div className="mt-8 w-full space-y-3">
        {TUTORIAL_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.titleKey}
              className="flex items-start gap-4 rounded-xl border border-neutral-200 bg-neutral-0 p-4"
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${card.iconBg}`}
              >
                <Icon className={`h-5 w-5 ${card.iconColor}`} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-neutral-900">
                  {t(card.titleKey)}
                </p>
                <p className="mt-0.5 text-xs text-neutral-500">
                  {t(card.descriptionKey)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
