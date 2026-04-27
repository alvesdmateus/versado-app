import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { Check, X, ArrowLeft, Clock, Trophy, AlertCircle } from "lucide-react";
import { FlashcardView } from "@versado/ui";
import { Button } from "@versado/ui";
import { useTrack } from "@/hooks/useTrack";
import { examApi, type ExamCard, type ExamResult } from "@/lib/exam-api";
import { GoFluentModal } from "@/components/shared/GoFluentModal";
import { CardLabelBadges } from "@/components/shared/CardLabelBadges";

type Phase = "loading" | "examining" | "results";

export function ExamPage() {
  const { t } = useTranslation("study");
  const navigate = useNavigate();
  const { track } = useTrack();

  const [phase, setPhase] = useState<Phase>("loading");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [cards, setCards] = useState<ExamCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [passingScore, setPassingScore] = useState(0);
  const [result, setResult] = useState<ExamResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);

  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startExam = useCallback(async () => {
    if (!track) return;
    try {
      const session = await examApi.startExam(track.id);
      setSessionId(session.id);
      setCards(session.cards);
      setTimeRemaining(session.timeLimitSeconds);
      setPassingScore(session.passingScore);
      startTimeRef.current = Date.now();
      setPhase("examining");
    } catch (err: unknown) {
      const apiErr = err as { code?: string };
      if (apiErr.code === "EXAM_LIMIT_REACHED") {
        setShowPaywall(true);
      } else {
        setError((err as Error).message || "Failed to start exam");
      }
    }
  }, [track]);

  useEffect(() => {
    startExam();
  }, [startExam]);

  useEffect(() => {
    if (phase !== "examining") return;
    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTimeUp = useCallback(async () => {
    if (!sessionId) return;
    if (timerRef.current) clearInterval(timerRef.current);
    const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000);
    try {
      const res = await examApi.completeExam(sessionId, elapsed);
      setResult(res);
      setPhase("results");
    } catch {
      setPhase("results");
    }
  }, [sessionId]);

  const handleAnswer = useCallback(
    async (knew: boolean) => {
      if (!sessionId || !cards[currentIndex]) return;
      const card = cards[currentIndex];

      examApi.submitAnswer(sessionId, card.id, knew).catch(() => {});

      const nextIndex = currentIndex + 1;
      if (nextIndex >= cards.length) {
        if (timerRef.current) clearInterval(timerRef.current);
        const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000);
        try {
          const res = await examApi.completeExam(sessionId, elapsed);
          setResult(res);
          setPhase("results");
        } catch {
          setPhase("results");
        }
      } else {
        setCurrentIndex(nextIndex);
        setIsFlipped(false);
      }
    },
    [sessionId, cards, currentIndex]
  );

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (showPaywall) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50">
        <GoFluentModal
          isOpen
          onClose={() => navigate("/")}
          trigger="limit"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-neutral-50 px-5">
        <AlertCircle className="h-12 w-12 text-error-500" />
        <p className="text-center text-neutral-700">{error}</p>
        <Button onClick={() => navigate("/")}>{t("exam.backHome")}</Button>
      </div>
    );
  }

  if (phase === "loading") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-neutral-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
        <p className="text-sm text-neutral-500">{t("exam.starting")}</p>
      </div>
    );
  }

  if (phase === "results") {
    const passed = result?.passed ?? false;
    const score = result?.score ?? 0;
    const correctCount = result?.correctCount ?? 0;
    const questionCount = result?.questionCount ?? cards.length;
    const timeSpent = result?.timeSpentSeconds ?? 0;
    const minutes = Math.floor(timeSpent / 60);
    const seconds = timeSpent % 60;

    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-5">
        <div className="w-full max-w-sm text-center">
          <div
            className={`mx-auto flex h-24 w-24 items-center justify-center rounded-full ${
              passed
                ? "bg-success-100 text-success-600"
                : "bg-error-100 text-error-600"
            }`}
          >
            {passed ? (
              <Trophy className="h-12 w-12" />
            ) : (
              <X className="h-12 w-12" />
            )}
          </div>

          <h1 className="mt-6 text-2xl font-bold text-neutral-900">
            {passed ? t("exam.passed") : t("exam.failed")}
          </h1>

          <div className="mt-6 rounded-2xl bg-neutral-0 p-6 shadow-card">
            <p className="text-4xl font-bold text-neutral-900">{score}%</p>
            <p className="mt-1 text-sm text-neutral-500">
              {t("exam.correct", { count: correctCount })} / {questionCount}
            </p>

            <div className="relative mt-4 h-3 overflow-hidden rounded-full bg-neutral-100">
              <div
                className={`absolute inset-y-0 left-0 rounded-full ${
                  passed ? "bg-success-500" : "bg-error-500"
                }`}
                style={{ width: `${score}%` }}
              />
              <div
                className="absolute inset-y-0 w-0.5 bg-neutral-400"
                style={{ left: `${passingScore}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-neutral-400">
              {t("exam.passingScore", { score: passingScore })}
            </p>

            <p className="mt-4 text-sm text-neutral-500">
              {t("exam.timeTaken", { minutes, seconds })}
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <Button
              onClick={() => {
                setPhase("loading");
                setCurrentIndex(0);
                setIsFlipped(false);
                setResult(null);
                startExam();
              }}
            >
              {t("exam.tryAgain")}
            </Button>
            <Button variant="secondary" onClick={() => navigate("/")}>
              {t("exam.backHome")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const card = cards[currentIndex]!;
  const progress = ((currentIndex + 1) / cards.length) * 100;
  const isTimeLow = timeRemaining < 60;

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      {/* Header */}
      <header className="flex items-center justify-between px-4 pt-4 pb-2">
        <button
          onClick={() => navigate("/")}
          className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <p className="text-sm font-medium text-neutral-700">
          {t("exam.question", {
            current: currentIndex + 1,
            total: cards.length,
          })}
        </p>
        <div
          className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-mono ${
            isTimeLow
              ? "bg-error-50 text-error-600 animate-pulse"
              : "bg-neutral-100 text-neutral-600"
          }`}
        >
          <Clock className="h-4 w-4" />
          {formatTime(timeRemaining)}
        </div>
      </header>

      {/* Progress bar */}
      <div className="mx-4 h-1.5 overflow-hidden rounded-full bg-neutral-200">
        <div
          className="h-full rounded-full bg-primary-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Card */}
      <div className="flex flex-1 items-center justify-center px-5 py-6">
        <div className="w-full max-w-md">
          <FlashcardView
            front={
              <div className="flex flex-col items-center gap-2">
                <CardLabelBadges tags={card.tags} />
                <p className="text-center text-lg font-medium text-neutral-900">
                  {card.front}
                </p>
              </div>
            }
            back={
              <p className="text-center text-base text-neutral-700">
                {card.back}
              </p>
            }
            isFlipped={isFlipped}
            onFlip={() => setIsFlipped((f) => !f)}
          />
        </div>
      </div>

      {/* Answer buttons */}
      {isFlipped && (
        <div className="flex gap-4 px-5 pb-8 animate-fade-in-up">
          <button
            onClick={() => handleAnswer(false)}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-error-50 py-4 text-error-700 font-semibold shadow-card transition-colors active:bg-error-100"
          >
            <X className="h-5 w-5" />
            {t("exam.iDontKnowThis")}
          </button>
          <button
            onClick={() => handleAnswer(true)}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-success-50 py-4 text-success-700 font-semibold shadow-card transition-colors active:bg-success-100"
          >
            <Check className="h-5 w-5" />
            {t("exam.iKnowThis")}
          </button>
        </div>
      )}
    </div>
  );
}
