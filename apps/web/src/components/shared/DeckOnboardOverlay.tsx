import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Layers, CreditCard, Sparkles } from "lucide-react";
import { Button } from "@versado/ui";

interface DeckOnboardOverlayProps {
  onComplete: () => void;
}

const STORAGE_KEY = "versado:deck-onboard-seen";

export function useDeckOnboard() {
  const seen = localStorage.getItem(STORAGE_KEY) === "true";
  const markSeen = () => localStorage.setItem(STORAGE_KEY, "true");
  return { seen, markSeen };
}

export function DeckOnboardOverlay({ onComplete }: DeckOnboardOverlayProps) {
  const { t } = useTranslation("decks");
  const [step, setStep] = useState(0);
  const totalSteps = 3;

  function handleNext() {
    if (step < totalSteps - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  }

  function handleSkip() {
    onComplete();
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-neutral-50">
      <div className="flex flex-1 flex-col items-center justify-center px-8">
        {step === 0 && (
          <div className="flex flex-col items-center text-center animate-fade-in-up">
            {/* Deck illustration */}
            <div className="relative mb-8">
              <div className="h-36 w-56 rounded-2xl bg-gradient-to-br from-violet-200 to-violet-300 shadow-card flex items-center justify-center">
                <Layers className="h-12 w-12 text-violet-600" />
              </div>
              {/* Stacked cards behind */}
              <div className="absolute -bottom-2 -right-2 -z-10 h-36 w-56 rounded-2xl bg-violet-100 shadow-sm" />
              <div className="absolute -bottom-4 -right-4 -z-20 h-36 w-56 rounded-2xl bg-violet-50" />
            </div>
            <h2 className="text-2xl font-bold text-neutral-900">
              {t("onboard.createDeck")}
            </h2>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-neutral-500">
              {t("onboard.createDeckDesc")}
            </p>
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col items-center text-center animate-fade-in-up">
            {/* Flashcard front/back illustration */}
            <div className="relative mb-8 flex gap-4">
              <div className="h-32 w-40 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 shadow-card flex flex-col items-center justify-center p-4">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-primary-400">
                  Front
                </span>
                <CreditCard className="mt-2 h-8 w-8 text-primary-500" />
                <span className="mt-1 text-xs font-medium text-primary-600">
                  Question
                </span>
              </div>
              <div className="h-32 w-40 rounded-xl bg-gradient-to-br from-success-100 to-success-200 shadow-card flex flex-col items-center justify-center p-4">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-success-400">
                  Back
                </span>
                <CreditCard className="mt-2 h-8 w-8 text-success-500" />
                <span className="mt-1 text-xs font-medium text-success-600">
                  Answer
                </span>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-neutral-900">
              {t("onboard.addCards")}
            </h2>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-neutral-500">
              {t("onboard.addCardsDesc")}
            </p>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col items-center text-center animate-fade-in-up">
            {/* AI generation illustration */}
            <div className="relative mb-8">
              <div className="h-40 w-64 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-200 shadow-card flex flex-col items-center justify-center gap-2">
                <Sparkles className="h-12 w-12 text-amber-500" />
                <div className="flex gap-1">
                  <div className="h-2 w-8 rounded-full bg-amber-300" />
                  <div className="h-2 w-12 rounded-full bg-amber-300" />
                  <div className="h-2 w-6 rounded-full bg-amber-300" />
                </div>
                <div className="flex gap-1">
                  <div className="h-2 w-10 rounded-full bg-amber-200" />
                  <div className="h-2 w-8 rounded-full bg-amber-200" />
                </div>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-neutral-900">
              {t("onboard.aiGeneration")}
            </h2>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-neutral-500">
              {t("onboard.aiGenerationDesc")}
            </p>
          </div>
        )}
      </div>

      {/* Footer: dots + buttons */}
      <div className="px-8 pb-10">
        {/* Step dots */}
        <div className="mb-6 flex justify-center gap-2">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all ${
                i === step ? "w-6 bg-primary-500" : "w-2 bg-neutral-300"
              }`}
            />
          ))}
        </div>

        <Button fullWidth onClick={handleNext}>
          {step === totalSteps - 1 ? t("onboard.getStarted") : t("onboard.next")}
        </Button>
        {step < totalSteps - 1 && (
          <button
            onClick={handleSkip}
            className="mt-3 w-full py-2 text-sm text-neutral-400 transition-colors hover:text-neutral-600"
          >
            {t("onboard.skip")}
          </button>
        )}
      </div>
    </div>
  );
}
