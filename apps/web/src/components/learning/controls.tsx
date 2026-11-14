import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Minus, Plus } from "lucide-react";
import type { ColorMappingEntry } from "./formula-types";
import { bandColor, fmt } from "./bands";
import type { ControlDef, InteractiveDefinition, Values } from "./interactives";

/**
 * Controls bound to a board axis become rails drawn by the board itself; the rest stay band sliders
 * under it. See `interactives/rail.tsx`.
 */
/** A multiple-choice control with nothing picked yet: the prediction cannot be committed. */
export function unanswered(controls: ControlDef[], values: Values): boolean {
  return controls.some((c) => c.choices && values[c.variableName] === undefined);
}

export function splitControls(def: InteractiveDefinition, controls: ControlDef[]) {
  const axes = def.axes ?? {};
  return {
    bound: controls.filter((c) => axes[c.variableName]),
    free: controls.filter((c) => !axes[c.variableName]),
  };
}

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!mq) return;
    const on = () => setReduced(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

/** Drives the Stage-1 anchoring animation from 0 to 1 over `seconds`; instant under reduced motion. */
export function useAnchor(active: boolean, seconds: number, replayKey: number): number {
  const reduced = usePrefersReducedMotion();
  const [t, setT] = useState(0);
  const raf = useRef(0);

  useEffect(() => {
    if (!active) return;
    if (reduced) {
      setT(1);
      return;
    }
    setT(0);
    const start = performance.now();
    const loop = (now: number) => {
      const next = Math.min(1, (now - start) / (seconds * 1000));
      setT(next);
      if (next < 1) raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf.current);
  }, [active, seconds, reduced, replayKey]);

  return t;
}

/** A band on a track with a peg thumb. Native range input, so keyboard and screen readers work. */
export function BandSlider({
  control,
  value,
  onChange,
  disabled,
}: {
  control: ControlDef;
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation("learn");
  const fill = ((value - control.min) / (control.max - control.min)) * 100;
  const color = bandColor(control.colorToken);
  const nudge = (dir: 1 | -1) => {
    const next = Math.round((value + dir * control.step) / control.step) * control.step;
    onChange(Math.min(control.max, Math.max(control.min, next)));
  };
  const stepBtn =
    "flex h-11 w-11 shrink-0 items-center justify-center rounded-[5px] border border-gb-seam text-gb-ink transition-colors hover:border-gb-mute active:bg-gb-seam/60 disabled:opacity-35";
  return (
    <div className="flex items-center gap-2">
      <label className="flex min-w-0 flex-1 items-center gap-3">
        <span className="w-20 shrink-0 text-sm font-semibold leading-tight" style={{ color }}>
          {control.label}
        </span>
        <input
          type="range"
          className="gb-range"
          min={control.min}
          max={control.max}
          step={control.step}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{ ["--band" as string]: color, ["--fill" as string]: `${fill}%` }}
          aria-valuetext={fmt(value)}
        />
      </label>
      <button type="button" className={stepBtn} onClick={() => nudge(-1)} disabled={disabled || value <= control.min} aria-label={t("lesson.decrease", { label: control.label })}>
        <Minus className="h-4 w-4" strokeWidth={2.5} />
      </button>
      <span className="w-9 shrink-0 text-center text-base font-bold tabular-nums">{fmt(value)}</span>
      <button type="button" className={stepBtn} onClick={() => nudge(1)} disabled={disabled || value >= control.max} aria-label={t("lesson.increase", { label: control.label })}>
        <Plus className="h-4 w-4" strokeWidth={2.5} />
      </button>
    </div>
  );
}

export function ControlStack({
  controls,
  values,
  onChange,
  disabled,
  locked = [],
}: {
  controls: ControlDef[];
  values: Values;
  onChange: (name: string, v: number) => void;
  disabled?: boolean;
  /** Controls preset by the system (assisted completion): shown at their value, not movable. */
  locked?: string[];
}) {
  return (
    <div className="flex flex-col gap-1">
      {controls.map((c) =>
        c.choices && c.optionLabels ? (
          // A toggle: its name stays visible above the two states, like a slider's label.
          <div key={c.variableName} className="flex flex-col gap-2">
            <span className="text-sm font-semibold leading-tight" style={{ color: bandColor(c.colorToken) }}>
              {c.label}
            </span>
            <ChoiceGrid
              control={c}
              value={values[c.variableName]}
              onChange={(v) => onChange(c.variableName, v)}
              disabled={disabled || locked.includes(c.variableName)}
            />
          </div>
        ) : c.choices ? (
          <ChoiceGrid
            key={c.variableName}
            control={c}
            value={values[c.variableName]}
            onChange={(v) => onChange(c.variableName, v)}
            disabled={disabled || locked.includes(c.variableName)}
          />
        ) : (
          <BandSlider
            key={c.variableName}
            control={c}
            value={values[c.variableName] ?? c.min}
            onChange={(v) => onChange(c.variableName, v)}
            disabled={disabled || locked.includes(c.variableName)}
          />
        )
      )}
    </div>
  );
}

/**
 * Multiple choice: a predicted result picked from a few boxes. Sliders are for tuning a quantity;
 * a computed answer is committed by choosing. Wrong options come from named misconceptions.
 */
export function ChoiceGrid({
  control,
  value,
  onChange,
  disabled,
}: {
  control: ControlDef;
  value: number | undefined;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation("learn");
  const color = bandColor(control.colorToken);
  const options = control.choices ?? [];
  const text = (opt: number) =>
    control.optionLabels?.[options.indexOf(opt)] ?? (control.choiceLabels?.[opt] ? t(control.choiceLabels[opt]!) : fmt(opt));
  const worded = (opt: number) => control.optionLabels !== undefined || control.choiceLabels?.[opt] !== undefined;
  const move = (dir: 1 | -1) => {
    const i = value === undefined ? -1 : options.indexOf(value);
    const next = options[(i + dir + options.length) % options.length];
    if (next !== undefined) onChange(next);
  };
  return (
    <div
      role="radiogroup"
      aria-label={control.label}
      className={options.length === 3 ? "grid grid-cols-3 gap-2" : "grid grid-cols-2 gap-2"}
      onKeyDown={(e) => {
        if (disabled) return;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") (e.preventDefault(), move(1));
        if (e.key === "ArrowLeft" || e.key === "ArrowUp") (e.preventDefault(), move(-1));
      }}
    >
      {options.map((opt, i) => {
        const checked = opt === value;
        return (
          <button
            key={opt}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={checked || (value === undefined && i === 0) ? 0 : -1}
            disabled={disabled}
            onClick={() => onChange(opt)}
            className={`flex items-center justify-center rounded-[6px] border-2 px-1 text-center font-extrabold leading-tight tabular-nums transition-[border-color,background-color,transform] duration-150 active:scale-[0.97] disabled:opacity-40 motion-reduce:transition-none ${worded(opt) ? "text-base" : "text-2xl"} ${control.optionLabels ? "min-h-12" : "min-h-16"}`}
            style={{
              borderColor: checked ? color : "var(--color-gb-seam)",
              backgroundColor: checked ? `color-mix(in srgb, ${color} 12%, var(--color-gb-panel))` : "var(--color-gb-panel)",
              color: "var(--color-gb-ink)",
            }}
          >
            {text(opt)}
          </button>
        );
      })}
    </div>
  );
}

/** Stage 4: the formal expression with each symbol coloured like the shape it names. */
export function Formula({ expression, mapping }: { expression: string; mapping: ColorMappingEntry[] }) {
  const { t } = useTranslation("learn");
  const parts = splitBySymbols(expression, mapping.map((m) => m.symbol));
  return (
    <figure className="flex flex-col gap-3">
      <p className="text-center text-[28px] font-extrabold leading-tight tracking-tight" aria-label={expression}>
        {parts.map((p, i) => {
          const entry = mapping.find((m) => m.symbol === p);
          return entry ? (
            <span key={i} style={{ color: bandColor(entry.colorToken) }}>
              {p}
            </span>
          ) : (
            <span key={i}>{p}</span>
          );
        })}
      </p>
      {/* No detached legend on screen (spatial contiguity): the board labels each shape with its symbol. */}
      <figcaption className="sr-only">
        {t("lesson.formulaLegend")}: {mapping.map((m) => `${m.symbol} — ${m.matchesVisual}`).join("; ")}
      </figcaption>
    </figure>
  );
}

/** Split an expression so mapped symbols become their own segments (longest symbols first). */
function splitBySymbols(expr: string, symbols: string[]): string[] {
  const sorted = [...symbols].sort((a, b) => b.length - a.length);
  const out: string[] = [];
  let i = 0;
  let buf = "";
  while (i < expr.length) {
    const hit = sorted.find((s) => expr.startsWith(s, i) && isBoundary(expr, i, s.length));
    if (hit) {
      if (buf) out.push(buf);
      buf = "";
      out.push(hit);
      i += hit.length;
    } else {
      buf += expr[i];
      i += 1;
    }
  }
  if (buf) out.push(buf);
  return out;
}

function isBoundary(expr: string, start: number, len: number): boolean {
  const before = expr[start - 1];
  const after = expr[start + len];
  const word = /[a-z0-9]/i;
  return !(before && word.test(before) && word.test(expr[start]!)) && !(after && word.test(after) && word.test(expr[start + len - 1]!));
}
