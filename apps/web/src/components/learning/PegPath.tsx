import { useId, useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { ChevronDown } from "lucide-react";
import { cn } from "@versado/ui";
import type { WireModule } from "@/lib/learning-api";
import { lessonPath } from "@/lib/learn-routes";
import { bandColor, INK, PEG } from "./bands";
import { DuePill, PrimaryButton, SecondaryButton } from "./ui";

/**
 * A chapter as one elastic band hooked peg to peg down a geoboard, with each lesson
 * as a card beside its peg. Cards set the rhythm; minutes are written on the card.
 * Only the current lesson is in full colour, and only one card is open at a time.
 */

/** Peg centre from the top of a row: level with the card's title line. */
const PEG_Y = 28;

type Segment = "done" | "current" | "ahead" | null;

export function PegPath({
  modules,
  dueIds,
  onContinue,
  allModules = modules,
}: {
  modules: WireModule[];
  dueIds: Set<string>;
  onContinue: (moduleId: string) => void;
  /** Every module of the course, to name a prerequisite that sits in another chapter. */
  allModules?: WireModule[];
}) {
  const currentIndex = modules.findIndex((m) => m.progressStatus === "in_progress" || m.progressStatus === "available");
  const [openId, setOpenId] = useState<string | null>(modules[currentIndex]?.id ?? null);

  /** Style of the band from module i to module i + 1. */
  const segment = (i: number): Segment => {
    if (i < 0 || i >= modules.length - 1) return null;
    if (i + 1 === currentIndex) return "current";
    if (modules[i]!.progressStatus === "completed" && (currentIndex < 0 || i + 1 < currentIndex)) return "done";
    return "ahead";
  };

  return (
    <ol className="gb-lattice relative w-full px-3 py-4">
      {modules.map((m, i) => (
        <li key={m.id} className="relative grid grid-cols-[40px_minmax(0,1fr)] gap-x-2 pb-3 last:pb-0">
          <Rail above={segment(i - 1)} below={segment(i)} module={m} current={i === currentIndex} due={dueIds.has(m.id)} />
          <LessonCard
            module={m}
            current={i === currentIndex}
            due={dueIds.has(m.id)}
            open={openId === m.id}
            onToggle={() => setOpenId((id) => (id === m.id ? null : m.id))}
            onContinue={() => onContinue(m.id)}
            allModules={allModules}
            previous={modules[i - 1]}
          />
        </li>
      ))}
    </ol>
  );
}

function bandStyle(s: Exclude<Segment, null>) {
  return {
    width: s === "ahead" ? 2 : 5,
    background: s === "done" ? INK : bandColor("red"),
    opacity: s === "ahead" ? 0.4 : 1,
  };
}

/** The peg and the two halves of the band that meet at it. */
function Rail({ above, below, module, current, due }: { above: Segment; below: Segment; module: WireModule; current: boolean; due: boolean }) {
  const status = module.progressStatus;
  return (
    <div className="relative" aria-hidden>
      {above && (
        <span className="absolute left-1/2 -translate-x-1/2 rounded-full" style={{ top: -2, height: PEG_Y + 2, ...bandStyle(above) }} />
      )}
      {below && (
        // Runs past the row's 12px bottom gap so the band reaches the next peg unbroken.
        <span className="absolute left-1/2 -translate-x-1/2 rounded-full" style={{ top: PEG_Y, bottom: -14, ...bandStyle(below) }} />
      )}
      <svg className="absolute left-0 overflow-visible" width={40} height={40} style={{ top: PEG_Y - 20 }}>
        {due && <circle cx={20} cy={20} r={15} fill="none" stroke={bandColor("blue")} strokeWidth={2} strokeDasharray="4 3" />}
        {current && <circle cx={20} cy={20} r={14} fill={bandColor("red")} opacity={0.18} />}
        <circle
          cx={20}
          cy={20}
          r={current ? 9 : 7}
          fill={current ? bandColor("red") : status === "completed" ? INK : "var(--color-gb-ground)"}
          stroke={status === "locked" ? PEG : current ? bandColor("red") : INK}
          strokeWidth={2}
        />
      </svg>
    </div>
  );
}

function LessonCard({
  module: m,
  current,
  due,
  open,
  onToggle,
  onContinue,
  allModules,
  previous,
}: {
  module: WireModule;
  previous: WireModule | undefined;
  current: boolean;
  due: boolean;
  open: boolean;
  onToggle: () => void;
  onContinue: () => void;
  allModules: WireModule[];
}) {
  const { t, i18n } = useTranslation("learn");
  const navigate = useNavigate();
  const panelId = useId();
  const locked = m.progressStatus === "locked";
  const completed = m.progressStatus === "completed";
  const p = m.progress;
  const stage = p && !p.completedAt ? p.stage : 1;

  // One line of facts about the lesson; never its takeaway (that would spoil the prediction).
  const facts: string[] = [];
  if (current && p && !p.completedAt) facts.push(t("path.stageOf", { stage, minutes: m.estimatedMinutes }));
  else facts.push(t("path.minutes", { minutes: m.estimatedMinutes }));
  if (completed && p) {
    const last = p.lastReviewedAt ?? p.completedAt;
    if (last) facts.push(t("path.lastCheck", { when: relative(last, i18n.language) }));
    if (!due && p.nextReviewAt) facts.push(t("path.nextCheck", { when: relative(p.nextReviewAt, i18n.language) }));
  }

  // What opens it: an unfinished explicit prerequisite, else the lesson right before it.
  const prerequisite = locked
    ? allModules.find((x) => m.prerequisites.includes(x.id) && x.progressStatus !== "completed") ??
      (previous && previous.progressStatus !== "completed" ? previous : undefined)
    : undefined;

  return (
    <div
      className={cn(
        "rounded-[6px] border bg-gb-panel transition-colors duration-150",
        current ? "border-gb-ink" : open ? "border-gb-mute" : "border-gb-seam hover:border-gb-mute"
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left"
      >
        <span
          className={cn(
            "min-w-0 flex-1 leading-tight",
            current ? "text-lg font-extrabold tracking-tight" : "text-base font-bold",
            locked ? "text-gb-mute" : "text-gb-ink"
          )}
        >
          {m.title}
          {locked && <span className="sr-only"> ({t("path.locked")})</span>}
        </span>
        {due ? (
          <DuePill>{t("path.checkDue")}</DuePill>
        ) : completed ? (
          <span className="shrink-0 text-xs font-semibold text-gb-mute">{t("path.done")}</span>
        ) : null}
        <ChevronDown
          className={cn(
            "h-5 w-5 shrink-0 text-gb-mute transition-transform duration-200 ease-out motion-reduce:transition-none",
            open && "rotate-180"
          )}
          aria-hidden
        />
      </button>

      {/* Disclosure: the row height eases open from 0fr to 1fr; reduced motion snaps. */}
      <div
        id={panelId}
        // React 18 has no typed `inert`; the empty string sets the attribute so closed content leaves the tab order.
        {...(open ? {} : { inert: "" })}
        className={cn(
          "grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <div className="flex flex-col gap-3 px-4 pb-4">
            <p className="text-xs font-semibold tabular-nums text-gb-mute">{facts.join(" · ")}</p>
            {locked ? (
              <p className="text-sm text-gb-mute">
                {prerequisite ? t("path.opensAfter", { title: prerequisite.title }) : t("path.opensLater")}
              </p>
            ) : due ? (
              <PrimaryButton onClick={() => navigate("/review")}>{t("path.reviewNow")}</PrimaryButton>
            ) : current ? (
              <PrimaryButton onClick={onContinue}>{p ? t("path.continue") : t("path.start")}</PrimaryButton>
            ) : completed ? (
              <SecondaryButton className="w-full" onClick={() => navigate(lessonPath(m))}>
                {t("path.practiceAgain")}
              </SecondaryButton>
            ) : (
              <PrimaryButton onClick={onContinue}>{t("path.start")}</PrimaryButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** "4 days ago", "tomorrow", "in 3 days" in the UI language, by whole days. */
function relative(iso: string, lang: string) {
  const days = Math.round((new Date(iso).getTime() - Date.now()) / 86_400_000);
  return new Intl.RelativeTimeFormat(lang, { numeric: "auto" }).format(days, "day");
}
