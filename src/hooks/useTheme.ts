// src/hooks/useTheme.ts
import { create } from "zustand";

type Theme = "dark" | "light";

interface ThemeStore {
  theme: Theme;
  toggleTheme: () => void;
}

export const useTheme = create<ThemeStore>((set, get) => ({
  theme: (localStorage.getItem("storeiq-theme") as Theme) ?? "dark",

  toggleTheme: () => {
    const next: Theme = get().theme === "dark" ? "light" : "dark";
    localStorage.setItem("storeiq-theme", next);
    document.documentElement.setAttribute("data-theme", next);
    set({ theme: next });
  },
}));

// Apply on load
const saved = (localStorage.getItem("storeiq-theme") ?? "dark") as Theme;
document.documentElement.setAttribute("data-theme", saved);