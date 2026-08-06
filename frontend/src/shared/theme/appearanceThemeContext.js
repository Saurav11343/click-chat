import { createContext, useContext } from "react";

export const AppearanceThemeContext = createContext(null);

export function useAppearanceTheme() {
  const context = useContext(AppearanceThemeContext);
  if (!context) throw new Error("useAppearanceTheme must be used inside ThemeProvider");
  return context;
}
