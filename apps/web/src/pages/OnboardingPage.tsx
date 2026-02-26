import { useState } from "react";
import { useNavigate } from "react-router";
import { Check, BookOpen, Target, Sparkles, Monitor, Sun, Moon } from "lucide-react";
import { Button, Input } from "@versado/ui";
import { useAuth } from "@/hooks/useAuth";
import { profileApi } from "@/lib/profile-api";
import { syncAwareApi } from "@/lib/sync-aware-api";
import { useTheme, type ThemePreference } from "@/contexts/ThemeContext";

const GOAL_OPTIONS = [10, 25, 50, 100] as const;

const STEPS = ["welcome", "theme", "goal", "deck", "done"] as const;
type Step = (typeof STEPS)[number];

const THEME_OPTIONS: {
  value: ThemePreference;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    value: "system",
    label: "System",
    description: "Follows your device setting",
    icon: <Monitor className="h-6 w-6" />,
  },
  {
    value: "light",
    label: "Light",
    description: "Always use light mode",
    icon: <Sun className="h-6 w-6" />,
  },
  {
    value: "dark",
    label: "Dark",
    description: "Always use dark mode",
    icon: <Moon className="h-6 w-6" />,
  },
];

export function OnboardingPage() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const { themePreference, setThemePreference } = useTheme();

  const [step, setStep] = useState<Step>("welcome");
  const [selectedTheme, setSelectedTheme] = useState<ThemePreference>(themePreference);
  const [dailyGoal, setDailyGoal] = useState(25);
  const [deckName, setDeckName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentIndex = STEPS.indexOf(step);

  function next() {
    const nextStep = STEPS[currentIndex + 1];
    if (nextStep) setStep(nextStep);
  }

  function handleThemeSelect(pref: ThemePreference) {
    setSelectedTheme(pref);
    setThemePreference(pref);
  }

  async function handleFinish() {
    setIsSubmitting(true);
    try {
      if (deckName.trim()) {
        await syncAwareApi.createDeck({ name: deckName.trim() });
      }

      await profileApi.updatePreferences({
        dailyGoal,
        themePreference: selectedTheme,
        onboardingCompleted: true,
      });

      await refreshUser();
      navigate("/", { replace: true });
    } catch {
      try {
        await profileApi.updatePreferences({ onboardingCompleted: true });
        await refreshUser();
      } catch {
        // Ignore — we'll redirect anyway
      }
      navigate("/", { replace: true });
    } finally {
      setIsSubmitting(false);
    }
  }

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

      <div className="flex flex-1 flex-col">
        {/* Step: Welcome */}
        {step === "welcome" && (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-100">
              <Sparkles className="h-8 w-8 text-primary-500" />
            </div>
            <h1 className="mt-6 text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              Welcome to Versado
              {user?.displayName ? `, ${user.displayName}` : ""}!
            </h1>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-neutral-500">
              Your personal spaced repetition learning tool. Let's set things up
              so you can start memorizing effectively.
            </p>
            <div className="mt-10 w-full">
              <Button fullWidth onClick={next}>
                Get Started
              </Button>
            </div>
          </div>
        )}

        {/* Step: Theme */}
        {step === "theme" && (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-100">
              <Sun className="h-8 w-8 text-primary-500" />
            </div>
            <h1 className="mt-6 text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              Choose Your Theme
            </h1>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-neutral-500">
              Pick how Versado looks. You can always change this later in your
              profile.
            </p>
            <div className="mt-8 flex w-full flex-col gap-3">
              {THEME_OPTIONS.map(({ value, label, description, icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleThemeSelect(value)}
                  className={`flex items-center gap-4 rounded-2xl border-2 px-5 py-4 text-left transition-all ${
                    selectedTheme === value
                      ? "border-primary-500 bg-primary-50 dark:bg-primary-950"
                      : "border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900"
                  }`}
                >
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      selectedTheme === value
                        ? "bg-primary-500 text-white"
                        : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500"
                    }`}
                  >
                    {icon}
                  </span>
                  <span className="flex flex-col">
                    <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                      {label}
                    </span>
                    <span className="text-xs text-neutral-500">{description}</span>
                  </span>
                  {selectedTheme === value && (
                    <Check className="ml-auto h-5 w-5 shrink-0 text-primary-500" />
                  )}
                </button>
              ))}
            </div>
            <div className="mt-8 w-full">
              <Button fullWidth onClick={next}>
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step: Daily Goal */}
        {step === "goal" && (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-100">
              <Target className="h-8 w-8 text-primary-500" />
            </div>
            <h1 className="mt-6 text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              Set Your Daily Goal
            </h1>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-neutral-500">
              How many cards do you want to review each day? You can always
              change this later.
            </p>
            <div className="mt-8 flex gap-3">
              {GOAL_OPTIONS.map((goal) => (
                <button
                  key={goal}
                  type="button"
                  onClick={() => setDailyGoal(goal)}
                  className={`flex h-14 w-14 items-center justify-center rounded-xl text-sm font-semibold transition-all ${
                    dailyGoal === goal
                      ? "bg-primary-500 text-white shadow-md"
                      : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                  }`}
                >
                  {goal}
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-neutral-400">cards per day</p>
            <div className="mt-10 w-full">
              <Button fullWidth onClick={next}>
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step: First Deck */}
        {step === "deck" && (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-100">
              <BookOpen className="h-8 w-8 text-primary-500" />
            </div>
            <h1 className="mt-6 text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              Create Your First Deck
            </h1>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-neutral-500">
              What would you like to study? Give your first deck a name.
            </p>
            <div className="mt-8 w-full text-left">
              <Input
                label="Deck Name"
                placeholder="e.g. Spanish Vocabulary"
                value={deckName}
                onChange={(e) => setDeckName(e.target.value)}
              />
            </div>
            <div className="mt-10 flex w-full flex-col gap-3">
              <Button fullWidth onClick={next}>
                Continue
              </Button>
              <button
                type="button"
                onClick={next}
                className="text-sm font-medium text-neutral-400 transition-colors hover:text-neutral-600"
              >
                Skip for now
              </button>
            </div>
          </div>
        )}

        {/* Step: Done */}
        {step === "done" && (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-success-100">
              <Check className="h-8 w-8 text-success-500" />
            </div>
            <h1 className="mt-6 text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              You're All Set!
            </h1>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-neutral-500">
              {deckName.trim()
                ? `Your deck "${deckName.trim()}" will be created and you're ready to start learning.`
                : "You're ready to start your learning journey. Create decks and add cards whenever you're ready."}
            </p>
            <div className="mt-10 w-full">
              <Button
                fullWidth
                onClick={handleFinish}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Setting up..." : "Start Learning"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
