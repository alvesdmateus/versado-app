import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { X, ChevronUp, MoreVertical } from "lucide-react";
import type { ReviewRating } from "@versado/algorithms";
import { studyApi } from "@/lib/study-api";
import type { DueCard } from "@/lib/study-api";
import { syncAwareApi } from "@/lib/sync-aware-api";
import { profileApi } from "@/lib/profile-api";
import { ApiError } from "@/lib/api-client";
import { getCardTheme, type CardTheme } from "@/lib/card-themes";
import { haptic, playSound, setHapticEnabled, setSoundEnabled } from "@/lib/feedback";
import { GoFluentModal } from "@/components/shared/GoFluentModal";
import { StudyOnboardOverlay, useStudyOnboard } from "@/components/shared/StudyOnboardOverlay";
import { useAuth } from "@/hooks/useAuth";

// ---------------------------------------------------------------------------
// Rating button config
// ---------------------------------------------------------------------------

interface RatingOption {
  rating: ReviewRating;
  labelKey: string;
  interval: string;
  bgClass: string;
  icon: React.ReactNode;
}

function FrownIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="10" />
      <path d="M8 9.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z" fill="white" />
      <path d="M16 9.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z" fill="white" />
      <path d="M8 16c1-1.333 2.667-2 4-2s3 .667 4 2" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function ThumbsUpIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
      <path d="M7.493 18.75c-.425 0-.82-.236-.975-.632A7.48 7.48 0 0 1 6 15.375c0-1.75.599-3.358 1.602-4.634.151-.192.373-.309.6-.397.473-.183.89-.514 1.212-.924a9.042 9.042 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V3a.75.75 0 0 1 .75-.75 2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H14.23c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23h-.777ZM2.331 10.977a11.969 11.969 0 0 0-.831 4.398 12 12 0 0 0 .52 3.507c.26.85 1.084 1.368 1.973 1.368H4.9c.445 0 .72-.498.523-.898a8.963 8.963 0 0 1-.924-3.977c0-1.708.476-3.305 1.302-4.666.245-.403-.028-.959-.5-.959H4.25c-.832 0-1.612.453-1.918 1.227Z" />
    </svg>
  );
}

function SmileIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="10" />
      <path d="M8 9.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z" fill="white" />
      <path d="M16 9.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z" fill="white" />
      <path d="M8 14c1 1.333 2.667 2 4 2s3-.667 4-2" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function GraduationCapIcon() {
  return (
    <svg className="h-10 w-10 text-primary-300" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.7 2.805a.75.75 0 0 1 .6 0A60.65 60.65 0 0 1 22.83 8.72a.75.75 0 0 1-.231 1.337 49.949 49.949 0 0 0-9.902 3.912l-.003.002-.34.18a.75.75 0 0 1-.707 0A50.88 50.88 0 0 0 7.5 12.174v-.224c0-.131.067-.248.172-.311a.75.75 0 0 0-.114-1.332A60.653 60.653 0 0 1 1.401 10.06a.75.75 0 0 1-.23-1.337A60.664 60.664 0 0 1 11.7 2.805Z" />
      <path d="M13.06 15.473a48.45 48.45 0 0 1 7.666-3.282c.134 1.414.22 2.843.255 4.285a.75.75 0 0 1-.46.71 47.878 47.878 0 0 0-8.105 4.342.75.75 0 0 1-.832 0 47.877 47.877 0 0 0-8.104-4.342.75.75 0 0 1-.461-.71c.035-1.442.121-2.87.255-4.286A48.4 48.4 0 0 1 10.94 15.473a.75.75 0 0 0 .114.032l1.006.337a.75.75 0 0 0 .476 0l1.006-.337a.756.756 0 0 0 .114-.032Z" />
      <path d="M4.75 12.025V16.5a.75.75 0 0 0 .75.75h.5a.75.75 0 0 0 .75-.75v-3.698a49.3 49.3 0 0 0-2 -.777Z" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg className="h-10 w-10 text-neutral-300" viewBox="0 0 24 24" fill="currentColor">
      <path fillRule="evenodd" d="M12.516 2.17a.75.75 0 0 0-1.032 0 11.209 11.209 0 0 1-7.877 3.08.75.75 0 0 0-.722.515A12.74 12.74 0 0 0 2.25 9.75c0 5.942 4.064 10.933 9.563 12.348a.749.749 0 0 0 .374 0c5.499-1.415 9.563-6.406 9.563-12.348 0-1.39-.223-2.73-.635-3.985a.75.75 0 0 0-.722-.516l-.143.001c-2.996 0-5.717-1.17-7.734-3.08Zm3.094 8.016a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
    </svg>
  );
}

