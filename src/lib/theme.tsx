import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type ThemeMode = "dark" | "light" | "pastel" | "spring" | "winter";

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType>({ theme: "dark", setTheme: () => {} });

export const useTheme = () => useContext(ThemeContext);

// ─── Full theme definitions with gradients ───────────────────────────────────
const themeVars: Record<ThemeMode, Record<string, string>> = {

  // ── 1. COSMOS (dark) — deep space, violet nebula ──────────────────────────
  dark: {
    "--background":            "226 22% 5%",
    "--foreground":            "0 0% 96%",
    "--card":                  "228 18% 9%",
    "--card-foreground":       "0 0% 96%",
    "--card-elevated":         "228 16% 12%",
    "--popover":               "228 18% 9%",
    "--popover-foreground":    "0 0% 96%",
    "--primary":               "258 90% 72%",
    "--primary-foreground":    "226 22% 5%",
    "--secondary":             "240 8% 16%",
    "--secondary-foreground":  "0 0% 88%",
    "--muted":                 "240 8% 17%",
    "--muted-foreground":      "240 5% 52%",
    "--accent":                "240 8% 20%",
    "--accent-foreground":     "0 0% 96%",
    "--destructive":           "0 72% 58%",
    "--destructive-foreground":"0 0% 99%",
    "--border":                "240 8% 17%",
    "--input":                 "240 8% 17%",
    "--ring":                  "258 90% 72%",
    "--radius":                "1rem",
    "--glass-border":          "0 0% 100% / 0.07",
    "--shadow-soft":           "0 4px 28px -4px hsl(0 0% 0% / 0.5)",
    // Category colors
    "--sleep":                 "258 80% 74%",
    "--sleep-soft":            "258 60% 14%",
    "--feeding":               "152 68% 52%",
    "--feeding-soft":          "152 55% 11%",
    "--diaper":                "42 96% 58%",
    "--diaper-soft":           "42 70% 12%",
    "--activity":              "199 90% 60%",
    "--activity-soft":         "199 65% 11%",
    "--growth":                "14 80% 64%",
    "--growth-soft":           "14 60% 12%",
    "--health":                "348 90% 68%",
    "--health-soft":           "348 65% 12%",
    "--mood":                  "290 80% 72%",
    "--mood-soft":             "290 55% 13%",
    "--milestone":             "42 96% 62%",
    "--milestone-soft":        "42 65% 12%",
    // Gradient variables
    "--bg-gradient":
      "radial-gradient(ellipse 110% 70% at 50% -10%, rgba(99,102,241,0.14) 0%, transparent 60%), " +
      "radial-gradient(ellipse 70% 50% at 85% 80%, rgba(167,139,250,0.06) 0%, transparent 55%), " +
      "hsl(226 22% 5%)",
    "--card-gradient":
      "linear-gradient(145deg, hsl(228 18% 10%), hsl(228 18% 8%))",
    "--sidebar-gradient":
      "linear-gradient(180deg, hsl(228 22% 7%) 0%, hsl(226 22% 5%) 100%)",
    "--primary-gradient":
      "linear-gradient(135deg, hsl(258 90% 68%), hsl(280 80% 58%))",
    "--fab-shadow":
      "0 8px 32px -4px rgba(124,58,237,0.50)",
  },

  // ── 2. AURORA (light) — clean white, soft violet sunrise ─────────────────
  light: {
    "--background":            "0 0% 97%",
    "--foreground":            "240 12% 10%",
    "--card":                  "0 0% 100%",
    "--card-foreground":       "240 12% 10%",
    "--card-elevated":         "240 5% 97%",
    "--popover":               "0 0% 100%",
    "--popover-foreground":    "240 12% 10%",
    "--primary":               "258 75% 58%",
    "--primary-foreground":    "0 0% 100%",
    "--secondary":             "240 6% 93%",
    "--secondary-foreground":  "240 8% 28%",
    "--muted":                 "240 6% 94%",
    "--muted-foreground":      "240 5% 45%",
    "--accent":                "258 40% 94%",
    "--accent-foreground":     "240 12% 10%",
    "--destructive":           "0 65% 52%",
    "--destructive-foreground":"0 0% 100%",
    "--border":                "240 6% 88%",
    "--input":                 "240 6% 88%",
    "--ring":                  "258 75% 58%",
    "--radius":                "1rem",
    "--glass-border":          "0 0% 0% / 0.07",
    "--shadow-soft":           "0 4px 24px -4px hsl(258 40% 40% / 0.12)",
    "--sleep":                 "258 70% 55%",
    "--sleep-soft":            "258 55% 93%",
    "--feeding":               "152 55% 40%",
    "--feeding-soft":          "152 45% 92%",
    "--diaper":                "38 80% 48%",
    "--diaper-soft":           "38 65% 92%",
    "--activity":              "199 80% 48%",
    "--activity-soft":         "199 60% 92%",
    "--growth":                "14 72% 52%",
    "--growth-soft":           "14 55% 92%",
    "--health":                "348 75% 55%",
    "--health-soft":           "348 60% 93%",
    "--mood":                  "290 65% 60%",
    "--mood-soft":             "290 50% 93%",
    "--milestone":             "42 88% 50%",
    "--milestone-soft":        "42 65% 92%",
    "--bg-gradient":
      "radial-gradient(ellipse 100% 60% at 50% -5%, rgba(167,139,250,0.10) 0%, transparent 60%), " +
      "radial-gradient(ellipse 60% 40% at 90% 90%, rgba(56,189,248,0.06) 0%, transparent 55%), " +
      "hsl(0 0% 97%)",
    "--card-gradient":
      "linear-gradient(145deg, hsl(0 0% 100%), hsl(240 5% 98%))",
    "--sidebar-gradient":
      "linear-gradient(180deg, hsl(0 0% 100%) 0%, hsl(240 5% 97%) 100%)",
    "--primary-gradient":
      "linear-gradient(135deg, hsl(258 75% 58%), hsl(280 70% 50%))",
    "--fab-shadow":
      "0 8px 28px -4px rgba(124,58,237,0.32)",
  },

  // ── 3. SAKURA (pastel) — soft pink, cherry blossom ───────────────────────
  pastel: {
    "--background":            "330 30% 97%",
    "--foreground":            "330 20% 15%",
    "--card":                  "330 35% 99%",
    "--card-foreground":       "330 20% 15%",
    "--card-elevated":         "330 25% 96%",
    "--popover":               "330 35% 99%",
    "--popover-foreground":    "330 20% 15%",
    "--primary":               "330 70% 62%",
    "--primary-foreground":    "0 0% 100%",
    "--secondary":             "320 20% 92%",
    "--secondary-foreground":  "330 15% 35%",
    "--muted":                 "320 18% 93%",
    "--muted-foreground":      "330 12% 48%",
    "--accent":                "340 30% 93%",
    "--accent-foreground":     "330 20% 15%",
    "--destructive":           "0 65% 52%",
    "--destructive-foreground":"0 0% 100%",
    "--border":                "330 20% 88%",
    "--input":                 "330 20% 88%",
    "--ring":                  "330 70% 62%",
    "--radius":                "1.125rem",
    "--glass-border":          "0 0% 0% / 0.06",
    "--shadow-soft":           "0 4px 24px -4px hsl(330 40% 50% / 0.12)",
    "--sleep":                 "270 55% 62%",
    "--sleep-soft":            "270 45% 93%",
    "--feeding":               "155 48% 44%",
    "--feeding-soft":          "155 38% 92%",
    "--diaper":                "38 72% 52%",
    "--diaper-soft":           "38 55% 92%",
    "--activity":              "210 60% 58%",
    "--activity-soft":         "210 45% 92%",
    "--growth":                "350 55% 60%",
    "--growth-soft":           "350 42% 93%",
    "--health":                "330 68% 62%",
    "--health-soft":           "330 52% 93%",
    "--mood":                  "305 55% 65%",
    "--mood-soft":             "305 42% 93%",
    "--milestone":             "42 78% 55%",
    "--milestone-soft":        "42 55% 92%",
    "--bg-gradient":
      "radial-gradient(ellipse 110% 70% at 50% -5%, rgba(244,114,182,0.14) 0%, transparent 55%), " +
      "radial-gradient(ellipse 60% 40% at 90% 80%, rgba(192,132,252,0.10) 0%, transparent 50%), " +
      "hsl(330 30% 97%)",
    "--card-gradient":
      "linear-gradient(145deg, hsl(330 35% 99.5%), hsl(330 25% 97%))",
    "--sidebar-gradient":
      "linear-gradient(180deg, hsl(330 35% 99%) 0%, hsl(330 25% 96%) 100%)",
    "--primary-gradient":
      "linear-gradient(135deg, hsl(330 70% 62%), hsl(305 65% 58%))",
    "--fab-shadow":
      "0 8px 28px -4px rgba(236,72,153,0.35)",
  },

  // ── 4. FOREST (spring) — fresh emerald, nature ───────────────────────────
  spring: {
    "--background":            "150 18% 96%",
    "--foreground":            "160 18% 12%",
    "--card":                  "150 22% 99%",
    "--card-foreground":       "160 18% 12%",
    "--card-elevated":         "150 16% 95%",
    "--popover":               "150 22% 99%",
    "--popover-foreground":    "160 18% 12%",
    "--primary":               "152 60% 42%",
    "--primary-foreground":    "0 0% 100%",
    "--secondary":             "140 14% 90%",
    "--secondary-foreground":  "160 12% 30%",
    "--muted":                 "140 12% 92%",
    "--muted-foreground":      "160 10% 44%",
    "--accent":                "80 28% 90%",
    "--accent-foreground":     "160 18% 12%",
    "--destructive":           "0 58% 50%",
    "--destructive-foreground":"0 0% 100%",
    "--border":                "140 12% 86%",
    "--input":                 "140 12% 86%",
    "--ring":                  "152 60% 42%",
    "--radius":                "1rem",
    "--glass-border":          "0 0% 0% / 0.07",
    "--shadow-soft":           "0 4px 24px -4px hsl(152 40% 30% / 0.10)",
    "--sleep":                 "260 45% 58%",
    "--sleep-soft":            "260 38% 91%",
    "--feeding":               "152 55% 42%",
    "--feeding-soft":          "152 42% 90%",
    "--diaper":                "42 72% 48%",
    "--diaper-soft":           "42 52% 90%",
    "--activity":              "195 58% 48%",
    "--activity-soft":         "195 42% 90%",
    "--growth":                "18 58% 52%",
    "--growth-soft":           "18 42% 90%",
    "--health":                "170 50% 42%",
    "--health-soft":           "170 38% 90%",
    "--mood":                  "320 48% 58%",
    "--mood-soft":             "320 38% 91%",
    "--milestone":             "48 72% 48%",
    "--milestone-soft":        "48 52% 90%",
    "--bg-gradient":
      "radial-gradient(ellipse 110% 65% at 50% -5%, rgba(52,211,153,0.12) 0%, transparent 58%), " +
      "radial-gradient(ellipse 55% 40% at 80% 85%, rgba(34,197,94,0.07) 0%, transparent 50%), " +
      "hsl(150 18% 96%)",
    "--card-gradient":
      "linear-gradient(145deg, hsl(150 22% 99.5%), hsl(150 15% 96%))",
    "--sidebar-gradient":
      "linear-gradient(180deg, hsl(150 22% 99%) 0%, hsl(150 16% 95%) 100%)",
    "--primary-gradient":
      "linear-gradient(135deg, hsl(152 60% 42%), hsl(170 55% 36%))",
    "--fab-shadow":
      "0 8px 28px -4px rgba(22,163,74,0.35)",
  },

  // ── 5. ARCTIC (winter) — dark ice, deep cyan ─────────────────────────────
  winter: {
    "--background":            "215 28% 7%",
    "--foreground":            "210 22% 95%",
    "--card":                  "215 22% 11%",
    "--card-foreground":       "210 22% 95%",
    "--card-elevated":         "215 20% 14%",
    "--popover":               "215 22% 11%",
    "--popover-foreground":    "210 22% 95%",
    "--primary":               "199 90% 58%",
    "--primary-foreground":    "215 28% 7%",
    "--secondary":             "215 16% 17%",
    "--secondary-foreground":  "210 15% 80%",
    "--muted":                 "215 14% 19%",
    "--muted-foreground":      "210 10% 50%",
    "--accent":                "200 22% 20%",
    "--accent-foreground":     "210 22% 95%",
    "--destructive":           "0 60% 52%",
    "--destructive-foreground":"0 0% 100%",
    "--border":                "215 14% 19%",
    "--input":                 "215 14% 19%",
    "--ring":                  "199 90% 58%",
    "--radius":                "1rem",
    "--glass-border":          "0 0% 100% / 0.07",
    "--shadow-soft":           "0 4px 28px -4px hsl(215 28% 0% / 0.55)",
    "--sleep":                 "240 65% 70%",
    "--sleep-soft":            "240 45% 18%",
    "--feeding":               "170 58% 50%",
    "--feeding-soft":          "170 40% 14%",
    "--diaper":                "42 72% 55%",
    "--diaper-soft":           "42 50% 14%",
    "--activity":              "199 85% 60%",
    "--activity-soft":         "199 60% 13%",
    "--growth":                "14 68% 58%",
    "--growth-soft":           "14 48% 13%",
    "--health":                "185 62% 52%",
    "--health-soft":           "185 45% 13%",
    "--mood":                  "290 60% 65%",
    "--mood-soft":             "290 40% 14%",
    "--milestone":             "48 78% 58%",
    "--milestone-soft":        "48 52% 14%",
    "--bg-gradient":
      "radial-gradient(ellipse 110% 70% at 50% -10%, rgba(56,189,248,0.16) 0%, transparent 58%), " +
      "radial-gradient(ellipse 65% 45% at 85% 85%, rgba(99,102,241,0.08) 0%, transparent 55%), " +
      "hsl(215 28% 7%)",
    "--card-gradient":
      "linear-gradient(145deg, hsl(215 22% 12%), hsl(215 22% 10%))",
    "--sidebar-gradient":
      "linear-gradient(180deg, hsl(215 25% 9%) 0%, hsl(215 28% 7%) 100%)",
    "--primary-gradient":
      "linear-gradient(135deg, hsl(199 90% 58%), hsl(215 85% 52%))",
    "--fab-shadow":
      "0 8px 28px -4px rgba(14,165,233,0.45)",
  },
};

// ─── Apply theme to DOM ───────────────────────────────────────────────────────
function applyTheme(theme: ThemeMode) {
  const root = document.documentElement;
  const vars = themeVars[theme];

  // Apply all CSS variables
  Object.entries(vars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });

  // Apply gradient background to body
  document.body.style.background = vars["--bg-gradient"] ?? `hsl(${vars["--background"]})`;

  // Light/pastel/spring themes: adjust glass border opacity
  const isLight = ["light", "pastel", "spring"].includes(theme);
  root.style.setProperty("--glass-border", isLight ? "0 0% 0% / 0.07" : "0 0% 100% / 0.07");
}

// ─── ThemeProvider ────────────────────────────────────────────────────────────
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    return (localStorage.getItem("babytrack_theme") as ThemeMode) || "dark";
  });

  const setTheme = (t: ThemeMode) => {
    setThemeState(t);
    localStorage.setItem("babytrack_theme", t);
    applyTheme(t);
  };

  useEffect(() => {
    applyTheme(theme);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
