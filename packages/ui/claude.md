# @flashcard/ui

Shared React UI components library with design tokens.

## Structure

```
src/
  components/    # Reusable UI components
  tokens/        # Design system tokens
```

## Design Tokens

```typescript
import { colors, spacing, fontSize } from "@flashcard/ui/tokens";

// Colors (semantic scales)
colors.primary[500]  // #3b82f6 - actions, links
colors.success[500]  // #22c55e - correct answers
colors.warning[500]  // #f59e0b - hard cards
colors.error[500]    // #ef4444 - wrong answers
colors.neutral[500]  // #6b7280 - text, chrome

// Spacing (4px base)
spacing[4]   // 1rem (16px)
spacing[8]   // 2rem (32px)

// Typography
fontFamily.sans  // Inter
fontSize.base    // ["1rem", { lineHeight: "1.5rem" }]

// Other tokens
radii.md         // 0.5rem (8px)
shadows.md       // medium shadow
breakpoints.md   // 768px (tablet)
```

## Component Pattern

```typescript
import type { HTMLAttributes, ReactNode } from "react";

export interface ButtonProps extends HTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
  children: ReactNode;
}

export function Button({ variant = "primary", children, ...props }: ButtonProps) {
  return (
    <button className={`btn btn-${variant}`} {...props}>
      {children}
    </button>
  );
}
```

## Rules

- Named exports only (no default exports)
- Extend native HTML attributes for flexibility
- Props interface named `<Component>Props`
- Sensible defaults for optional props
- Spread remaining props to root element
- No business logic; pure presentation

## Token Files

| File | Contains |
|------|----------|
| `colors.ts` | Semantic color scales (primary, success, warning, error, neutral) |
| `spacing.ts` | Spacing scale based on 4px increments |
| `typography.ts` | Font families, sizes, weights |
| `radii.ts` | Border radius values |
| `shadows.ts` | Box shadow definitions |
| `transitions.ts` | Animation timing |
| `breakpoints.ts` | Responsive breakpoints, touch targets |

## Current Components

| Component | Purpose |
|-----------|---------|
| `Button` | Action trigger with variants |
| `Card`, `CardHeader`, `CardContent` | Content container |
