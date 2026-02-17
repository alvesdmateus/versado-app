import { ChevronLeft } from "lucide-react";

interface MarketplaceDetailHeaderProps {
  title: string;
  onBack: () => void;
}

export function MarketplaceDetailHeader({
  title,
  onBack,
}: MarketplaceDetailHeaderProps) {
  return (
    <div className="flex items-center gap-2 px-5 py-4">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-neutral-600 transition-colors hover:text-neutral-900"
      >
        <ChevronLeft className="h-5 w-5" />
        <span className="text-sm">Back</span>
      </button>
      <h1 className="flex-1 truncate text-center text-lg font-semibold text-neutral-900 pr-12">
        {title}
      </h1>
    </div>
  );
}
