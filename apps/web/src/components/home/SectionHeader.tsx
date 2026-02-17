interface SectionHeaderProps {
  title: string;
  action?: { label: string; onClick: () => void };
}

export function SectionHeader({ title, action }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between px-5">
      <h2 className="text-lg font-bold text-neutral-900">{title}</h2>
      {action && (
        <button
          onClick={action.onClick}
          className="text-sm font-medium text-primary-500 transition-colors hover:text-primary-600"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
