"use client";

import React, { createContext, useState, useContext, useEffect } from "react";

const ThemeContext = createContext(undefined);

export const ThemeProvider = ({ children }) => {
  const [theme] = useState("light");

  useEffect(() => {
    // Always ensure light theme
    document.documentElement.classList.remove("dark");
  }, []);

  const toggleTheme = () => {
    // No-op: theme toggle disabled, always light theme
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
