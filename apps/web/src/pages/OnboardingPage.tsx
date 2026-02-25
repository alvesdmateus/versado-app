import { useState } from "react";
import { useNavigate } from "react-router";
import { Check, BookOpen, Target, Sparkles } from "lucide-react";
import { Button, Input } from "@versado/ui";
import { useAuth } from "@/hooks/useAuth";
import { profileApi } from "@/lib/profile-api";
import { syncAwareApi } from "@/lib/sync-aware-api";

const GOAL_OPTIONS = [10, 25, 50, 100] as const;

const STEPS = ["welcome", "goal", "deck", "done"] as const;
type Step = (typeof STEPS)[number];

export function OnboardingPage() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();

  const [step, setStep] = useState<Step>("welcome");
  const [dailyGoal, setDailyGoal] = useState(25);
  const [deckName, setDeckName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentIndex = STEPS.indexOf(step);

  function next() {
    const nextIndex = currentIndex + 1;
    const nextStep = STEPS[nextIndex];
    if (nextStep) {
      setStep(nextStep);
    }
  }

  async function handleFinish() {
    setIsSubmitting(true);
    try {
      // Create deck if name was entered
      if (deckName.trim()) {
        await syncAwareApi.createDeck({ name: deckName.trim() });
      }

      // Save preferences
      await profileApi.updatePreferences({
        dailyGoal,
        onboardingCompleted: true,
      });

      await refreshUser();
      navigate("/", { replace: true });
    } catch {
      // Still mark onboarding complete even if deck creation fails
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
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-neutral-50 px-6">
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
                  : "w-1.5 bg-neutral-200"
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
            <h1 className="mt-6 text-2xl font-bold text-neutral-900">
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

        {/* Step: Daily Goal */}
        {step === "goal" && (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-100">
              <Target className="h-8 w-8 text-primary-500" />
            </div>
            <h1 className="mt-6 text-2xl font-bold text-neutral-900">
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
                      : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
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
            <h1 className="mt-6 text-2xl font-bold text-neutral-900">
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
            <h1 className="mt-6 text-2xl font-bold text-neutral-900">
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
