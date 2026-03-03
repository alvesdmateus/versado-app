import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Hand, ArrowRight, ArrowLeft, ArrowUp, TrendingUp } from "lucide-react";
import { Button } from "@versado/ui";

interface StudyOnboardOverlayProps {
  onComplete: () => void;
}

const STORAGE_KEY = "versado:study-onboard-seen";

export function useStudyOnboard() {
  const seen = localStorage.getItem(STORAGE_KEY) === "true";
  const markSeen = () => localStorage.setItem(STORAGE_KEY, "true");
  return { seen, markSeen };
}

export function StudyOnboardOverlay({ onComplete }: StudyOnboardOverlayProps) {
  const { t } = useTranslation("study");
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
            {/* Tap to flip illustration */}
            <div className="relative mb-8">
              <div className="h-44 w-64 rounded-2xl bg-gradient-to-br from-primary-100 to-primary-200 shadow-card flex items-center justify-center">
                <span className="text-sm font-semibold text-primary-600">
                  {t("card.question")}
                </span>
              </div>
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-primary-500 shadow-card-lg">
                <Hand className="h-5 w-5 text-white" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-neutral-900">
              {t("onboard.tapToFlip")}
            </h2>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-neutral-500">
              {t("onboard.tapToFlipDesc")}
            </p>
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col items-center text-center animate-fade-in-up">
            {/* Swipe directions illustration */}
            <div className="relative mb-8">
              <div className="h-44 w-64 rounded-2xl bg-gradient-to-br from-neutral-100 to-neutral-200 shadow-card flex items-center justify-center">
                <span className="text-sm font-semibold text-neutral-500">
                  {t("card.answerRevealed")}
                </span>
              </div>
              {/* Arrow indicators */}
              <div className="absolute top-1/2 -right-12 -translate-y-1/2 flex items-center gap-1">
                <ArrowRight className="h-6 w-6 text-success-500" />
              </div>
              <div className="absolute top-1/2 -left-12 -translate-y-1/2 flex items-center gap-1">
                <ArrowLeft className="h-6 w-6 text-error-500" />
              </div>
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center gap-1">
                <ArrowUp className="h-6 w-6 text-sky-400" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-neutral-900">
              {t("onboard.swipeToRate")}
            </h2>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-neutral-500">
              {t("onboard.swipeToRateDesc")}
            </p>
            <div className="mt-5 flex flex-col gap-2.5">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success-100">
                  <ArrowRight className="h-4 w-4 text-success-600" />
                </div>
                <span className="text-sm font-medium text-neutral-700">
                  {t("onboard.swipeRight")}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-error-100">
                  <ArrowLeft className="h-4 w-4 text-error-600" />
                </div>
                <span className="text-sm font-medium text-neutral-700">
                  {t("onboard.swipeLeft")}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100">
                  <ArrowUp className="h-4 w-4 text-sky-600" />
                </div>
                <span className="text-sm font-medium text-neutral-700">
                  {t("onboard.swipeUp")}
                </span>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col items-center text-center animate-fade-in-up">
            {/* Mastery ring illustration */}
            <div className="mb-8">
              <svg className="h-32 w-32 -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" className="stroke-neutral-200" strokeWidth="8" />
                <circle
                  cx="60" cy="60" r="50" fill="none"
                  className="stroke-primary-500"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray="220 314"
                />
              </svg>
              <div className="relative -mt-[88px] flex flex-col items-center">
                <TrendingUp className="h-8 w-8 text-primary-500" />
                <span className="mt-1 text-lg font-bold text-primary-500">70%</span>
              </div>
              <div className="mt-6" />
            </div>
            <h2 className="text-2xl font-bold text-neutral-900">
              {t("onboard.trackProgress")}
            </h2>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-neutral-500">
              {t("onboard.trackProgressDesc")}
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
          {step === totalSteps - 1 ? t("onboard.startStudying") : t("onboard.next")}
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
