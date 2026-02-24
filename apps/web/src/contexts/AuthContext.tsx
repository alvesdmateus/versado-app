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
import { setAccessToken } from "@/lib/api-client";

export interface AuthContextValue {
  user: PublicProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    displayName: string,
    turnstileToken?: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleRefresh = useCallback(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }
    // Refresh 1 minute before expiry
    const refreshMs = (ACCESS_TOKEN_EXPIRY - 60) * 1000;
    refreshTimerRef.current = setTimeout(async () => {
      try {
        const { accessToken } = await authApi.refresh();
        setAccessToken(accessToken);
        scheduleRefresh();
      } catch {
        // Refresh failed — session expired
        setAccessToken(null);
        setUser(null);
      }
    }, refreshMs);
  }, []);

  const clearRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  // Try to restore session on mount
  useEffect(() => {
    let cancelled = false;

    async function tryRestore() {
      try {
        const { accessToken } = await authApi.refresh();
        if (cancelled) return;
        setAccessToken(accessToken);

        const profile = await authApi.getMe();
        if (cancelled) return;
        setUser(profile);
        scheduleRefresh();
      } catch {
        // No valid session — that's fine
        if (!cancelled) {
          setAccessToken(null);
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    tryRestore();
    return () => {
      cancelled = true;
      clearRefreshTimer();
    };
  }, [scheduleRefresh, clearRefreshTimer]);

  const login = useCallback(
    async (email: string, password: string) => {
      const { accessToken, user: profile } = await authApi.login(
        email,
        password
      );
      setAccessToken(accessToken);
      setUser(profile);
      scheduleRefresh();
    },
    [scheduleRefresh]
  );

  const register = useCallback(
    async (email: string, password: string, displayName: string, turnstileToken?: string) => {
      const { accessToken, user: profile } = await authApi.register(
        email,
        password,
        displayName,
        turnstileToken
      );
      setAccessToken(accessToken);
      setUser(profile);
      scheduleRefresh();
    },
    [scheduleRefresh]
  );

  const refreshUser = useCallback(async () => {
    try {
      const { accessToken } = await authApi.refresh();
      setAccessToken(accessToken);
      const profile = await authApi.getMe();
      setUser(profile);
      scheduleRefresh();
    } catch {
      // ignore
    }
  }, [scheduleRefresh]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Logout may fail if already expired — that's okay
    }
    setAccessToken(null);
    setUser(null);
    clearRefreshTimer();
  }, [clearRefreshTimer]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
