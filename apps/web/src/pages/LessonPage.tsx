import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { RotateCcw, X } from "lucide-react";
import type { ModuleStage } from "@versado/core";
import { learningApi, type WireModule } from "@/lib/learning-api";
import { ApiError } from "@/lib/api-client";
import { getInteractive, type Values, type Verdict } from "@/components/learning/interactives";
import { ControlStack, Formula, splitControls, unanswered, useAnchor } from "@/components/learning/controls";
import { BoardPanel, PrimaryButton, SecondaryButton, Spinner, StageRail } from "@/components/learning/ui";
import { bandColor } from "@/components/learning/bands";

type LoadState =
  | { kind: "loading" }
  | { kind: "error"; reason: "locked" | "missing" | "network" }
  | { kind: "ready"; module: WireModule };

export function LessonPage() {
  const { moduleId = "" } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation("learn");
  const [load, setLoad] = useState<LoadState>({ kind: "loading" });

  useEffect(() => {
    let alive = true;
    setLoad({ kind: "loading" });
    learningApi
      .getModule(moduleId)
      .then((module) => alive && setLoad({ kind: "ready", module }))
      .catch((err) => {
        if (!alive) return;
        const reason = err instanceof ApiError && err.status === 403 ? "locked" : err instanceof ApiError && err.status === 404 ? "missing" : "network";
        setLoad({ kind: "error", reason });
      });
    return () => {
      alive = false;
    };
  }, [moduleId]);

  if (load.kind === "loading") {
    return (
      <Shell onClose={() => navigate("/")}>
        <div className="flex flex-1 items-center justify-center">
          <Spinner />
        </div>
      </Shell>
    );
  }

  if (load.kind === "error") {
    return (
      <Shell onClose={() => navigate("/")}>
        <div className="flex flex-1 flex-col justify-center gap-4">
          <h1 className="text-2xl font-extrabold">{t(`lesson.error.${load.reason}.title`)}</h1>
          <p className="text-gb-mute">{t(`lesson.error.${load.reason}.body`)}</p>
          <PrimaryButton onClick={() => navigate("/")}>{t("lesson.backToTrack")}</PrimaryButton>
        </div>
      </Shell>
    );
  }

  return <LessonPlayer module={load.module} onExit={() => navigate("/")} />;
}

function Shell({
  children,
  onClose,
  rail,
  title,
}: {
  children: React.ReactNode;
  onClose: () => void;
  rail?: React.ReactNode;
  title?: string;
}) {
  const { t } = useTranslation("learn");
  return (
    <div className="gb-surface flex min-h-dvh flex-col">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))]">
        <header className="flex h-12 items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            aria-label={t("lesson.close")}
            className="-ml-2 flex h-10 w-10 items-center justify-center rounded-[5px] text-gb-ink hover:bg-gb-seam/50"
          >
            <X className="h-5 w-5" strokeWidth={2.25} />
          </button>
          {(rail || title) && (
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              {title && <span className="truncate text-xs font-semibold text-gb-mute">{title}</span>}
              {rail}
            </div>
          )}
        </header>
        {children}
      </div>
    </div>
  );
}

/** The most specific diagnostic copy for a miss: per-kind, then sign, then the generic misconception. */
function diagnosis(
  fb: { onCommonMisconception: string; onSignError?: string; byKind?: Record<string, string> },
  kind?: string
): string {
  if (kind && fb.byKind?.[kind]) return fb.byKind[kind]!;
  if (kind === "sign" && fb.onSignError) return fb.onSignError;
  return fb.onCommonMisconception;
}

function lerpValues(from: Values, to: Values, t: number): Values {
  const out: Values = { ...to };
  for (const key of Object.keys(to)) {
    const a = from[key] ?? to[key]!;
    out[key] = a + (to[key]! - a) * t;
  }
  return out;
}

/** Seconds a guided demonstration takes to morph the line into place. */
const GUIDE_SECONDS = 3.5;

