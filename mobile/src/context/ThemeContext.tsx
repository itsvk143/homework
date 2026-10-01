// mobile/src/context/ThemeContext.tsx
import React, { createContext, useContext, useState } from "react";
import { ThemeMode } from "../types";

export interface ThemeColors {
  mode: ThemeMode;
  background: string;
  surface: string;
  surfaceSubtle: string;
  cardBorder: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accentPrimary: string;
  accentSecondary: string;
  accentSuccess: string;
  accentWarning: string;
  accentDanger: string;
  orbColor1: string;
  orbColor2: string;
  orbColor3: string;
  particleColor: string;
  gridLineColor: string;
  tabBarBackground: string;
  tabBarBorder: string;
}

export const DarkTheme: ThemeColors = {
  mode: "DARK",
  background: "#090D16",
  surface: "#111827",
  surfaceSubtle: "rgba(30, 41, 59, 0.7)",
  cardBorder: "rgba(79, 70, 229, 0.25)",
  textPrimary: "#F8FAFC",
  textSecondary: "#94A3B8",
  textMuted: "#64748B",
  accentPrimary: "#6366F1",
  accentSecondary: "#8B5CF6",
  accentSuccess: "#10B981",
  accentWarning: "#F59E0B",
  accentDanger: "#EF4444",
  orbColor1: "rgba(99, 102, 241, 0.28)",
  orbColor2: "rgba(139, 92, 246, 0.22)",
  orbColor3: "rgba(16, 185, 129, 0.18)",
  particleColor: "rgba(224, 231, 255, 0.45)",
  gridLineColor: "rgba(99, 102, 241, 0.05)",
  tabBarBackground: "rgba(15, 23, 42, 0.95)",
  tabBarBorder: "rgba(51, 65, 85, 0.5)",
};

export const LightTheme: ThemeColors = {
  mode: "LIGHT",
  background: "#F8FAFC",
  surface: "#FFFFFF",
  surfaceSubtle: "rgba(241, 245, 249, 0.8)",
  cardBorder: "rgba(226, 232, 240, 0.9)",
  textPrimary: "#0F172A",
  textSecondary: "#475569",
  textMuted: "#94A3B8",
  accentPrimary: "#4F46E5",
  accentSecondary: "#7C3AED",
  accentSuccess: "#059669",
  accentWarning: "#D97706",
  accentDanger: "#DC2626",
  orbColor1: "rgba(99, 102, 241, 0.12)",
  orbColor2: "rgba(192, 132, 252, 0.10)",
  orbColor3: "rgba(52, 211, 153, 0.10)",
  particleColor: "rgba(99, 102, 241, 0.35)",
  gridLineColor: "rgba(148, 163, 184, 0.08)",
  tabBarBackground: "rgba(255, 255, 255, 0.95)",
  tabBarBorder: "rgba(226, 232, 240, 0.8)",
};

interface ThemeContextType {
  theme: ThemeColors;
  themeMode: ThemeMode;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: DarkTheme,
  themeMode: "DARK",
  toggleTheme: () => {},
  setThemeMode: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeMode] = useState<ThemeMode>("DARK");

  const toggleTheme = () => {
    setThemeMode((prev) => (prev === "DARK" ? "LIGHT" : "DARK"));
  };

  const theme = themeMode === "DARK" ? DarkTheme : LightTheme;

  return (
    <ThemeContext.Provider value={{ theme, themeMode, toggleTheme, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
