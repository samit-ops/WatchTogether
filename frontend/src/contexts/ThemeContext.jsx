import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

const ThemeContext = createContext(null);

export function getISTHour() {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: 'numeric', hour12: false });
    const parts = formatter.formatToParts(now);
    let hour = 0, minute = 0;
    for (const part of parts) {
      if (part.type === 'hour') hour = parseInt(part.value, 10) % 24;
      if (part.type === 'minute') minute = parseInt(part.value, 10);
    }
    return hour + minute / 60;
  } catch (e) {
    console.error('Error calculating IST time:', e);
  }
  return new Date().getHours() + new Date().getMinutes() / 60;
}

export function isISTLightThemeTime() {
  const istTime = getISTHour();
  // 10:00 AM (10.0) to 12:00 PM (12.0) IST
  return istTime >= 10.0 && istTime <= 12.0;
}

const applyThemeClass = (theme) => {
  const root = document.documentElement;
  const body = document.body;
  const appRoot = document.getElementById('root');

  if (theme === 'dark') {
    root.classList.add('dark');
    if (body) body.classList.add('dark');
    if (appRoot) appRoot.classList.add('dark');
  } else {
    root.classList.remove('dark');
    if (body) body.classList.remove('dark');
    if (appRoot) appRoot.classList.remove('dark');
  }
};

export const ThemeProvider = ({ children }) => {
  const { user } = useAuth();
  
  const [themePreference, setThemePreferenceState] = useState(() => {
    return localStorage.getItem('themePreference') || user?.themePreference || 'auto';
  });

  const [activeTheme, setActiveTheme] = useState('dark');

  // Sync user profile preference when user logs in/loads
  useEffect(() => {
    if (user?.themePreference) {
      setThemePreferenceState(user.themePreference);
    }
  }, [user?.themePreference]);

  // Evaluate active theme based on preference and IST time rule
  useEffect(() => {
    let resolvedTheme = 'dark';

    if (themePreference === 'light') {
      resolvedTheme = 'light';
    } else if (themePreference === 'dark') {
      resolvedTheme = 'dark';
    } else {
      // Auto mode: Light between 10 AM and 12 PM IST, Dark at all other times
      resolvedTheme = isISTLightThemeTime() ? 'light' : 'dark';
    }

    setActiveTheme(resolvedTheme);
    applyThemeClass(resolvedTheme);
  }, [themePreference]);

  // Periodic IST time check for Auto theme transitions
  useEffect(() => {
    const interval = setInterval(() => {
      if (themePreference === 'auto') {
        const resolvedTheme = isISTLightThemeTime() ? 'light' : 'dark';
        setActiveTheme(resolvedTheme);
        applyThemeClass(resolvedTheme);
      }
    }, 15000); // Check every 15 seconds

    return () => clearInterval(interval);
  }, [themePreference]);

  const setThemePreference = async (newPref) => {
    if (!['auto', 'light', 'dark'].includes(newPref)) return;

    // 1. Instantly update local React state and LocalStorage
    setThemePreferenceState(newPref);
    localStorage.setItem('themePreference', newPref);

    // 2. Instantly update DOM CSS classes
    let resolvedTheme = 'dark';
    if (newPref === 'light') resolvedTheme = 'light';
    else if (newPref === 'dark') resolvedTheme = 'dark';
    else resolvedTheme = isISTLightThemeTime() ? 'light' : 'dark';

    setActiveTheme(resolvedTheme);
    applyThemeClass(resolvedTheme);

    // 3. Save to backend asynchronously
    if (user) {
      try {
        await api.put('/v1/auth/theme', { themePreference: newPref });
      } catch (err) {
        console.error('Failed to save theme preference to server:', err);
      }
    }
  };

  return (
    <ThemeContext.Provider value={{ activeTheme, themePreference, setThemePreference, isISTLightThemeTime }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
