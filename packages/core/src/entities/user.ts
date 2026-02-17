export type UserTier = "free" | "premium" | "team";

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  tier: UserTier;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserInput {
  email: string;
  displayName: string;
  avatarUrl?: string;
  tier?: UserTier;
}

export function createUser(input: CreateUserInput): User {
  const now = new Date();
  return {
    id: crypto.randomUUID(),
    email: input.email,
    displayName: input.displayName,
    avatarUrl: input.avatarUrl ?? null,
    tier: input.tier ?? "free",
    createdAt: now,
    updatedAt: now,
  };
}
