'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface Settings {
  appearance: { theme: string };
  debugging: { boundingBoxes: boolean };
  downloads: { downloadPath: string };
  soundpad: { enabled: boolean; port: string };
}

const DEFAULT_SETTINGS: Settings = {
  appearance: { theme: 'system' },
  debugging: { boundingBoxes: false },
  downloads: { downloadPath: '~/Downloads/asp-downloads' },
  soundpad: { enabled: false, port: '8844' },
};

const SettingsContext = createContext<{
  settings: Settings;
  updateSettings: (section: keyof Settings, values: any) => void;
} | undefined>(undefined);

function initializeSettings(): Settings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;

  try {
    const stored = localStorage.getItem('settings');
    if (!stored) {
      localStorage.setItem('settings', JSON.stringify(DEFAULT_SETTINGS));
      return DEFAULT_SETTINGS;
    }

    const parsed = JSON.parse(stored);
    const mergedSettings: Settings = {
      appearance: { ...DEFAULT_SETTINGS.appearance, ...parsed.appearance },
      debugging: { ...DEFAULT_SETTINGS.debugging, ...parsed.debugging },
      downloads: { ...DEFAULT_SETTINGS.downloads, ...parsed.downloads },
      soundpad: { ...DEFAULT_SETTINGS.soundpad, ...parsed.soundpad }
    };

    // Always write back the merged settings to ensure completeness
    localStorage.setItem('settings', JSON.stringify(mergedSettings));
    return mergedSettings;
  } catch (err) {
    console.error('Failed to parse stored settings:', err);
    localStorage.setItem('settings', JSON.stringify(DEFAULT_SETTINGS));
    return DEFAULT_SETTINGS;
  }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(initializeSettings);

  // Sync settings to localStorage on every change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('settings', JSON.stringify(settings));
      window.dispatchEvent(new Event('settingsChanged'));
    }
  }, [settings]);

  // Update handler that maintains nested structure
  const updateSettings = (section: keyof Settings, values: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        ...values
      }
    }));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
}