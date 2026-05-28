"use client";

import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children, initialPreferences }) {
  const [theme, setTheme] = useState(initialPreferences?.theme || "dark");
  const [primaryColor, setPrimaryColor] = useState(
    initialPreferences?.primaryColor || "#7c3aed",
  );
  const [adminEffectsEnabled, setAdminEffectsEnabled] = useState(false);

  useEffect(() => {
    // Apply theme class to html element
    const html = document.documentElement;
    if (theme === "dark") {
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
    }

    // Apply primary color as CSS variable
    html.style.setProperty("--primary-custom", primaryColor);

    // We also need to update the color in a way that tailwind/shadcn can use it.
    // Since globals.css uses oklch, we might need a way to convert hex to oklch or just override the variable with hex.
    // Most browsers support hex in CSS variables used in oklch() if we redefine the whole variable.
    // But it's easier to just set it to the hex value and have the CSS use that.
  }, [theme, primaryColor]);

  const isPrideMonth = () => {
    const now = new Date();
    return now.getMonth() === 5; // June
  };

  const isChristmasTime = () => {
    const now = new Date();
    return now.getMonth() === 11; // December
  };

  const activeEffects = {
    pride: isPrideMonth() || (adminEffectsEnabled && isPrideMonth()), // Actually if admin enabled, it should show regardless of date?
    // User said: "der Effekt ist nur für ihn sichtbar" and "außerhalb der festgelegten Zeiten auch nur er sehen kann"
    // So:
    showPride: isPrideMonth() || adminEffectsEnabled,
    showSnow: isChristmasTime() || adminEffectsEnabled,
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        primaryColor,
        setPrimaryColor,
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
