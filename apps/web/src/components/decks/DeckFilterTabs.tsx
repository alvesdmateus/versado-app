export interface DeckFilterTabsProps {
  tabs: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function DeckFilterTabs({ tabs, activeTab, onTabChange }: DeckFilterTabsProps) {
  return (
    <div className="scrollbar-hide mt-3 flex gap-2 overflow-x-auto px-5">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          className={`flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            tab === activeTab
              ? "bg-primary-500 text-white"
              : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
