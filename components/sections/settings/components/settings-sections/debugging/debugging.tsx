import { BugOffIcon } from "lucide-react";
import { SettingsSectionHeader } from "../../settings-section-header";
import SettingsPrefWrapper from "../../settings-pref-wrapper";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useEffect } from "react";

export default function SettingsDebugging() {
  const [devTools, setDevTools] = useState(false);
  const [logs, setLogs] = useState(false);
  const [boundingBoxes, setBoundingBoxes] = useState(false);

  // store states in localstorage in a structured style
  const storeSettings = () => {
    const existingSettings = localStorage.getItem("settings");
    const settings = existingSettings ? JSON.parse(existingSettings) : {};
    
    settings.debugging = {
      devTools,
      logs,
      boundingBoxes,
    };

    localStorage.setItem("settings", JSON.stringify(settings));
  };

  // load settings from localstorage
  const loadSettings = () => {
    const settings = localStorage.getItem("settings");
    if (settings) {
      const parsedSettings = JSON.parse(settings);
      if (parsedSettings.debugging) {
        setDevTools(parsedSettings.debugging.devTools ?? false);
        setLogs(parsedSettings.debugging.logs ?? false);
        setBoundingBoxes(parsedSettings.debugging.boundingBoxes ?? false);
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
  }, [devTools, logs, boundingBoxes]);

  // apply an outline of red to all elements when bounding boxes are enabled
  const applyBoundingBoxOutline = () => {
    const style = document.createElement('style');
    style.innerHTML = `
      * {
        outline: 1px solid red !important;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  };

  // Effect to handle bounding box visibility
  useEffect(() => {
    if (boundingBoxes) {
      const cleanup = applyBoundingBoxOutline();
      return cleanup;
    }
  }, [boundingBoxes]);

  return (
    <div className="h-full w-full p-4">
      <SettingsSectionHeader 
          title="Debugging"
          description="Tools to help fix or submit bugs."
          icon={<BugOffIcon className="opacity-50" />}
      />

      <div className="flex flex-col gap-4 mt-4 h-full overflow-y-auto">        
        <SettingsPrefWrapper
          title="Enable Dev Tools"
          description="Enable developer tools for advanced debugging."
        >
          <Checkbox 
            className="size-6"
            checked={devTools}
            onCheckedChange={(checked) => setDevTools(checked as boolean)}
          />
        </SettingsPrefWrapper>

        <SettingsPrefWrapper
          title="Enable Logs"
          description="Enable logs for debugging purposes."
        >
          <Checkbox 
            className="size-6"
            checked={logs}
            onCheckedChange={(checked) => setLogs(checked as boolean)}
          />
        </SettingsPrefWrapper>

        <SettingsPrefWrapper
          title="Indicate Bounding Boxes"
          description="Show bounding boxes around elements for debugging."
        >
          <Checkbox 
            className="size-6"
            checked={boundingBoxes}
            onCheckedChange={(checked) => setBoundingBoxes(checked as boolean)}
          />
        </SettingsPrefWrapper>
      </div>
    </div>
  );
}