const RATING_OPTIONS: RatingOption[] = [
  { rating: 2 as ReviewRating, labelKey: "hard", interval: "< 20m", bgClass: "bg-warning-500", icon: <FrownIcon /> },
  { rating: 3 as ReviewRating, labelKey: "good", interval: "< 40m", bgClass: "bg-primary-500", icon: <ThumbsUpIcon /> },
  { rating: 4 as ReviewRating, labelKey: "easy", interval: "< 78m", bgClass: "bg-success-500", icon: <SmileIcon /> },
];

// ---------------------------------------------------------------------------
// StudySessionPage — API-driven with demo fallback
// ---------------------------------------------------------------------------

type SessionState = "loading" | "studying" | "reviewing" | "complete" | "empty";

export function StudySessionPage() {
  const navigate = useNavigate();
  const { deckId } = useParams<{ deckId: string }>();
  const { t } = useTranslation("study");
  const { user } = useAuth();
  const { seen: onboardSeen, markSeen: markOnboardSeen } = useStudyOnboard();
  const [showOnboard, setShowOnboard] = useState(false);

  const [sessionState, setSessionState] = useState<SessionState>("loading");
  const [dueCards, setDueCards] = useState<DueCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [ratingCounts, setRatingCounts] = useState({ 2: 0, 3: 0, 4: 0 });
  const [totalResponseTime, setTotalResponseTime] = useState(0);
  const [isLimitReached, setIsLimitReached] = useState(false);
  const [isGoFluentOpen, setIsGoFluentOpen] = useState(false);
  const [cardTheme, setCardTheme] = useState<CardTheme>(getCardTheme());
  const isResettingRef = useRef(false);
  const cardStartTimeRef = useRef(Date.now());

  // Swipe gesture state (X = left/right, Y = up for master)
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [swipeOffsetY, setSwipeOffsetY] = useState(0);
  const [swipeExit, setSwipeExit] = useState<"left" | "right" | "up" | null>(null);
  const swipeStartX = useRef(0);
  const swipeStartY = useRef(0);
  const isDragging = useRef(false);
  const swipeAxis = useRef<"x" | "y" | null>(null);

  const currentCard = dueCards[currentIndex] ?? null;
  const total = dueCards.length;
  const current = currentIndex + 1;

  useEffect(() => {
    profileApi.getPreferences().then((prefs) => {
      setCardTheme(getCardTheme(prefs.cardTheme));
      setHapticEnabled(prefs.hapticFeedback ?? true);
      setSoundEnabled(prefs.soundFeedback ?? true);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!deckId) return;

    async function loadCards() {
      try {
        // Initialize progress for new cards, then fetch non-mastered cards
        await studyApi.initProgress(deckId!);
        const cards = await syncAwareApi.getDueCards(deckId!);

        if (cards.length === 0) {
          setSessionState("empty");
          return;
        }

        setDueCards(cards);

        // Start a session
        const session = await syncAwareApi.startSession(deckId!);
        if (session) setSessionId(session.id);
        cardStartTimeRef.current = Date.now();
        if (!onboardSeen) {
          setShowOnboard(true);
        }
        setSessionState("studying");
      } catch {
        setSessionState("empty");
      }
    }

    loadCards();
  }, [deckId]);

  const handleFlip = useCallback(() => {
    if (sessionState === "studying") {
      setIsFlipped(true);
      setSessionState("reviewing");
      haptic("light");
      playSound("flip");
    }
  }, [sessionState]);

  const handleReview = useCallback(
    async (rating: ReviewRating) => {
      if (!currentCard) return;

      // Tactile + audio feedback
      haptic(rating === 4 ? "success" : "medium");
      playSound("rate");

      const responseTimeMs = Date.now() - cardStartTimeRef.current;

      // Submit review to API
      try {
        await syncAwareApi.submitReview(
          currentCard.progress.id,
          rating,
          responseTimeMs,
          sessionId ?? undefined
        );
      } catch (err) {
        if (err instanceof ApiError && err.code === "REVIEW_LIMIT_REACHED") {
          setIsLimitReached(true);
          return;
        }
        // Continue even if other submissions fail
      }

      setReviewedCount((prev) => prev + 1);
      setRatingCounts((prev) => ({ ...prev, [rating]: prev[rating as keyof typeof prev] + 1 }));
      setTotalResponseTime((prev) => prev + responseTimeMs);

      const nextIndex = currentIndex + 1;
      if (nextIndex >= dueCards.length) {
        // End session
        if (sessionId) {
          syncAwareApi.endSession(sessionId).catch(console.error);
        }
        setSessionState("complete");
      } else {
        // Instantly reset card to front (no transition)
        isResettingRef.current = true;
        setIsFlipped(false);
        setSwipeOffset(0);
        setSwipeOffsetY(0);
        setSwipeExit(null);
        setCurrentIndex(nextIndex);
        setSessionState("studying");
        cardStartTimeRef.current = Date.now();

        // Re-enable transition on next frame
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            isResettingRef.current = false;
          });
        });
      }
    },
    [currentIndex, dueCards.length, currentCard, sessionId]
  );

  const handleMaster = useCallback(
    async () => {
      if (!currentCard) return;

      haptic("success");
      playSound("swipeUp");

      const responseTimeMs = Date.now() - cardStartTimeRef.current;

      try {
        await syncAwareApi.submitReview(
          currentCard.progress.id,
          4 as ReviewRating,
          responseTimeMs,
          sessionId ?? undefined,
          true // forceMaster
        );
      } catch (err) {
        if (err instanceof ApiError && err.code === "REVIEW_LIMIT_REACHED") {
          setIsLimitReached(true);
          return;
        }
      }

      setReviewedCount((prev) => prev + 1);
      setRatingCounts((prev) => ({ ...prev, 4: prev[4] + 1 }));
      setTotalResponseTime((prev) => prev + responseTimeMs);

      const nextIndex = currentIndex + 1;
      if (nextIndex >= dueCards.length) {
        if (sessionId) {
          syncAwareApi.endSession(sessionId).catch(console.error);
        }
        setSessionState("complete");
      } else {
        isResettingRef.current = true;
        setIsFlipped(false);
        setSwipeOffset(0);
        setSwipeOffsetY(0);
        setSwipeExit(null);
        setCurrentIndex(nextIndex);
        setSessionState("studying");
        cardStartTimeRef.current = Date.now();

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            isResettingRef.current = false;
          });
        });
      }
    },
    [currentIndex, dueCards.length, currentCard, sessionId]
  );

  // Swipe gesture handlers (only active in reviewing state)
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (sessionState !== "reviewing" || swipeExit) return;
      e.preventDefault();
      swipeStartX.current = e.clientX;
      swipeStartY.current = e.clientY;
      swipeAxis.current = null;
      isDragging.current = true;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    [sessionState, swipeExit]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging.current) return;
      e.preventDefault();
      const dx = e.clientX - swipeStartX.current;
      const dy = e.clientY - swipeStartY.current;

      // Lock axis after 10px of movement — favor Y when moving upward
      if (!swipeAxis.current && (Math.abs(dx) > 10 || Math.abs(dy) > 10)) {
        // Favor vertical when the upward component is significant
        if (dy < -10 && Math.abs(dy) > Math.abs(dx) * 0.7) {
          swipeAxis.current = "y";
        } else {
          swipeAxis.current = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
        }
      }

      if (swipeAxis.current === "y") {
        // Only track upward movement (negative dy)
        setSwipeOffsetY(Math.min(0, dy));
        setSwipeOffset(0);
      } else {
        setSwipeOffset(dx);
        setSwipeOffsetY(0);
      }
    },
    []
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging.current) return;
      isDragging.current = false;
      const dx = e.clientX - swipeStartX.current;
      const dy = e.clientY - swipeStartY.current;
      const axis = swipeAxis.current;
      swipeAxis.current = null;
      const SWIPE_THRESHOLD = 100;
      const SWIPE_UP_THRESHOLD = 70;

      if (axis === "y" && dy < -SWIPE_UP_THRESHOLD) {
        // Swipe up — master the card
        haptic("heavy");
        playSound("swipeUp");
        setSwipeExit("up");
        setTimeout(() => {
          setSwipeExit(null);
          setSwipeOffset(0);
          setSwipeOffsetY(0);
          handleMaster();
        }, 300);
      } else if (axis !== "y" && Math.abs(dx) > SWIPE_THRESHOLD) {
        // Swipe left/right
        const direction = dx > 0 ? "right" : "left";
        haptic("heavy");
        playSound(direction === "right" ? "swipeRight" : "swipeLeft");
        setSwipeExit(direction);
        setTimeout(() => {
          setSwipeExit(null);
          setSwipeOffset(0);
          setSwipeOffsetY(0);
          handleReview(direction === "right" ? (4 as ReviewRating) : (2 as ReviewRating));
        }, 300);
      } else {
        // Snap back
        setSwipeOffset(0);
        setSwipeOffsetY(0);
      }
    },
    [handleReview, handleMaster]
  );

  const handleClose = useCallback(() => {
    if (sessionId) {
      syncAwareApi.endSession(sessionId).catch(console.error);
    }
    navigate("/");
  }, [navigate, sessionId]);

  // Keyboard support
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (sessionState === "studying" && (e.key === " " || e.key === "Enter")) {
        e.preventDefault();
        handleFlip();
      } else if (sessionState === "reviewing" && e.key >= "2" && e.key <= "4") {
        handleReview(Number(e.key) as ReviewRating);
      } else if (sessionState === "reviewing" && (e.key === "m" || e.key === "M")) {
        handleMaster();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [sessionState, handleFlip, handleReview, handleMaster]);

  // Celebrate session completion + prompt upgrade every 3rd session
  useEffect(() => {
    if (sessionState === "complete") {
      haptic("success");
      playSound("complete");

      if (user?.tier === "free") {
        const key = "versado:study-session-count";
        const count = Number(localStorage.getItem(key) || "0") + 1;
        localStorage.setItem(key, String(count));
        if (count % 3 === 0) {
          setIsGoFluentOpen(true);
        }
      }
    }
  }, [sessionState, user?.tier]);

  // Loading
  if (sessionState === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50">
        <p className="text-sm text-neutral-400">{t("loading")}</p>
      </div>
    );
  }

  // Empty
  if (sessionState === "empty") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-5">
        <h1 className="text-2xl font-bold text-neutral-900">{t("empty.heading")}</h1>
        <p className="mt-2 text-neutral-500">
          {t("empty.message")}
        </p>
        <button
          onClick={() => navigate("/")}
          className="mt-6 rounded-full bg-primary-500 px-8 py-3 text-sm font-semibold text-white transition-all hover:bg-primary-600 active:scale-95"
        >
          {t("empty.backHome")}
        </button>
      </div>
    );
  }

  // Complete
  if (sessionState === "complete") {
    const accuracy = reviewedCount > 0
      ? Math.round(((ratingCounts[3] + ratingCounts[4]) / reviewedCount) * 100)
      : 0;
    const avgTime = reviewedCount > 0
      ? Math.round(totalResponseTime / reviewedCount / 1000)
      : 0;

    const ratingBars = [
      { label: t("ratings.hard"), count: ratingCounts[2], color: "bg-warning-500" },
      { label: t("ratings.good"), count: ratingCounts[3], color: "bg-primary-500" },
      { label: t("ratings.easy"), count: ratingCounts[4], color: "bg-success-500" },
    ];

    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-5">
        <div className="w-full max-w-sm">
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-success-50">
              <SmileIcon />
            </div>
            <h1 className="text-2xl font-bold text-neutral-900">
              {t("complete.heading")}
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              {t("complete.reviewed", { count: reviewedCount })}
            </p>
          </div>

          {/* Stats */}
          <div className="mt-6 flex justify-center gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary-500">{accuracy}%</p>
              <p className="text-xs text-neutral-500">{t("complete.accuracy")}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-neutral-700">{avgTime}s</p>
              <p className="text-xs text-neutral-500">{t("complete.avgTime")}</p>
            </div>
          </div>

          {/* Rating breakdown */}
          <div className="mt-6 rounded-xl bg-neutral-0 p-4 shadow-card">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-400">
              {t("complete.ratingBreakdown")}
            </p>
            <div className="flex flex-col gap-2">
              {ratingBars.map((bar) => (
                <div key={bar.label} className="flex items-center gap-2">
                  <span className="w-12 text-xs text-neutral-600">
                    {bar.label}
                  </span>
                  <div className="flex-1 overflow-hidden rounded-full bg-neutral-100 h-2">
                    <div
                      className={`h-full rounded-full transition-all ${bar.color}`}
                      style={{
                        width: reviewedCount > 0
                          ? `${(bar.count / reviewedCount) * 100}%`
                          : "0%",
                      }}
                    />
                  </div>
                  <span className="w-6 text-right text-xs font-medium text-neutral-500">
                    {bar.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex flex-col gap-2">
            <button
              onClick={() => window.location.reload()}
              className="w-full rounded-full bg-primary-500 py-3 text-sm font-semibold text-white transition-all hover:bg-primary-600 active:scale-95"
            >
              {t("complete.studyAgain")}
            </button>
            <button
              onClick={() => navigate(`/decks/${deckId}`)}
              className="w-full rounded-full bg-neutral-100 py-3 text-sm font-semibold text-neutral-700 transition-all hover:bg-neutral-200 active:scale-95"
            >
              {t("complete.backToDeck")}
            </button>
            <button
              onClick={() => navigate("/history")}
              className="w-full rounded-full bg-neutral-100 py-3 text-sm font-semibold text-neutral-700 transition-all hover:bg-neutral-200 active:scale-95"
            >
              {t("complete.viewHistory")}
            </button>
            <button
              onClick={() => navigate("/")}
              className="w-full py-2 text-sm text-neutral-500 transition-colors hover:text-neutral-700"
            >
              {t("complete.backHome")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isReviewing = sessionState === "reviewing";

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      {/* Header */}
      <header className="px-5 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <button
            onClick={handleClose}
            aria-label={t("session.closeSession")}
            className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-500 transition-all hover:bg-neutral-200 active:scale-90"
          >
            <X className="h-5 w-5" />
          </button>
          <span className="text-sm font-semibold text-neutral-700">
            {current} / {total}
          </span>
          {isReviewing ? (
            <button aria-label={t("session.moreOptions")} className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-500 transition-all hover:bg-neutral-200 active:scale-90">
              <MoreVertical className="h-5 w-5" />
            </button>
          ) : (
            <div className="h-9 w-9" />
          )}
        </div>
        {/* Progress bar */}
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-neutral-200">
          <div
            className="h-full rounded-full bg-primary-500 transition-all duration-300"
            style={{ width: `${(current / total) * 100}%` }}
          />
        </div>
      </header>

      {/* Card area — 3D flip + swipe */}
      <div className="relative flex flex-1 flex-col items-center justify-center px-5 overflow-hidden">
        {/* Swipe direction gradient backgrounds (behind the card) */}
        {isReviewing && !swipeExit && (swipeOffset !== 0 || swipeOffsetY < 0) && (
          <>
            {/* Right swipe = easy = green gradient on right */}
            <div
              className="pointer-events-none absolute inset-y-0 right-0 w-1/2 flex items-center justify-center"
              style={{
                background: "linear-gradient(to left, rgba(34,197,94,0.8), transparent)",
                opacity: Math.max(0, swipeOffset / 150),
              }}
            >
              <span className="text-3xl font-black uppercase text-white/90 tracking-widest -rotate-90">
                {t("swipe.easy")}
              </span>
            </div>
            {/* Left swipe = hard = red gradient on left */}
            <div
              className="pointer-events-none absolute inset-y-0 left-0 w-1/2 flex items-center justify-center"
              style={{
                background: "linear-gradient(to right, rgba(239,68,68,0.8), transparent)",
                opacity: Math.max(0, -swipeOffset / 150),
              }}
            >
              <span className="text-3xl font-black uppercase text-white/90 tracking-widest rotate-90">
                {t("swipe.hard")}
              </span>
            </div>
            {/* Up swipe = mastered = light blue gradient on top */}
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-1/2 flex items-center justify-center"
              style={{
                background: "linear-gradient(to bottom, rgba(56,189,248,0.8), transparent)",
                opacity: Math.max(0, -swipeOffsetY / 120),
              }}
            >
              <span className="text-3xl font-black uppercase text-white/90 tracking-widest">
                {t("swipe.mastered")}
              </span>
            </div>
          </>
        )}

        <div
          className={`flip-card relative z-10 w-full max-w-md ${swipeExit === "up" ? "swipe-exit-up" : ""} ${swipeExit === "left" ? "swipe-exit-left" : ""} ${swipeExit === "right" ? "swipe-exit-right" : ""}`}
          style={{
            touchAction: isReviewing ? "none" : "auto",
            ...(!swipeExit && swipeOffsetY < 0
              ? {
                  transform: `translateY(${swipeOffsetY}px) scale(${1 + swipeOffsetY / 1000})`,
                  opacity: 1 - Math.abs(swipeOffsetY) / 400,
                  transition: "none",
                }
              : !swipeExit && swipeOffset !== 0
                ? {
                    transform: `translateX(${swipeOffset}px) rotate(${swipeOffset * 0.05}deg)`,
                    opacity: 1 - Math.abs(swipeOffset) / 600,
                    transition: "none",
                  }
                : {}),
          }}
          onClick={sessionState === "studying" ? handleFlip : undefined}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          role={!isReviewing ? "button" : undefined}
          tabIndex={!isReviewing ? 0 : undefined}
        >
          <div
            className={`flip-card-inner w-full ${isFlipped ? "flipped" : ""} ${isResettingRef.current ? "no-transition" : ""}`}
          >
            {/* Front face — Question */}
            <div className={`flip-card-face flex w-full flex-col items-center gap-4 p-8 min-h-[280px] max-h-[60vh] transition-shadow ${cardTheme.cardClassName} ${!isReviewing ? "cursor-pointer hover:shadow-card-hover active:scale-[0.98]" : ""}`}>
              <span className={`shrink-0 text-xs font-semibold uppercase tracking-wider ${cardTheme.labelClassName}`}>
                {t("card.question")}
              </span>
              <p className={`flex-1 overflow-y-auto break-words text-xl font-bold text-center ${cardTheme.textClassName}`}>
                {currentCard?.flashcard.front}
              </p>
              <div className="shrink-0">
                <GraduationCapIcon />
              </div>
            </div>

            {/* Back face — Answer */}
            <div className={`flip-card-face flip-card-back flex w-full flex-col items-center gap-4 p-8 min-h-[280px] max-h-[60vh] ${cardTheme.cardClassName}`}>
              <span className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider ${cardTheme.answerLabelClassName}`}>
                {t("card.answerRevealed")}
              </span>
              <p className={`flex-1 overflow-y-auto break-words text-base leading-relaxed text-center ${cardTheme.textClassName}`}>
                {currentCard?.flashcard.back}
              </p>
              <div className="shrink-0">
                <ShieldIcon />
              </div>
            </div>
          </div>
        </div>

        {/* Mastery indicator */}
        {currentCard && (() => {
          const interval = currentCard.progress.interval;
          const masteryPercent = Math.min(100, Math.round((interval / 21) * 100));
          const status = currentCard.progress.status;
          const statusConfig = {
            new: { label: t("status.new"), color: "text-neutral-400", ring: "stroke-neutral-300" },
            learning: { label: t("status.learning"), color: "text-primary-500", ring: "stroke-primary-500" },
            relearning: { label: t("status.learning"), color: "text-primary-500", ring: "stroke-primary-500" },
            review: { label: t("status.review"), color: "text-warning-500", ring: "stroke-warning-500" },
            mastered: { label: t("status.mastered"), color: "text-success-500", ring: "stroke-success-500" },
          }[status] ?? { label: status, color: "text-neutral-400", ring: "stroke-neutral-300" };

          return (
            <div className="mt-3 flex items-center gap-2">
              {/* Mini circular progress ring */}
              <svg className="h-5 w-5 -rotate-90" viewBox="0 0 20 20">
                <circle cx="10" cy="10" r="8" fill="none" className="stroke-neutral-200" strokeWidth="2.5" />
                <circle
                  cx="10" cy="10" r="8" fill="none"
                  className={statusConfig.ring}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeDasharray={`${masteryPercent * 0.5} 50`}
                  style={{ transition: "stroke-dasharray 0.5s ease" }}
                />
              </svg>
              <span className={`text-xs font-medium ${statusConfig.color}`}>
                {statusConfig.label}
              </span>
              <span className="text-xs text-neutral-400">
                {t("card.masteryProgress", { percent: masteryPercent })}
              </span>
            </div>
          );
        })()}
      </div>

      {/* Footer */}
      <footer className="px-5 pb-6 pt-4">
        {isReviewing ? (
          <div className="flex flex-col items-center gap-4 animate-in fade-in duration-300">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
              {t("card.howWell")}
            </p>
            <div className="flex gap-4">
              {RATING_OPTIONS.map((opt) => (
                <button
                  key={opt.rating}
                  onClick={() => handleReview(opt.rating)}
                  className="flex flex-col items-center gap-1"
                >
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-full text-white shadow-card transition-transform hover:scale-110 active:scale-90 ${opt.bgClass}`}
                  >
                    {opt.icon}
                  </div>
                  <span className="text-[10px] font-bold uppercase text-neutral-600">
                    {t(`ratings.${opt.labelKey}`)}
                  </span>
                  <span className="text-[10px] text-neutral-400">
                    {opt.interval}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <button
            onClick={handleFlip}
            className="flex w-full flex-col items-center gap-1 py-2 text-neutral-400 transition-colors hover:text-neutral-600"
          >
            <ChevronUp className="h-5 w-5 animate-bounce-subtle" />
            <span className="text-sm">{t("card.tapToReveal")}</span>
          </button>
        )}
      </footer>

      <GoFluentModal
        isOpen={isLimitReached}
        onClose={() => {
          setIsLimitReached(false);
          if (sessionId) {
            syncAwareApi.endSession(sessionId).catch(console.error);
          }
          navigate("/");
        }}
        trigger="limit"
      />

      <GoFluentModal
        isOpen={isGoFluentOpen}
        onClose={() => setIsGoFluentOpen(false)}
        trigger="session"
      />

      {showOnboard && (
        <StudyOnboardOverlay
          onComplete={() => {
            markOnboardSeen();
            setShowOnboard(false);
          }}
        />
      )}
    </div>
  );
}
