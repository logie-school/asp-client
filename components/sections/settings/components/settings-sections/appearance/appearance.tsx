import { PaletteIcon } from "lucide-react";
import { SettingsSectionHeader } from "../../settings-section-header";
import SettingsPrefWrapper from "../../settings-pref-wrapper";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSettings } from "@/app/contexts/settings-context";
import { useState, useEffect } from "react";

// Default settings
const DEFAULT_SETTINGS = {
  theme: "system",
  // animations: true,
};

export default function SettingsAppearance() {
  const { settings, updateSettings } = useSettings();

  // Get appearance settings with defaults
  const appearanceSettings = {
    ...DEFAULT_SETTINGS,
    ...settings.appearance,
    theme: !settings.appearance?.theme ? DEFAULT_SETTINGS.theme : settings.appearance.theme,
    // animations: typeof settings.appearance?.animations === "boolean" ? settings.appearance.animations : DEFAULT_SETTINGS.animations,
  };

  // Local state for theme and animations
  const [theme, setTheme] = useState<string>(appearanceSettings.theme);

  // Update context/settings when theme changes
  useEffect(() => {
    updateSettings("appearance", {
      ...appearanceSettings,
      theme,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);

  // Sync local state if context changes (e.g. from another tab)
  useEffect(() => {
    setTheme(appearanceSettings.theme);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.appearance?.theme]);

  return (
    <div className="h-full w-full p-4">
        <SettingsSectionHeader 
            title="Appearance"
            description="Manage the look and feel."
            icon={<PaletteIcon className="opacity-50" />}
        />

      <div className="flex flex-col gap-4 mt-4 h-full overflow-y-auto">
        <SettingsPrefWrapper
            title="Theme"
            description="Choose between light and dark themes."
          >
            <Select value={theme} onValueChange={(value) => setTheme(value)}>
              <SelectTrigger>
                <SelectValue placeholder="select" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Theme</SelectLabel>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="light">Light</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
        </SettingsPrefWrapper>
      </div>
    </div>
  );
}