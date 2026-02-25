import type { UserTier } from "@versado/core/entities";

/** Payload encoded in the JWT access token */
export interface TokenPayload {
  sub: string; // userId
  email: string;
  tier: UserTier;
  iat: number; // issued at (unix seconds)
  exp: number; // expires at (unix seconds)
}

/** Authenticated user context available after JWT verification */
export interface AuthUser {
  id: string;
  email: string;
  tier: UserTier;
}

/** Public user profile (safe to return in API responses) */
export interface PublicProfile {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  emailVerified: boolean;
  tier: UserTier;
  createdAt: Date;
}

/** Auth response returned after login/register */
export interface AuthResponse {
  accessToken: string;
  user: PublicProfile;
}

/** Token refresh response */
export interface RefreshResponse {
  accessToken: string;
}
