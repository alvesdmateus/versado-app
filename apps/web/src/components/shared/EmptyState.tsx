import type { ReactNode } from "react";
import { Button } from "@flashcard/ui";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center text-center px-5 py-12">
      {icon && <div className="mb-3 text-neutral-300">{icon}</div>}
      <p className="text-sm font-medium text-neutral-500">{title}</p>
      {description && (
        <p className="mt-1 text-xs text-neutral-400">{description}</p>
      )}
      {action && (
        <Button
          variant="primary"
          size="sm"
          className="mt-4"
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}
