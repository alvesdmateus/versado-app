import { ChevronRight } from "lucide-react";

export interface SettingRowProps {
  icon: React.ReactNode;
  label: string;
  value?: string;
  rightElement?: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
}

export function SettingRow({ icon, label, value, rightElement, onClick, danger }: SettingRowProps) {
  const content = (
    <>
      <span className={danger ? "text-error-500" : "text-neutral-500"}>{icon}</span>
      <span className={`flex-1 text-sm ${danger ? "font-medium text-error-500" : "text-neutral-900"}`}>{label}</span>
      {rightElement ?? (
        <>
          {value && <span className="text-sm text-neutral-400">{value}</span>}
          {onClick && <ChevronRight className="h-4 w-4 text-neutral-300" />}
        </>
      )}
    </>
  );

  // A row is a button only when the whole row is the control. Rows that hold their own
  // controls (switches, segmented buttons) are plain containers: a button inside a button
  // is invalid HTML and confuses screen readers and keyboard focus.
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-neutral-50 active:bg-neutral-100"
      >
        {content}
      </button>
    );
  }

  return <div className="flex w-full items-center gap-3 px-4 py-3.5">{content}</div>;
}
