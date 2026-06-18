import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { accentFor, ACCENTS, darkTheme, DEFAULT_ACCENT, lightTheme, Theme } from '../theme/theme';

type ThemePreference = 'system' | 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  preference: ThemePreference;
  setPreference: (pref: ThemePreference) => void;
  toggle: () => void;
  accent: string;
  setAccent: (key: string) => void;
  accents: typeof ACCENTS;
}

const PREF_KEY = 'fr.themePref';
const ACCENT_KEY = 'fr.accent';

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [accent, setAccentState] = useState<string>(DEFAULT_ACCENT);

  useEffect(() => {
    AsyncStorage.getItem(PREF_KEY).then((stored) => {
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        setPreferenceState(stored);
      }
    });
    AsyncStorage.getItem(ACCENT_KEY).then((stored) => {
      if (stored && ACCENTS.some((a) => a.key === stored)) setAccentState(stored);
    });
  }, []);

  const setPreference = (pref: ThemePreference) => {
    setPreferenceState(pref);
    AsyncStorage.setItem(PREF_KEY, pref);
  };

  const setAccent = (key: string) => {
    setAccentState(key);
    AsyncStorage.setItem(ACCENT_KEY, key);
  };

  const resolvedMode: 'light' | 'dark' = preference === 'system' ? (system ?? 'light') : preference;

  const theme = useMemo<Theme>(() => {
    const base = resolvedMode === 'dark' ? darkTheme : lightTheme;
    return {
      ...base,
      colors: { ...base.colors, primary: accentFor(accent, resolvedMode) },
    };
  }, [resolvedMode, accent]);

  const toggle = () => setPreference(theme.mode === 'dark' ? 'light' : 'dark');

  const value = useMemo(
    () => ({ theme, preference, setPreference, toggle, accent, setAccent, accents: ACCENTS }),
    [theme, preference, accent],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
