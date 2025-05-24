import { BugOffIcon } from "lucide-react";
import { SettingsSectionHeader } from "../../settings-section-header";
import SettingsPrefWrapper from "../../settings-pref-wrapper";
import { Checkbox } from "@/components/ui/checkbox";
import { useSettings } from "@/app/contexts/settings-context";

// defaults
const DEFAULT_SETTINGS = {
  devTools: false,
  logs: false,
  boundingBoxes: false
};

export default function SettingsDebugging() {
  const { settings, updateSettings } = useSettings();
  
  // Get debugging settings with defaults
  const debuggingSettings = settings.debugging ?? DEFAULT_SETTINGS;

  // Update handler
  const handleSettingChange = (key: string, value: boolean) => {
    updateSettings('debugging', {
      ...debuggingSettings,
      [key]: value
    });
  };

  return (
    <div className="h-full w-full p-4">
      <SettingsSectionHeader 
          title="Debugging"
          description="Tools to help fix or submit bugs."
          icon={<BugOffIcon className="opacity-50" />}
      />

      <div className="flex flex-col gap-4 mt-4 h-full overflow-y-auto">        
        {/* <SettingsPrefWrapper
          title="Enable Dev Tools"
          description="Enable developer tools for advanced debugging."
        >
          <Checkbox 
            className="size-6"
            checked={debuggingSettings.devTools}
            onCheckedChange={(checked) => handleSettingChange('devTools', checked as boolean)}
          />
        </SettingsPrefWrapper> */}

        {/* <SettingsPrefWrapper
          title="Enable Logs"
          description="Enable logs for debugging purposes."
        >
          <Checkbox 
            className="size-6"
            checked={debuggingSettings.logs}
            onCheckedChange={(checked) => handleSettingChange('logs', checked as boolean)}
          />
        </SettingsPrefWrapper> */}

        <SettingsPrefWrapper
          title="Bounding Boxes"
          description="Show bounding boxes around elements for debugging."
        >
          <Checkbox 
            className="size-6"
            checked={debuggingSettings.boundingBoxes}
            onCheckedChange={(checked) => handleSettingChange('boundingBoxes', checked as boolean)}
          />
        </SettingsPrefWrapper>
      </div>
    </div>
  );
}