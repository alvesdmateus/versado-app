import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";

export type ThemePreference = "light" | "dark" | "system";

interface ThemeContextValue {
  isDark: boolean;
  themePreference: ThemePreference;
  setThemePreference: (pref: ThemePreference) => void;
  toggleDarkMode: () => void;
  setDarkMode: (dark: boolean) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

function getSystemDark(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function getStoredPreference(): ThemePreference {
  const stored = localStorage.getItem("theme");
  if (stored === "dark" || stored === "light" || stored === "system") return stored;
  return "system";
}

function resolveIsDark(pref: ThemePreference): boolean {
  if (pref === "dark") return true;
  if (pref === "light") return false;
  return getSystemDark();
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themePreference, setThemePref] = useState<ThemePreference>(getStoredPreference);
  const [isDark, setIsDark] = useState(() => resolveIsDark(getStoredPreference()));

  const applyTheme = useCallback((dark: boolean) => {
    if (dark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute("content", dark ? "#0f172a" : "#3b82f6");
    }
  }, []);

  const setThemePreference = useCallback(
    (pref: ThemePreference) => {
      setThemePref(pref);
      if (pref === "system") {
        localStorage.removeItem("theme");
      } else {
        localStorage.setItem("theme", pref);
      }
      const dark = resolveIsDark(pref);
      setIsDark(dark);
      applyTheme(dark);
    },
    [applyTheme]
  );

  const toggleDarkMode = useCallback(() => {
    setThemePreference(isDark ? "light" : "dark");
  }, [isDark, setThemePreference]);

  const setDarkMode = useCallback(
    (dark: boolean) => {
      setThemePreference(dark ? "dark" : "light");
    },
    [setThemePreference]
  );

  // Apply on mount
  useEffect(() => {
    applyTheme(isDark);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Follow system changes when preference is "system"
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      if (themePreference === "system") {
        setIsDark(e.matches);
        applyTheme(e.matches);
      }
    };
    mq.addEventListener("change", handleChange);
    return () => mq.removeEventListener("change", handleChange);
  }, [themePreference, applyTheme]);

  return (
    <ThemeContext.Provider
      value={{ isDark, themePreference, setThemePreference, toggleDarkMode, setDarkMode }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
