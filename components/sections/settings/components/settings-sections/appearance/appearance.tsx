import { PaletteIcon } from "lucide-react";
import { SettingsSectionHeader } from "../../settings-section-header";
import SettingsPrefWrapper from "../../settings-pref-wrapper";
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function SettingsAppearance() {
  const [theme, setTheme] = useState("system");
  const [animations, setAnimations] = useState(true);

  // store states in localstorage in a structured style
  const storeSettings = () => {
    const existingSettings = localStorage.getItem("settings");
    const settings = existingSettings ? JSON.parse(existingSettings) : {};
    
    settings.appearance = {
      theme,
      animations,
    };

    localStorage.setItem("settings", JSON.stringify(settings));
  };

  // load settings from localstorage
  const loadSettings = () => {
    const settings = localStorage.getItem("settings");
    if (settings) {
      const parsedSettings = JSON.parse(settings);
      if (parsedSettings.appearance) {
        setTheme(parsedSettings.appearance.theme ?? "system");
        setAnimations(parsedSettings.appearance.animations ?? true);
      }
    }
  };

  // load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  // save settings when values change
  useEffect(() => {
    storeSettings();
  }, [theme, animations]);

  return (
    <div className="h-full w-full p-4">
        <SettingsSectionHeader 
            title="Appearance"
            description="Manage the look and feel."
            icon={<PaletteIcon className="opacity-50" />}
        />

      <div className="flex flex-col gap-4 mt-4 h-full overflow-y-auto">
        {/* <SettingsPrefWrapper
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
        </SettingsPrefWrapper> */}

        {/* <SettingsPrefWrapper
            title="Animations"
            description="Enable or disable animations."
          >
            <Checkbox 
              id="animations" 
              className="size-6" 
              checked={animations}
              onCheckedChange={(checked) => setAnimations(checked as boolean)}
            />
        </SettingsPrefWrapper> */}

        <SettingsPrefWrapper
            title="Work in progress"
            description="Work in progress"
          >
            Work in progress
            </SettingsPrefWrapper>
      </div>
    </div>
  );
}