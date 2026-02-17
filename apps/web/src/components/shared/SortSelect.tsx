import { ArrowUpDown } from "lucide-react";

interface SortSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}

export function SortSelect({ value, onChange, options }: SortSelectProps) {
  return (
    <div className="relative inline-flex items-center">
      <ArrowUpDown className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-neutral-400" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none rounded-full border border-neutral-200 bg-neutral-0 py-1.5 pl-8 pr-3 text-xs font-medium text-neutral-600 outline-none transition-colors hover:border-neutral-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
