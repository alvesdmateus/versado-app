import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router";
import { X, ChevronUp, MoreVertical } from "lucide-react";
import type { ReviewRating } from "@versado/algorithms";
import { studyApi } from "@/lib/study-api";
import type { DueCard } from "@/lib/study-api";
import { syncAwareApi } from "@/lib/sync-aware-api";
import { profileApi } from "@/lib/profile-api";
import { ApiError } from "@/lib/api-client";
import { getCardTheme, type CardTheme } from "@/lib/card-themes";
import { LimitReachedModal } from "@/components/shared/LimitReachedModal";

// ---------------------------------------------------------------------------
// Rating button config
// ---------------------------------------------------------------------------

interface RatingOption {
  rating: ReviewRating;
  label: string;
  interval: string;
  bgClass: string;
  icon: React.ReactNode;
}

function UndoIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10h10a5 5 0 0 1 0 10H9" />
      <path d="M3 10l4-4" />
      <path d="M3 10l4 4" />
    </svg>
  );
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
  { rating: 1 as ReviewRating, label: "Again", interval: "< 1m", bgClass: "bg-error-500", icon: <UndoIcon /> },
  { rating: 2 as ReviewRating, label: "Hard", interval: "< 20m", bgClass: "bg-warning-500", icon: <FrownIcon /> },
  { rating: 3 as ReviewRating, label: "Good", interval: "< 40m", bgClass: "bg-primary-500", icon: <ThumbsUpIcon /> },
  { rating: 4 as ReviewRating, label: "Easy", interval: "< 78m", bgClass: "bg-success-500", icon: <SmileIcon /> },
];

// ---------------------------------------------------------------------------
// StudySessionPage — API-driven with demo fallback
// ---------------------------------------------------------------------------

type SessionState = "loading" | "studying" | "reviewing" | "complete" | "empty";

