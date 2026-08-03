import { useState } from "react";
import { Check, Monitor, Moon, Palette, RotateCcw, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { APPEARANCE_THEMES } from "@/lib/appearanceThemes";
import { useAppearanceTheme } from "@/lib/appearanceThemeContext";
import { useUserStore } from "@/store/useUserStore";

export function AppearanceSettings() {
  const { theme: colorMode, setTheme: setColorMode } = useTheme();
  const { appearanceTheme, setAppearanceTheme } = useAppearanceTheme();
  const updateProfile = useUserStore((state) => state.updateProfile);
  const isUpdatingProfile = useUserStore((state) => state.isUpdatingProfile);
  const [draftTheme, setDraftTheme] = useState(appearanceTheme);
  const [draftMode, setDraftMode] = useState(colorMode || "system");
  const hasChanges = draftTheme !== appearanceTheme || draftMode !== colorMode;

  const handleApply = async () => {
    const saved = await updateProfile(
      { appearance: { preset: draftTheme, colorMode: draftMode } },
      { silent: true },
    );
    if (!saved) return;
    setAppearanceTheme(draftTheme);
    setColorMode(draftMode);
    toast.success("Appearance saved across your devices.");
  };

  const handleReset = async () => {
    const saved = await updateProfile(
      { appearance: { preset: "clickchat", colorMode: "system" } },
      { silent: true },
    );
    if (!saved) return;
    setDraftTheme("clickchat");
    setDraftMode("system");
    setAppearanceTheme("clickchat");
    setColorMode("system");
    toast.success("Default appearance restored.");
  };

  return (
    <Card className="mt-6 rounded-2xl py-6">
      <CardHeader>
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Palette className="size-5" />
          </span>
          <div>
            <CardTitle className="text-xl tracking-tight">Appearance</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Choose a theme for the app, chat canvas, and readable message bubbles.
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <p className="mb-3 text-sm font-medium">Color mode</p>
          <div className="grid grid-cols-3 gap-2 rounded-2xl bg-muted p-1.5">
            {[["light", Sun, "Light"], ["dark", Moon, "Dark"], ["system", Monitor, "System"]].map(([value, Icon, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setDraftMode(value)}
                className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${draftMode === value ? "bg-background shadow-sm ring-1 ring-foreground/8" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Icon className="size-4" /> {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-3 text-sm font-medium">Theme</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {APPEARANCE_THEMES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setDraftTheme(item.id)}
                className={`overflow-hidden rounded-2xl border bg-card p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-md ${draftTheme === item.id ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}`}
              >
                <div className="h-24 rounded-xl p-3" style={{ background: item.colors[2] }}>
                  <div className="flex h-full flex-col justify-end gap-1.5">
                    <span className="max-w-[74%] rounded-xl rounded-bl-sm px-2 py-1 text-[10px] shadow-sm" style={{ background: item.colors[1], color: "#172033" }}>Easy to read</span>
                    <span className="ml-auto max-w-[74%] rounded-xl rounded-br-sm px-2 py-1 text-[10px] text-white shadow-sm" style={{ background: item.colors[0] }}>Looks great</span>
                  </div>
                </div>
                <div className="mt-3 flex items-start justify-between gap-2 px-0.5">
                  <div><p className="text-sm font-semibold">{item.name}</p><p className="text-xs text-muted-foreground">{item.description}</p></div>
                  {draftTheme === item.id && <Check className="mt-0.5 size-4 text-primary" />}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:justify-between">
          <Button type="button" variant="ghost" onClick={handleReset} disabled={isUpdatingProfile}><RotateCcw className="size-4" />{isUpdatingProfile ? "Saving..." : "Restore default"}</Button>
          <Button type="button" onClick={handleApply} disabled={!hasChanges || isUpdatingProfile}><Check className="size-4" />{isUpdatingProfile ? "Saving..." : "Apply appearance"}</Button>
        </div>
      </CardContent>
    </Card>
  );
}
