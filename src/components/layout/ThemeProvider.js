"use client";

import { createContext, useContext, useState } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  // Theme is now fixed to "dark" as per the new requirements
  const theme = "dark";
  const primaryColor = "oklch(0.85 0.22 135)"; // Fixed Neon Lime

  const [adminEffectsEnabled, setAdminEffectsEnabled] = useState(false);

  const isPrideMonth = () => {
    const now = new Date();
    return now.getMonth() === 5; // June
  };

  const isChristmasTime = () => {
    const now = new Date();
    return now.getMonth() === 11; // December
  };

  const activeEffects = {
    showPride: isPrideMonth() || adminEffectsEnabled,
    showSnow: isChristmasTime() || adminEffectsEnabled,
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        primaryColor,
        adminEffectsEnabled,
        setAdminEffectsEnabled,
        activeEffects,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
