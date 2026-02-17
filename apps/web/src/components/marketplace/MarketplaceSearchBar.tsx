import { Search } from "lucide-react";

export interface MarketplaceSearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function MarketplaceSearchBar({ value, onChange }: MarketplaceSearchBarProps) {
  return (
    <div className="mx-5 mt-3">
      <div className="flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-0 px-4 py-2.5">
        <Search className="h-4 w-4 text-neutral-400" />
        <input
          type="text"
          placeholder="Search for decks, creators, or topics..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-transparent text-sm text-neutral-900 outline-none placeholder:text-neutral-400"
        />
      </div>
    </div>
  );
}
