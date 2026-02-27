import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { ChevronLeft, BookOpen, Clock, Target } from "lucide-react";
import { Button } from "@versado/ui";
import { studyApi, type SessionHistoryItem } from "@/lib/study-api";
import { useErrorNotification } from "@/contexts/ErrorNotificationContext";

const PAGE_SIZE = 20;

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDuration(startedAt: string, endedAt: string | null): string | null {
  if (!endedAt) return null;
  const ms = new Date(endedAt).getTime() - new Date(startedAt).getTime();
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

function getRatingBreakdown(reviews: Array<{ rating: number }> | null) {
  if (!reviews || reviews.length === 0) return null;
  const counts = [0, 0, 0, 0]; // Again, Hard, Good, Easy
  for (const r of reviews) {
    if (r.rating >= 1 && r.rating <= 4) counts[r.rating - 1] = (counts[r.rating - 1] ?? 0) + 1;
  }
  return counts;
}

const RATING_COLORS = ["bg-error-400", "bg-warning-400", "bg-primary-400", "bg-success-400"];

function SessionCard({ session }: { session: SessionHistoryItem }) {
  const { t } = useTranslation(["home", "study"]);
  const RATING_LABELS = [t("study:ratings.again"), t("study:ratings.hard"), t("study:ratings.good"), t("study:ratings.easy")];
  const navigate = useNavigate();
  const stats = session.stats;
  const cardsStudied = stats?.cardsStudied ?? 0;
  const accuracy = cardsStudied > 0
    ? Math.round(((stats?.correctCount ?? 0) / cardsStudied) * 100)
    : 0;
  const breakdown = getRatingBreakdown(session.reviews);

  return (
    <button
      onClick={() => session.deckId && navigate(`/decks/${session.deckId}`)}
      className="w-full rounded-xl bg-neutral-0 p-4 shadow-card text-left transition-shadow hover:shadow-card-lg"
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-neutral-900">
            {session.deckName ?? t("history.deletedDeck")}
          </p>
          <p className="mt-0.5 text-xs text-neutral-400">
            {formatDate(session.startedAt)}
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="mt-3 flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-xs text-neutral-500">
          <BookOpen className="h-3.5 w-3.5" />
          <span>{t("history.cards", { count: cardsStudied })}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-neutral-500">
          <Target className="h-3.5 w-3.5" />
          <span>{accuracy}%</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-neutral-500">
          <Clock className="h-3.5 w-3.5" />
          <span>{formatDuration(session.startedAt, session.endedAt) ?? t("history.inProgress")}</span>
        </div>
      </div>

      {/* Rating breakdown bar */}
      {breakdown && cardsStudied > 0 && (
        <div className="mt-3">
          <div className="flex h-2 overflow-hidden rounded-full">
            {breakdown.map((count, i) =>
              count > 0 ? (
                <div
                  key={i}
                  className={`${RATING_COLORS[i]}`}
                  style={{ width: `${(count / cardsStudied) * 100}%` }}
                  title={`${RATING_LABELS[i]}: ${count}`}
                />
              ) : null
            )}
          </div>
          <div className="mt-1.5 flex gap-3">
            {breakdown.map((count, i) =>
              count > 0 ? (
                <span key={i} className="text-[10px] text-neutral-400">
                  {RATING_LABELS[i]} {count}
                </span>
              ) : null
            )}
          </div>
        </div>
      )}
    </button>
  );
}

export function StudyHistoryPage() {
  const { t } = useTranslation(["home", "common"]);
  const navigate = useNavigate();
  const { showErrorNotification } = useErrorNotification();
  const [sessions, setSessions] = useState<SessionHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const offsetRef = useRef(0);

  const fetchSessions = useCallback(async (append = false) => {
    if (append) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
      offsetRef.current = 0;
    }
    try {
      const result = await studyApi.getSessions(PAGE_SIZE, offsetRef.current);
      if (append) {
        setSessions((prev) => [...prev, ...result.sessions]);
      } else {
        setSessions(result.sessions);
      }
      setHasMore(result.sessions.length >= PAGE_SIZE);
      offsetRef.current += result.sessions.length;
    } catch (err) {
      showErrorNotification(err);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="flex items-center px-5 py-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-neutral-600 transition-colors hover:text-neutral-900"
        >
          <ChevronLeft className="h-5 w-5" />
          <span className="text-sm">{t("common:actions.back")}</span>
        </button>
        <h1 className="flex-1 truncate text-center text-lg font-semibold text-neutral-900 pr-14">
          {t("history.heading")}
        </h1>
      </div>

      {/* Session list */}
      <div className="space-y-3 px-5">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-neutral-200" />
          ))
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center py-16">
            <BookOpen className="h-12 w-12 text-neutral-300" />
            <p className="mt-3 text-sm font-medium text-neutral-500">{t("history.noSessions")}</p>
            <p className="mt-1 text-xs text-neutral-400">{t("history.emptyState")}</p>
          </div>
        ) : (
          <>
            {sessions.map((session) => (
              <SessionCard key={session.id} session={session} />
            ))}
            {hasMore && (
              <Button
                variant="secondary"
                fullWidth
                onClick={() => fetchSessions(true)}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? t("common:loading") : t("history.loadMore")}
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
