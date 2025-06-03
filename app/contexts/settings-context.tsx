'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { toast } from 'sonner';

interface Settings {
  appearance: { theme: string };
  debugging: { boundingBoxes: boolean };
  downloads: { 
    useTempPath?: boolean;
    paths: { name: string; path: string; active: boolean }[];
  };
  soundpad: { enabled: boolean; port: string };
  main?: {
    quality?: string;
    type?: string;
    preview?: string;
    addToSoundpad?: boolean;
  };
}

const DEFAULT_SETTINGS: Settings = {
  appearance: { theme: 'system' },
  debugging: { boundingBoxes: false },
  downloads: {
    useTempPath: false,
    paths: [{ name: "asp-downloads", path: "~/Downloads/asp-downloads", active: true }]
  },
  soundpad: { enabled: false, port: '8866' }, // Changed default port to 8866
  main: {
    quality: 'high',
    type: 'mp3',
    preview: 'image',
    addToSoundpad: false // Ensure addToSoundpad has a default in main
  }
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
      downloads: { 
        ...DEFAULT_SETTINGS.downloads, 
        ...parsed.downloads,
        useTempPath: parsed.downloads?.useTempPath ?? DEFAULT_SETTINGS.downloads.useTempPath
      },
      soundpad: { 
        ...DEFAULT_SETTINGS.soundpad, // Ensure soundpad section is merged
        ...parsed.soundpad,
        port: parsed.soundpad?.port || DEFAULT_SETTINGS.soundpad.port // Ensure port has a default
      },
      main: { 
        ...DEFAULT_SETTINGS.main, 
        ...parsed.main,
        addToSoundpad: parsed.main?.addToSoundpad ?? DEFAULT_SETTINGS.main!.addToSoundpad // Ensure addToSoundpad is merged
      }
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

  // Check for settings reset on mount
  useEffect(() => {
    if (sessionStorage.getItem('settingsResetFlag')) {
      toast.info("Settings have been reset to default values.");
      sessionStorage.removeItem('settingsResetFlag');
    }
  }, []);

  // Sync settings to localStorage and send to main process on every change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('settings', JSON.stringify(settings));
      window.dispatchEvent(new Event('settingsChanged'));
      // Send settings to the main process
      if (window.api && window.api.send) {
        window.api.send('settings-updated', settings);
      }
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