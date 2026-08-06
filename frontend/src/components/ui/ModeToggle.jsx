"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { useAppearanceTheme } from "@/shared/theme/appearanceThemeContext";
import { useUserStore } from "@/features/profile/store/useUserStore";
import { useAuthStore } from "@/features/auth/store/useAuthStore";

export function ModeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const { appearanceTheme } = useAppearanceTheme();
  const updateProfile = useUserStore((state) => state.updateProfile);
  const isUpdatingProfile = useUserStore((state) => state.isUpdatingProfile);
  const authUser = useAuthStore((state) => state.authUser);

  const toggleTheme = async () => {
    const nextMode = resolvedTheme === "dark" ? "light" : "dark";
    setTheme(nextMode);
    if (authUser) {
      const saved = await updateProfile(
        { appearance: { preset: appearanceTheme, colorMode: nextMode } },
        { silent: true },
      );
      if (!saved) setTheme(resolvedTheme || "system");
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      disabled={Boolean(authUser) && isUpdatingProfile}
      aria-label="Toggle theme"
    >
      <Sun className="size-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />

      <Moon className="absolute size-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />

      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
