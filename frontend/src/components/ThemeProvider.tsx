"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  // 1. Initial Load Effect
  useEffect(() => {
    // Check Local Storage first
    const savedTheme = localStorage.getItem("cortex-theme") as Theme;
    if (savedTheme) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTheme(savedTheme);
    }
    
    // Mark as mounted to reveal the UI
    setMounted(true); 
  }, []);

  // 2. Sync Theme with HTML tag
  useEffect(() => {
    if (!mounted) return;
    
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    
    localStorage.setItem("cortex-theme", theme);
  }, [theme, mounted]);

  // Prevent Hydration Mismatch by rendering nothing until mounted
  if (!mounted) {
    return <div className="min-h-screen bg-[#0B0C15]" />;
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within a ThemeProvider");
  return context;
};