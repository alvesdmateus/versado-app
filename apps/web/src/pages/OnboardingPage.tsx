import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Camera,
  Check,
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
  { key: "languages", icon: Globe, bg: "bg-blue-100", text: "text-blue-600" },
  { key: "science", icon: FlaskConical, bg: "bg-purple-100", text: "text-purple-600" },
  { key: "math", icon: Calculator, bg: "bg-indigo-100", text: "text-indigo-600" },
  { key: "history", icon: Landmark, bg: "bg-amber-100", text: "text-amber-600" },
  { key: "geography", icon: MapPin, bg: "bg-emerald-100", text: "text-emerald-600" },
  { key: "programming", icon: Code, bg: "bg-cyan-100", text: "text-cyan-600" },
  { key: "medicine", icon: Stethoscope, bg: "bg-red-100", text: "text-red-500" },
  { key: "law", icon: Scale, bg: "bg-slate-100", text: "text-slate-600" },
  { key: "music", icon: Music, bg: "bg-pink-100", text: "text-pink-600" },
  { key: "art", icon: Brush, bg: "bg-rose-100", text: "text-rose-500" },
  { key: "literature", icon: BookText, bg: "bg-orange-100", text: "text-orange-600" },
  { key: "philosophy", icon: Lightbulb, bg: "bg-yellow-100", text: "text-yellow-600" },
  { key: "psychology", icon: Brain, bg: "bg-fuchsia-100", text: "text-fuchsia-600" },
  { key: "economics", icon: TrendingUp, bg: "bg-teal-100", text: "text-teal-600" },
  { key: "business", icon: Briefcase, bg: "bg-sky-100", text: "text-sky-600" },
  { key: "cooking", icon: UtensilsCrossed, bg: "bg-lime-100", text: "text-lime-600" },
] as const;

const GOAL_PRESETS = [
  { value: 10, labelKey: "casual", descKey: "casualDesc" },
  { value: 25, labelKey: "regular", descKey: "regularDesc" },
  { value: 50, labelKey: "serious", descKey: "seriousDesc" },
  { value: 100, labelKey: "intense", descKey: "intenseDesc" },
] as const;

const LANGUAGE_FLAGS: Record<string, string> = {
  en: "\u{1F1FA}\u{1F1F8}",
  pt: "\u{1F1E7}\u{1F1F7}",
  es: "\u{1F1EA}\u{1F1F8}",
  fr: "\u{1F1EB}\u{1F1F7}",
  de: "\u{1F1E9}\u{1F1EA}",
};

