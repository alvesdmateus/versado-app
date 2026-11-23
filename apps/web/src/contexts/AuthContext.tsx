import {
  createContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import type { PublicProfile } from "@versado/auth";
import { ACCESS_TOKEN_EXPIRY } from "@versado/auth";
import { authApi } from "@/lib/auth-api";
import { ApiError, setAccessToken, setUnauthorizedHandler } from "@/lib/api-client";
import { withRetry } from "@/lib/retry";

export interface AuthContextValue {
  user: PublicProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithToken: (accessToken: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    displayName: string,
    acceptedTerms: true,
    turnstileToken?: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

/** Only an explicit rejection ends a session; outages and rate limits do not. */
function sessionRejected(err: unknown): boolean {
  return err instanceof ApiError && (err.status === 401 || err.status === 403);
}

/** Renew the access token this long before it expires. */
const REFRESH_LEAD_MS = 60_000;
/** After a failed renewal that did not end the session, try again after this long. */
const RETRY_REFRESH_MS = 30_000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** When the current access token was issued (ms), to renew after the app was asleep. */
  const issuedAtRef = useRef(0);
  /**
   * Bumped by every explicit sign-in / sign-out. Async work started under an older epoch
   * (the start-up session restore, a background renewal) must not overwrite what the
   * user just did — e.g. a late 401 from the restore logging out a fresh login.
   */
  const epochRef = useRef(0);
  const userRef = useRef<PublicProfile | null>(null);
  userRef.current = user;

  const clearRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  const endSession = useCallback(() => {
    clearRefreshTimer();
    setAccessToken(null);
    setUser(null);
  }, [clearRefreshTimer]);

  const acceptToken = useCallback((token: string) => {
    setAccessToken(token);
    issuedAtRef.current = Date.now();
  }, []);

  /**
   * Renew the access token now. Returns the new token, or null when the session is over
   * (in which case the user is signed out). Transient failures keep the session and are
   * retried on a timer.
   */
  const renewSession = useCallback(async (): Promise<string | null> => {
    const epoch = epochRef.current;
    try {
      const { accessToken } = await withRetry(() => authApi.refresh());
      if (epoch !== epochRef.current) return null;
      acceptToken(accessToken);
      scheduleRefreshRef.current(ACCESS_TOKEN_EXPIRY * 1000 - REFRESH_LEAD_MS);
      return accessToken;
    } catch (err) {
      if (epoch !== epochRef.current) return null;
      if (sessionRejected(err)) {
        endSession();
      } else {
        scheduleRefreshRef.current(RETRY_REFRESH_MS);
      }
      return null;
    }
  }, [acceptToken, endSession]);

  const scheduleRefreshRef = useRef<(inMs: number) => void>(() => {});
  scheduleRefreshRef.current = (inMs: number) => {
    clearRefreshTimer();
    refreshTimerRef.current = setTimeout(() => {
      void renewSession();
    }, Math.max(0, inMs));
  };

  const startSession = useCallback(
    (accessToken: string, profile?: PublicProfile) => {
      acceptToken(accessToken);
      if (profile) setUser(profile);
      scheduleRefreshRef.current(ACCESS_TOKEN_EXPIRY * 1000 - REFRESH_LEAD_MS);
    },
    [acceptToken]
  );

  // Try to restore the session on mount.
  useEffect(() => {
    let cancelled = false;
    const epoch = epochRef.current;
    const stale = () => cancelled || epoch !== epochRef.current;

    async function tryRestore() {
      try {
        const { accessToken } = await withRetry(() => authApi.refresh());
        if (stale()) return;
        acceptToken(accessToken);
        const profile = await withRetry(() => authApi.getMe());
        if (stale()) return;
        startSession(accessToken, profile);
      } catch {
        // No session, or the server could not be reached after retries. Either way there is
        // nobody signed in — unless the user signed in meanwhile, which must win.
        if (!stale()) {
          setAccessToken(null);
          setUser(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    tryRestore();
    return () => {
      cancelled = true;
      clearRefreshTimer();
    };
  }, [acceptToken, startSession, clearRefreshTimer]);

  // Any API call that comes back 401 (token expired while the app slept, timer throttled)
  // renews the session once and is retried by the client.
  useEffect(() => {
    setUnauthorizedHandler(() => (userRef.current ? renewSession() : Promise.resolve(null)));
    return () => setUnauthorizedHandler(null);
  }, [renewSession]);

  // Phones pause timers in the background: renew on return if the token is about to lapse.
  useEffect(() => {
    function onVisible() {
      if (document.visibilityState !== "visible" || !userRef.current) return;
      const age = Date.now() - issuedAtRef.current;
      if (age > ACCESS_TOKEN_EXPIRY * 1000 - REFRESH_LEAD_MS * 2) void renewSession();
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [renewSession]);

  const login = useCallback(
    async (email: string, password: string) => {
      const epoch = ++epochRef.current;
      const { accessToken, user: profile } = await authApi.login(email, password);
      if (epoch !== epochRef.current) return;
      startSession(accessToken, profile);
    },
    [startSession]
  );

  const loginWithToken = useCallback(
    async (accessToken: string) => {
      const epoch = ++epochRef.current;
      acceptToken(accessToken);
      const profile = await authApi.getMe();
      if (epoch !== epochRef.current) return;
      startSession(accessToken, profile);
    },
    [acceptToken, startSession]
  );

  const register = useCallback(
    async (email: string, password: string, displayName: string, acceptedTerms: true, turnstileToken?: string) => {
      const epoch = ++epochRef.current;
      const { accessToken, user: profile } = await authApi.register(
        email,
        password,
        displayName,
        acceptedTerms,
        turnstileToken
      );
      if (epoch !== epochRef.current) return;
      startSession(accessToken, profile);
    },
    [startSession]
  );

  const refreshUser = useCallback(async () => {
    const epoch = epochRef.current;
    try {
      const token = await renewSession();
      if (!token || epoch !== epochRef.current) return;
      const profile = await authApi.getMe();
      if (epoch !== epochRef.current) return;
      setUser(profile);
    } catch {
      // ignore: the session state is handled by renewSession
    }
  }, [renewSession]);

  const logout = useCallback(async () => {
    ++epochRef.current;
    clearRefreshTimer();
    try {
      await authApi.logout();
    } catch {
      // Logout may fail if already expired — that's okay
    }
    endSession();
  }, [clearRefreshTimer, endSession]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        isLoading,
        login,
        loginWithToken,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
