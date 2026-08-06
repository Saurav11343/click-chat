import { useEffect, useState } from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { useTheme } from "next-themes";

import {
  APPEARANCE_EVENT,
  APPEARANCE_STORAGE_KEY,
  COLOR_MODE_EVENT,
  readAppearanceTheme,
} from "@/shared/theme/appearanceThemes";
import { AppearanceThemeContext } from "@/shared/theme/appearanceThemeContext";

export function ThemeProvider({ children, ...props }) {
  const [appearanceTheme, setAppearanceThemeState] = useState(readAppearanceTheme);

  useEffect(() => {
    document.documentElement.dataset.clickchatTheme = appearanceTheme;
  }, [appearanceTheme]);

  useEffect(() => {
    const refresh = () => setAppearanceThemeState(readAppearanceTheme());
    window.addEventListener("storage", refresh);
    window.addEventListener(APPEARANCE_EVENT, refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener(APPEARANCE_EVENT, refresh);
    };
  }, []);

  const setAppearanceTheme = (themeId) => {
    window.localStorage.setItem(APPEARANCE_STORAGE_KEY, themeId);
    setAppearanceThemeState(themeId);
    window.dispatchEvent(new Event(APPEARANCE_EVENT));
  };

  return (
    <NextThemesProvider {...props}>
      <ColorModeSync />
      <AppearanceThemeContext.Provider value={{ appearanceTheme, setAppearanceTheme }}>
        {children}
      </AppearanceThemeContext.Provider>
    </NextThemesProvider>
  );
}

function ColorModeSync() {
  const { setTheme } = useTheme();

  useEffect(() => {
    const syncColorMode = (event) => setTheme(event.detail?.colorMode || "system");
    window.addEventListener(COLOR_MODE_EVENT, syncColorMode);
    return () => window.removeEventListener(COLOR_MODE_EVENT, syncColorMode);
  }, [setTheme]);

  return null;
}
