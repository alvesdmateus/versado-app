import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { learningApi, type DueReview } from "@/lib/learning-api";
import { getInteractive, type Values, type Verdict } from "@/components/learning/interactives";
import { ControlStack, splitControls, unanswered } from "@/components/learning/controls";
import { BoardPanel, PrimaryButton, Spinner } from "@/components/learning/ui";
import { bandColor } from "@/components/learning/bands";

const MAX_ATTEMPTS = 3;

/** Review tab: spaced, interleaved prediction checks on completed modules. */
export function ReviewPage() {
  const { t } = useTranslation("learn");
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<DueReview[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [index, setIndex] = useState(0);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let alive = true;
    setReviews(null);
    setFailed(false);
    learningApi
      .listDueReviews()
      .then((r) => {
        if (!alive) return;
        // Interleave: alternate between modules of different kinds when possible.
        setReviews(interleave(r));
        setIndex(0);
      })
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [reload]);

  const current = reviews?.[index];

  return (
    <div className="gb-surface min-h-full">
      <header className="flex h-14 items-center justify-between border-b border-gb-seam px-5">
        <h1 className="text-[19px] font-extrabold tracking-tight">{t("review.title")}</h1>
        {reviews && reviews.length > 0 && index < reviews.length && (
          <span className="flex min-w-0 items-center gap-2 text-[13px] font-semibold text-gb-mute">
            <span className="truncate">{reviews[index]?.module.title}</span>
            <span className="shrink-0 tabular-nums">
              {index + 1} / {reviews.length}
            </span>
          </span>
        )}
      </header>

      <div className="mx-auto max-w-md px-5 pb-28 pt-5">
        {failed && (
          <div className="flex flex-col gap-4 py-6">
            <p className="text-lg font-bold">{t("review.error")}</p>
            <PrimaryButton onClick={() => setReload((r) => r + 1)}>{t("home.error.retry")}</PrimaryButton>
          </div>
        )}
        {!failed && reviews === null && (
          <div className="flex h-64 items-center justify-center">
            <Spinner />
          </div>
        )}
        {reviews && (reviews.length === 0 || index >= reviews.length) && (
          <div className="flex flex-col gap-3 py-6">
            <p className="text-2xl font-extrabold tracking-tight">
              {reviews.length === 0 ? t("review.empty.title") : t("review.finished.title")}
            </p>
            <p className="text-gb-mute">{reviews.length === 0 ? t("review.empty.body") : t("review.finished.body")}</p>
            <PrimaryButton className="mt-2" onClick={() => navigate("/")}>
              {t("review.toLearn")}
            </PrimaryButton>
          </div>
        )}
        {current && <ReviewCheck key={current.module.id} review={current} onDone={() => setIndex((i) => i + 1)} />}
      </div>
    </div>
  );
}

function ReviewCheck({ review, onDone }: { review: DueReview; onDone: () => void }) {
  const { t } = useTranslation("learn");
  const { module } = review;
  const def = getInteractive(module.interactive);
  const spec = module.spec;
  const target = spec.retentionHooks.reviewTarget;
  const [values, setValues] = useState<Values>(() => def?.initialValues(spec, 3, target) ?? {});
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [touched, setTouched] = useState(false);
  const [changed, setChanged] = useState<{ name: string; tick: number } | null>(null);
  const [saving, setSaving] = useState(false);

  if (!def) return null;
  const Board = def.Board;
  const finished = verdict?.correct || attempts >= MAX_ATTEMPTS;

  const check = () => {
    const v = def.evaluate(values, target, spec.stage3Prediction.tolerance, spec);
    setVerdict(v);
    setAttempts((a) => a + 1);
    setTouched(false);
  };

  const next = async () => {
    setSaving(true);
    await learningApi
      .submitReview(module.id, { correct: !!verdict?.correct, attempts: Math.max(1, attempts) })
      .catch(() => {});
    setSaving(false);
    onDone();
  };

  const onControl = (name: string, v: number) => {
    setValues((p) => ({ ...p, [name]: v }));
    setVerdict(null);
    setTouched(true);
    setChanged((c) => ({ name, tick: (c?.tick ?? 0) + 1 }));
  };
  const reviewControls = def.predictionControls(spec, target);
  const { free } = splitControls(def, reviewControls);

  const prompt = verdict
    ? verdict.correct
      ? spec.retentionHooks.reviewOnSuccess
      : diagnose(spec.stage3Prediction.adaptiveFeedback, verdict.kind)
    : spec.retentionHooks.spacedReviewPrompt;

  return (
    <section className="flex flex-col gap-3">
      <h2
        className="min-h-[3.5rem] text-[22px] font-bold leading-snug tracking-tight text-balance"
        aria-live="polite"
        style={verdict && !verdict.correct ? { color: bandColor("red") } : undefined}
      >
        {prompt}
      </h2>
      <BoardPanel>
        <Board
          spec={spec}
          stage={3}
          values={values}
          target={target}
          verdict={verdict}
          anchorT={1}
          changed={changed}
          input={!finished ? { controls: reviewControls, onChange: onControl } : undefined}
        />
      </BoardPanel>
      {!finished && free.length > 0 && <ControlStack controls={free} values={values} onChange={onControl} />}
      <div className="mt-2">
        {finished ? (
          <PrimaryButton onClick={next} disabled={saving}>
            {saving ? <Spinner /> : t("review.next")}
          </PrimaryButton>
        ) : (
          <PrimaryButton onClick={check} disabled={(verdict !== null && !touched) || unanswered(reviewControls, values)}>
            {verdict ? t("lesson.checkAgain") : t("lesson.check")}
          </PrimaryButton>
        )}
        {!finished && attempts > 0 && (
          <p className="mt-2 text-center text-xs text-gb-mute">{t("review.attemptsLeft", { count: MAX_ATTEMPTS - attempts })}</p>
        )}
      </div>
    </section>
  );
}

function diagnose(
  fb: { onCommonMisconception: string; onSignError?: string; byKind?: Record<string, string> },
  kind?: string
): string {
  if (kind && fb.byKind?.[kind]) return fb.byKind[kind]!;
  if (kind === "sign" && fb.onSignError) return fb.onSignError;
  return fb.onCommonMisconception;
}

function interleave(list: DueReview[]): DueReview[] {
  const groups = new Map<string, DueReview[]>();
  for (const r of list) {
    const g = groups.get(r.module.interactive) ?? [];
    g.push(r);
    groups.set(r.module.interactive, g);
  }
  const queues = [...groups.values()];
  const out: DueReview[] = [];
  while (queues.some((q) => q.length)) for (const q of queues) if (q.length) out.push(q.shift()!);
  return out;
}
