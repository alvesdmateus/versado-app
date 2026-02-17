export interface SessionSummaryProps {
  cardsStudied: number;
  correctCount: number;
  incorrectCount: number;
  averageTimeMs: number;
  totalTimeMs: number;
  onContinue?: () => void;
  onFinish?: () => void;
  className?: string;
}

export function SessionSummary({
  cardsStudied,
  correctCount,
  incorrectCount,
  averageTimeMs,
  totalTimeMs,
  onContinue,
  onFinish,
  className = "",
}: SessionSummaryProps) {
  const accuracyPercent =
    cardsStudied > 0 ? Math.round((correctCount / cardsStudied) * 100) : 0;

  const formatTime = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    const seconds = Math.round(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getPerformanceMessage = (): string => {
    if (cardsStudied === 0) return "No cards studied";
    if (accuracyPercent >= 90) return "Excellent work!";
    if (accuracyPercent >= 70) return "Good job!";
    if (accuracyPercent >= 50) return "Keep practicing!";
    return "Needs more review";
  };

  return (
    <div className={`session-summary ${className}`}>
      <h2 className="session-summary__title">Session Complete</h2>
      <p className="session-summary__message">{getPerformanceMessage()}</p>

      <div className="session-summary__stats">
        <div className="session-summary__stat">
          <span className="session-summary__stat-value">{cardsStudied}</span>
          <span className="session-summary__stat-label">Cards Studied</span>
        </div>

        <div className="session-summary__stat session-summary__stat--correct">
          <span className="session-summary__stat-value">{correctCount}</span>
          <span className="session-summary__stat-label">Correct</span>
        </div>

        <div className="session-summary__stat session-summary__stat--incorrect">
          <span className="session-summary__stat-value">{incorrectCount}</span>
          <span className="session-summary__stat-label">Incorrect</span>
        </div>

        <div className="session-summary__stat">
          <span className="session-summary__stat-value">{accuracyPercent}%</span>
          <span className="session-summary__stat-label">Accuracy</span>
        </div>

        <div className="session-summary__stat">
          <span className="session-summary__stat-value">{formatTime(averageTimeMs)}</span>
          <span className="session-summary__stat-label">Avg Time</span>
        </div>

        <div className="session-summary__stat">
          <span className="session-summary__stat-value">{formatTime(totalTimeMs)}</span>
          <span className="session-summary__stat-label">Total Time</span>
        </div>
      </div>

      <div className="session-summary__actions">
        {onContinue && (
          <button
            type="button"
            className="session-summary__button session-summary__button--continue"
            onClick={onContinue}
          >
            Continue Studying
          </button>
        )}
        {onFinish && (
          <button
            type="button"
            className="session-summary__button session-summary__button--finish"
            onClick={onFinish}
          >
            Finish
          </button>
        )}
      </div>
    </div>
  );
}