/** Scroll-picker tick values: 5, 10, 15, …, 100 */
const GOAL_TICKS = Array.from({ length: 20 }, (_, i) => (i + 1) * 5);
const TICK_GAP = 48; // px distance between each tick center

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
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const goalScrollRef = useRef<HTMLDivElement>(null);
  const ignoreScrollRef = useRef(false);

  // Scroll picker to a tick index — sets flag to ignore resulting scroll events
  const scrollPickerTo = useCallback((goal: number, animate: boolean) => {
    const el = goalScrollRef.current;
    if (!el) return;
    const nearest = GOAL_TICKS.reduce((prev, curr) =>
      Math.abs(curr - goal) < Math.abs(prev - goal) ? curr : prev,
    );
    const idx = GOAL_TICKS.indexOf(nearest);
    ignoreScrollRef.current = true;
    el.scrollTo({ top: idx * TICK_GAP, behavior: animate ? "smooth" : "instant" });
    // Re-enable scroll handler after animation finishes
    setTimeout(() => { ignoreScrollRef.current = false; }, animate ? 500 : 60);
  }, []);

  // Called by preset buttons: set value AND scroll
  const selectGoalPreset = useCallback((value: number) => {
    setDailyGoal(value);
    scrollPickerTo(value, true);
  }, [scrollPickerTo]);

  // Jump to correct position when goal step first renders
  useEffect(() => {
    if (step === "goal") {
      requestAnimationFrame(() => scrollPickerTo(dailyGoal, false));
    }
    // Only on step change, not on dailyGoal change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // Scroll handler — reads position, updates number (NO programmatic scroll back)
  const handleGoalScroll = useCallback(() => {
    if (ignoreScrollRef.current) return;
    const el = goalScrollRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollTop / TICK_GAP);
    const clamped = Math.max(0, Math.min(idx, GOAL_TICKS.length - 1));
    setDailyGoal(GOAL_TICKS[clamped] ?? 25);
  }, []);

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

  function handleAvatarSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const size = 256;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d")!;

      // Crop to square from center
      const min = Math.min(img.width, img.height);
      const sx = (img.width - min) / 2;
      const sy = (img.height - min) / 2;
      ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);

      const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
      setAvatarPreview(dataUrl);
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(file);
  }

  async function handleFinish() {
    setIsSubmitting(true);
    try {
      // Follow selected topics
      const followPromises = selectedTopics.map((topic) =>
        socialApi.followTag(topic.toLowerCase()).catch(() => {}),
      );
      await Promise.allSettled(followPromises);

      // Save avatar if selected
      if (avatarPreview) {
        await profileApi.update({ avatarUrl: avatarPreview });
      }

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
    <div className="flex flex-1 flex-col items-center text-center">
      <h1 className="mt-4 text-2xl font-bold text-neutral-900">
        {t("welcome.heading", { name: user?.displayName ? `, ${user.displayName}` : "" })}
      </h1>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-neutral-500">
        {t("welcome.subheading")}
      </p>

      {/* Avatar upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarSelect}
      />
      <div
        className="my-auto flex cursor-pointer flex-col items-center gap-3"
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="flex h-40 w-40 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-primary-300 bg-primary-50">
          {avatarPreview ? (
            <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
          ) : (
            <Camera className="h-12 w-12 text-primary-400" />
          )}
        </div>
        <span className="text-sm font-semibold text-primary-500">
          {avatarPreview ? t("welcome.changePhoto") : t("welcome.addPhoto")}
        </span>
        <span className="text-xs text-neutral-400">
          {t("welcome.optional")}
        </span>
      </div>

      <div className="w-full pb-6 flex flex-col items-center gap-3">
        <Button fullWidth onClick={next}>
          {t("welcome.nextStep")}
        </Button>
        <button
          type="button"
          onClick={next}
          className="text-xs font-medium text-neutral-400 hover:text-neutral-600 transition-colors"
        >
          {t("welcome.skip")}
        </button>
      </div>
    </div>
  );

  const renderLanguage = () => (
    <div className="flex flex-1 flex-col">
      <div className="pt-4">
        <h1 className="text-xl font-bold text-neutral-900">
          {t("language.heading")}
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          {t("language.subheading")}
        </p>
      </div>
      <div className="mt-5 flex flex-col gap-2 overflow-y-auto flex-1 pb-4">
        {SUPPORTED_LANGUAGES.map(({ code, label }) => (
          <button
            key={code}
            type="button"
            onClick={() => handleLanguageSelect(code)}
            className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3.5 text-left transition-all ${
              nativeLanguage === code
                ? "border-primary-500 bg-primary-50"
                : "border-neutral-200 bg-neutral-0"
            }`}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 shadow-sm ring-1 ring-neutral-200/60">
              <span className="text-xl leading-none">
                {LANGUAGE_FLAGS[code] ?? code.toUpperCase()}
              </span>
            </div>
            <div className="flex flex-col">
              <span
                className={`text-sm font-semibold ${
                  nativeLanguage === code ? "text-primary-700" : "text-neutral-900"
                }`}
              >
                {label}
              </span>
            </div>
            {nativeLanguage === code && (
              <Check className="ml-auto h-5 w-5 text-primary-500" />
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
        {TOPICS.map(({ key, icon: Icon, bg, text }) => {
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
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${bg} ${text}`}
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

      {/* Vertical scroll picker */}
      <div className="relative mx-auto mt-6 w-full max-w-[200px]" style={{ height: TICK_GAP * 3 }}>
        {/* Center indicator bar */}
        <div className="pointer-events-none absolute left-0 right-0 top-1/2 z-10 h-0.5 -translate-y-1/2 rounded-full bg-primary-500" />
        <div
          ref={goalScrollRef}
          onScroll={handleGoalScroll}
          className="scrollbar-hide flex h-full snap-y snap-mandatory flex-col overflow-y-auto"
          style={{ scrollSnapType: "y mandatory" }}
        >
          {/* Top spacer so first tick can reach center */}
          <div className="shrink-0" style={{ height: "calc(50% - 1px)" }} />
          {GOAL_TICKS.map((val) => {
            const isActive = val === dailyGoal;
            return (
              <div
                key={val}
                className="flex shrink-0 snap-center items-center justify-center gap-3"
                style={{ height: TICK_GAP }}
              >
                <div
                  className={`rounded-full transition-all ${
                    isActive
                      ? "h-1.5 w-10 bg-primary-500"
                      : "h-1 w-6 bg-neutral-300"
                  }`}
                />
                {val % 10 === 0 && (
                  <span
                    className={`w-8 text-right text-[10px] font-semibold ${
                      isActive ? "text-primary-600" : "text-neutral-400"
                    }`}
                  >
                    {val}
                  </span>
                )}
                {val % 10 !== 0 && <span className="w-8" />}
              </div>
            );
          })}
          {/* Bottom spacer */}
          <div className="shrink-0" style={{ height: "calc(50% - 1px)" }} />
        </div>
      </div>

      {/* 2x2 preset grid */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        {GOAL_PRESETS.map(({ value, labelKey }) => (
          <button
            key={value}
            type="button"
            onClick={() => selectGoalPreset(value)}
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
        <div className="mt-3 grid grid-cols-4 gap-3 overflow-y-auto flex-1 p-1 pb-4">
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
                    ? "ring-2 ring-primary-500 ring-offset-2 ring-offset-neutral-50"
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
