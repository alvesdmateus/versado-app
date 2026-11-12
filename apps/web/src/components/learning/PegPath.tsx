import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import type { WireModule } from "@/lib/learning-api";
import { bandColor, INK, PEG } from "./bands";
import { PrimaryButton } from "./ui";

/**
 * The track as one elastic band hooked peg to peg down a geoboard.
 * Pegs sit on the 28px lattice; the vertical span to the next peg is the module's minutes.
 * Only the current module is in full colour.
 */

const U = 28;
const ORIGIN = 14;
const COLS = [ORIGIN + U, ORIGIN + U * 2];
/** Two lattice rows per minute: every span is exactly proportional to its module's duration. */
const ROWS_PER_MINUTE = 2;
const PANEL_MAX = 340;

interface Placed {
  module: WireModule;
  x: number;
  y: number;
  due: boolean;
}

export function PegPath({
  modules,
  dueIds,
  onContinue,
}: {
  modules: WireModule[];
  dueIds: Set<string>;
  onContinue: (moduleId: string) => void;
}) {
  const { t } = useTranslation("learn");
  const currentIndex = modules.findIndex((m) => m.progressStatus === "in_progress" || m.progressStatus === "available");

  const placed: Placed[] = [];
  let y = ORIGIN + U;
  modules.forEach((module, i) => {
    placed.push({ module, x: COLS[i % 2]!, y, due: dueIds.has(module.id) });
    y += module.estimatedMinutes * ROWS_PER_MINUTE * U;
  });
  const height = (placed.at(-1)?.y ?? 0) + U * 2;

  return (
    <div className="gb-lattice relative w-full" style={{ height }}>
      <svg className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
        {placed.slice(1).map((p, i) => {
          const from = placed[i]!;
          const toCurrent = i + 1 === currentIndex;
          const done = from.module.progressStatus === "completed" && !toCurrent;
          const ahead = currentIndex >= 0 && i + 1 > currentIndex;
          return (
            <line
              key={p.module.id}
              x1={from.x}
              y1={from.y}
              x2={p.x}
              y2={p.y}
              stroke={done ? INK : bandColor("red")}
              strokeWidth={done || toCurrent ? 5 : 2}
              strokeOpacity={ahead || currentIndex < 0 ? 0.4 : 1}
              strokeLinecap="round"
            />
          );
        })}
        {placed.map((p, i) => {
          const current = i === currentIndex;
          const status = p.module.progressStatus;
          return (
            <g key={p.module.id}>
              {p.due && (
                <circle cx={p.x} cy={p.y} r={15} fill="none" stroke={bandColor("blue")} strokeWidth={2} strokeDasharray="4 3" />
              )}
              {current && <circle cx={p.x} cy={p.y} r={14} fill={bandColor("red")} opacity={0.18} />}
              <circle
                cx={p.x}
                cy={p.y}
                r={current ? 9 : 7}
                fill={current ? bandColor("red") : status === "completed" ? INK : "var(--color-gb-ground)"}
                stroke={status === "locked" ? PEG : current ? bandColor("red") : INK}
                strokeWidth={2}
              />
            </g>
          );
        })}
      </svg>

      <ol className="absolute inset-0">
        {placed.map((p, i) => {
          const m = p.module;
          const current = i === currentIndex;
          const left = p.x + 26;
          if (current) {
            const stage = m.progress && !m.progress.completedAt ? m.progress.stage : 1;
            return (
              <li
                key={m.id}
                className="absolute flex flex-col gap-3 rounded-[6px] border border-gb-ink bg-gb-panel p-4"
                style={{ left, top: p.y - 22, width: `min(${PANEL_MAX}px, calc(100% - ${left + 12}px))` }}
              >
                <div className="flex flex-col gap-1">
                  <span className="text-lg font-extrabold leading-tight tracking-tight">{m.title}</span>
                  <span className="text-xs font-semibold text-gb-mute">
                    {m.progress && !m.progress.completedAt
                      ? t("path.stageOf", { stage, minutes: m.estimatedMinutes })
                      : t("path.minutes", { minutes: m.estimatedMinutes })}
                  </span>
                </div>
                <PrimaryButton onClick={() => onContinue(m.id)}>
                  {m.progress ? t("path.continue") : t("path.start")}
                </PrimaryButton>
              </li>
            );
          }
          const locked = m.progressStatus === "locked";
          const body = (
            <>
              <span className={locked ? "text-gb-mute" : "text-gb-ink"}>{m.title}</span>
              <span className="block text-xs font-normal text-gb-mute">
                {p.due ? t("path.checkDue") : m.progressStatus === "completed" ? t("path.done") : t("path.minutes", { minutes: m.estimatedMinutes })}
              </span>
            </>
          );
          return (
            <li
              key={m.id}
              className="absolute right-0 text-base font-semibold leading-tight"
              style={{ left, top: p.y - 10 }}
            >
              {p.due ? (
                <Link to="/review" className="inline-block bg-gb-ground pr-2 hover:underline hover:underline-offset-4">
                  {body}
                </Link>
              ) : m.progressStatus === "completed" ? (
                <Link to={`/learn/${m.id}`} className="inline-block bg-gb-ground pr-2 hover:underline hover:underline-offset-4">
                  {body}
                </Link>
              ) : (
                <span className="inline-block bg-gb-ground pr-2" aria-disabled={locked}>
                  {body}
                  {locked && <span className="sr-only"> ({t("path.locked")})</span>}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
