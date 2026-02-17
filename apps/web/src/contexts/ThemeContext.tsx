import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";

interface ThemeContextValue {
  isDark: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (dark: boolean) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(() => {
    return document.documentElement.classList.contains("dark");
  });

  const applyTheme = useCallback((dark: boolean) => {
    if (dark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", dark ? "dark" : "light");

    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute("content", dark ? "#0f172a" : "#3b82f6");
    }
  }, []);

  const toggleDarkMode = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      applyTheme(next);
      return next;
    });
  }, [applyTheme]);

  const setDarkMode = useCallback(
    (dark: boolean) => {
      setIsDark(dark);
      applyTheme(dark);
    },
    [applyTheme]
  );

  useEffect(() => {
    applyTheme(isDark);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <ThemeContext.Provider value={{ isDark, toggleDarkMode, setDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}
