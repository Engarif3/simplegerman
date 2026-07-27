import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColorScheme as useNativeWindColorScheme } from "nativewind";

export type ThemeName = "light" | "dark";

const THEME_STORAGE_KEY = "theme";
const DEFAULT_THEME: ThemeName = "dark";

type ThemeContextValue = {
  theme: ThemeName;
  isReady: boolean;
  toggleTheme: () => void;
  setTheme: (theme: ThemeName) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setThemeState] = useState<ThemeName>(DEFAULT_THEME);
  const [isReady, setIsReady] = useState(false);
  const { setColorScheme } = useNativeWindColorScheme();

  useEffect(() => {
    let isMounted = true;

    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((stored) => {
        const resolved: ThemeName = stored === "light" ? "light" : DEFAULT_THEME;
        if (isMounted) {
          setThemeState(resolved);
          setColorScheme(resolved);
        }
      })
      .finally(() => {
        if (isMounted) setIsReady(true);
      });

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setTheme = (next: ThemeName) => {
    setThemeState(next);
    setColorScheme(next);
    AsyncStorage.setItem(THEME_STORAGE_KEY, next).catch(() => {});
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const value = useMemo(
    () => ({ theme, isReady, toggleTheme, setTheme }),
    [theme, isReady],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
};