export function StudySessionPage() {
  const navigate = useNavigate();
  const { deckId } = useParams<{ deckId: string }>();

  const [sessionState, setSessionState] = useState<SessionState>("loading");
  const [dueCards, setDueCards] = useState<DueCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [ratingCounts, setRatingCounts] = useState({ 1: 0, 2: 0, 3: 0, 4: 0 });
  const [totalResponseTime, setTotalResponseTime] = useState(0);
  const [isLimitReached, setIsLimitReached] = useState(false);
  const [cardTheme, setCardTheme] = useState<CardTheme>(getCardTheme());
  const isResettingRef = useRef(false);
  const cardStartTimeRef = useRef(Date.now());

  const currentCard = dueCards[currentIndex] ?? null;
  const total = dueCards.length;
  const current = currentIndex + 1;

  useEffect(() => {
    profileApi.getPreferences().then((prefs) => {
      setCardTheme(getCardTheme(prefs.cardTheme));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!deckId) return;

    async function loadCards() {
      try {
        // Initialize progress for new cards, then fetch due cards
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
    }
  }, [sessionState]);

  const handleReview = useCallback(
    async (rating: ReviewRating) => {
      if (!currentCard) return;

      const responseTimeMs = Date.now() - cardStartTimeRef.current;

      // Submit review to API
      try {
        await syncAwareApi.submitReview(
          currentCard.progress.id,
          rating,
          responseTimeMs
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
          syncAwareApi.endSession(sessionId).catch(() => {});
        }
        setSessionState("complete");
      } else {
        // Instantly reset card to front (no transition)
        isResettingRef.current = true;
        setIsFlipped(false);
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

  const handleClose = useCallback(() => {
    if (sessionId) {
      syncAwareApi.endSession(sessionId).catch(() => {});
    }
    navigate("/");
  }, [navigate, sessionId]);

  // Keyboard support
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (sessionState === "studying" && (e.key === " " || e.key === "Enter")) {
        e.preventDefault();
        handleFlip();
      } else if (sessionState === "reviewing" && e.key >= "1" && e.key <= "4") {
        handleReview(Number(e.key) as ReviewRating);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [sessionState, handleFlip, handleReview]);

  // Loading
  if (sessionState === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50">
        <p className="text-sm text-neutral-400">Loading cards...</p>
      </div>
    );
  }

  // Empty
  if (sessionState === "empty") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-5">
        <h1 className="text-2xl font-bold text-neutral-900">No Cards Due</h1>
        <p className="mt-2 text-neutral-500">
          All caught up! Come back later for more reviews.
        </p>
        <button
          onClick={() => navigate("/")}
          className="mt-6 rounded-full bg-primary-500 px-8 py-3 text-sm font-semibold text-white transition-all hover:bg-primary-600 active:scale-95"
        >
          Back to Home
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
      { label: "Again", count: ratingCounts[1], color: "bg-error-500" },
      { label: "Hard", count: ratingCounts[2], color: "bg-warning-500" },
      { label: "Good", count: ratingCounts[3], color: "bg-primary-500" },
      { label: "Easy", count: ratingCounts[4], color: "bg-success-500" },
    ];

    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-5">
        <div className="w-full max-w-sm">
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-success-50">
              <SmileIcon />
            </div>
            <h1 className="text-2xl font-bold text-neutral-900">
              Session Complete!
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              You reviewed {reviewedCount} card{reviewedCount !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Stats */}
          <div className="mt-6 flex justify-center gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary-500">{accuracy}%</p>
              <p className="text-xs text-neutral-500">Accuracy</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-neutral-700">{avgTime}s</p>
              <p className="text-xs text-neutral-500">Avg. Time</p>
            </div>
          </div>

          {/* Rating breakdown */}
          <div className="mt-6 rounded-xl bg-neutral-0 p-4 shadow-card">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Rating Breakdown
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
              Study Again
            </button>
            <button
              onClick={() => navigate(`/decks/${deckId}`)}
              className="w-full rounded-full bg-neutral-100 py-3 text-sm font-semibold text-neutral-700 transition-all hover:bg-neutral-200 active:scale-95"
            >
              Back to Deck
            </button>
            <button
              onClick={() => navigate("/")}
              className="w-full py-2 text-sm text-neutral-500 transition-colors hover:text-neutral-700"
            >
              Back to Home
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
            className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-500 transition-all hover:bg-neutral-200 active:scale-90"
          >
            <X className="h-5 w-5" />
          </button>
          <span className="text-sm font-semibold text-neutral-700">
            {current} / {total}
          </span>
          {isReviewing ? (
            <button className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-500 transition-all hover:bg-neutral-200 active:scale-90">
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

      {/* Card area — 3D flip */}
      <div className="flex flex-1 flex-col items-center justify-center px-5">
        <div
          className="flip-card w-full max-w-md"
          onClick={!isReviewing ? handleFlip : undefined}
          role={!isReviewing ? "button" : undefined}
          tabIndex={!isReviewing ? 0 : undefined}
        >
          <div
            className={`flip-card-inner w-full ${isFlipped ? "flipped" : ""} ${isResettingRef.current ? "no-transition" : ""}`}
          >
            {/* Front face — Question */}
            <div className={`flip-card-face flex w-full flex-col items-center gap-5 p-8 transition-shadow ${cardTheme.cardClassName} ${!isReviewing ? "cursor-pointer hover:shadow-card-hover active:scale-[0.98]" : ""}`}>
              <span className={`text-xs font-semibold uppercase tracking-wider ${cardTheme.labelClassName}`}>
                Question
              </span>
              <p className={`text-xl font-bold text-center ${cardTheme.textClassName}`}>
                {currentCard?.flashcard.front}
              </p>
              <GraduationCapIcon />
            </div>

            {/* Back face — Answer */}
            <div className={`flip-card-face flip-card-back flex w-full flex-col items-center gap-5 p-8 ${cardTheme.cardClassName}`}>
              <span className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider ${cardTheme.answerLabelClassName}`}>
                Answer Revealed
              </span>
              <p className={`text-base leading-relaxed text-center ${cardTheme.textClassName}`}>
                {currentCard?.flashcard.back}
              </p>
              <ShieldIcon />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="px-5 pb-6 pt-4">
        {isReviewing ? (
          <div className="flex flex-col items-center gap-4 animate-in fade-in duration-300">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
              How well did you know this?
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
                    {opt.label}
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
            <span className="text-sm">Tap to reveal answer</span>
          </button>
        )}
      </footer>

      <LimitReachedModal
        isOpen={isLimitReached}
        onClose={() => {
          setIsLimitReached(false);
          if (sessionId) {
            syncAwareApi.endSession(sessionId).catch(() => {});
          }
          navigate("/");
        }}
      />
    </div>
  );
}
