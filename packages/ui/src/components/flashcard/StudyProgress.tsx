export interface StudyProgressProps {
  current: number;
  total: number;
  correctCount: number;
  incorrectCount: number;
  className?: string;
}

export function StudyProgress({
  current,
  total,
  correctCount,
  incorrectCount,
  className = "",
}: StudyProgressProps) {
  const progressPercent = total > 0 ? Math.round((current / total) * 100) : 0;
  const accuracyPercent =
    correctCount + incorrectCount > 0
      ? Math.round((correctCount / (correctCount + incorrectCount)) * 100)
      : 0;

  return (
    <div className={`study-progress ${className}`}>
      <div className="study-progress__bar-container">
        <div
          className="study-progress__bar"
          style={{ width: `${progressPercent}%` }}
          role="progressbar"
          aria-valuenow={current}
          aria-valuemin={0}
          aria-valuemax={total}
        />
      </div>
      <div className="study-progress__stats">
        <span className="study-progress__count">
          {current} / {total}
        </span>
        <div className="study-progress__results">
          <span className="study-progress__correct">{correctCount} correct</span>
          <span className="study-progress__separator">|</span>
          <span className="study-progress__incorrect">{incorrectCount} wrong</span>
          {correctCount + incorrectCount > 0 && (
            <>
              <span className="study-progress__separator">|</span>
              <span className="study-progress__accuracy">{accuracyPercent}%</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