function LessonPlayer({ module, onExit }: { module: WireModule; onExit: () => void }) {
  const { t } = useTranslation("learn");
  const def = getInteractive(module.interactive);
  const spec = module.spec;
  const target = spec.stage3Prediction.target;
  const practiceItems = spec.practice?.items ?? [];

  const resumeStage: ModuleStage = module.progress && !module.progress.completedAt ? module.progress.stage : 1;
  const [stage, setStage] = useState<ModuleStage>(resumeStage);
  const [values, setValues] = useState<Values>(() => def?.initialValues(spec, resumeStage, target) ?? {});
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [solved, setSolved] = useState(module.progress ? module.progress.predictionCorrect > 0 && resumeStage >= 3 : false);
  const [touched, setTouched] = useState(false);
  const [changed, setChanged] = useState<{ name: string; tick: number } | null>(null);
  const [replay, setReplay] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const [finishError, setFinishError] = useState(false);
  const [done, setDone] = useState(false);
  /** Index of the current practice item, or null while still in the 4-stage lesson. */
  const [practice, setPractice] = useState<number | null>(null);
  const pending = useRef<Promise<unknown>>(Promise.resolve());

  const item = practice !== null ? practiceItems[practice] : undefined;
  const anchorT = useAnchor(stage === 1 && practice === null, spec.stage1Anchoring.durationSeconds, replay);
  const guideT = useAnchor(item?.fade === "guided", GUIDE_SECONDS, (practice ?? 0) * 100 + replay);

  const stageLabels = useMemo(() => {
    const base = [t("stage.anchor"), t("stage.explore"), t("stage.predict"), t("stage.formalize")];
    return practiceItems.length > 0 ? [...base, t("stage.practice")] : base;
  }, [t, practiceItems.length]);

  const track = useCallback(
    (input: Parameters<typeof learningApi.updateProgress>[1]) => {
      pending.current = pending.current
        .catch(() => {})
        .then(() => learningApi.updateProgress(module.id, input))
        .catch(() => {});
      return pending.current;
    },
    [module.id]
  );

  const resetInteraction = () => {
    setVerdict(null);
    setTouched(false);
    setChanged(null);
  };

  const goTo = (next: ModuleStage) => {
    setStage(next);
    setValues(def?.initialValues(spec, next, target) ?? {});
    resetInteraction();
    track({ stage: next });
  };

  /** Start values for a practice item: neutral controls, with assisted presets already solved. */
  const practiceStart = (index: number): Values => {
    const it = practiceItems[index]!;
    const v = def?.initialValues(spec, 3, it.target) ?? {};
    const solution = def?.solve(it.target, spec) ?? {};
    for (const name of it.presetControls) v[name] = solution[name] ?? v[name]!;
    return v;
  };

  const startPractice = (index: number) => {
    setPractice(index);
    setValues(practiceStart(index));
    resetInteraction();
  };

  const onControl = (name: string, v: number) => {
    setValues((prev) => ({ ...prev, [name]: v }));
    setTouched(true);
    setVerdict(null);
    setChanged((c) => ({ name, tick: (c?.tick ?? 0) + 1 }));
  };

  const check = () => {
    if (!def) return;
    const goal = item ? item.target : target;
    const result = def.evaluate(values, goal, spec.stage3Prediction.tolerance, spec);
    setVerdict(result);
    setTouched(false);
    if (!item) {
      if (result.correct) setSolved(true);
      track({ stage: 3, predictionAttempt: { correct: result.correct } });
    }
  };

  const finish = async () => {
    setFinishing(true);
    setFinishError(false);
    try {
      await pending.current;
      await learningApi.updateProgress(module.id, { stage: 4, completed: true });
      setDone(true);
    } catch {
      setFinishError(true);
    } finally {
      setFinishing(false);
    }
  };

  const nextPractice = () => {
    if (practice === null) return;
    if (practice + 1 < practiceItems.length) startPractice(practice + 1);
    else void finish();
  };

  if (!def) {
    return (
      <Shell onClose={onExit}>
        <div className="flex flex-1 flex-col justify-center gap-4">
          <h1 className="text-2xl font-extrabold">{t("lesson.error.unsupported.title")}</h1>
          <p className="text-gb-mute">{t("lesson.error.unsupported.body")}</p>
          <PrimaryButton onClick={onExit}>{t("lesson.backToTrack")}</PrimaryButton>
        </div>
      </Shell>
    );
  }

  if (done) {
    return (
      <Shell onClose={onExit}>
        <div className="flex flex-1 flex-col justify-center gap-6">
          <svg viewBox="0 0 120 40" className="h-10 w-32" aria-hidden>
            <polyline points="8,32 44,8 80,32 112,8" fill="none" stroke={bandColor("red")} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
            {[8, 44, 80, 112].map((x, i) => (
              <circle key={x} cx={x} cy={i % 2 ? 8 : 32} r={5} fill="var(--color-gb-ink)" />
            ))}
          </svg>
          <div className="flex flex-col gap-2">
            <h1 className="text-[28px] font-extrabold leading-tight tracking-tight">{t("lesson.done.title")}</h1>
            <p className="text-base text-gb-mute">{t("lesson.done.body", { title: module.title })}</p>
          </div>
          <PrimaryButton onClick={onExit}>{t("lesson.backToTrack")}</PrimaryButton>
        </div>
      </Shell>
    );
  }

  const Board = def.Board;
  const s3 = spec.stage3Prediction;
  const missed = verdict !== null && !verdict.correct;

  // ── Practice phase (faded worked examples) ──────────────────────────────
  if (item && practice !== null) {
    const guided = item.fade === "guided";
    const shown = guided ? lerpValues(practiceStart(practice), def.solve(item.target, spec), guideT) : values;
    const last = practice + 1 === practiceItems.length;
    const prompt = guided
      ? item.prompt
      : verdict
        ? verdict.correct
          ? t("practice.correct")
          : diagnosis(s3.adaptiveFeedback, verdict.kind)
        : item.prompt;
    const practiceActive = !guided && !verdict?.correct;
    const practiceControls = def.predictionControls(spec, item.target);
    const practiceSplit = splitControls(def, practiceControls);

    return (
      <Shell
        onClose={onExit}
        title={module.title}
        rail={
          <StageRail
            stage={5}
            labels={[...stageLabels.slice(0, 4), `${t("stage.practice")} ${practice + 1}/${practiceItems.length}`]}
          />
        }
      >
        <h1
          className="mt-3 min-h-[3.5rem] text-[22px] font-bold leading-snug tracking-tight text-balance"
          aria-live="polite"
          style={missed ? { color: bandColor("red") } : undefined}
        >
          {prompt}
        </h1>

        <BoardPanel className="mt-3">
          <Board
            spec={spec}
            stage={3}
            values={shown}
            target={item.target}
            verdict={verdict}
            anchorT={1}
            changed={changed}
            guide={guided ? guideT : null}
            input={practiceActive ? { controls: practiceControls, onChange: onControl, locked: item.presetControls } : undefined}
          />
        </BoardPanel>

        {practiceActive && practiceSplit.free.length > 0 && (
          <div className="mt-4">
            <ControlStack
              controls={practiceSplit.free}
              values={values}
              onChange={onControl}
              locked={item.presetControls}
            />
          </div>
        )}

        <footer className="mt-auto flex gap-3 pt-6">
          {guided ? (
            <>
              <SecondaryButton onClick={() => setReplay((r) => r + 1)} aria-label={t("lesson.replay")} className="w-12 px-0">
                <RotateCcw className="h-5 w-5" />
              </SecondaryButton>
              <PrimaryButton disabled={guideT < 1} onClick={nextPractice}>
                {t("lesson.continue")}
              </PrimaryButton>
            </>
          ) : verdict?.correct ? (
            <PrimaryButton onClick={nextPractice} disabled={finishing}>
              {finishing ? <Spinner /> : last ? t("lesson.finish") : t("practice.next")}
            </PrimaryButton>
          ) : (
            <PrimaryButton disabled={(verdict !== null && !touched) || unanswered(practiceControls, values)} onClick={check}>
              {verdict ? t("lesson.checkAgain") : t("lesson.check")}
            </PrimaryButton>
          )}
        </footer>
        {finishError && (
          <p className="mt-2 text-sm font-semibold" role="alert" style={{ color: bandColor("red") }}>
            {t("lesson.finishError")}
          </p>
        )}
      </Shell>
    );
  }

  // ── The 4-stage lesson ──────────────────────────────────────────────────
  const prompt =
    stage === 1
      ? spec.stage1Anchoring.caption
      : stage === 2
        ? spec.stage2Exploration.prompt
        : stage === 3
          ? verdict
            ? verdict.correct
              ? s3.adaptiveFeedback.onSuccess
              : diagnosis(s3.adaptiveFeedback, verdict.kind)
            : s3.challengePrompt
          : spec.stage4Formalization.caption;

  const controls =
    stage === 2
      ? spec.stage2Exploration.controls.map((c) => ({
          variableName: c.variableName,
          label: c.label,
          min: c.min,
          max: c.max,
          step: c.step,
          colorToken: c.colorToken,
        }))
      : stage === 3
        ? def.predictionControls(spec, target)
        : [];
  const controlsActive = controls.length > 0 && !(stage === 3 && solved && verdict?.correct);
  const { free } = splitControls(def, controls);

  return (
    <Shell onClose={onExit} title={module.title} rail={<StageRail stage={stage} labels={stageLabels} />}>
      <h1
        className="mt-3 min-h-[3.5rem] text-[22px] font-bold leading-snug tracking-tight text-balance"
        aria-live="polite"
        style={stage === 3 && missed ? { color: bandColor("red") } : undefined}
      >
        {prompt}
      </h1>

      <BoardPanel className="mt-3">
        <Board
          spec={spec}
          stage={stage}
          values={values}
          target={target}
          verdict={stage === 3 ? verdict : null}
          anchorT={anchorT}
          changed={changed}
          input={controlsActive ? { controls, onChange: onControl } : undefined}
        />
      </BoardPanel>

      <div className="mt-4 flex flex-col gap-4">
        {controlsActive && free.length > 0 && <ControlStack controls={free} values={values} onChange={onControl} />}
        {stage === 4 && (
          <Formula expression={spec.stage4Formalization.formalExpression} mapping={spec.stage4Formalization.colorMapping} />
        )}
      </div>

      {/* The action stays pinned to the bottom of the screen (thumb zone), same place on every stage */}
      <footer className="mt-auto flex gap-3 pt-6">
        {stage === 1 && (
          <>
            <SecondaryButton onClick={() => setReplay((r) => r + 1)} aria-label={t("lesson.replay")} className="w-12 px-0">
              <RotateCcw className="h-5 w-5" />
            </SecondaryButton>
            <PrimaryButton disabled={anchorT < 1} onClick={() => goTo(2)}>
              {t("lesson.continue")}
            </PrimaryButton>
          </>
        )}
        {stage === 2 && (
          <PrimaryButton disabled={!touched} onClick={() => goTo(3)}>
            {touched ? t("lesson.continue") : t("lesson.tryControls")}
          </PrimaryButton>
        )}
        {stage === 3 &&
          (verdict?.correct ? (
            <PrimaryButton onClick={() => goTo(4)}>{t("lesson.continue")}</PrimaryButton>
          ) : (
            <PrimaryButton disabled={(verdict !== null && !touched) || unanswered(controls, values)} onClick={check}>
              {verdict ? t("lesson.checkAgain") : t("lesson.check")}
            </PrimaryButton>
          ))}
        {stage === 4 &&
          (practiceItems.length > 0 ? (
            <PrimaryButton onClick={() => startPractice(0)}>{t("practice.start")}</PrimaryButton>
          ) : (
            <PrimaryButton onClick={finish} disabled={finishing}>
              {finishing ? <Spinner /> : finishError ? t("lesson.retryFinish") : t("lesson.finish")}
            </PrimaryButton>
          ))}
      </footer>
      {finishError && (
        <p className="mt-2 text-sm font-semibold" role="alert" style={{ color: bandColor("red") }}>
          {t("lesson.finishError")}
        </p>
      )}
    </Shell>
  );
}
