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
  const isClickable = !!onClick;

  return (
    <button
      onClick={onClick}
      disabled={!isClickable && !rightElement}
      className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors ${
        isClickable ? "hover:bg-neutral-50 active:bg-neutral-100" : ""
      }`}
    >
      <span className={danger ? "text-error-500" : "text-neutral-500"}>
        {icon}
      </span>
      <span className={`flex-1 text-sm ${danger ? "font-medium text-error-500" : "text-neutral-900"}`}>
        {label}
      </span>
      {rightElement ?? (
        <>
          {value && (
            <span className="text-sm text-neutral-400">{value}</span>
          )}
          {isClickable && (
            <ChevronRight className="h-4 w-4 text-neutral-300" />
          )}
        </>
      )}
    </button>
  );
}
