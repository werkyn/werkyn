import { useEffect } from "react";
import { useThemeStore } from "@/stores/theme-store";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useThemeStore((s) => s.theme);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "system") {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.toggle("dark", isDark);
    } else {
      root.classList.toggle("dark", theme === "dark");
    }
  }, [theme]);

  return <>{children}</>;
}
