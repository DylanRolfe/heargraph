'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_SETTINGS,
  applySettingsToDocument,
  loadSettings,
  saveSettings,
  type Settings,
} from '@/lib/settings';

interface SettingsContextValue {
  settings: Settings;
  /** false until saved settings have been read in the browser. */
  ready: boolean;
  update: (patch: Partial<Settings>) => void;
  reset: () => void;
}

const SettingsContext = createContext<SettingsContextValue>({
  settings: DEFAULT_SETTINGS,
  ready: false,
  update: () => undefined,
  reset: () => undefined,
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const loaded = loadSettings();
    setSettings(loaded);
    applySettingsToDocument(loaded);
    setReady(true);
  }, []);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      applySettingsToDocument(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    const next = { ...DEFAULT_SETTINGS };
    saveSettings(next);
    applySettingsToDocument(next);
    setSettings(next);
  }, []);

  const value = useMemo(() => ({ settings, ready, update, reset }), [settings, ready, update, reset]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  return useContext(SettingsContext);
}
