import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface Settings {
  appearance?: {
    theme: string;
    // animations: boolean;
  };
  debugging?: {
    // devTools: boolean;
    // logs: boolean;
    boundingBoxes: boolean;
  };
  downloads?: {
    downloadPath: string;
  };
  soundpad?: {
    enabled: boolean;
    port: string;
  };
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (section: string, values: any) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => {
    // Initialize settings from localStorage during initial render
    if (typeof window !== 'undefined') {
      const storedSettings = localStorage.getItem('settings');
      if (storedSettings) {
        try {
          return JSON.parse(storedSettings);
        } catch (error) {
          console.error('Error parsing settings:', error);
        }
      }
    }
    return {};
  });

  const updateSettings = (section: string, values: any) => {
    setSettings(prev => {
      const newSettings = {
        ...prev,
        [section]: values
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem('settings', JSON.stringify(newSettings));
        window.dispatchEvent(new Event('settingsChanged'));
      }
      return newSettings;
    });
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}