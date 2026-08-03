export const APPEARANCE_STORAGE_KEY = "clickchat:appearance-theme:v1";
export const APPEARANCE_EVENT = "clickchat:appearance-change";

export const APPEARANCE_THEMES = [
  { id: "clickchat", name: "ClickChat", description: "Clean and neutral", colors: ["#171717", "#f5f5f5", "#ffffff"] },
  { id: "ocean", name: "Ocean", description: "Clear blue and cyan", colors: ["#0369a1", "#cffafe", "#f0f9ff"] },
  { id: "forest", name: "Forest", description: "Calm green and emerald", colors: ["#047857", "#d1fae5", "#f0fdf4"] },
  { id: "sunset", name: "Sunset", description: "Warm orange and rose", colors: ["#c2410c", "#ffedd5", "#fff7ed"] },
  { id: "lavender", name: "Lavender", description: "Soft violet and purple", colors: ["#7c3aed", "#ede9fe", "#faf5ff"] },
  { id: "midnight", name: "Midnight", description: "Focused indigo contrast", colors: ["#4338ca", "#1e293b", "#0f172a"] },
];

export function readAppearanceTheme() {
  if (typeof window === "undefined") return "clickchat";
  const stored = window.localStorage.getItem(APPEARANCE_STORAGE_KEY);
  return APPEARANCE_THEMES.some((theme) => theme.id === stored) ? stored : "clickchat";
}
